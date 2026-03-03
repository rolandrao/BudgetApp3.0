import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const performMonthlyTasks = async (event) => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const lastMonthDate = new Date();
  lastMonthDate.setMonth(now.getMonth() - 1);
  const startOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1).toISOString().split('T')[0];
  const endOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).toISOString().split('T')[0];

  console.log(`[Automation] Starting job for ${currentMonthKey}...`);

  const { data: existingLogs } = await supabase.from('automation_logs').select('*').eq('run_month', currentMonthKey);
  if (existingLogs && existingLogs.length > 0) return { statusCode: 200 };

  try {
    // --- TASK A: RECURRING EXPENSES ---
    const { data: expenses } = await supabase.from('recurring_expenses').select('*').eq('active', true);
    if (expenses?.length > 0) {
      await supabase.from('transactions').insert(expenses.map(exp => ({
        transaction_date: new Date().toISOString().split('T')[0],
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        paid_by: exp.paid_by,
        is_shared: exp.is_shared,
      })));
    }

    // --- TASK B: RECURRING SAVINGS (Updated to add Transactions) ---
    const { data: allocations } = await supabase.from('recurring_allocations').select('*');
    if (allocations?.length > 0) {
      const updates = {};
      const txsToInsert = [];
      const { data: goals } = await supabase.from('savings_goals').select('*');
      
      const getMonthlyEquivalent = (amount, freq) => {
          const f = (freq || 'monthly').toLowerCase();
          if (f === 'weekly') return amount * 4.33;     
          if (f === 'bi-weekly') return amount * 2.165; 
          return amount; 
      };

      allocations.forEach(alloc => {
        const monthlyVal = getMonthlyEquivalent(alloc.amount, alloc.frequency);
        const goal = goals?.find(g => g.id === alloc.savings_goal_id);
        
        // 1. Add to the Goal balance
        if (alloc.savings_goal_id) {
          updates[alloc.savings_goal_id] = (updates[alloc.savings_goal_id] || 0) + monthlyVal;
        }

        // 2. Create the Transaction receipt
        if (alloc.category) {
          txsToInsert.push({
             transaction_date: new Date().toISOString().split('T')[0],
             description: `Auto-Save: ${goal ? goal.name : 'General'}`,
             amount: monthlyVal,
             category: alloc.category,
             paid_by: alloc.user_name,
             is_shared: false // Auto-savings are usually personal pulls
          });
        }
      });

      // Execute Goal updates
      for (const [goalId, amountToAdd] of Object.entries(updates)) {
        const goal = goals.find(g => g.id === parseInt(goalId));
        if (goal) await supabase.from('savings_goals').update({ current_amount: goal.current_amount + amountToAdd }).eq('id', parseInt(goalId));
      }

      // Execute Transaction inserts
      if (txsToInsert.length > 0) {
         await supabase.from('transactions').insert(txsToInsert);
         console.log(`[Automation] Inserted ${txsToInsert.length} savings transactions.`);
      }
    }

    // --- TASK C: BUDGET ROLLOVERS ---
    const { data: rolloverGoals } = await supabase.from('savings_goals').select('*').not('linked_category', 'is', null);

    if (rolloverGoals?.length > 0) {
      const { data: limits } = await supabase.from('budget_limits').select('monthly_limit, user_name, categories(category_name)');
      const { data: txs } = await supabase.from('transactions').select('amount, category, paid_by')
        .gte('transaction_date', startOfLastMonth).lte('transaction_date', endOfLastMonth);

      for (const goal of rolloverGoals) {
        const category = goal.linked_category;
        const linkedUser = goal.linked_user; 

        const spent = txs
          .filter(t => t.category === category)
          .filter(t => !linkedUser || t.paid_by === linkedUser) 
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalLimit = limits
          .filter(l => l.categories?.category_name === category)
          .filter(l => !linkedUser || l.user_name === linkedUser) 
          .reduce((sum, l) => sum + parseFloat(l.monthly_limit), 0);

        const remainder = totalLimit - spent;

        if (remainder !== 0) {
          let newAmount = goal.current_amount + remainder;
          if (newAmount < 0) newAmount = 0;

          await supabase.from('savings_goals').update({ current_amount: newAmount }).eq('id', goal.id);
        }
      }
    }

    await supabase.from('automation_logs').insert({ run_month: currentMonthKey, status: 'success' });
    return { statusCode: 200 };

  } catch (error) {
    console.error("Automation Error:", error);
    return { statusCode: 500 };
  }
};

export const handler = schedule('0 5 1 * *', performMonthlyTasks);
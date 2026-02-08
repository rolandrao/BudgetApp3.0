import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const performMonthlyTasks = async (event) => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Calculate "Last Month"
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(now.getMonth() - 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthIndex = lastMonthDate.getMonth(); 
  
  const startOfLastMonth = new Date(lastMonthYear, lastMonthIndex, 1).toISOString().split('T')[0];
  const endOfLastMonth = new Date(lastMonthYear, lastMonthIndex + 1, 0).toISOString().split('T')[0];

  console.log(`[Automation] Starting job for ${currentMonthKey}...`);

  // 1. IDEMPOTENCY CHECK
  const { data: existingLogs } = await supabase
    .from('automation_logs')
    .select('*')
    .eq('run_month', currentMonthKey);

  if (existingLogs && existingLogs.length > 0) {
    console.log(`[Automation] Job already ran for ${currentMonthKey}. Skipping.`);
    return { statusCode: 200 };
  }

  try {
    // --- TASK A: RECURRING EXPENSES ---
    const { data: expenses } = await supabase.from('recurring_expenses').select('*').eq('active', true);
    if (expenses && expenses.length > 0) {
      const transactions = expenses.map(exp => ({
        transaction_date: new Date().toISOString().split('T')[0],
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        paid_by: exp.paid_by,
        is_shared: exp.is_shared,
      }));
      await supabase.from('transactions').insert(transactions);
    }

    // --- TASK B: RECURRING SAVINGS ---
    const { data: allocations } = await supabase.from('recurring_allocations').select('*');
    if (allocations && allocations.length > 0) {
      const updates = {};
      const getMonthlyEquivalent = (amount, freq) => {
          const f = (freq || 'monthly').toLowerCase();
          if (f === 'weekly') return amount * 4.33;     
          if (f === 'bi-weekly') return amount * 2.165; 
          return amount; 
      };

      allocations.forEach(alloc => {
        if (alloc.savings_goal_id) {
          const monthlyVal = getMonthlyEquivalent(alloc.amount, alloc.frequency);
          updates[alloc.savings_goal_id] = (updates[alloc.savings_goal_id] || 0) + monthlyVal;
        }
      });

      const { data: goals } = await supabase.from('savings_goals').select('*');
      for (const [goalId, amountToAdd] of Object.entries(updates)) {
        const goal = goals.find(g => g.id === parseInt(goalId));
        if (goal) {
          await supabase.from('savings_goals').update({ current_amount: goal.current_amount + amountToAdd }).eq('id', parseInt(goalId));
        }
      }
    }

    // --- TASK C: BUDGET ROLLOVERS (Surplus OR Deficit) ---
    const { data: rolloverGoals } = await supabase
      .from('savings_goals')
      .select('*')
      .not('linked_category', 'is', null);

    if (rolloverGoals && rolloverGoals.length > 0) {
      // Fetch Limits & Transactions
      const { data: limitsWithCats } = await supabase.from('budget_limits').select('monthly_limit, categories(category_name)');
      
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, category')
        .gte('transaction_date', startOfLastMonth)
        .lte('transaction_date', endOfLastMonth);

      for (const goal of rolloverGoals) {
        const category = goal.linked_category;
        
        // 1. Calc Spent
        const spent = txs
          .filter(t => t.category === category)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // 2. Calc Limit
        const totalLimit = limitsWithCats
          .filter(l => l.categories?.category_name === category)
          .reduce((sum, l) => sum + parseFloat(l.monthly_limit), 0);

        // 3. Calc Remainder (Positive = Surplus, Negative = Overspending)
        const remainder = totalLimit - spent;

        if (remainder !== 0) {
          // Calculate new amount
          let newAmount = goal.current_amount + remainder;
          
          // Safety: Don't let goal drop below $0
          if (newAmount < 0) newAmount = 0;

          const action = remainder > 0 ? "Rolling over surplus" : "Covering deficit";
          console.log(`[Automation] ${action}: ${remainder.toFixed(2)} for ${category} -> ${goal.name}`);

          await supabase
            .from('savings_goals')
            .update({ current_amount: newAmount })
            .eq('id', goal.id);
        }
      }
    }

    // 2. LOG SUCCESS
    await supabase.from('automation_logs').insert({
      run_month: currentMonthKey,
      status: 'success',
      details: `Processed bills, savings, and budget rollovers.`
    });

    return { statusCode: 200 };

  } catch (error) {
    console.error("Automation Error:", error);
    return { statusCode: 500 };
  }
};

export const handler = schedule('0 5 1 * *', performMonthlyTasks);
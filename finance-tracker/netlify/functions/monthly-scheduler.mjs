import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Internal function logic (renamed to avoid conflict)
const performMonthlyTasks = async (event) => {
  const date = new Date();
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  console.log(`[Automation] Starting job for ${monthKey}...`);

  // 1. IDEMPOTENCY CHECK: Did we already run this month?
  const { data: existingLogs } = await supabase
    .from('automation_logs')
    .select('*')
    .eq('run_month', monthKey);

  if (existingLogs && existingLogs.length > 0) {
    console.log(`[Automation] Job already ran for ${monthKey}. Skipping.`);
    return { statusCode: 200 };
  }

  try {
    // --- TASK A: PROCESS RECURRING EXPENSES ---
    const { data: expenses } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('active', true);

    if (expenses && expenses.length > 0) {
      const transactions = expenses.map(exp => ({
        transaction_date: new Date().toISOString().split('T')[0], // Today
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        paid_by: exp.paid_by,
        is_shared: exp.is_shared, // Ensure this column exists in your DB now
        created_at: new Date().toISOString()
      }));

      const { error: txError } = await supabase.from('transactions').insert(transactions);
      if (txError) throw txError;
      console.log(`[Automation] Added ${transactions.length} transactions.`);
    }

    // --- TASK B: PROCESS SAVINGS GOALS ---
    const { data: allocations } = await supabase
      .from('recurring_allocations')
      .select('*');

    if (allocations && allocations.length > 0) {
      // Group by Goal ID to minimize updates
      const updates = {};
      allocations.forEach(alloc => {
        if (alloc.savings_goal_id) {
          updates[alloc.savings_goal_id] = (updates[alloc.savings_goal_id] || 0) + alloc.amount;
        }
      });

      // Fetch current goals to add to them
      const { data: goals } = await supabase.from('savings_goals').select('*');
      
      for (const [goalId, amountToAdd] of Object.entries(updates)) {
        const goal = goals.find(g => g.id === parseInt(goalId));
        if (goal) {
          await supabase
            .from('savings_goals')
            .update({ current_amount: goal.current_amount + amountToAdd })
            .eq('id', parseInt(goalId));
        }
      }
      console.log(`[Automation] Updated ${Object.keys(updates).length} savings goals.`);
    }

    // 2. LOG SUCCESS
    await supabase.from('automation_logs').insert({
      run_month: monthKey,
      status: 'success',
      details: `Processed ${expenses?.length || 0} expenses and savings.`
    });

    return { statusCode: 200 };

  } catch (error) {
    console.error("Automation Error:", error);
    return { statusCode: 500 };
  }
};

// EXPORT MUST BE NAMED 'handler'
export const handler = schedule('0 0 1 * *', performMonthlyTasks);
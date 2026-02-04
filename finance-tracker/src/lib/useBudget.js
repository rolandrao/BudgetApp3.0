import { useState, useEffect } from 'react';
import { supabase } from './supabase'; 
import { MONTHS, CATEGORIES } from './budget-constants';
import { calculateMonthlyIncome } from './income-utils'; 

export function useBudget(year, month) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState([]);
  const [limitsData, setLimitsData] = useState([]);
  const [totalsData, setTotalsData] = useState({ Roland: 0, Sarah: 0 });
  const [calculatedIncome, setCalculatedIncome] = useState({ Roland: 0, Sarah: 0 }); 

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    setLoading(true);

    // 1. Fetch Limits & Income Settings
    const [limitsResult, incomeResult] = await Promise.all([
        supabase.from('budget_limits').select(`monthly_limit, user_name, category_id, categories ( category_name )`),
        supabase.from('income_settings').select('*')
    ]);

    const limits = limitsResult.data || [];
    const incomeSettings = incomeResult.data || [];
    setLimitsData(limits);

    // --- DEBUGGING LOGS ---
    console.log("--- BUDGET DEBUG ---");
    console.log("Selected Month/Year:", month, year);
    console.log("Fetched Income Settings:", incomeSettings);
    // ----------------------

    // 2. Calculate Income
    if (month !== "all") {
        const mIndex = parseInt(month); // Ensure number
        
        // Find settings case-insensitively just to be safe
        const rSettings = incomeSettings.find(s => s.user_name.toLowerCase() === 'roland');
        const sSettings = incomeSettings.find(s => s.user_name.toLowerCase() === 'sarah');

        const rIncome = calculateMonthlyIncome(year, mIndex, rSettings);
        const sIncome = calculateMonthlyIncome(year, mIndex, sSettings);

        console.log("Calculated Roland:", rIncome);
        console.log("Calculated Sarah:", sIncome);

        setCalculatedIncome({
            Roland: rIncome,
            Sarah: sIncome
        });
    } else {
        setCalculatedIncome({ Roland: 0, Sarah: 0 });
    }

    // 3. Fetch Transactions
    let query = supabase.from('transactions').select('amount, category, paid_by, transaction_date');
    
    if (month === "all") {
        query = query
            .gte('transaction_date', `${year}-01-01`)
            .lte('transaction_date', `${year}-12-31`);
    } else {
        const mVal = parseInt(month);
        const mStr = String(mVal + 1).padStart(2, '0');
        const endDate = new Date(year, mVal + 1, 0).toISOString().split('T')[0]; 
        query = query
            .gte('transaction_date', `${year}-${mStr}-01`)
            .lte('transaction_date', endDate);
    }

    const { data: transactions } = await query;
    processData(limits, transactions || []);
    setLoading(false);
  };

  const processData = (limits, transactions) => {
    if (month === "all") {
        // --- YEARLY LOGIC ---
        const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
            monthIndex: i,
            monthName: MONTHS[i],
            totalLimit: 0,
            totalSpent: 0,
            isFuture: new Date(year, i, 1) > new Date()
        }));

        const monthlyTotalLimit = limits.reduce((sum, l) => sum + (Number(l.monthly_limit) || 0), 0);
        monthlyStats.forEach(m => m.totalLimit = monthlyTotalLimit);

        transactions.forEach(t => {
            if (!t.transaction_date) return;
            const mIndex = new Date(t.transaction_date).getMonth();
            if (mIndex >= 0 && mIndex <= 11) monthlyStats[mIndex].totalSpent += Number(t.amount);
        });

        setSummaryData(monthlyStats);
    } else {
        // --- MONTHLY LOGIC ---
        const rows = [];
        let totalRoland = 0;
        let totalSarah = 0;

        const getSpent = (cat, person) => transactions
            .filter(t => t.category === cat && t.paid_by === person)
            .reduce((s, t) => s + Number(t.amount), 0);

        const getLimit = (cat, person) => {
            const l = limits.find(lim => lim.categories?.category_name === cat && lim.user_name === person);
            return l ? Number(l.monthly_limit) : 0;
        };

        CATEGORIES.forEach(cat => {
            ['Roland', 'Sarah'].forEach(person => {
                const limit = getLimit(cat, person);
                const spent = getSpent(cat, person);
                
                if (person === 'Roland') totalRoland += spent;
                else totalSarah += spent;

                if (limit > 0 || spent > 0) {
                    rows.push({
                        id: `${cat}-${person}`,
                        category: cat,
                        person,
                        limit,
                        spent,
                        remaining: limit - spent,
                        status: spent > limit ? 'Over' : 'Under'
                    });
                }
            });
        });

        setTotalsData({ Roland: totalRoland, Sarah: totalSarah });
        setSummaryData(rows);
    }
  };

  return { loading, summaryData, limitsData, totalsData, calculatedIncome, refreshData: fetchData };
}
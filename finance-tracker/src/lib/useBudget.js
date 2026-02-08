import { useState, useEffect } from 'react';
import { supabase } from './supabase'; 
import { MONTHS } from './budget-constants';
import { calculateMonthlyIncome } from './income-utils'; 

export function useBudget(year, month) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState([]);
  const [limitsData, setLimitsData] = useState([]);
  const [totalsData, setTotalsData] = useState({ Roland: 0, Sarah: 0 });
  const [calculatedIncome, setCalculatedIncome] = useState({ Roland: 0, Sarah: 0 }); 
  const [transactions, setTransactions] = useState([]); 
  const [dbCategories, setDbCategories] = useState([]); // <--- New State for DB Categories

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    setLoading(true);

    // 1. Fetch Limits, Income Settings AND Categories
    const [limitsResult, incomeResult, catResult] = await Promise.all([
        supabase.from('budget_limits').select(`monthly_limit, user_name, category_id, categories ( category_name )`),
        supabase.from('income_settings').select('*'),
        supabase.from('categories').select('*').order('category_name') // <--- Fetch Categories
    ]);

    const limits = limitsResult.data || [];
    const incomeSettings = incomeResult.data || [];
    const categories = catResult.data || [];
    
    setLimitsData(limits);
    setDbCategories(categories); // <--- Store them

    // 2. Calculate Income
    if (month !== "all") {
        const mIndex = parseInt(month);
        const rSettings = incomeSettings.find(s => s.user_name.toLowerCase() === 'roland');
        const sSettings = incomeSettings.find(s => s.user_name.toLowerCase() === 'sarah');

        setCalculatedIncome({
            Roland: calculateMonthlyIncome(year, mIndex, rSettings),
            Sarah: calculateMonthlyIncome(year, mIndex, sSettings)
        });
    } else {
        setCalculatedIncome({ Roland: 0, Sarah: 0 });
    }

    // 3. Fetch Transactions
    let query = supabase.from('transactions').select('amount, category, paid_by, transaction_date, description');
    
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

    const { data: txData } = await query;
    const cleanTransactions = txData || [];
    
    setTransactions(cleanTransactions);
    
    // Pass the fetched categories to processData
    processData(limits, cleanTransactions, categories);
    setLoading(false);
  };

  const processData = (limits, txList, categories) => {
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

        txList.forEach(t => {
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

        const getSpent = (cat, person) => txList
            .filter(t => t.category === cat && t.paid_by === person)
            .reduce((s, t) => s + Number(t.amount), 0);

        const getLimit = (cat, person) => {
            const l = limits.find(lim => lim.categories?.category_name === cat && lim.user_name === person);
            return l ? Number(l.monthly_limit) : 0;
        };

        // Use the DB Categories, not the static list
        categories.forEach(c => {
            const cat = c.category_name;
            ['Roland', 'Sarah'].forEach(person => {
                const limit = getLimit(cat, person);
                const spent = getSpent(cat, person);
                
                if (person === 'Roland') totalRoland += spent;
                else totalSarah += spent;

                // Push row if it exists in DB (which it does, because we are iterating DB categories)
                rows.push({
                    id: `${cat}-${person}`,
                    category: cat,
                    person,
                    limit,
                    spent,
                    remaining: limit - spent,
                    status: spent > limit ? 'Over' : 'Under'
                });
            });
        });

        setTotalsData({ Roland: totalRoland, Sarah: totalSarah });
        setSummaryData(rows);
    }
  };

  return { loading, summaryData, limitsData, totalsData, calculatedIncome, transactions, dbCategories, refreshData: fetchData };
}
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabase';

export function useTransactions(itemsPerPage = 50) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'transaction_date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '', category: 'All', minAmount: '', maxAmount: '', startDate: '', endDate: '', paidBy: 'All'
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase.from('transactions').select('*').range(0, 9999);
    if (error) console.error('Error fetching data:', error);
    else setTransactions(data || []);
    setLoading(false);
  }

  // --- Actions ---
  const addTransaction = (newTx) => setTransactions(prev => [newTx, ...prev]);
  
  const addBulkTransactions = (newTxs) => setTransactions(prev => [...newTxs, ...prev]);

  const updateTransaction = async (id, field, newValue) => {
    // Optimistic update
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: newValue } : t));
    const { error } = await supabase.from('transactions').update({ [field]: newValue }).eq('id', id);
    if (error) {
      alert('Failed to update.');
      fetchTransactions(); // Revert on error
    }
  };

  const deleteTransaction = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- Processing ---
  const processedData = useMemo(() => {
    let data = transactions.filter(t => {
      if (filters.search && !t.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.category !== 'All' && t.category !== filters.category) return false;
      if (filters.paidBy !== 'All' && t.paid_by !== filters.paidBy) return false;
      if (filters.minAmount && t.amount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && t.amount > parseFloat(filters.maxAmount)) return false;
      if (t.transaction_date) {
        const tDate = new Date(t.transaction_date).toISOString().split('T')[0];
        if (filters.startDate && tDate < filters.startDate) return false;
        if (filters.endDate && tDate > filters.endDate) return false;
      }
      return true;
    });

    return data.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return (aVal > bVal ? 1 : -1) * (sortConfig.direction === 'asc' ? 1 : -1);
    });
  }, [transactions, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const filteredTotal = processedData.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))].sort();

  const handleSort = (key) => {
    setSortConfig(cur => ({ key, direction: cur.key === key && cur.direction === 'asc' ? 'desc' : 'asc' }));
  };

  return {
    transactions, loading, paginatedData, totalPages, currentPage, setCurrentPage,
    sortConfig, handleSort, filters, setFilters, uniqueCategories, filteredTotal,
    addTransaction, addBulkTransactions, updateTransaction, deleteTransaction
  };
}
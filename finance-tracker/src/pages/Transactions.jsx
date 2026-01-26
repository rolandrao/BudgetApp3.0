import { useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Search, 
  Trash2, 
  Loader2,
  Filter,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Helper: Pagination Controls ---
const PaginationControls = ({ currentPage, totalPages, setCurrentPage, className = "" }) => {
  return (
    <div className={`flex items-center justify-between p-4 ${className}`}>
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages || 1}
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setCurrentPage(1)} 
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setCurrentPage(totalPages)} 
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// --- Helper: Editable Cell ---
function EditableCell({ value, type = "text", onSave, className }) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { setTempValue(value) }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus()
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (tempValue !== value) onSave(tempValue)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBlur()
    if (e.key === 'Escape') {
      setTempValue(value)
      setIsEditing(false)
    }
  }

  const displayValue = type === 'number' && !isNaN(parseFloat(value))
    ? parseFloat(value).toFixed(2)
    : value;

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`h-8 w-full bg-background ${className}`} 
      />
    )
  }

  return (
    <div 
      className={`cursor-pointer hover:bg-muted p-1 rounded min-h-[24px] flex items-center transition-colors ${className}`} 
      onClick={() => setIsEditing(true)}
    >
      {type === 'number' && '$'}{displayValue}
    </div>
  )
}

// --- Helper: Date Cell ---
function DateCell({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const dateStr = value ? new Date(value).toISOString().split('T')[0] : ''
  const displayStr = value ? new Date(value).toLocaleDateString() : '-'

  const handleChange = (e) => {
    onSave(e.target.value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Input
        type="date"
        defaultValue={dateStr}
        onBlur={() => setIsEditing(false)}
        onChange={handleChange}
        autoFocus
        className="h-8 w-[140px] bg-background"
      />
    )
  }

  return (
    <div 
      className="cursor-pointer hover:bg-muted p-1 rounded text-muted-foreground font-medium transition-colors" 
      onClick={() => setIsEditing(true)}
    >
      {displayStr}
    </div>
  )
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  const [sortConfig, setSortConfig] = useState({ key: 'transaction_date', direction: 'desc' })

  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    paidBy: 'All'
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .range(0, 9999) 

    if (error) console.error('Error fetching data:', error)
    else setTransactions(data)
    setLoading(false)
  }

  const uniqueCategories = useMemo(() => {
    const cats = transactions.map(t => t.category).filter(Boolean)
    return [...new Set(cats)].sort()
  }, [transactions])

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleUpdate = async (id, field, newValue) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: newValue } : t
    ))
    
    const { error } = await supabase
      .from('transactions')
      .update({ [field]: newValue })
      .eq('id', id)

    if (error) {
      alert('Failed to update. Refreshing...')
      fetchTransactions() 
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) setTransactions(transactions.filter(t => t.id !== id))
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
      paidBy: 'All'
    })
    setCurrentPage(1)
  }

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
    })

    return data.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      if (aValue === bValue) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      else if (aValue < bValue) comparison = -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

  }, [transactions, filters, sortConfig])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return processedData.slice(start, start + itemsPerPage)
  }, [processedData, currentPage])

  const filteredTotal = useMemo(() => {
    return processedData.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [processedData])

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground/30" />
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" /> 
      : <ArrowDown className="h-4 w-4 text-primary" />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header - Added px-4 for mobile spacing */}
      <div className="flex flex-col gap-4 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Total: <span className="font-mono font-medium text-foreground">${filteredTotal.toFixed(2)}</span> 
              <span className="mx-2">|</span> 
              Records: {processedData.length}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        {/* Filter Bar (Stack on Mobile) */}
        {showFilters && (
          <div className="bg-muted/50 p-4 rounded-lg border grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 bg-background"
                  value={filters.search}
                  onChange={(e) => { setFilters({...filters, search: e.target.value}); setCurrentPage(1); }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(val) => { setFilters({...filters, category: val}); setCurrentPage(1); }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Paid By</label>
                <Select 
                  value={filters.paidBy} 
                  onValueChange={(val) => { setFilters({...filters, paidBy: val}); setCurrentPage(1); }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Roland">Roland</SelectItem>
                    <SelectItem value="Sarah">Sarah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Date Range</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" className="bg-background"
                  value={filters.startDate}
                  onChange={(e) => { setFilters({...filters, startDate: e.target.value}); setCurrentPage(1); }}
                />
                <Input 
                  type="date" className="bg-background"
                  value={filters.endDate}
                  onChange={(e) => { setFilters({...filters, endDate: e.target.value}); setCurrentPage(1); }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" placeholder="Min" className="bg-background"
                  value={filters.minAmount}
                  onChange={(e) => { setFilters({...filters, minAmount: e.target.value}); setCurrentPage(1); }}
                />
                <Input 
                  type="number" placeholder="Max" className="bg-background"
                  value={filters.maxAmount}
                  onChange={(e) => { setFilters({...filters, maxAmount: e.target.value}); setCurrentPage(1); }}
                />
                <Button variant="ghost" size="icon" onClick={resetFilters} title="Clear Filters">
                  <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="bg-card sm:border sm:rounded-md"> 
        
        {/* Pagination Top - Added px-4 for mobile */}
        <PaginationControls 
          className="border-b px-4"
          currentPage={currentPage} 
          totalPages={totalPages} 
          setCurrentPage={setCurrentPage} 
        />

        {loading ? (
           <div className="h-24 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
           </div>
        ) : paginatedData.length === 0 ? (
           <div className="h-24 flex items-center justify-center text-muted-foreground">
              No transactions match your filters.
           </div>
        ) : (
          <>
            {/* 1. TABLE VIEW (Desktop Only) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="w-[130px] cursor-pointer" onClick={() => handleSort('transaction_date')}>
                      <div className="flex items-center gap-2">Date <SortIcon column="transaction_date" /></div>
                    </TableHead>
                    <TableHead className="max-w-[300px] cursor-pointer" onClick={() => handleSort('description')}>
                      <div className="flex items-center gap-2">Description <SortIcon column="description" /></div>
                    </TableHead>
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('amount')}>
                      <div className="flex items-center gap-2">Amount <SortIcon column="amount" /></div>
                    </TableHead>
                    <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-2">Category <SortIcon column="category" /></div>
                    </TableHead>
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('paid_by')}>
                      <div className="flex items-center gap-2">Paid By <SortIcon column="paid_by" /></div>
                    </TableHead>
                    <TableHead className="text-center w-[100px]">Shared</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((t) => (
                    <TableRow key={t.id} className="group hover:bg-muted/50">
                      <TableCell><DateCell value={t.transaction_date} onSave={(val) => handleUpdate(t.id, 'transaction_date', val)} /></TableCell>
                      <TableCell><EditableCell value={t.description || ''} onSave={(val) => handleUpdate(t.id, 'description', val)} /></TableCell>
                      <TableCell><EditableCell value={t.amount} type="number" className="font-mono" onSave={(val) => handleUpdate(t.id, 'amount', val)} /></TableCell>
                      <TableCell><EditableCell value={t.category || 'Uncategorized'} onSave={(val) => handleUpdate(t.id, 'category', val)} /></TableCell>
                      <TableCell>
                        <Select value={t.paid_by || "Roland"} onValueChange={(val) => handleUpdate(t.id, 'paid_by', val)}>
                          <SelectTrigger className={`h-8 border-none shadow-none font-medium ${t.paid_by === 'Sarah' ? 'text-pink-600 bg-pink-50 dark:bg-pink-950 dark:text-pink-300' : 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox checked={t.is_shared || false} onCheckedChange={(checked) => handleUpdate(t.id, 'is_shared', checked)} className="data-[state=checked]:bg-purple-600 border-purple-300" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 2. CARD LIST VIEW (Mobile Only - Full Width) */}
            <div className="md:hidden divide-y border-t sm:border-t-0">
              {paginatedData.map((t) => (
                <div key={t.id} className="p-4 bg-card active:bg-muted/50 transition-colors">
                   {/* Top Row: Date & Actions */}
                   <div className="flex justify-between items-start">
                      <div className="space-y-1 w-full mr-4">
                          <DateCell value={t.transaction_date} onSave={(val) => handleUpdate(t.id, 'transaction_date', val)} />
                          <EditableCell value={t.description} onSave={(val) => handleUpdate(t.id, 'description', val)} className="font-bold text-base" />
                      </div>
                      <div className="text-right whitespace-nowrap">
                         <EditableCell value={t.amount} type="number" onSave={(val) => handleUpdate(t.id, 'amount', val)} className="font-mono text-lg font-bold" />
                      </div>
                   </div>
                   
                   {/* Bottom Row: Controls */}
                   <div className="grid grid-cols-2 gap-2 pt-2">
                       {/* Category */}
                       <EditableCell value={t.category || 'Uncategorized'} onSave={(val) => handleUpdate(t.id, 'category', val)} className="text-xs text-muted-foreground border rounded px-2 h-8" />
                       
                       {/* Paid By */}
                       <Select value={t.paid_by || "Roland"} onValueChange={(val) => handleUpdate(t.id, 'paid_by', val)}>
                          <SelectTrigger className={`h-8 text-xs ${t.paid_by === 'Sarah' ? 'text-pink-600 bg-pink-50 dark:bg-pink-950 dark:text-pink-300' : 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                        </Select>
                   </div>
                   
                   {/* Footer: Shared & Delete */}
                   <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={t.is_shared || false} onCheckedChange={(checked) => handleUpdate(t.id, 'is_shared', checked)} id={`shared-${t.id}`} />
                        <label htmlFor={`shared-${t.id}`} className="text-sm text-muted-foreground">Shared Split</label>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive h-8 px-2">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                   </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Bottom - Added px-4 */}
        <PaginationControls 
          className="border-t px-4"
          currentPage={currentPage} 
          totalPages={totalPages} 
          setCurrentPage={setCurrentPage} 
        />

      </div>
    </div>
  )
}
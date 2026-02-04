import { useState } from 'react';
import { useTransactions } from '@/lib/useTransactions'; 

// Icons & UI
import { Filter, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Sub-Components (Directly from components folder)
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionTable from '@/components/transactions/TransactionTable';
import TransactionMobileList from '@/components/transactions/TransactionMobileList';
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog';
import BulkAddDialog from '@/components/transactions/BulkAddDialog';
import PaginationControls from '@/components/transactions/PaginationControls';

export default function Transactions() {
  const [showFilters, setShowFilters] = useState(false);
  
  // Destructure Logic from Hook
  const {
    loading, paginatedData, totalPages, currentPage, setCurrentPage,
    sortConfig, handleSort, filters, setFilters, uniqueCategories, filteredTotal,
    addTransaction, addBulkTransactions, updateTransaction, deleteTransaction
  } = useTransactions();

  // Helper for Sort Icons
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground/30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 text-primary" /> : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* --- Header & Controls --- */}
      <div className="flex flex-col gap-4 px-4 sm:px-0">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Total: <span className="font-mono font-medium text-foreground">${filteredTotal.toFixed(2)}</span> 
              <span className="mx-2">|</span> 
              Records: {filteredTotal > 0 ? paginatedData.length * totalPages : 0} 
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
             {/* Bulk Add Component */}
             <BulkAddDialog onBulkAdd={addBulkTransactions} />
             
             <AddTransactionDialog onTransactionAdded={addTransaction} />

             <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                <Filter className="h-4 w-4" /> {showFilters ? 'Hide' : 'Filter'}
             </Button>
          </div>
        </div>

        {showFilters && (
            <TransactionFilters 
                onFilterChange={setFilters} 
                uniqueCategories={uniqueCategories} 
            />
        )}
      </div>

      {/* --- Data Display --- */}
      <div className="bg-card sm:border sm:rounded-md"> 
        <PaginationControls 
            className="border-b px-4"
            currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} 
        />

        {loading ? (
           <div className="h-24 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
           </div>
        ) : paginatedData.length === 0 ? (
           <div className="h-24 flex items-center justify-center text-muted-foreground">No transactions found.</div>
        ) : (
          <>
            <TransactionTable 
                data={paginatedData} 
                onUpdate={updateTransaction} 
                onDelete={deleteTransaction}
                onSort={handleSort}
                SortIcon={SortIcon}
            />
            <TransactionMobileList 
                data={paginatedData}
                onUpdate={updateTransaction} 
                onDelete={deleteTransaction}
            />
          </>
        )}

        <PaginationControls 
            className="border-t px-4"
            currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} 
        />
      </div>
    </div>
  );
}
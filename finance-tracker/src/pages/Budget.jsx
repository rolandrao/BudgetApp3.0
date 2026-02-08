import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTHS, YEARS } from '@/lib/budget-constants';
import { useBudget } from '@/lib/useBudget';

// Sub-components
import BudgetConfigDialog from '@/components/BudgetConfigDialog';
import BudgetYearlyView from '@/components/BudgetYearlyView';
import BudgetMonthlyView from '@/components/BudgetMonthlyView';

export default function BudgetPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("all"); 
  
  const { 
    loading, 
    summaryData, 
    limitsData, 
    totalsData, 
    calculatedIncome, 
    transactions,
    dbCategories, // <--- Destructure this
    refreshData 
  } = useBudget(year, month);

  return (
    <div className="space-y-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 px-4 sm:px-0">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Budget Overview</h1>
               <p className="text-muted-foreground">Track your spending goals and monthly limits.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
                    <SelectTrigger className="w-[100px] bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={month.toString()} onValueChange={(val) => setMonth(val)}>
                    <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Full Year Summary" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Full Year Summary</SelectItem>
                        {MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <BudgetConfigDialog onSave={refreshData} initialLimits={limitsData} />
            </div>
         </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="bg-card sm:border sm:rounded-md p-4 sm:p-6 min-h-[500px]">
         {loading ? (
             <div className="h-64 flex items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
         ) : (
             month === "all" 
                ? <BudgetYearlyView data={summaryData} /> 
                : <BudgetMonthlyView 
                    summaryData={summaryData} 
                    totalsData={totalsData} 
                    calculatedIncome={calculatedIncome} 
                    transactions={transactions}
                    dbCategories={dbCategories} // <--- Pass it here
                  />
         )}
      </div>
    </div>
  );
}
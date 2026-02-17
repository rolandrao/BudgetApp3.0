import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, DollarSign, Wallet, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/budget-constants';

// Add dbCategories to props vvv
export default function BudgetMonthlyView({ summaryData, totalsData, calculatedIncome, transactions, dbCategories }) {
  const [incomeData, setIncomeData] = useState({ Roland: 0, Sarah: 0 });
  const [inspecting, setInspecting] = useState(null); 

  useEffect(() => {
    if (calculatedIncome) {
        setIncomeData({
            Roland: calculatedIncome.Roland || 0,
            Sarah: calculatedIncome.Sarah || 0
        });
    }
  }, [calculatedIncome]);

  const getInspectedTransactions = () => {
      if (!inspecting || !transactions) return [];
      return transactions.filter(t => 
          t.category === inspecting.category && 
          t.paid_by === inspecting.person
      ).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  };

  const expensesRoland = totalsData.Roland || 0;
  const expensesSarah = totalsData.Sarah || 0;
  
  const netRoland = (parseFloat(incomeData.Roland) || 0) - expensesRoland;
  const netSarah = (parseFloat(incomeData.Sarah) || 0) - expensesSarah;
  
  const totalIncome = (parseFloat(incomeData.Roland) || 0) + (parseFloat(incomeData.Sarah) || 0);
  const totalExpenses = expensesRoland + expensesSarah;
  const totalNet = totalIncome - totalExpenses;

  // --- DATA PREP ---
  const buildCompleteData = (personName) => {
    // 1. Define Hidden Categories
    const hiddenCategories = ['Cat', 'Uber Eats'];
    
    // 2. USE DB CATEGORIES INSTEAD OF STATIC CONSTANT
    // Map the DB objects to just their names strings
    const sourceCategories = (dbCategories || []).map(c => c.category_name);

    const visibleCategories = sourceCategories.filter(c => 
        c !== 'Uncategorized' && !hiddenCategories.includes(c)
    );

    return visibleCategories.map(catName => {
        const found = summaryData.find(d => d.category === catName && d.person === personName);
        return {
            id: found?.id || `${personName}-${catName}-zero`, 
            category: catName,
            limit: found?.limit || 0,
            spent: found?.spent || 0,
            remaining: (found?.limit || 0) - (found?.spent || 0),
            person: personName
        };
    });
  };

  const rolandData = buildCompleteData('Roland');
  const sarahData = buildCompleteData('Sarah');

  // --- HELPER: STAT BOX ---
  const StatBox = ({ label, value, subtext, colorClass = "text-foreground", borderClass = "" }) => (
    <div className={`flex flex-col p-4 rounded-lg bg-background border shadow-sm ${borderClass}`}>
       <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
       <div className={`text-2xl font-bold mt-1 ${colorClass}`}>{formatCurrency(value)}</div>
       {subtext && <span className="text-xs text-muted-foreground mt-1">{subtext}</span>}
    </div>
  );

  // --- HELPER: BUDGET TABLE ---
  const PersonBudgetTable = ({ data, name, headerColor, headerBg }) => {
    const totalLimit = data.reduce((acc, curr) => acc + curr.limit, 0);
    const totalSpent = data.reduce((acc, curr) => acc + curr.spent, 0);
    const totalRemaining = totalLimit - totalSpent;

    return (
      <Card className="h-full border shadow-sm flex flex-col">
        <CardHeader className={`${headerBg} py-3 border-b`}>
          <CardTitle className={`text-md font-semibold ${headerColor} flex justify-between items-center`}>
            <span>{name}</span>
            <span className="text-xs font-normal opacity-80">Monthly Budget</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs h-10">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[140px]">Category</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2">Limit</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2">Spent</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-2">Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-sm">
                {data.map((row) => {
                    const isZeroState = row.limit === 0 && row.spent === 0;
                    return (
                      <TableRow key={row.id} className={`h-12 ${isZeroState ? 'opacity-50 grayscale' : ''}`}>
                          <TableCell className="px-2">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => setInspecting({ category: row.category, person: row.person })}
                            >
                                <Search className="h-3 w-3" />
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium truncate max-w-[140px]" title={row.category}>
                              {row.category}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground tabular-nums px-2">
                              {row.limit > 0 ? formatCurrency(row.limit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums px-2">
                              {row.spent > 0 ? formatCurrency(row.spent) : '-'}
                          </TableCell>
                          <TableCell className="text-right px-2">
                              {isZeroState ? <span className="text-muted-foreground/30">-</span> : (
                                  <div className={`flex items-center justify-end gap-1 font-bold tabular-nums ${row.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                  {formatCurrency(row.remaining)}
                                  {row.remaining < 0 
                                      ? <AlertCircle className="w-3 h-3 text-destructive shrink-0" /> 
                                      : <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0 hidden sm:block" />
                                  }
                                  </div>
                              )}
                          </TableCell>
                      </TableRow>
                    );
                })}
              </TableBody>
              <TableFooter className="bg-muted/30 border-t-2">
                <TableRow className="h-12 hover:bg-muted/30">
                  <TableCell></TableCell>
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-right font-bold tabular-nums px-2">{formatCurrency(totalLimit)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums px-2">{formatCurrency(totalSpent)}</TableCell>
                  <TableCell className={`text-right font-bold tabular-nums px-2 ${totalRemaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(totalRemaining)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <Dialog open={!!inspecting} onOpenChange={(open) => !open && setInspecting(null)}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{inspecting?.category} Details</DialogTitle>
                    <DialogDescription>
                        Expenses paid by {inspecting?.person} in this period.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {getInspectedTransactions().length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No transactions found.</TableCell>
                                </TableRow>
                            ) : (
                                getInspectedTransactions().map((t, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString(undefined, {month:'numeric', day:'numeric'}) : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium truncate max-w-[150px]">
                                            {t.description}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {formatCurrency(t.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatBox 
                label="Household Net" 
                value={totalNet} 
                subtext="Total Income - Total Expenses"
                colorClass={totalNet >= 0 ? "text-green-600" : "text-red-600"}
                borderClass={totalNet >= 0 ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900"}
             />
             <StatBox 
                label="Roland Net" 
                value={netRoland} 
                subtext={`In: ${formatCurrency(incomeData.Roland)} | Out: ${formatCurrency(expensesRoland)}`}
                colorClass={netRoland >= 0 ? "text-blue-600" : "text-red-600"}
                borderClass="border-blue-200 dark:border-blue-900"
             />
             <StatBox 
                label="Sarah Net" 
                value={netSarah} 
                subtext={`In: ${formatCurrency(incomeData.Sarah)} | Out: ${formatCurrency(expensesSarah)}`}
                colorClass={netSarah >= 0 ? "text-pink-600" : "text-red-600"}
                borderClass="border-pink-200 dark:border-pink-900"
             />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Roland', 'Sarah'].map(person => {
                const isRoland = person === 'Roland';
                const income = parseFloat(incomeData[person]) || 0;
                const expenses = isRoland ? expensesRoland : expensesSarah;
                const net = isRoland ? netRoland : netSarah;
                
                const borderColor = isRoland ? 'border-blue-200 dark:border-blue-900' : 'border-pink-200 dark:border-pink-900';
                const iconColor = isRoland ? 'text-blue-500' : 'text-pink-500';

                return (
                    <Card key={person} className={`bg-card ${borderColor} border-l-4 shadow-sm`}>
                        <CardHeader className="pb-2 pt-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Wallet className={`h-4 w-4 ${iconColor}`} /> {person}'s Calculator
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-xs">Income (Override)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input 
                                            type="number" 
                                            className="pl-8 h-9 w-32 bg-background font-mono border-dashed focus:border-solid"
                                            placeholder="0.00"
                                            value={incomeData[person] || ''} 
                                            onChange={(e) => setIncomeData({...incomeData, [person]: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Label className="text-xs block mb-1">Net Result</Label>
                                    <div className={`text-xl font-bold font-mono ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {net > 0 ? '+' : ''}{formatCurrency(net)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PersonBudgetTable 
                data={rolandData} 
                name="Roland" 
                headerColor="text-blue-700 dark:text-blue-300"
                headerBg="bg-blue-50/50 dark:bg-blue-900/10"
            />
            <PersonBudgetTable 
                data={sarahData} 
                name="Sarah" 
                headerColor="text-pink-700 dark:text-pink-300"
                headerBg="bg-pink-50/50 dark:bg-pink-900/10"
            />
        </div>
    </div>
  );
}
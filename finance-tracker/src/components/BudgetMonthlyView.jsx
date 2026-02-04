import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Calculator, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency, CATEGORIES } from '@/lib/budget-constants';

export default function BudgetMonthlyView({ summaryData, totalsData, calculatedIncome }) {
  // Local state for income (defaults to engine values, but editable)
  const [incomeData, setIncomeData] = useState({ Roland: 0, Sarah: 0 });

  // Sync automated income from the "Engine" when it changes (e.g. switching months)
  useEffect(() => {
    if (calculatedIncome) {
        setIncomeData({
            Roland: calculatedIncome.Roland || 0,
            Sarah: calculatedIncome.Sarah || 0
        });
    }
  }, [calculatedIncome]);

  // --- CALCULATIONS ---
  const expensesRoland = totalsData.Roland || 0;
  const expensesSarah = totalsData.Sarah || 0;
  
  const netRoland = (parseFloat(incomeData.Roland) || 0) - expensesRoland;
  const netSarah = (parseFloat(incomeData.Sarah) || 0) - expensesSarah;
  
  const totalIncome = (parseFloat(incomeData.Roland) || 0) + (parseFloat(incomeData.Sarah) || 0);
  const totalExpenses = expensesRoland + expensesSarah;
  const totalNet = totalIncome - totalExpenses;

  // --- DATA PREP FOR TABLES ---
  const buildCompleteData = (personName) => {
    const cleanCategories = CATEGORIES.filter(c => c !== 'Uncategorized');
    return cleanCategories.map(catName => {
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

  // --- SUB-COMPONENT: BUDGET TABLE ---
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
        
        {/* --- 1. HOUSEHOLD SUMMARY BANNER --- */}
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${totalNet >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {totalNet >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Total Household Net</h3>
                        <div className={`text-3xl font-bold tracking-tight ${totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalNet > 0 ? '+' : ''}{formatCurrency(totalNet)}
                        </div>
                    </div>
                </div>
                <div className="flex gap-8 text-sm text-muted-foreground">
                    <div className="text-center sm:text-right">
                        <div className="font-semibold text-foreground">{formatCurrency(totalIncome)}</div>
                        <div>Combined Income</div>
                    </div>
                    <div className="text-center sm:text-right">
                        <div className="font-semibold text-destructive">-{formatCurrency(totalExpenses)}</div>
                        <div>Total Spent</div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* --- 2. INDIVIDUAL NET CALCULATORS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Roland', 'Sarah'].map(person => {
                const isRoland = person === 'Roland';
                const income = parseFloat(incomeData[person]) || 0;
                const expenses = isRoland ? expensesRoland : expensesSarah;
                const net = isRoland ? netRoland : netSarah;
                const isPositive = net >= 0;
                
                const borderColor = isRoland ? 'border-blue-200 dark:border-blue-900' : 'border-pink-200 dark:border-pink-900';
                const iconColor = isRoland ? 'text-blue-500' : 'text-pink-500';

                return (
                    <Card key={person} className={`bg-card ${borderColor} border-l-4 shadow-sm`}>
                        <CardHeader className="pb-2 pt-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Wallet className={`h-4 w-4 ${iconColor}`} /> {person}'s Monthly Result
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                {/* Income Input Row */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Income (Auto-Calc)</Label>
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
                                        <Label className="text-xs block mb-1">Expenses</Label>
                                        <div className="text-lg font-semibold text-destructive font-mono">
                                            -{formatCurrency(expenses)}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Net Result Row */}
                                <div className="pt-3 border-t flex justify-between items-center bg-muted/20 -mx-6 px-6 -mb-6 pb-4 pt-4 mt-2">
                                    <span className="font-medium text-sm">Left Over</span>
                                    <span className={`text-xl font-bold font-mono ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? '+' : ''}{formatCurrency(net)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>

        {/* --- 3. COMPARISON TABLES --- */}
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
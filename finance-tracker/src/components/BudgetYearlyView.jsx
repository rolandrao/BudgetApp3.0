import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../lib/budget-constants'; // Adjust path

export default function BudgetYearlyView({ data }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
        {data.map((m) => {
            const variance = m.totalLimit - m.totalSpent;
            const isOver = variance < 0;
            const percent = m.totalLimit > 0 ? (m.totalSpent / m.totalLimit) * 100 : 0;
            return (
                <Card key={m.monthIndex} className={`border-l-4 ${m.isFuture ? 'opacity-50' : isOver ? 'border-l-destructive' : 'border-l-green-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{m.monthName}</CardTitle>
                        {isOver ? <TrendingUp className="h-4 w-4 text-destructive" /> : <TrendingDown className="h-4 w-4 text-green-500" />}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(m.totalSpent)}</div>
                        <p className="text-xs text-muted-foreground mb-3">Limit: {formatCurrency(m.totalLimit)}</p>
                        <Progress value={Math.min(percent, 100)} className={`h-2 ${isOver ? "bg-destructive/20 [&>*]:bg-destructive" : "[&>*]:bg-green-500"}`} />
                        <div className="mt-2 text-sm font-medium flex justify-between">
                            <span className={isOver ? "text-destructive" : "text-green-600"}>
                                {isOver ? "+" : ""}{formatCurrency(m.totalSpent - m.totalLimit)} {isOver ? "Over" : "Under"}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            );
        })}
    </div>
  );
}
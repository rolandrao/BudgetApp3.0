import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableCell, DateCell } from './TransactionCells';
import { CATEGORIES } from '@/lib/budget-constants';

export default function TransactionMobileList({ data, onUpdate, onDelete }) {
  return (
    <div className="md:hidden divide-y border-t sm:border-t-0">
      {data.map((t) => (
        <div key={t.id} className="p-4 bg-card active:bg-muted/50 transition-colors">
           {/* Top Row: Date & Actions */}
           <div className="flex justify-between items-start">
              <div className="space-y-1 w-full mr-4">
                  <DateCell value={t.transaction_date} onSave={(val) => onUpdate(t.id, 'transaction_date', val)} />
                  <EditableCell value={t.description} onSave={(val) => onUpdate(t.id, 'description', val)} className="font-bold text-base" />
              </div>
              <div className="text-right whitespace-nowrap">
                  <EditableCell value={t.amount} type="number" onSave={(val) => onUpdate(t.id, 'amount', val)} className="font-mono text-lg font-bold" />
              </div>
           </div>
           
           {/* Bottom Row: Controls */}
           <div className="grid grid-cols-2 gap-2 pt-2">
                {/* Category */}
                <Select value={t.category || "Uncategorized"} onValueChange={(val) => onUpdate(t.id, 'category', val)}>
                    <SelectTrigger className="h-8 text-xs border bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
                
                {/* Paid By */}
                <Select value={t.paid_by || "Roland"} onValueChange={(val) => onUpdate(t.id, 'paid_by', val)}>
                  <SelectTrigger className={`h-8 text-xs ${t.paid_by === 'Sarah' ? 'text-pink-600 bg-pink-50 dark:bg-pink-950 dark:text-pink-300' : 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                </Select>
           </div>
           
           {/* Footer: Shared & Delete */}
           <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={t.is_shared || false} onCheckedChange={(checked) => onUpdate(t.id, 'is_shared', checked)} id={`shared-${t.id}`} />
                <label htmlFor={`shared-${t.id}`} className="text-sm text-muted-foreground">Shared Split</label>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)} className="text-destructive h-8 px-2">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
           </div>
        </div>
      ))}
    </div>
  );
}
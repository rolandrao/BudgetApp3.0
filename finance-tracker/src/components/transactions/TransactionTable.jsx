import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableCell, DateCell } from './TransactionCells'; // Import helpers
import { CATEGORIES } from '@/lib/budget-constants'; // Adjust path if needed

export default function TransactionTable({ data, onUpdate, onDelete, onSort, SortIcon }) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/50">
            <TableHead className="w-[130px] cursor-pointer" onClick={() => onSort('transaction_date')}>
              <div className="flex items-center gap-2">Date <SortIcon column="transaction_date" /></div>
            </TableHead>
            <TableHead className="max-w-[300px] cursor-pointer" onClick={() => onSort('description')}>
              <div className="flex items-center gap-2">Description <SortIcon column="description" /></div>
            </TableHead>
            <TableHead className="w-[120px] cursor-pointer" onClick={() => onSort('amount')}>
              <div className="flex items-center gap-2">Amount <SortIcon column="amount" /></div>
            </TableHead>
            <TableHead className="w-[180px] cursor-pointer" onClick={() => onSort('category')}>
              <div className="flex items-center gap-2">Category <SortIcon column="category" /></div>
            </TableHead>
            <TableHead className="w-[120px] cursor-pointer" onClick={() => onSort('paid_by')}>
              <div className="flex items-center gap-2">Paid By <SortIcon column="paid_by" /></div>
            </TableHead>
            <TableHead className="text-center w-[100px]">Shared</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((t) => (
            <TableRow key={t.id} className="group hover:bg-muted/50">
              <TableCell><DateCell value={t.transaction_date} onSave={(val) => onUpdate(t.id, 'transaction_date', val)} /></TableCell>
              <TableCell><EditableCell value={t.description || ''} onSave={(val) => onUpdate(t.id, 'description', val)} /></TableCell>
              <TableCell><EditableCell value={t.amount} type="number" className="font-mono" onSave={(val) => onUpdate(t.id, 'amount', val)} /></TableCell>
              
              {/* Category */}
              <TableCell>
                <Select value={t.category || "Uncategorized"} onValueChange={(val) => onUpdate(t.id, 'category', val)}>
                    <SelectTrigger className="h-8 w-full border-none shadow-none font-medium text-muted-foreground hover:text-foreground">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
              </TableCell>

              {/* Paid By */}
              <TableCell>
                <Select value={t.paid_by || "Roland"} onValueChange={(val) => onUpdate(t.id, 'paid_by', val)}>
                  <SelectTrigger className={`h-8 border-none shadow-none font-medium ${t.paid_by === 'Sarah' ? 'text-pink-600 bg-pink-50 dark:bg-pink-950 dark:text-pink-300' : 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                </Select>
              </TableCell>

              <TableCell className="text-center">
                <Checkbox checked={t.is_shared || false} onCheckedChange={(checked) => onUpdate(t.id, 'is_shared', checked)} className="data-[state=checked]:bg-purple-600 border-purple-300" />
              </TableCell>
              
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDelete(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
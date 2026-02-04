import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Adjust path
import { CATEGORIES } from '@/lib/budget-constants'; // Adjust path
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Layers } from 'lucide-react';

export default function BulkAddDialog({ onBulkAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: 'Rent',
    amount: '',
    category: 'Rent',
    paid_by: 'Roland',
    is_shared: true,
    startDate: '',
    endDate: '',
    dayOfMonth: '1', // Default to 1st of month
    frequency: 'Monthly'
  });

  const generateDates = () => {
    const dates = [];
    let current = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const targetDay = parseInt(formData.dayOfMonth);

    // Normalize current to the target day of its month
    current.setDate(targetDay);
    
    // If setting the day moved us backwards (e.g. started Jan 5, set to Jan 1), 
    // or if the start date is naturally after the calculated target, move to next month
    if (current < new Date(formData.startDate)) {
        current.setMonth(current.getMonth() + 1);
    }

    while (current <= end) {
        dates.push(new Date(current).toISOString().split('T')[0]);
        // Add 1 Month
        current.setMonth(current.getMonth() + 1);
    }
    return dates;
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.startDate || !formData.endDate) {
        alert("Please fill in all fields");
        return;
    }

    setLoading(true);
    const dates = generateDates();
    
    if (dates.length === 0) {
        alert("No dates generated within this range. Check your start/end dates.");
        setLoading(false);
        return;
    }

    if(!confirm(`This will create ${dates.length} transactions. Proceed?`)) {
        setLoading(false);
        return;
    }

    const payload = dates.map(date => ({
        transaction_date: date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paid_by: formData.paid_by,
        is_shared: formData.is_shared,
        created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase.from('transactions').insert(payload).select();

    setLoading(false);
    if (error) {
        alert(error.message);
    } else {
        onBulkAdd(data);
        setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
            <Layers className="h-4 w-4" /> Bulk Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>Bulk Add Recurring Transactions</DialogTitle>
            <DialogDescription>Perfect for Rent, Subscriptions, or Payment Plans.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {/* Top Row: Description & Amount */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
            </div>

            {/* Category & Payer */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label>Paid By</Label>
                    <Select value={formData.paid_by} onValueChange={v => setFormData({...formData, paid_by: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                    </Select>
                 </div>
            </div>

            {/* Date Logic */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Select value={formData.dayOfMonth} onValueChange={v => setFormData({...formData, dayOfMonth: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[...Array(31)].map((_, i) => (
                                <SelectItem key={i+1} value={(i+1).toString()}>{i+1}{getOrdinal(i+1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2 flex items-center pt-8 gap-2">
                    <Checkbox id="bulk-shared" checked={formData.is_shared} onCheckedChange={c => setFormData({...formData, is_shared: c})} />
                    <Label htmlFor="bulk-shared">Split this cost?</Label>
                 </div>
            </div>
        </div>
        <DialogFooter>
            <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Transactions
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
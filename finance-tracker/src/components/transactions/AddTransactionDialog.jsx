import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AddTransactionDialog({ onTransactionAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // State for dynamic categories
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '', // Start empty to force user selection
    paid_by: 'Roland',
    is_shared: false
  });

  // Fetch categories from DB on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('category_name')
          .order('category_name', { ascending: true });

        if (error) throw error;
        
        if (data) {
           setCategoryOptions(data.map(c => c.category_name));
           // Optional: Set default category if list isn't empty
           // if (data.length > 0) setNewTx(prev => ({ ...prev, category: data[0].category_name }));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    if (!newTx.description || !newTx.amount) {
        alert("Please enter a description and amount.");
        return;
    }

    setIsAdding(true);
    
    const payload = {
        transaction_date: newTx.date,
        description: newTx.description,
        amount: parseFloat(newTx.amount),
        category: newTx.category || 'Uncategorized', // Fallback
        paid_by: newTx.paid_by,
        is_shared: newTx.is_shared,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('transactions').insert([payload]).select();

    setIsAdding(false);

    if (error) {
        alert(`Error: ${error.message}`);
    } else {
        onTransactionAdded(data[0]); 
        setIsOpen(false);
        // Reset form
        setNewTx({
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: '',
            category: '',
            paid_by: 'Roland',
            is_shared: false
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
          <Button className="flex-1 sm:flex-none gap-2">
              <Plus className="h-4 w-4" /> Add New
          </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>Manually enter a new expense.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input id="date" type="date" value={newTx.date} onChange={(e) => setNewTx({...newTx, date: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="desc" className="text-right">Description</Label>
                  <Input id="desc" placeholder="Description" value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount</Label>
                  <Input id="amount" type="number" placeholder="0.00" value={newTx.amount} onChange={(e) => setNewTx({...newTx, amount: e.target.value})} className="col-span-3" />
              </div>
              
              {/* Dynamic Category Select */}
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <div className="col-span-3">
                      <Select 
                        value={newTx.category} 
                        onValueChange={(val) => setNewTx({...newTx, category: val})}
                        disabled={loadingCategories}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder={loadingCategories ? "Loading..." : "Select Category"} />
                          </SelectTrigger>
                          <SelectContent>
                              {categoryOptions.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paid_by" className="text-right">Paid By</Label>
                   <div className="col-span-3">
                      <Select value={newTx.paid_by} onValueChange={(val) => setNewTx({...newTx, paid_by: val})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Roland">Roland</SelectItem>
                              <SelectItem value="Sarah">Sarah</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                   <Label className="text-right">Shared</Label>
                   <div className="col-span-3 flex items-center gap-2">
                      <Checkbox id="shared" checked={newTx.is_shared} onCheckedChange={(checked) => setNewTx({...newTx, is_shared: checked})} />
                      <label htmlFor="shared" className="text-sm text-muted-foreground cursor-pointer">Split this cost?</label>
                   </div>
              </div>
          </div>
          <DialogFooter>
              <Button type="submit" onClick={handleSubmit} disabled={isAdding}>
                  {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Transaction"}
              </Button>
          </DialogFooter>
      </DialogContent>
   </Dialog>
  );
}
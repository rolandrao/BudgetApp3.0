import { useState, useEffect, memo } from 'react';
import { supabase } from '@/lib/supabase'; 
import { Loader2, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BudgetConfigDialog = memo(({ onSave, initialLimits }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [limits, setLimits] = useState({});
  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    if (initialLimits) {
        const limitMap = {};
        initialLimits.forEach(l => {
            // FIX: Use the direct category_id first, fallback to the joined object if needed
            const catId = l.category_id || l.categories?.category_id;
            
            if (catId) {
                limitMap[`${catId}_${l.user_name}`] = l.monthly_limit;
            }
        });
        setLimits(limitMap);
    }
  }, [initialLimits]);

  useEffect(() => {
     if (isOpen) {
         supabase.from('categories').select('*').order('category_name', { ascending: true }).then(({ data }) => {
             if (data) setCategoriesList(data);
         });
     }
  }, [isOpen]);

  const handleLimitChange = (categoryId, user, value) => {
     setLimits(prev => ({ ...prev, [`${categoryId}_${user}`]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const upserts = [];
    Object.keys(limits).forEach(key => {
        const [catId, user] = key.split('_');
        const limitVal = limits[key];
        
        // Save if value exists (even if it's 0)
        if (limitVal !== '' && limitVal !== undefined) {
            upserts.push({ 
                category_id: parseInt(catId), 
                user_name: user, 
                monthly_limit: parseFloat(limitVal) 
            });
        }
    });

    if (upserts.length > 0) {
        const { error } = await supabase.from('budget_limits').upsert(upserts, { onConflict: 'category_id, user_name' });
        if (error) alert("Error: " + error.message);
        else onSave();
    }
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
          <Button variant="outline" className="gap-2"><Settings className="h-4 w-4" /> Configure Limits</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
              <DialogTitle>Monthly Budget Limits</DialogTitle>
              <DialogDescription>
                  Set the target spending limit for each category per person.
              </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
               {categoriesList.length === 0 ? (
                   <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground"/></div>
               ) : (
                   categoriesList.map(cat => (
                      <div key={cat.category_id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 last:border-0 gap-4">
                          <span className="font-medium min-w-[120px]">{cat.category_name}</span>
                          <div className="flex gap-4 w-full sm:w-auto">
                             {['Roland', 'Sarah'].map(person => (
                                 <div key={person} className="flex flex-col w-full sm:w-[140px]">
                                    <Label className="text-xs text-muted-foreground mb-1">{person}</Label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">$</span>
                                        <Input 
                                            type="number" 
                                            className="pl-6 h-9" 
                                            placeholder="0"
                                            // Ensure we check for undefined so we don't lock the input
                                            value={limits[`${cat.category_id}_${person}`] === undefined ? '' : limits[`${cat.category_id}_${person}`]}
                                            onChange={(e) => handleLimitChange(cat.category_id, person, e.target.value)}
                                        /> 
                                    </div>
                                 </div>
                             ))}
                          </div>
                      </div>
                  ))
               )}
          </div>
          
          <DialogFooter>
              <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
          </DialogFooter>
      </DialogContent>
   </Dialog>
  );
});

export default BudgetConfigDialog;
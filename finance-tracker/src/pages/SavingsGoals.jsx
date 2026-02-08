import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trophy, Calendar, TrendingUp, AlertCircle, PlayCircle, Pencil, Trash2, ArrowLeft, ArrowRight, Link as LinkIcon, GripVertical, Save, X, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/lib/budget-constants';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- SUB-COMPONENT: Circular Progress ---
const CircularProgress = ({ value, size = 120, strokeWidth = 10, children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle className="text-muted/20" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
                <circle className="text-primary transition-all duration-1000 ease-out" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                {children}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Sortable Goal Card ---
const SortableGoalCard = ({ goal, isRearranging, onEdit, onDelete, allocations }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: goal.id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    
    const getMonthlyEquivalent = (amount, freq) => {
      const f = (freq || 'monthly').toLowerCase();
      if (f === 'weekly') return amount * 4.33;     
      if (f === 'bi-weekly') return amount * 2.165; 
      return amount; 
    };

    const getCompletionData = (g) => {
        const goalAllocations = allocations.filter(a => a.savings_goal_id === g.id);
        const monthlyRate = goalAllocations.reduce((sum, a) => sum + getMonthlyEquivalent(a.amount, a.frequency), 0);
        const remaining = g.target_amount - g.current_amount;
        const isRollover = !!g.linked_category;

        if (remaining <= 0) return { date: "Completed!", isDone: true };
        if (isRollover) return { date: "Fueled by Budget Rollover", rate: 0, isDone: false, isRollover: true };
        if (monthlyRate <= 0) return { date: "No auto-save set", isDone: false, noRate: true };

        const monthsToGo = Math.ceil(remaining / monthlyRate);
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + monthsToGo);
        
        return { 
            date: futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            rate: monthlyRate, 
            isDone: false 
        };
    };

    const { date, rate, isDone, noRate, isRollover } = getCompletionData(goal);

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <Card className={`relative flex flex-col items-center text-center overflow-visible border shadow-sm hover:shadow-md transition-shadow group h-full ${isRearranging ? 'cursor-move ring-2 ring-primary/20 bg-muted/5' : ''}`}>
                <CardHeader className="pb-2 w-full flex flex-row items-center justify-center relative">
                    {isRearranging && (
                        <div className="absolute left-3 top-3 text-muted-foreground" {...listeners}>
                            <GripVertical className="h-5 w-5" />
                        </div>
                    )}

                    <CardTitle className="flex items-center gap-2 text-xl">
                        {goal.name}
                        {isDone && <Trophy className="h-5 w-5 text-yellow-500" />}
                    </CardTitle>

                    {!isRearranging && (
                        <div className="absolute right-0 top-0 flex">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => onEdit(goal)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDelete(goal.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col items-center w-full pb-6">
                    <div className="py-6 pointer-events-none select-none">
                        <CircularProgress value={percent} size={160} strokeWidth={12}>
                            <div className="text-3xl font-bold">{percent.toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Done</div>
                        </CircularProgress>
                    </div>

                    <div className="mb-6 space-y-1">
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(goal.current_amount)}</div>
                        <div className="text-sm text-muted-foreground">target: {formatCurrency(goal.target_amount)}</div>
                    </div>

                    <div className="w-full bg-muted/40 rounded-lg p-3 text-sm mb-6">
                        {isDone ? (
                            <div className="flex items-center justify-center text-green-600 font-medium gap-2">
                                <Trophy className="h-4 w-4" /> Goal Achieved!
                            </div>
                        ) : isRollover ? (
                            <div className="space-y-1">
                                    <div className="flex items-center justify-center text-blue-600 font-medium gap-2">
                                    <LinkIcon className="h-4 w-4" /> 
                                    {goal.linked_user ? `${goal.linked_user}'s ${goal.linked_category}` : `Household ${goal.linked_category}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Budget surplus rolls over on the 1st.
                                </div>
                            </div>
                        ) : noRate ? (
                            <div className="flex items-center justify-center text-muted-foreground gap-2 opacity-80">
                                <AlertCircle className="h-4 w-4" /> No recurring savings linked
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Projected Monthly Pace:</span>
                                    <span className="font-mono text-foreground">{formatCurrency(rate)}/mo</span>
                                </div>
                                <div className="flex items-center justify-between font-medium pt-1 border-t border-muted-foreground/10">
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Finish By:</span>
                                    <span className="text-primary">{date}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [processingAuto, setProcessingAuto] = useState(false);
  
  const [isRearranging, setIsRearranging] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({ name: '', target_amount: '', current_amount: '0', linked_category: 'none', linked_user: 'household' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: goalData } = await supabase.from('savings_goals').select('*').order('rank', { ascending: true });
    if (goalData) setGoals(goalData);

    const { data: allocData } = await supabase.from('recurring_allocations').select('*');
    if (allocData) setAllocations(allocData);

    const { data: catData } = await supabase.from('categories').select('*').order('category_name');
    if (catData) setCategories(catData);

    setLoading(false);
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
        setGoals((items) => {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
        setHasOrderChanged(true);
    }
  };

  const saveOrder = async () => {
      setLoading(true);
      const updates = goals.map((goal, index) => ({ id: goal.id, rank: index }));
      for (const update of updates) {
          await supabase.from('savings_goals').update({ rank: update.rank }).eq('id', update.id);
      }
      setHasOrderChanged(false);
      setIsRearranging(false);
      setLoading(false);
  };

  const cancelRearrange = () => {
      setIsRearranging(false);
      setHasOrderChanged(false);
      fetchData(); 
  };

  const handleDelete = async (id) => {
      if(!confirm("Are you sure you want to delete this goal?")) return;
      await supabase.from('savings_goals').delete().eq('id', id);
      fetchData();
  };

  const openCreateDialog = () => {
      setEditingId(null);
      setFormData({ name: '', target_amount: '', current_amount: '0', linked_category: 'none', linked_user: 'household' });
      setIsDialogOpen(true);
  };

  const openEditDialog = (goal) => {
      setEditingId(goal.id);
      setFormData({ 
          name: goal.name, 
          target_amount: goal.target_amount, 
          current_amount: goal.current_amount,
          linked_category: goal.linked_category || 'none',
          linked_user: goal.linked_user || 'household'
      });
      setIsDialogOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!formData.name || !formData.target_amount) return;
    
    let newRank = 0;
    if (!editingId && goals.length > 0) {
        newRank = Math.max(...goals.map(g => g.rank || 0)) + 1;
    } else if (editingId) {
        const existing = goals.find(g => g.id === editingId);
        newRank = existing.rank;
    }

    const payload = {
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount),
        linked_category: formData.linked_category === 'none' ? null : formData.linked_category,
        linked_user: formData.linked_user === 'household' ? null : formData.linked_user,
        rank: newRank
    };

    if (editingId) {
        await supabase.from('savings_goals').update(payload).eq('id', editingId);
    } else {
        await supabase.from('savings_goals').insert([payload]);
    }
    
    fetchData();
    setIsDialogOpen(false);
  };

  const getMonthlyEquivalent = (amount, freq) => {
      const f = (freq || 'monthly').toLowerCase();
      if (f === 'weekly') return amount * 4.33;     
      if (f === 'bi-weekly') return amount * 2.165; 
      return amount; 
  };

  const handleApplyMonthlySavings = async () => {
      if(!confirm("Apply one month of standard auto-savings?")) return;
      setProcessingAuto(true);
      const updates = {};
      allocations.forEach(alloc => {
          if (alloc.savings_goal_id) {
              const monthlyVal = getMonthlyEquivalent(alloc.amount, alloc.frequency);
              updates[alloc.savings_goal_id] = (updates[alloc.savings_goal_id] || 0) + monthlyVal;
          }
      });
      for (const [goalId, amountToAdd] of Object.entries(updates)) {
          const goal = goals.find(g => g.id === parseInt(goalId));
          if (goal) {
              await supabase.from('savings_goals').update({ current_amount: goal.current_amount + amountToAdd }).eq('id', parseInt(goalId));
          }
      }
      await fetchData();
      setProcessingAuto(false);
  };

  const totalMonthlyAutoSave = allocations.reduce((sum, a) => sum + (a.savings_goal_id ? getMonthlyEquivalent(a.amount, a.frequency) : 0), 0);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 px-4 sm:px-0">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
               <p className="text-muted-foreground">Visualizing your path to financial freedom.</p>
            </div>
            
            <div className="flex items-center gap-2">
                {isRearranging ? (
                    <>
                        <Button variant="outline" onClick={cancelRearrange} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
                        <Button onClick={saveOrder} disabled={!hasOrderChanged} className="gap-2"><Save className="h-4 w-4" /> Save Order</Button>
                    </>
                ) : (
                    <Button variant="outline" onClick={() => setIsRearranging(true)} className="gap-2"><GripVertical className="h-4 w-4" /> Rearrange</Button>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={openCreateDialog} disabled={isRearranging}><Plus className="h-4 w-4"/> New Goal</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editingId ? "Edit Goal" : "Create New Goal"}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Goal Name</label>
                                <Input placeholder="e.g. Japan Trip" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Target ($)</label>
                                    <Input type="number" placeholder="5000" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Current ($)</label>
                                    <Input type="number" placeholder="0" value={formData.current_amount} onChange={e => setFormData({...formData, current_amount: e.target.value})} />
                                </div>
                            </div>
                            
                            {/* LINKED CATEGORY SECTION */}
                            <div className="space-y-3 pt-3 border-t">
                                 <label className="text-sm font-medium flex items-center gap-2">
                                    <LinkIcon className="h-3 w-3" /> Budget Rollover Source
                                 </label>
                                 <div className="grid grid-cols-2 gap-2">
                                     <Select value={formData.linked_category} onValueChange={(v) => setFormData({ ...formData, linked_category: v })}>
                                        <SelectTrigger><SelectValue placeholder="Category..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- No Link --</SelectItem>
                                            {categories.map(c => <SelectItem key={c.category_id} value={c.category_name}>{c.category_name}</SelectItem>)}
                                        </SelectContent>
                                     </Select>

                                     {/* NEW: USER SELECTOR FOR ROLLOVER */}
                                     {formData.linked_category !== 'none' && (
                                         <Select value={formData.linked_user} onValueChange={(v) => setFormData({ ...formData, linked_user: v })}>
                                            <SelectTrigger><SelectValue placeholder="Whose Budget?" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="household">Household (Combined)</SelectItem>
                                                <SelectItem value="Roland">Roland Only</SelectItem>
                                                <SelectItem value="Sarah">Sarah Only</SelectItem>
                                            </SelectContent>
                                         </Select>
                                     )}
                                 </div>
                                 {formData.linked_category !== 'none' && (
                                    <p className="text-[10px] text-muted-foreground">
                                        Surplus from <strong>{formData.linked_user === 'household' ? 'the household' : formData.linked_user + "'s"}</strong> {formData.linked_category} budget will be added on the 1st.
                                    </p>
                                 )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveGoal}>{editingId ? "Save Changes" : "Create Goal"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
         </div>

         {/* --- AUTO-SAVE RUNNER --- */}
         {totalMonthlyAutoSave > 0 && !isRearranging && (
             <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
                 <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-300">
                            <TrendingUp className="h-5 w-5" />
                         </div>
                         <div>
                             <h3 className="font-semibold text-foreground">Monthly Savings Engine</h3>
                             <p className="text-sm text-muted-foreground">
                                 You are saving a projected <span className="font-medium text-foreground">{formatCurrency(totalMonthlyAutoSave)}/mo</span> based on your recurring transfers.
                             </p>
                         </div>
                     </div>
                     <Button 
                        onClick={handleApplyMonthlySavings} 
                        disabled={processingAuto}
                        className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                     >
                        {processingAuto ? <Loader2 className="animate-spin h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        Apply Standard Savings
                     </Button>
                 </div>
             </Card>
         )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={goals.map(g => g.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4 sm:px-0">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground"/></div>
                ) : goals.map((goal) => (
                    <SortableGoalCard 
                        key={goal.id} 
                        goal={goal} 
                        isRearranging={isRearranging}
                        onEdit={openEditDialog}
                        onDelete={handleDelete}
                        allocations={allocations}
                    />
                ))}
            </div>
        </SortableContext>
      </DndContext>

    </div>
  );
}
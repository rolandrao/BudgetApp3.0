import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trophy, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from '@/lib/budget-constants';

// --- SUB-COMPONENT: Circular Progress ---
const CircularProgress = ({ value, size = 120, strokeWidth = 10, children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                {/* Background Circle */}
                <circle
                    className="text-muted/20"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Circle */}
                <circle
                    className="text-primary transition-all duration-1000 ease-out"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                {children}
            </div>
        </div>
    );
};

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', current_amount: '0' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // 1. Fetch Goals
    const { data: goalData } = await supabase.from('savings_goals').select('*').order('created_at');
    if (goalData) setGoals(goalData);

    // 2. Fetch Allocations (to calculate expected dates)
    const { data: allocData } = await supabase.from('recurring_allocations').select('*');
    if (allocData) setAllocations(allocData);

    setLoading(false);
  }

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) return;
    
    const { error } = await supabase.from('savings_goals').insert([{
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount)
    }]);

    if (!error) {
        fetchData();
        setIsDialogOpen(false);
        setNewGoal({ name: '', target_amount: '', current_amount: '0' });
    }
  };

  const handleUpdateAmount = async (id, currentAmount, change) => {
    const newVal = currentAmount + change;
    await supabase.from('savings_goals').update({ current_amount: newVal }).eq('id', id);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current_amount: newVal } : g));
  };

  // --- Logic to calculate completion date ---
  const getCompletionData = (goal) => {
      // 1. Find all monthly auto-saves for this specific goal
      const goalAllocations = allocations.filter(a => a.savings_goal_id === goal.id);
      const monthlyContribution = goalAllocations.reduce((sum, a) => sum + a.amount, 0);
      
      const remaining = goal.target_amount - goal.current_amount;

      if (remaining <= 0) return { date: "Completed!", isDone: true };
      if (monthlyContribution <= 0) return { date: "No auto-save set", isDone: false, noRate: true };

      // 2. Calculate months remaining
      const monthsToGo = Math.ceil(remaining / monthlyContribution);
      
      // 3. Project the date
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + monthsToGo);
      
      return { 
          date: futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          rate: monthlyContribution,
          isDone: false 
      };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-0">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
            <p className="text-muted-foreground">Visualizing your path to financial freedom.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4"/> New Goal</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Create New Goal</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Goal Name</label>
                        <Input placeholder="e.g. Japan Trip" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target ($)</label>
                            <Input type="number" placeholder="5000" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Starting ($)</label>
                            <Input type="number" placeholder="0" value={newGoal.current_amount} onChange={e => setNewGoal({...newGoal, current_amount: e.target.value})} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddGoal}>Create Goal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4 sm:px-0">
        {loading ? (
            <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground"/></div>
        ) : goals.map(goal => {
            const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            const { date, rate, isDone, noRate } = getCompletionData(goal);
            
            return (
                <Card key={goal.id} className="relative flex flex-col items-center text-center overflow-visible border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            {goal.name}
                            {isDone && <Trophy className="h-5 w-5 text-yellow-500" />}
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col items-center w-full pb-6">
                        {/* Circular Progress */}
                        <div className="py-6">
                            <CircularProgress value={percent} size={160} strokeWidth={12}>
                                <div className="text-3xl font-bold">{percent.toFixed(0)}%</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Done</div>
                            </CircularProgress>
                        </div>

                        {/* Amount Detail */}
                        <div className="mb-6 space-y-1">
                            <div className="text-2xl font-bold text-foreground">
                                {formatCurrency(goal.current_amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                target: {formatCurrency(goal.target_amount)}
                            </div>
                        </div>

                        {/* Forecast Section */}
                        <div className="w-full bg-muted/40 rounded-lg p-3 text-sm mb-6">
                            {isDone ? (
                                <div className="flex items-center justify-center text-green-600 font-medium gap-2">
                                    <Trophy className="h-4 w-4" /> Goal Achieved!
                                </div>
                            ) : noRate ? (
                                <div className="flex items-center justify-center text-muted-foreground gap-2 opacity-80">
                                    <AlertCircle className="h-4 w-4" /> No recurring savings linked
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Monthly Pace:</span>
                                        <span className="font-mono text-foreground">{formatCurrency(rate)}/mo</span>
                                    </div>
                                    <div className="flex items-center justify-between font-medium pt-1 border-t border-muted-foreground/10">
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Finish By:</span>
                                        <span className="text-primary">{date}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Add Buttons */}
                        <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                            <Button variant="outline" size="sm" onClick={() => handleUpdateAmount(goal.id, goal.current_amount, 100)}>
                                <TrendingUp className="h-3 w-3 mr-1 text-green-600" /> +$100
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleUpdateAmount(goal.id, goal.current_amount, 500)}>
                                <TrendingUp className="h-3 w-3 mr-1 text-green-600" /> +$500
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
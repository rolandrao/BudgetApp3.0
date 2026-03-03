import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Loader2, DollarSign, Calendar, Pencil, Check, X, Users, User, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// --- SUB-COMPONENT: Editable Allocation Row (Savings) ---
// *UPDATED to include Category prop*
const AllocationRow = ({ alloc, goals, categories, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        user_name: alloc.user_name,
        amount: alloc.amount,
        frequency: alloc.frequency || 'monthly', 
        category: alloc.category || 'Savings', // Add category state
        savings_goal_id: alloc.savings_goal_id ? alloc.savings_goal_id.toString() : 'none'
    });

    const handleSave = async () => {
        await onUpdate(alloc.id, {
            user_name: editValues.user_name,
            amount: parseFloat(editValues.amount),
            frequency: editValues.frequency,
            category: editValues.category,
            savings_goal_id: editValues.savings_goal_id === 'none' ? null : parseInt(editValues.savings_goal_id)
        });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex flex-col sm:flex-row items-center gap-2 p-2 border rounded-lg bg-muted/20 animate-in fade-in flex-wrap">
                <Select value={editValues.user_name} onValueChange={(v) => setEditValues({ ...editValues, user_name: v })}>
                    <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                </Select>
                
                <div className="relative w-[90px]">
                    <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                    <Input type="number" className="pl-4 h-8" value={editValues.amount} onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })} />
                </div>

                <Select value={editValues.frequency} onValueChange={(v) => setEditValues({ ...editValues, frequency: v })}>
                    <SelectTrigger className="w-[110px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                </Select>

                {/* NEW: Category Dropdown */}
                <Select value={editValues.category} onValueChange={(v) => setEditValues({ ...editValues, category: v })}>
                    <SelectTrigger className="w-[120px] h-8"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                        {categories.map(c => <SelectItem key={c.category_id} value={c.category_name}>{c.category_name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={editValues.savings_goal_id} onValueChange={(v) => setEditValues({ ...editValues, savings_goal_id: v })}>
                    <SelectTrigger className="flex-1 h-8 min-w-[120px]"><SelectValue placeholder="Goal" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">General Savings</SelectItem>
                        {goals.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="flex gap-1 ml-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSave}><Check className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="flex flex-col">
                <span className="font-medium flex items-center gap-2">
                    {alloc.user_name} saves ${alloc.amount}
                    <Badge variant="secondary" className="text-[10px] h-5 font-normal px-1.5 capitalize">{alloc.frequency || 'monthly'}</Badge>
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <span>Target: {alloc.savings_goals?.name || 'General'}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-primary/70">Category: {alloc.category || 'Savings'}</span>
                </span>
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(alloc.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Editable Expense Row (Bills) ---
const ExpenseRow = ({ exp, categories, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        paid_by: exp.paid_by,
        is_shared: exp.is_shared
    });

    const handleSave = async () => {
        await onUpdate(exp.id, {
            description: editValues.description,
            amount: parseFloat(editValues.amount),
            category: editValues.category,
            paid_by: editValues.paid_by,
            is_shared: editValues.is_shared
        });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex flex-col md:flex-row items-center gap-2 p-2 border rounded-lg bg-muted/20 animate-in fade-in flex-wrap">
                <Input className="flex-1 min-w-[150px] h-8" placeholder="Description" value={editValues.description} onChange={e => setEditValues({...editValues, description: e.target.value})} />
                
                <Select value={editValues.category} onValueChange={v => setEditValues({...editValues, category: v})}>
                    <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {categories.map(c => <SelectItem key={c.category_id} value={c.category_name}>{c.category_name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={editValues.paid_by} onValueChange={v => setEditValues({...editValues, paid_by: v})}>
                    <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                </Select>

                <div className="flex items-center space-x-2 bg-background px-2 h-8 rounded border">
                    <Checkbox id={`edit-shared-${exp.id}`} checked={editValues.is_shared} onCheckedChange={(c) => setEditValues({...editValues, is_shared: c})} />
                    <Label htmlFor={`edit-shared-${exp.id}`} className="text-xs cursor-pointer">Shared?</Label>
                </div>

                <div className="relative w-[90px]">
                    <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                    <Input type="number" className="pl-4 h-8" value={editValues.amount} onChange={e => setEditValues({...editValues, amount: e.target.value})} />
                </div>

                <div className="flex gap-1 ml-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSave}><Check className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{exp.description}</span>
                    {exp.is_shared ? (
                        <Badge variant="secondary" className="h-5 text-[10px] gap-1 px-1.5"><Users className="h-3 w-3" /> Shared</Badge>
                    ) : (
                        <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5 text-muted-foreground"><User className="h-3 w-3" /> Personal</Badge>
                    )}
                </div>
                <span className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
                    <Badge variant="outline" className="text-[10px] h-5 font-normal">{exp.category}</Badge>
                    <span>Paid by {exp.paid_by}</span>
                </span>
            </div>
            <div className="flex items-center gap-3">
                <span className="font-bold text-sm sm:text-base">${exp.amount}</span>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(exp.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            </div>
        </div>
    );
};

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);

    // Data States
    const [categories, setCategories] = useState([]);
    const [goals, setGoals] = useState([]);
    const [incomeSettings, setIncomeSettings] = useState({ Roland: {}, Sarah: {} });
    const [allocations, setAllocations] = useState([]);
    const [expenses, setExpenses] = useState([]);

    // Form States
    const [newCategory, setNewCategory] = useState('');
    // *UPDATED to include category*
    const [newAllocation, setNewAllocation] = useState({ user: 'Roland', amount: '', frequency: 'monthly', category: 'Savings', goal_id: 'none' });
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '', paid_by: 'Roland', is_shared: true });

    useEffect(() => { fetchAllData(); }, []);

    async function fetchAllData() {
        setLoading(true);
        const [catRes, goalRes, incRes, allocRes, expRes] = await Promise.all([
            supabase.from('categories').select('*').order('category_name'),
            supabase.from('savings_goals').select('*'),
            supabase.from('income_settings').select('*'),
            supabase.from('recurring_allocations').select(`*, savings_goals ( name )`).order('id'),
            supabase.from('recurring_expenses').select('*').order('id')
        ]);

        if (catRes.data) setCategories(catRes.data);
        if (goalRes.data) setGoals(goalRes.data);
        if (incRes.data) {
            const map = { Roland: {}, Sarah: {} };
            incRes.data.forEach(item => map[item.user_name] = item);
            setIncomeSettings(map);
        }
        if (allocRes.data) setAllocations(allocRes.data);
        if (expRes.data) setExpenses(expRes.data);
        setLoading(false);
    }

    // --- HANDLERS (Generic) ---
    const addCategory = async () => {
        if (!newCategory) return;
        await supabase.from('categories').insert([{ category_name: newCategory }]);
        setNewCategory(''); fetchAllData();
    };
    const deleteCategory = async (id) => {
        if (!confirm("Delete?")) return;
        await supabase.from('categories').delete().eq('category_id', id);
        fetchAllData();
    };
    const saveIncome = async (user, field, value) => {
        const updates = { ...incomeSettings[user], user_name: user, [field]: value };
        setIncomeSettings(prev => ({ ...prev, [user]: updates }));
        await supabase.from('income_settings').upsert(updates, { onConflict: 'user_name' });
    };

    // --- ALLOCATION HANDLERS ---
    const addAllocation = async () => {
        if (!newAllocation.amount) return;
        await supabase.from('recurring_allocations').insert([{
            user_name: newAllocation.user,
            amount: parseFloat(newAllocation.amount),
            frequency: newAllocation.frequency, 
            category: newAllocation.category, // Added category
            savings_goal_id: newAllocation.goal_id === 'none' ? null : parseInt(newAllocation.goal_id)
        }]);
        setNewAllocation({ user: 'Roland', amount: '', frequency: 'monthly', category: 'Savings', goal_id: 'none' });
        fetchAllData();
    };
    const updateAllocation = async (id, updates) => {
        await supabase.from('recurring_allocations').update(updates).eq('id', id);
        fetchAllData();
    };
    const deleteAllocation = async (id) => {
        if (!confirm("Remove this auto-save?")) return;
        await supabase.from('recurring_allocations').delete().eq('id', id);
        fetchAllData();
    };

    // --- EXPENSE HANDLERS ---
    const addExpense = async () => {
        if (!newExpense.description || !newExpense.amount || !newExpense.category) {
            alert("Please fill in Description, Amount and Category");
            return;
        }
        await supabase.from('recurring_expenses').insert([{
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            category: newExpense.category,
            paid_by: newExpense.paid_by,
            is_shared: newExpense.is_shared
        }]);
        setNewExpense({ description: '', amount: '', category: '', paid_by: 'Roland', is_shared: true });
        fetchAllData();
    };
    const updateExpense = async (id, updates) => {
        await supabase.from('recurring_expenses').update(updates).eq('id', id);
        fetchAllData();
    };
    const deleteExpense = async (id) => {
        if (!confirm("Remove this recurring bill?")) return;
        await supabase.from('recurring_expenses').delete().eq('id', id);
        fetchAllData();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your categories, income rules, and automation.</p>
            </div>

            <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="expenses">Recurring Expenses</TabsTrigger>
                    <TabsTrigger value="savings">Auto-Savings</TabsTrigger>
                    <TabsTrigger value="income">Income Rules</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                {/* --- TAB 1: RECURRING EXPENSES --- */}
                <TabsContent value="expenses" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Recurring Charges</CardTitle>
                            <CardDescription>These are automatically added to "Transactions" on the 1st of every month.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                {loading ? <Loader2 className="animate-spin" /> : expenses.map(exp => (
                                    <ExpenseRow key={exp.id} exp={exp} categories={categories} onDelete={deleteExpense} onUpdate={updateExpense} />
                                ))}
                                {!loading && expenses.length === 0 && <p className="text-sm text-muted-foreground italic">No recurring expenses set.</p>}
                            </div>

                            <div className="border-t pt-6 grid gap-4">
                                <Label className="text-base font-semibold">Add New Recurring Expense</Label>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                    <div className="md:col-span-3"><Input placeholder="Description (e.g. Rent)" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} /></div>
                                    <div className="md:col-span-3">
                                        <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                                            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                            <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={c.category_name}>{c.category_name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Select value={newExpense.paid_by} onValueChange={v => setNewExpense({...newExpense, paid_by: v})}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2 flex items-center space-x-2 bg-muted/30 rounded-md border px-2 h-10">
                                        <Checkbox id="new-shared" checked={newExpense.is_shared} onCheckedChange={(c) => setNewExpense({...newExpense, is_shared: c})} />
                                        <Label htmlFor="new-shared" className="text-sm cursor-pointer font-normal">Shared</Label>
                                    </div>
                                    <div className="md:col-span-1 relative">
                                        <span className="absolute left-1 top-2.5 text-xs text-muted-foreground">$</span>
                                        <Input type="number" className="pl-3 px-1 text-center" placeholder="0" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-1"><Button className="w-full" onClick={addExpense}><Plus className="h-4 w-4" /></Button></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 2: AUTO-SAVINGS --- */}
                <TabsContent value="savings" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recurring Transfers</CardTitle>
                            <CardDescription>Money automatically tracked in your Savings Goals and budget.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                {allocations.map(alloc => (
                                    <AllocationRow key={alloc.id} alloc={alloc} goals={goals} categories={categories} onDelete={deleteAllocation} onUpdate={updateAllocation} />
                                ))}
                            </div>
                            <div className="border-t pt-4 grid gap-4">
                                <Label className="text-base font-semibold">Add New Auto-Save</Label>
                                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                                    <Select value={newAllocation.user} onValueChange={v => setNewAllocation({...newAllocation, user: v})}>
                                        <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
                                    </Select>
                                    
                                    <Input type="number" placeholder="Amount" className="w-full sm:w-[100px]" value={newAllocation.amount} onChange={e => setNewAllocation({...newAllocation, amount: e.target.value})} />
                                    
                                    <Select value={newAllocation.frequency} onValueChange={v => setNewAllocation({...newAllocation, frequency: v})}>
                                        <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Freq" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* NEW Category Selector */}
                                    <Select value={newAllocation.category} onValueChange={v => setNewAllocation({...newAllocation, category: v})}>
                                        <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c.category_id} value={c.category_name}>{c.category_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <Select value={newAllocation.goal_id} onValueChange={v => setNewAllocation({...newAllocation, goal_id: v})}>
                                        <SelectTrigger className="flex-1 min-w-[150px]"><SelectValue placeholder="Select Goal" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">General Savings</SelectItem>
                                            {goals.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <Button onClick={addAllocation} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Add</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* --- TAB 3: INCOME RULES --- */}
                <TabsContent value="income" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Roland', 'Sarah'].map(person => (
                            <Card key={person}>
                                <CardHeader><CardTitle>{person}'s Income</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Paycheck Amount</Label>
                                        <Input type="number" value={incomeSettings[person]?.pay_amount || ''} onChange={(e) => saveIncome(person, 'pay_amount', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Anchor Date</Label>
                                        <Input type="date" value={incomeSettings[person]?.anchor_date || ''} onChange={(e) => saveIncome(person, 'anchor_date', e.target.value)} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- TAB 4: CATEGORIES --- */}
                <TabsContent value="categories" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-4">
                                <Input placeholder="New Category..." value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                                <Button onClick={addCategory}><Plus className="h-4 w-4 mr-2" /> Add</Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {categories.map(c => (
                                    <div key={c.category_id} className="flex justify-between items-center p-2 border rounded text-sm group hover:bg-muted/50 transition-colors">
                                        {c.category_name}
                                        <Trash2 className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteCategory(c.category_id)} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
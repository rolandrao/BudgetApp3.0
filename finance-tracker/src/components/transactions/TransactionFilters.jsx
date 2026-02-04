import { useState, useRef, memo } from 'react';
import { Search, XCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TransactionFilters = memo(({ onFilterChange, uniqueCategories }) => {
    // Local state for immediate UI updates
    const [localFilters, setLocalFilters] = useState({
        search: '',
        category: 'All',
        minAmount: '',
        maxAmount: '',
        startDate: '',
        endDate: '',
        paidBy: 'All'
    });

    // Debounce Timer Ref
    const debounceTimer = useRef(null);

    // 1. Handle Text Inputs (Debounced)
    const handleTextChange = (field, value) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            onFilterChange(newFilters);
        }, 400); 
    };

    // 2. Handle Selects/Dates (Immediate)
    const handleImmediateChange = (field, value) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
    };

    const resetFilters = () => {
        const defaults = {
            search: '',
            category: 'All',
            minAmount: '',
            maxAmount: '',
            startDate: '',
            endDate: '',
            paidBy: 'All'
        };
        setLocalFilters(defaults);
        onFilterChange(defaults);
    };

    return (
        <div className="bg-muted/50 p-4 rounded-lg border grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search..." 
                        className="pl-8 bg-background"
                        value={localFilters.search}
                        onChange={(e) => handleTextChange('search', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <Select 
                        value={localFilters.category} 
                        onValueChange={(val) => handleImmediateChange('category', val)}
                    >
                        <SelectTrigger className="bg-background"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Categories</SelectItem>
                            {uniqueCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Paid By</label>
                    <Select 
                        value={localFilters.paidBy} 
                        onValueChange={(val) => handleImmediateChange('paidBy', val)}
                    >
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All</SelectItem>
                            <SelectItem value="Roland">Roland</SelectItem>
                            <SelectItem value="Sarah">Sarah</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="date" className="bg-background" 
                        value={localFilters.startDate} 
                        onChange={(e) => handleImmediateChange('startDate', e.target.value)} 
                    />
                    <Input 
                        type="date" className="bg-background" 
                        value={localFilters.endDate} 
                        onChange={(e) => handleImmediateChange('endDate', e.target.value)} 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" placeholder="Min" className="bg-background" 
                        value={localFilters.minAmount} 
                        onChange={(e) => handleTextChange('minAmount', e.target.value)} 
                    />
                    <Input 
                        type="number" placeholder="Max" className="bg-background" 
                        value={localFilters.maxAmount} 
                        onChange={(e) => handleTextChange('maxAmount', e.target.value)} 
                    />
                    <Button variant="ghost" size="icon" onClick={resetFilters} title="Clear Filters">
                        <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default TransactionFilters;
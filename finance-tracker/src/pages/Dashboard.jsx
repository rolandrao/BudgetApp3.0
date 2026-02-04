import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  CreditCard,
  FilterX
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const PRIMARY_COLOR = "#3b82f6";
const COMPARE_COLOR = "#f97316";
const CATEGORY_COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#ec4899', '#ef4444', '#eab308'];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// --- 1. Robust Date Parsers (With Logging) ---
const getMonthIndexFromDate = (dateStr) => {
    if (!dateStr) return -1;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) return parseInt(parts[1]) - 1; 
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? -1 : d.getMonth();
};

const getYearFromDate = (dateStr) => {
    if (!dateStr) return "0";
    if (dateStr.includes('-')) return dateStr.split('-')[0];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "0" : d.getFullYear().toString();
};

// --- Helper Components ---
function Counter({ value, prefix = "" }) {
  return (
    <span className="flex">
      {prefix}
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </motion.span>
    </span>
  )
}

const CustomTooltip = ({ active, payload, label, primaryYear, compareYear }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border text-popover-foreground shadow-md rounded-lg p-3 text-sm z-50">
        <p className="font-bold mb-2">{label}</p>
        {payload.map((entry, index) => {
          let color = entry.color;
          if (entry.name === primaryYear) color = PRIMARY_COLOR;
          if (entry.name === compareYear) color = COMPARE_COLOR;
          return (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground capitalize">{entry.name}:</span>
              <span className="font-mono font-medium ml-auto">${Number(entry.value).toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

function KpiCard({ title, value, trend, comparisonLabel, icon: Icon }) {
  const isPositive = trend > 0;
  const showTrend = isFinite(trend) && !isNaN(trend);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold"><Counter value={value} prefix="$" /></div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {showTrend ? (
             <>
               {isPositive ? <ArrowUpRight className="h-3 w-3 text-red-500" /> : <ArrowDownRight className="h-3 w-3 text-green-500" />}
               <span className={isPositive ? "text-red-500 font-medium" : "text-green-500 font-medium"}>{Math.abs(trend).toFixed(1)}%</span>
               {comparisonLabel}
             </>
          ) : <span className="text-gray-400">No comparison data</span>}
        </p>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const currentYearStr = new Date().getFullYear().toString();
  const prevYearStr = (new Date().getFullYear() - 1).toString();

  const [primaryYear, setPrimaryYear] = useState(currentYearStr)
  const [compareYear, setCompareYear] = useState(prevYearStr)
  
  const [userFilter, setUserFilter] = useState('All') 
  const [sharedFilter, setSharedFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All') 

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null) 

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('transactions').select('*').range(0, 9999)
      if (data) {
          console.log(`[Dashboard] Loaded ${data.length} transactions from Supabase.`);
          // Sanity check first transaction
          if(data.length > 0) {
              const sample = data[0];
              console.log("[Dashboard] Sample Transaction:", {
                  date: sample.transaction_date,
                  yearParsed: getYearFromDate(sample.transaction_date),
                  monthParsed: getMonthIndexFromDate(sample.transaction_date)
              });
          }
          setTransactions(data)
      }
    }
    fetchData()
  }, [])

  // --- Derived State ---
  const availableYears = useMemo(() => {
    const years = transactions.map(t => getYearFromDate(t.transaction_date))
    const unique = [...new Set(years)].sort((a, b) => b - a).filter(Boolean)
    if (!unique.includes(currentYearStr)) unique.unshift(currentYearStr)
    return unique
  }, [transactions, currentYearStr])

  const uniqueCategories = useMemo(() => {
      const cats = transactions.map(t => t.category).filter(Boolean)
      return [...new Set(cats)].sort()
  }, [transactions])

  // --- Handlers ---
  const handlePrimaryYearChange = (newVal) => {
    setPrimaryYear(newVal);
    if (newVal === compareYear) setCompareYear((parseInt(newVal) - 1).toString());
  }

  const handleCompareYearChange = (newVal) => {
    setCompareYear(newVal);
    if (newVal === primaryYear) {
        const primInt = parseInt(primaryYear);
        if (primInt < new Date().getFullYear()) setPrimaryYear((primInt + 1).toString());
        else setCompareYear((parseInt(newVal) - 1).toString());
    }
  }

  // UPDATED CLICK HANDLER: Safer Logic using activeLabel
  const handleBarClick = (state) => {
     console.log("[Dashboard] Bar Click Detected:", state);
     
     if (state && state.activeLabel) {
         const clickedIndex = MONTHS.indexOf(state.activeLabel);
         console.log(`[Dashboard] Clicked Label: "${state.activeLabel}" -> Mapped to Index: ${clickedIndex}`);
         
         if (clickedIndex !== -1) {
             if (selectedMonthIndex === clickedIndex) {
                 console.log("[Dashboard] Deselecting Month");
                 setSelectedMonthIndex(null); 
             } else {
                 console.log(`[Dashboard] Selecting Month Index: ${clickedIndex}`);
                 setSelectedMonthIndex(clickedIndex); 
             }
         }
     }
  }

  // --- Filtering ---
  const filterTransaction = (t) => {
    if (userFilter !== 'All' && t.paid_by !== userFilter) return false
    if (sharedFilter === 'Shared' && !t.is_shared) return false
    if (sharedFilter === 'Personal' && t.is_shared) return false
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false
    return true
  }

  // Get Primary and Comparison Datasets (Yearly)
  const yearData = useMemo(() => {
    const primary = []
    const comparison = []
    transactions.forEach(t => {
      if (!filterTransaction(t)) return
      const tYear = getYearFromDate(t.transaction_date);
      if (tYear === primaryYear) primary.push(t)
      if (tYear === compareYear) comparison.push(t)
    })
    console.log(`[Dashboard] Yearly Data Filtered. Primary (${primaryYear}): ${primary.length}, Compare (${compareYear}): ${comparison.length}`);
    return { primary, comparison }
  }, [transactions, primaryYear, compareYear, userFilter, sharedFilter, categoryFilter])

  // --- KPI Calculation (Aware of Selection) ---
  const kpis = useMemo(() => {
    let primDataset = yearData.primary;
    let compDataset = yearData.comparison;
    
    let title = `Total Spend (${primaryYear})`;
    let avgTitle = "Monthly Average";
    
    // If Month Selected: Filter Datasets Deeply
    if (selectedMonthIndex !== null) {
        console.log(`[Dashboard] KPI Calculation: Filtering for Month Index ${selectedMonthIndex} (${MONTHS[selectedMonthIndex]})`);
        
        const countBefore = primDataset.length;
        primDataset = primDataset.filter(t => getMonthIndexFromDate(t.transaction_date) === selectedMonthIndex);
        compDataset = compDataset.filter(t => getMonthIndexFromDate(t.transaction_date) === selectedMonthIndex);
        
        console.log(`[Dashboard] Primary Rows: ${countBefore} -> ${primDataset.length} after month filter.`);

        title = `Total Spend (${MONTHS[selectedMonthIndex]})`;
        avgTitle = "Daily Average";
    }

    const sum = (arr) => arr.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
    const primTotal = sum(primDataset)
    const compTotal = sum(compDataset)
    
    const totalChange = compTotal === 0 ? 0 : ((primTotal - compTotal) / compTotal) * 100
    
    let primAvg = 0;
    let compAvg = 0;

    if (selectedMonthIndex !== null) {
        primAvg = primTotal / 30; // Daily avg approximation
        compAvg = compTotal / 30;
    } else {
        primAvg = primTotal / 12; // Monthly avg
        compAvg = compTotal / 12;
    }
    
    const avgChange = compAvg === 0 ? 0 : ((primAvg - compAvg) / compAvg) * 100

    return {
        title,
        avgTitle,
        total: primTotal,
        totalChange,
        avg: primAvg,
        avgChange,
        count: primDataset.length
    }
  }, [yearData, selectedMonthIndex, primaryYear])

  // --- Chart Data Preparation ---
  const monthlyData = useMemo(() => {
    return MONTHS.map((month, index) => {
        const getSum = (dataset) => dataset
            .filter(t => getMonthIndexFromDate(t.transaction_date) === index)
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
        return {
            name: month,
            [primaryYear]: getSum(yearData.primary),
            [compareYear]: getSum(yearData.comparison)
        }
    })
  }, [yearData, primaryYear, compareYear])

  const categoryData = useMemo(() => {
    const groups = {}
    // Filter dataset by month if selected
    const dataset = selectedMonthIndex !== null 
        ? yearData.primary.filter(t => getMonthIndexFromDate(t.transaction_date) === selectedMonthIndex)
        : yearData.primary

    dataset.forEach(t => {
        const cat = t.category || 'Uncategorized'
        groups[cat] = (groups[cat] || 0) + Number(t.amount)
    })
    
    return Object.keys(groups)
        .map(key => ({ name: key, value: groups[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6) 
  }, [yearData, selectedMonthIndex])

  const topCategoryName = categoryData.length > 0 ? categoryData[0].name : 'N/A';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 px-4 sm:px-0">
      
      {/* --- Control Bar --- */}
      <div className="bg-card border rounded-lg p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 shadow-sm">
         <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">PRIMARY YEAR</label>
            <Select value={primaryYear} onValueChange={handlePrimaryYearChange}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
         </div>
         <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">COMPARE WITH</label>
            <Select value={compareYear} onValueChange={handleCompareYearChange}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
         </div>
         <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">CATEGORY</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
            </Select>
         </div>
         <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">USER</label>
            <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="All">All Users</SelectItem><SelectItem value="Roland">Roland</SelectItem><SelectItem value="Sarah">Sarah</SelectItem></SelectContent>
            </Select>
         </div>
         <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">TYPE</label>
            <Select value={sharedFilter} onValueChange={setSharedFilter}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="All">All Transactions</SelectItem><SelectItem value="Shared">Shared Only</SelectItem><SelectItem value="Personal">Personal Only</SelectItem></SelectContent>
            </Select>
         </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title={kpis.title} value={kpis.total} trend={kpis.totalChange} comparisonLabel={`vs ${compareYear}`} icon={DollarSign} />
        <KpiCard title={kpis.avgTitle} value={kpis.avg} trend={kpis.avgChange} comparisonLabel={`vs ${compareYear}`} icon={Calendar} />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold truncate">{topCategoryName}</div>
                <p className="text-xs text-muted-foreground mt-1">Highest spend area</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{kpis.count}</div>
                <p className="text-xs text-muted-foreground mt-1">Records found</p>
            </CardContent>
        </Card>
      </div>

      {/* --- Charts --- */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Bar Chart */}
        <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Comparison</CardTitle>
                        <CardDescription>
                            Monthly spending: <span style={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>{primaryYear}</span> vs <span style={{ color: COMPARE_COLOR, fontWeight: 'bold' }}>{compareYear}</span>
                        </CardDescription>
                    </div>
                    <AnimatePresence>
                        {selectedMonthIndex !== null && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <Button size="sm" variant="secondary" onClick={() => setSelectedMonthIndex(null)} className="h-7 text-xs">
                                    <FilterX className="mr-1 h-3 w-3" /> Clear Selection
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[350px] w-full cursor-pointer">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={monthlyData} 
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            onClick={handleBarClick}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.4} />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip content={<CustomTooltip primaryYear={primaryYear} compareYear={compareYear} />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <defs>
                                <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PRIMARY_COLOR} stopOpacity={1}/><stop offset="100%" stopColor={PRIMARY_COLOR} stopOpacity={0.6}/></linearGradient>
                                <linearGradient id="gradCompare" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COMPARE_COLOR} stopOpacity={1}/><stop offset="100%" stopColor={COMPARE_COLOR} stopOpacity={0.6}/></linearGradient>
                            </defs>

                            <Bar dataKey={compareYear} name={compareYear} fill="url(#gradCompare)" radius={[4, 4, 0, 0]}>
                                {monthlyData.map((_, index) => (
                                    <Cell key={`cell-comp-${index}`} fillOpacity={selectedMonthIndex === null || selectedMonthIndex === index ? 1 : 0.3} />
                                ))}
                            </Bar>
                            <Bar dataKey={primaryYear} name={primaryYear} fill="url(#gradPrimary)" radius={[4, 4, 0, 0]}>
                                {monthlyData.map((_, index) => (
                                    <Cell key={`cell-prim-${index}`} fillOpacity={selectedMonthIndex === null || selectedMonthIndex === index ? 1 : 0.3} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>{selectedMonthIndex !== null ? `${MONTHS[selectedMonthIndex]} Breakdown` : `Top Expenses (${primaryYear})`}</CardTitle>
                <CardDescription>{selectedMonthIndex !== null ? "Distribution for the selected month" : "Distribution for the whole year"}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full relative">
                    {categoryData.length === 0 ? (
                         <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    <div className="absolute bottom-0 w-full flex justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {categoryData.slice(0,3).map((cat, i) => (
                            <div key={cat.name} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i] }} />
                                {cat.name}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
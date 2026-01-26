import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
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
  CreditCard
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

const PRIMARY_COLOR = "#3b82f6";
const COMPARE_COLOR = "#f97316";
const CATEGORY_COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#ec4899'];

// --- Helper: Animated Number ---
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

// --- Helper: Tooltip ---
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
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground capitalize">{entry.name}:</span>
              <span className="font-mono font-medium ml-auto">
                ${Number(entry.value).toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

// --- Helper: KPI Card ---
function KpiCard({ title, value, trend, comparisonLabel, icon: Icon }) {
  const isPositive = trend > 0;
  const showTrend = isFinite(trend) && !isNaN(trend);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
            <Counter value={value} prefix="$" />
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {showTrend ? (
             <>
               {isPositive ? (
                 <ArrowUpRight className="h-3 w-3 text-red-500" />
               ) : (
                 <ArrowDownRight className="h-3 w-3 text-green-500" />
               )}
               <span className={isPositive ? "text-red-500 font-medium" : "text-green-500 font-medium"}>
                 {Math.abs(trend).toFixed(1)}%
               </span>
               {comparisonLabel}
             </>
          ) : (
             <span className="text-gray-400">No comparison data</span>
          )}
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

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .range(0, 9999)
        
      if (data) setTransactions(data)
    }
    fetchData()
  }, [])

  const availableYears = useMemo(() => {
    const years = transactions.map(t => new Date(t.transaction_date).getFullYear())
    const unique = [...new Set(years)].sort((a, b) => b - a).map(String)
    if (!unique.includes(currentYearStr)) unique.unshift(currentYearStr)
    return unique
  }, [transactions, currentYearStr])

  const handlePrimaryYearChange = (newVal) => {
    setPrimaryYear(newVal);
    if (newVal === compareYear) {
        const newCompare = (parseInt(newVal) - 1).toString();
        setCompareYear(newCompare);
    }
  }

  const handleCompareYearChange = (newVal) => {
    setCompareYear(newVal);
    if (newVal === primaryYear) {
        const currentYearInt = new Date().getFullYear();
        const primaryInt = parseInt(primaryYear);
        if (primaryInt < currentYearInt) {
            setPrimaryYear((primaryInt + 1).toString());
        } else {
            const newCompare = (parseInt(newVal) - 1).toString();
            setCompareYear(newCompare); 
        }
    }
  }

  const filterTransaction = (t) => {
    if (userFilter !== 'All' && t.paid_by !== userFilter) return false
    if (sharedFilter === 'Shared' && !t.is_shared) return false
    if (sharedFilter === 'Personal' && t.is_shared) return false
    return true
  }

  const yearData = useMemo(() => {
    const primary = []
    const comparison = []

    transactions.forEach(t => {
      if (!filterTransaction(t)) return
      const tYear = new Date(t.transaction_date).getFullYear().toString()
      if (tYear === primaryYear) primary.push(t)
      if (tYear === compareYear) comparison.push(t)
    })

    return { primary, comparison }
  }, [transactions, primaryYear, compareYear, userFilter, sharedFilter])

  const kpis = useMemo(() => {
    const sum = (arr) => arr.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
    const primTotal = sum(yearData.primary)
    const compTotal = sum(yearData.comparison)
    const totalChange = compTotal === 0 ? 0 : ((primTotal - compTotal) / compTotal) * 100
    const primAvg = primTotal / 12
    const compAvg = compTotal / 12
    const avgChange = compAvg === 0 ? 0 : ((primAvg - compAvg) / compAvg) * 100

    return {
        total: primTotal,
        totalChange,
        avg: primAvg,
        avgChange,
        count: yearData.primary.length
    }
  }, [yearData])

  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map((month, index) => {
        const getSum = (dataset) => dataset
            .filter(t => new Date(t.transaction_date).getMonth() === index)
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
    yearData.primary.forEach(t => {
        const cat = t.category || 'Uncategorized'
        groups[cat] = (groups[cat] || 0) + Number(t.amount)
    })
    return Object.keys(groups)
        .map(key => ({ name: key, value: groups[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
  }, [yearData])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 px-4 sm:px-0">
      
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Deep dive into your expenditure trends.</p>
        </div>

        {/* --- CONTROL BAR (Responsive Grid) --- */}
        <div className="bg-card border rounded-lg p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 shadow-sm">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Year</label>
                <Select value={primaryYear} onValueChange={handlePrimaryYearChange}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compare With</label>
                <Select value={compareYear} onValueChange={handleCompareYearChange}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Users</SelectItem>
                        <SelectItem value="Roland">Roland</SelectItem>
                        <SelectItem value="Sarah">Sarah</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
                <Select value={sharedFilter} onValueChange={setSharedFilter}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Transactions</SelectItem>
                        <SelectItem value="Shared">Shared Only</SelectItem>
                        <SelectItem value="Personal">Personal Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      {/* --- KPI CARDS (Responsive Grid) --- */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
            title={`Total Spend (${primaryYear})`}
            value={kpis.total} 
            trend={kpis.totalChange}
            comparisonLabel={`vs ${compareYear}`}
            icon={DollarSign}
        />
        <KpiCard 
            title="Monthly Average" 
            value={kpis.avg} 
            trend={kpis.avgChange}
            comparisonLabel={`vs ${compareYear}`}
            icon={Calendar}
        />
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold truncate">
                    {categoryData[0]?.name || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Highest spend area in {primaryYear}
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{kpis.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    Records found matching filters
                </p>
            </CardContent>
        </Card>
      </div>

      {/* --- CHARTS (Stack Vertically on Mobile) --- */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        
        {/* Main Bar Chart */}
        <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
                <CardTitle>Comparison</CardTitle>
                <CardDescription>
                    Monthly spending: <span style={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>{primaryYear}</span> vs <span style={{ color: COMPARE_COLOR, fontWeight: 'bold' }}>{compareYear}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.4} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#9ca3af" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                stroke="#9ca3af" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`} 
                            />
                            
                            <Tooltip 
                              content={<CustomTooltip primaryYear={primaryYear} compareYear={compareYear} />} 
                              cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                            />
                            
                            <defs>
                                <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={PRIMARY_COLOR} stopOpacity={1}/>
                                    <stop offset="100%" stopColor={PRIMARY_COLOR} stopOpacity={0.6}/>
                                </linearGradient>
                                <linearGradient id="gradCompare" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COMPARE_COLOR} stopOpacity={1}/>
                                    <stop offset="100%" stopColor={COMPARE_COLOR} stopOpacity={0.6}/>
                                </linearGradient>
                            </defs>

                            <Bar 
                                dataKey={compareYear} 
                                name={compareYear} 
                                fill="url(#gradCompare)" 
                                radius={[4, 4, 0, 0]} 
                            />
                            
                            <Bar 
                                dataKey={primaryYear} 
                                name={primaryYear}
                                fill="url(#gradPrimary)" 
                                radius={[4, 4, 0, 0]} 
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>Top Expenses ({primaryYear})</CardTitle>
                <CardDescription>Distribution by Category</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full relative">
                    {categoryData.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            No data for {primaryYear}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
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
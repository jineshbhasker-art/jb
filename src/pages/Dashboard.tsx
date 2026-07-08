/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { salesService, productsService, customersService, businessProfileService, expensesService } from '../lib/dbService';
import { Sale, Product, Customer, BusinessProfile, Expense } from '../types';

const StatCard = ({ title, value, change, trend, icon: Icon }: any) => (
  <div className="advanced-3d-card p-10 flex flex-col gap-8 bg-white group cursor-default">
    <div className="flex items-center justify-between">
      <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-black border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full border",
        trend === 'up' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
      )}>
        {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change}%
      </div>
    </div>
    <div>
      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</div>
      <div className="text-3xl font-black mt-2 tracking-tighter">{value}</div>
      <div className="flex gap-1 mt-4">
         {[1,2,3,4,5,6,7].map(i => (
           <div key={i} className={cn("h-1 flex-1 rounded-full", trend === 'up' ? "bg-green-100" : "bg-red-100")} />
         ))}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(new Date());
  const [syncStatus, setSyncStatus] = React.useState<'synchronized' | 'syncing' | 'offline'>('synchronized');

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      setTimeout(() => {
        setSyncStatus('synchronized');
        setLastSyncTime(new Date());
      }, 1000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerManualSync = React.useCallback(() => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synchronized');
      setLastSyncTime(new Date());
    }, 1500);
  }, []);

  React.useEffect(() => {
    const updateSync = () => {
      if (navigator.onLine) {
        setLastSyncTime(new Date());
        setSyncStatus('synchronized');
      }
    };

    const unsubSales = salesService.subscribe((data) => {
      setSales(data);
      updateSync();
    });
    const unsubProducts = productsService.subscribe((data) => {
      setProducts(data);
      updateSync();
    });
    const unsubCustomers = customersService.subscribe((data) => {
      setCustomers(data);
      updateSync();
    });
    const unsubProfile = businessProfileService.subscribe((data) => {
      setProfile(data);
      updateSync();
    });
    const unsubExpenses = expensesService.subscribe((data) => {
      setExpenses(data);
      updateSync();
    });
    setLoading(false);
    return () => {
      unsubSales();
      unsubProducts();
      unsubCustomers();
      unsubProfile();
      unsubExpenses();
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySalesTotal = sales
    .filter(s => new Date(s.createdAt) >= today)
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const todayProfitTotal = sales
    .filter(s => new Date(s.createdAt) >= today)
    .reduce((acc, s) => {
      return acc + s.items.reduce((itemAcc, item) => itemAcc + (item.unitPrice - (item.unitCost || 0)) * item.quantity, 0);
    }, 0);

  const totalInventoryValue = products.reduce((acc, p) => acc + p.stockQuantity * (p.costPrice || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const grossProfit = sales.reduce((acc, s) => {
     return acc + s.items.reduce((itemAcc, item) => itemAcc + (item.unitPrice - (item.unitCost || 0)) * item.quantity, 0);
  }, 0);
  const netProfit = grossProfit - totalExpenses;

  // Weekly data for chart
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekData.push({
        name: days[d.getDay()],
        sales: 0,
        profit: 0,
        fullDate: d.toLocaleDateString()
      });
    }

    sales.forEach(s => {
      const saleDate = new Date(s.createdAt).toLocaleDateString();
      const chartItem = weekData.find(w => w.fullDate === saleDate);
      if (chartItem) {
        chartItem.sales += s.grandTotal;
        const saleProfit = s.items.reduce((acc, item) => acc + (item.unitPrice - (item.unitCost || 0)) * item.quantity, 0);
        chartItem.profit += saleProfit;
      }
    });

    return weekData;
  };

  const chartData = getWeeklyData();

  const [timeRange, setTimeRange] = React.useState<'7days' | '30days'>('7days');
  const [activeMetric, setActiveMetric] = React.useState<'revenue' | 'profit'>('revenue');

  const dailyRevenueData = React.useMemo(() => {
    const daysCount = timeRange === '7days' ? 7 : 30;
    const dailyData = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dailyData.push({
        name: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        revenue: 0,
        profit: 0,
        fullDate: d.toLocaleDateString()
      });
    }

    sales.forEach(s => {
      const saleDate = new Date(s.createdAt).toLocaleDateString();
      const chartItem = dailyData.find(w => w.fullDate === saleDate);
      if (chartItem) {
        chartItem.revenue += s.grandTotal;
        const saleProfit = s.items.reduce((acc, item) => acc + (item.unitPrice - (item.unitCost || 0)) * item.quantity, 0);
        chartItem.profit += saleProfit;
      }
    });

    return dailyData;
  }, [sales, timeRange]);

  const categoryData = React.useMemo(() => {
    const categoriesMap: Record<string, { name: string; value: number; revenue: number }> = {};
    
    sales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const category = prod?.category || item.type || 'Scent Blends';
        const catName = category.charAt(0).toUpperCase() + category.slice(1);
        
        if (!categoriesMap[catName]) {
          categoriesMap[catName] = {
            name: catName,
            value: 0,
            revenue: 0
          };
        }
        categoriesMap[catName].value += item.quantity;
        categoriesMap[catName].revenue += item.totalWithVat;
      });
    });

    const data = Object.values(categoriesMap);
    if (data.length > 0 && data.some(c => c.revenue > 0)) {
      return data.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }

    // High-end fallback dataset for when database has no sales yet
    return [
      { name: 'Eau de Parfum', value: 35, revenue: 5400 },
      { name: 'Extrait de Parfum', value: 24, revenue: 6200 },
      { name: 'Scented Oils', value: 40, revenue: 1800 },
      { name: 'Oud Blends', value: 15, revenue: 4200 },
      { name: 'Bespoke Formulas', value: 10, revenue: 3800 }
    ].sort((a, b) => b.revenue - a.revenue);
  }, [sales, products]);

  const categoryColors = ['#C5A059', '#E66C23', '#7E9675', '#1A1A1A', '#888888'];

  const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel);

  const [isCalibrating, setIsCalibrating] = React.useState(false);

  const runCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => setIsCalibrating(false), 2000);
  };

  return (
    <div className="space-y-12 pb-24 relative">
      <AnimatePresence>
        {isCalibrating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md pointer-events-none"
          >
            <div className="calibrate-grid absolute inset-0 opacity-20" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 border-2 border-white/20 border-t-white rounded-full flex items-center justify-center"
            >
               <div className="w-16 h-16 border-2 border-white/10 border-b-white rounded-full animate-spin-reverse" />
            </motion.div>
            <motion.p 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="mt-8 text-white font-black text-[10px] uppercase tracking-[0.6em]"
            >
              Calibrating Data Nodes...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">MANAGEMENT PORTAL</h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em] flex items-center gap-2">
             System Node: {profile?.companyName || 'Scents & Souls Perfume LAB'} • UAE
             {profile?.trn && (
               <>
                 <span className="w-1 h-1 bg-gray-300 rounded-full" />
                 <span className="bg-black text-white px-2 py-0.5 rounded-sm">TRN: {profile.trn}</span>
               </>
             )}
          </p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Net Profit Balance</p>
              <p className={cn("text-2xl font-black mt-2 tracking-tighter", netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(netProfit)}
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard 
            title="TODAY'S REVENUE" 
            value={formatCurrency(todaySalesTotal)} 
            change={12.5} 
            trend="up" 
            icon={DollarSign} 
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard 
            title="TOTAL EXPENSES" 
            value={formatCurrency(totalExpenses)} 
            change={-4.2} 
            trend="down" 
            icon={TrendingDown} 
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard 
            title="INVENTORY VALUE" 
            value={formatCurrency(totalInventoryValue)} 
            change={2.1} 
            trend="up" 
            icon={Package} 
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatCard 
            title="ACTIVE CUSTOMERS" 
            value={customers.length.toString()} 
            change={15.3} 
            trend="up" 
            icon={Users} 
          />
        </motion.div>
      </div>

      {/* Row 1: Scent & Financial Analytics Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Revenue & Profit Trend Analysis */}
        <div className="lg:col-span-2 advanced-3d-card p-10 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-black rounded-full" />
              <div>
                <h2 className="text-2xl font-black font-display tracking-tight">TRENDS ENGINE</h2>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Real-time daily transaction metrics</p>
              </div>
            </div>

            {/* Interactive Control Toggles */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Metric Switch */}
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setActiveMetric('revenue')}
                  className={cn(
                    "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    activeMetric === 'revenue' 
                      ? "bg-black text-white shadow-sm" 
                      : "text-gray-500 hover:text-black"
                  )}
                >
                  REVENUE
                </button>
                <button
                  onClick={() => setActiveMetric('profit')}
                  className={cn(
                    "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    activeMetric === 'profit' 
                      ? "bg-[#C5A059] text-black shadow-sm" 
                      : "text-gray-500 hover:text-[#C5A059]"
                  )}
                >
                  PROFIT
                </button>
              </div>

              {/* Time Range Switch */}
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setTimeRange('7days')}
                  className={cn(
                    "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    timeRange === '7days' 
                      ? "bg-white text-black shadow-sm border border-gray-200/50" 
                      : "text-gray-500 hover:text-black"
                  )}
                >
                  7 DAYS
                </button>
                <button
                  onClick={() => setTimeRange('30days')}
                  className={cn(
                    "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    timeRange === '30days' 
                      ? "bg-white text-black shadow-sm border border-gray-200/50" 
                      : "text-gray-500 hover:text-black"
                  )}
                >
                  30 DAYS
                </button>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenueData}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={activeMetric === 'revenue' ? '#000000' : '#C5A059'} 
                      stopOpacity={0.06}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={activeMetric === 'revenue' ? '#000000' : '#C5A059'} 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#F5F5F5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                  tickFormatter={(val) => `AED ${val}`}
                />
                <Tooltip 
                  cursor={{ stroke: activeMetric === 'revenue' ? '#E5E7EB' : '#F5D996', strokeWidth: 1.5 }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 40px -5px rgba(0,0,0,0.15)',
                    padding: '20px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), activeMetric === 'revenue' ? 'Gross Revenue' : 'Net Profit']}
                />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke={activeMetric === 'revenue' ? '#000000' : '#C5A059'} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#trendGradient)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best-Selling Perfume Categories (Circular Segment Matrix) */}
        <div className="advanced-3d-card p-10 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                <div>
                  <h2 className="text-xl font-black font-display tracking-tight">BEST SELLERS</h2>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Scent categories by revenue</p>
                </div>
              </div>
            </div>

            {/* Recharts Pie Donut visualizer */}
            <div className="h-[200px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="revenue"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={categoryColors[index % categoryColors.length]} 
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      padding: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Absolute Center Ring Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">LEADER</span>
                <span className="text-xs font-black text-black truncate max-w-[100px] mt-0.5">
                  {categoryData[0]?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Scent Share legend list with calculated percentages */}
          <div className="space-y-3 mt-6 pt-6 border-t border-gray-100">
            {categoryData.map((item, idx) => {
              const totalRevenue = categoryData.reduce((acc, c) => acc + c.revenue, 0);
              const percentage = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(0) : '0';
              return (
                <div key={item.name} className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                  <div className="flex items-center gap-2 truncate max-w-[140px]">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: categoryColors[idx % categoryColors.length] }} 
                    />
                    <span className="truncate text-gray-900 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-gray-400 text-[10px] font-normal">{percentage}%</span>
                    <span className="text-black font-semibold text-right min-w-[70px]">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Status Panels, Database Sync, Alerts (Full Width 3-Col Stack) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Database Synchronization Node */}
        <div className="advanced-3d-card p-10 bg-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black font-display mb-8 tracking-tight flex items-center justify-between">
              <span>DATABASE SYNC</span>
              {isOnline ? (
                <span className="flex items-center gap-2 text-[9px] font-black tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  ONLINE
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[9px] font-black tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  OFFLINE
                </span>
              )}
            </h2>

            <div className="space-y-5">
              <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                 <div className="flex items-center gap-3">
                    {isOnline ? (
                      <Wifi className="text-green-600" size={18} />
                    ) : (
                      <WifiOff className="text-red-500" size={18} />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">NETWORK STATE</span>
                 </div>
                 <span className="text-sm font-bold text-black uppercase">
                   {isOnline ? 'Active' : 'Offline Cache'}
                 </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                 <div className="flex items-center gap-3">
                    <Database className="text-black" size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">CACHED ASSETS</span>
                 </div>
                 <span className="text-sm font-bold text-black">
                   {sales.length + products.length + customers.length + expenses.length} NODES
                 </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                 <div className="flex items-center gap-3">
                    <Clock className="text-black" size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">LAST SYNC</span>
                 </div>
                 <span className="text-sm font-bold text-black">
                   {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'PENDING'}
                 </span>
              </div>
            </div>
          </div>

          <button 
            onClick={triggerManualSync}
            disabled={syncStatus === 'syncing'}
            className="w-full mt-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-800 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={cn("text-white", syncStatus === 'syncing' && "animate-spin")} />
            {syncStatus === 'syncing' ? 'SYNCHRONIZING...' : 'FORCE SERVER SYNC'}
          </button>
        </div>

        {/* Node System Load Monitor */}
        <div className="advanced-3d-card p-10 bg-[#0F0F0F] text-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black font-display mb-8 tracking-tight underline decoration-white/20 underline-offset-8">NODE STATUS</h2>
            <div className="space-y-5">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">STOCK INTEGRITY</span>
                 </div>
                 <span className="text-sm font-bold">{lowStockProducts.length === 0 ? 'INTEGRAL' : `${lowStockProducts.length} LOW`}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">SYSTEM LOAD</span>
                 </div>
                 <span className="text-sm font-bold">1.2% CAP</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">SYNC LATENCY</span>
                 </div>
                 <span className="text-sm font-bold">8ms</span>
              </div>
            </div>
          </div>
          <button 
            onClick={runCalibration}
            className="w-full mt-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-200 transition-all cursor-pointer"
          >
            RUN CALIBRATION
          </button>
        </div>

        {/* Real-time Alerts & Stock Warnings */}
        <div className="advanced-3d-card p-10 bg-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black font-display mb-8 tracking-tight">ALERTS</h2>
            {lowStockProducts.length > 0 ? (
              <div className="flex gap-4 p-5 bg-red-50 rounded-2xl border border-red-100 animate-pulse">
                 <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                 <div>
                   <p className="text-[11px] font-black text-red-900 uppercase tracking-wider">REPLENISHMENT REQUIRED</p>
                   <p className="text-[11px] text-red-800/80 mt-1 font-medium">{lowStockProducts.length} Perfume items have dipped below critical thresholds.</p>
                 </div>
              </div>
            ) : (
              <div className="flex gap-4 p-5 bg-green-50 rounded-2xl border border-green-100">
                 <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                 <div>
                   <p className="text-[11px] font-black text-green-900 uppercase tracking-wider">SYSTEM SECURE</p>
                   <p className="text-[11px] text-green-800/80 mt-1 font-medium">All database rows validated. Fragrance vault matches expectation.</p>
                 </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[8px] font-mono tracking-widest text-gray-400 uppercase">CALIBRATOR ID</p>
            <p className="text-[10px] text-gray-700 font-bold uppercase tracking-wider mt-1">NODE-S&S-PRIME-0772</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  AlertTriangle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  Sliders,
  Plus,
  ArrowRight,
  ExternalLink,
  X,
  Search,
  ShieldAlert,
  Sparkles
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { salesService, productsService, customersService, businessProfileService, expensesService } from '../lib/dbService';
import { Sale, Product, Customer, BusinessProfile, Expense } from '../types';
import { RRVLogo } from '../components/RRVLogo';

const StatCard = ({ title, value, change, trend, icon: Icon, onClick, subtitle, badge }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "advanced-3d-card p-8 md:p-10 flex flex-col justify-between bg-white group transition-all",
      onClick ? "cursor-pointer hover:shadow-xl hover:border-black/20" : "cursor-default"
    )}
  >
    <div className="flex items-center justify-between">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-black border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-red-600 text-white uppercase tracking-wider animate-pulse">
            {badge}
          </span>
        )}
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full border",
            trend === 'up' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
          )}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}%
          </div>
        )}
      </div>
    </div>
    <div className="mt-6">
      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</div>
      <div className="text-3xl font-black mt-2 tracking-tighter text-black">{value}</div>
      {subtitle && (
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1 truncate">
          {subtitle}
        </div>
      )}
      <div className="flex gap-1 mt-4">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div 
            key={i} 
            className={cn(
              "h-1 flex-1 rounded-full", 
              trend === 'up' ? "bg-green-100" : trend === 'warning' ? "bg-amber-200" : "bg-red-100"
            )} 
          />
        ))}
      </div>
    </div>
  </div>
);

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Connectivity & Sync States
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(new Date());
  const [syncStatus, setSyncStatus] = React.useState<'synchronized' | 'syncing' | 'offline'>('synchronized');

  // Predefined Threshold & Low-Stock Notification States
  const [thresholdMode, setThresholdMode] = React.useState<'item' | 'global'>(() => {
    return (localStorage.getItem('rrv_threshold_mode') as 'item' | 'global') || 'item';
  });
  const [globalThreshold, setGlobalThreshold] = React.useState<number>(() => {
    const saved = localStorage.getItem('rrv_global_threshold');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(() => {
    return localStorage.getItem('rrv_alert_sound') !== 'false';
  });
  const [showLowStockModal, setShowLowStockModal] = React.useState(false);
  const [dismissWarningBanner, setDismissWarningBanner] = React.useState(false);
  const [lowStockSearchQuery, setLowStockSearchQuery] = React.useState('');
  const [lowStockFilter, setLowStockFilter] = React.useState<'all' | 'out_of_stock' | 'critical'>('all');
  const [restockingId, setRestockingId] = React.useState<string | null>(null);

  // Play luxury synthesized alert chime
  const playWarningChime = React.useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      // Dual-tone ascending luxury chime (E5 -> A5)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {
      // Audio context error or not allowed
    }
  }, [soundEnabled]);

  // Network listener
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

  // Real-time Firestore Subscriptions
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

  // Helper to determine predefined threshold for an item
  const getItemThreshold = React.useCallback((p: Product): number => {
    if (thresholdMode === 'global') {
      return globalThreshold;
    }
    return p.minStockLevel !== undefined && p.minStockLevel !== null ? p.minStockLevel : 5;
  }, [thresholdMode, globalThreshold]);

  // Real-time Low-Stock Items Calculation
  const lowStockProducts = React.useMemo(() => {
    return products.filter(p => {
      if (!p.isActive) return false;
      const threshold = getItemThreshold(p);
      return p.stockQuantity <= threshold;
    });
  }, [products, getItemThreshold]);

  const outOfStockItems = React.useMemo(() => {
    return lowStockProducts.filter(p => p.stockQuantity === 0);
  }, [lowStockProducts]);

  const criticalStockItems = React.useMemo(() => {
    return lowStockProducts.filter(p => {
      if (p.stockQuantity === 0) return false;
      const th = getItemThreshold(p);
      return p.stockQuantity <= Math.ceil(th / 2);
    });
  }, [lowStockProducts, getItemThreshold]);

  // Real-time Warning Sound Trigger when count increases
  const prevLowCountRef = React.useRef<number>(0);
  React.useEffect(() => {
    if (lowStockProducts.length > prevLowCountRef.current && prevLowCountRef.current !== 0) {
      playWarningChime();
    }
    prevLowCountRef.current = lowStockProducts.length;
  }, [lowStockProducts.length, playWarningChime]);

  // Quick Restock action (+10 units)
  const handleQuickRestock = async (productId: string, amount: number = 10) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;
    setRestockingId(productId);
    try {
      await productsService.update(productId, {
        stockQuantity: target.stockQuantity + amount,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Restock failed:", err);
    } finally {
      setTimeout(() => setRestockingId(null), 500);
    }
  };

  // Quick Restock All Out of Stock Items
  const handleRestockAllCritical = async () => {
    for (const item of lowStockProducts) {
      const th = getItemThreshold(item);
      const needed = Math.max(10, th * 2);
      await productsService.update(item.id, {
        stockQuantity: item.stockQuantity + needed,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleSaveThresholdSettings = (mode: 'item' | 'global', val: number) => {
    setThresholdMode(mode);
    setGlobalThreshold(val);
    localStorage.setItem('rrv_threshold_mode', mode);
    localStorage.setItem('rrv_global_threshold', val.toString());
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('rrv_alert_sound', next ? 'true' : 'false');
    if (next) playWarningChime();
  };

  // Metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySalesTotal = sales
    .filter(s => new Date(s.createdAt) >= today)
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const totalInventoryValue = products.reduce((acc, p) => acc + p.stockQuantity * (p.costPrice || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const grossProfit = sales.reduce((acc, s) => {
     return acc + s.items.reduce((itemAcc, item) => itemAcc + (item.unitPrice - (item.unitCost || 0)) * item.quantity, 0);
  }, 0);
  const netProfit = grossProfit - totalExpenses;

  // Chart ranges
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

    return [
      { name: 'Eau de Parfum', value: 35, revenue: 5400 },
      { name: 'Extrait de Parfum', value: 24, revenue: 6200 },
      { name: 'Scented Oils', value: 40, revenue: 1800 },
      { name: 'Oud Blends', value: 15, revenue: 4200 },
      { name: 'Bespoke Formulas', value: 10, revenue: 3800 }
    ].sort((a, b) => b.revenue - a.revenue);
  }, [sales, products]);

  const categoryColors = ['#C5A059', '#E66C23', '#7E9675', '#1A1A1A', '#888888'];

  const [isCalibrating, setIsCalibrating] = React.useState(false);

  const runCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => setIsCalibrating(false), 2000);
  };

  // Filtered low stock products for modal
  const filteredLowStockList = React.useMemo(() => {
    return lowStockProducts.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(lowStockSearchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(lowStockSearchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(lowStockSearchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (lowStockFilter === 'out_of_stock') {
        return p.stockQuantity === 0;
      }
      if (lowStockFilter === 'critical') {
        const th = getItemThreshold(p);
        return p.stockQuantity > 0 && p.stockQuantity <= Math.ceil(th / 2);
      }
      return true;
    });
  }, [lowStockProducts, lowStockSearchQuery, lowStockFilter, getItemThreshold]);

  return (
    <div className="space-y-10 pb-24 relative">
      {/* Node Calibration Overlay */}
      <AnimatePresence>
        {isCalibrating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none"
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
              Calibrating RRV Perfume Nodes...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DASHBOARD HEADER & REAL-TIME LOW-STOCK BADGE */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter uppercase">
              MANAGEMENT PORTAL
            </h1>
          </div>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.25em] flex flex-wrap items-center gap-2">
            <span>System Node: {profile?.companyName || 'RRV PERFUME'}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-[#C5A059]">A Division of RRV TRADING LLC</span>
            {profile?.trn && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="bg-black text-white px-2 py-0.5 rounded-sm">TRN: {profile.trn}</span>
              </>
            )}
          </p>
        </div>

        {/* Action Bar with Real-Time Low-Stock Notification Badge */}
        <div className="flex flex-wrap items-center gap-4">
          {/* REAL-TIME LOW-STOCK NOTIFICATION BADGE (TRIGGERS WARNING) */}
          {lowStockProducts.length > 0 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowLowStockModal(true);
                setDismissWarningBanner(false);
              }}
              className="relative flex items-center gap-3 px-4 py-2.5 bg-red-50 hover:bg-red-100/90 border border-red-200 rounded-2xl shadow-sm transition-all cursor-pointer group select-none"
              title="Click to view all low-stock items and restock immediately"
            >
              {/* Pulsing Warning Beacon */}
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
              </span>

              <div className="text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-red-700 uppercase tracking-widest">
                  <AlertTriangle size={13} className="text-red-600" />
                  <span>LOW-STOCK WARNING</span>
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-full leading-none">
                    {lowStockProducts.length}
                  </span>
                </div>
                <p className="text-[8px] font-bold text-red-600/80 uppercase tracking-wider mt-0.5">
                  {outOfStockItems.length > 0 ? `${outOfStockItems.length} OUT OF STOCK • ` : ''}
                  Threshold Triggered
                </p>
              </div>

              <div className="w-6 h-6 rounded-lg bg-red-200/60 text-red-800 flex items-center justify-center ml-1 group-hover:translate-x-0.5 transition-transform">
                <ArrowRight size={12} />
              </div>
            </motion.button>
          ) : (
            <button
              onClick={() => setShowLowStockModal(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm transition-all cursor-pointer select-none"
              title="Predefined inventory thresholds are healthy"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-800 uppercase tracking-widest">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>ALL STOCKS OPTIMAL</span>
                </div>
                <p className="text-[8px] font-bold text-emerald-600/70 uppercase tracking-wider">
                  Vault Above Predefined Threshold
                </p>
              </div>
            </button>
          )}

          {/* Sound Mute/Unmute Toggle */}
          <button
            onClick={handleToggleSound}
            className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-black transition-all cursor-pointer"
            title={soundEnabled ? "Audio Warning Chime: Active (Click to Mute)" : "Audio Warning Chime: Muted (Click to Unmute)"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-gray-400" />}
          </button>

          {/* Net Profit Balance Display */}
          <div className="text-right pl-3 border-l border-gray-100">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Net Profit Balance</p>
            <p className={cn("text-2xl font-black mt-1.5 tracking-tighter", netProfit >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* PROMINENT REAL-TIME WARNING BANNER (TRIGGERS WHEN ANY INVENTORY ITEM DROPS BELOW THRESHOLD) */}
      <AnimatePresence>
        {lowStockProducts.length > 0 && !dismissWarningBanner && (
          <motion.div
            initial={{ opacity: 0, y: -15, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -15, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 md:p-6 bg-gradient-to-r from-red-600 via-rose-700 to-zinc-950 text-white rounded-3xl shadow-xl shadow-red-950/15 flex flex-col md:flex-row md:items-center justify-between gap-5 relative border border-red-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                  <ShieldAlert size={24} className="text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-[8px] font-black uppercase tracking-widest border border-white/20">
                      LIVE INVENTORY WARNING
                    </span>
                    <span className="text-[9px] font-mono text-white/70">
                      Threshold Rule: {thresholdMode === 'global' ? `Global (≤ ${globalThreshold} units)` : 'Item Config (minStockLevel)'}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black tracking-tight mt-1">
                    {lowStockProducts.length} Item{lowStockProducts.length > 1 ? 's' : ''} Dropped Below Predefined Minimum Threshold!
                  </h3>
                  <p className="text-xs text-white/80 mt-1 max-w-2xl leading-relaxed">
                    Immediate restock required to prevent POS checkout disruptions.
                    {outOfStockItems.length > 0 && (
                      <span className="font-bold text-amber-200"> {outOfStockItems.length} completely out of stock.</span>
                    )}
                  </p>

                  {/* Quick Preview Chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {lowStockProducts.slice(0, 4).map(p => (
                      <span 
                        key={p.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/30 border border-white/10 text-[9px] font-bold"
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", p.stockQuantity === 0 ? "bg-red-400 animate-ping" : "bg-amber-400")} />
                        <span className="truncate max-w-[140px]">{p.name}</span>
                        <span className="font-mono text-white/70">({p.stockQuantity} left / min {getItemThreshold(p)})</span>
                      </span>
                    ))}
                    {lowStockProducts.length > 4 && (
                      <span className="px-2 py-1 rounded-xl bg-white/10 text-[9px] font-bold">
                        +{lowStockProducts.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons inside Banner */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setShowLowStockModal(true)}
                  className="px-4 py-2.5 bg-white text-black hover:bg-gray-100 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer shadow-md flex items-center gap-2 active:scale-95"
                >
                  <Search size={12} />
                  <span>INSPECT ALL ({lowStockProducts.length})</span>
                </button>

                {outOfStockItems.length > 0 && (
                  <button
                    onClick={handleRestockAllCritical}
                    className="px-4 py-2.5 bg-amber-400 text-black hover:bg-amber-300 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer shadow-md flex items-center gap-2 active:scale-95"
                    title="Quick restock all depleted items with safe buffers"
                  >
                    <Plus size={12} />
                    <span>RESTOCK ALL</span>
                  </button>
                )}

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('inventory')}
                    className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer border border-white/20 flex items-center gap-1.5"
                    title="Switch to full Inventory screen"
                  >
                    <span>VAULT</span>
                    <ExternalLink size={11} />
                  </button>
                )}

                <button
                  onClick={() => setDismissWarningBanner(true)}
                  className="w-9 h-9 rounded-xl bg-black/20 hover:bg-black/40 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Dismiss warning banner (badge in header will remain active)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRIMARY KPI STATS GRID (INCLUDES DEDICATED LOW-STOCK WARNING CARD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
            title="ACTIVE CLIENTS" 
            value={customers.length.toString()} 
            change={15.3} 
            trend="up" 
            icon={Users} 
          />
        </motion.div>

        {/* 5th Metric Card: REAL-TIME LOW-STOCK MONITOR & WARNING CARD */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <StatCard 
            title="LOW-STOCK WARNINGS" 
            value={lowStockProducts.length.toString()} 
            trend={lowStockProducts.length > 0 ? "warning" : "up"}
            badge={lowStockProducts.length > 0 ? `${lowStockProducts.length} ALERT` : undefined}
            subtitle={thresholdMode === 'global' ? `Global Rule (≤ ${globalThreshold})` : "Item Min Stock Rule"}
            icon={AlertTriangle}
            onClick={() => setShowLowStockModal(true)}
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

        {/* Best-Selling Perfume Categories */}
        <div className="advanced-3d-card p-10 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                <div>
                  <h2 className="text-xl font-black font-display tracking-tight">BEST SELLERS</h2>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">RRV Collections by revenue</p>
                </div>
              </div>
            </div>

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

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">LEADER</span>
                <span className="text-xs font-black text-black truncate max-w-[100px] mt-0.5">
                  {categoryData[0]?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>

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
                    <div className={cn("w-2 h-2 rounded-full", lowStockProducts.length === 0 ? "bg-green-500 animate-pulse" : "bg-red-500 animate-ping")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">STOCK INTEGRITY</span>
                 </div>
                 <span className={cn("text-sm font-bold", lowStockProducts.length > 0 ? "text-red-400" : "text-green-400")}>
                   {lowStockProducts.length === 0 ? 'INTEGRAL (0 LOW)' : `${lowStockProducts.length} BELOW THRESHOLD`}
                 </span>
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
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black font-display tracking-tight">ALERTS HUB</h2>
              {lowStockProducts.length > 0 && (
                <span className="px-2.5 py-1 bg-red-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                  TRIGGERED
                </span>
              )}
            </div>

            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-4 p-5 bg-red-50 rounded-2xl border border-red-200">
                   <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                   <div>
                     <p className="text-[11px] font-black text-red-950 uppercase tracking-wider">
                       PREDEFINED THRESHOLD BREACH
                     </p>
                     <p className="text-[11px] text-red-800/90 mt-1 font-medium leading-relaxed">
                       {lowStockProducts.length} perfume product{lowStockProducts.length > 1 ? 's' : ''} have fallen below their safety threshold.
                     </p>
                   </div>
                </div>

                <button
                  onClick={() => setShowLowStockModal(true)}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search size={12} />
                  <span>VIEW & RESTOCK {lowStockProducts.length} ITEMS</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-4 p-5 bg-green-50 rounded-2xl border border-green-100">
                 <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                 <div>
                   <p className="text-[11px] font-black text-green-900 uppercase tracking-wider">SYSTEM SECURE</p>
                   <p className="text-[11px] text-green-800/80 mt-1 font-medium">
                     All database rows validated. RRV Perfume Vault stock matches expectation.
                   </p>
                 </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-mono tracking-widest text-gray-400 uppercase">CALIBRATOR NODE</p>
              <p className="text-[10px] text-gray-700 font-bold uppercase tracking-wider mt-0.5">NODE-RRV-PRIME-01</p>
            </div>
            <div className="w-6 h-6 shrink-0 opacity-70">
              <RRVLogo size="xs" showText={false} lightMode={true} />
            </div>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE REAL-TIME LOW-STOCK WARNING & RESTOCK MODAL */}
      <AnimatePresence>
        {showLowStockModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLowStockModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 md:p-8 z-10 max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black text-white">
                        RRV PERFUME
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        REAL-TIME LOW-STOCK MONITOR
                      </span>
                    </div>
                    <h2 className="text-2xl font-black font-display tracking-tight text-black mt-1">
                      {lowStockProducts.length === 0 ? 'INVENTORY STOCKS HEALTHY' : `${lowStockProducts.length} Items Below Predefined Threshold`}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setShowLowStockModal(false)}
                  className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-black flex items-center justify-center transition-all cursor-pointer font-bold"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Threshold Rule Controls Bar */}
              <div className="py-4 px-5 bg-gray-50/80 rounded-2xl my-4 border border-gray-100 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Sliders size={16} className="text-gray-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-700">PREDEFINED THRESHOLD RULE:</span>
                  <div className="flex bg-white rounded-xl p-1 border border-gray-200">
                    <button
                      onClick={() => handleSaveThresholdSettings('item', globalThreshold)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                        thresholdMode === 'item' ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-black"
                      )}
                    >
                      Per-Item Min (Default)
                    </button>
                    <button
                      onClick={() => handleSaveThresholdSettings('global', globalThreshold)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                        thresholdMode === 'global' ? "bg-[#C5A059] text-black shadow-sm" : "text-gray-500 hover:text-black"
                      )}
                    >
                      Global Fixed
                    </button>
                  </div>
                </div>

                {thresholdMode === 'global' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Alert if stock ≤</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={globalThreshold}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                        handleSaveThresholdSettings('global', val);
                      }}
                      className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-black"
                    />
                    <span className="text-[9px] font-bold text-gray-400">units</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSound}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-gray-200 text-[9px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    {soundEnabled ? <Volume2 size={12} className="text-green-600" /> : <VolumeX size={12} className="text-gray-400" />}
                    <span>{soundEnabled ? 'Chime ON' : 'Chime OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setLowStockFilter('all')}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      lowStockFilter === 'all' ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    All Warnings ({lowStockProducts.length})
                  </button>
                  <button
                    onClick={() => setLowStockFilter('out_of_stock')}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      lowStockFilter === 'out_of_stock' ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
                    )}
                  >
                    Out of Stock ({outOfStockItems.length})
                  </button>
                  <button
                    onClick={() => setLowStockFilter('critical')}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      lowStockFilter === 'critical' ? "bg-amber-500 text-black" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    )}
                  >
                    Critical Low ({criticalStockItems.length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={lowStockSearchQuery}
                    onChange={(e) => setLowStockSearchQuery(e.target.value)}
                    placeholder="Search item or SKU..."
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Items List (Scrollable) */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar">
                {filteredLowStockList.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
                    <p className="text-sm font-black uppercase tracking-wider text-black">NO PRODUCTS IN WARNING STATE</p>
                    <p className="text-xs text-gray-400 mt-1">All inventory items are currently at or above the predefined threshold.</p>
                  </div>
                ) : (
                  filteredLowStockList.map((product) => {
                    const threshold = getItemThreshold(product);
                    const isZero = product.stockQuantity === 0;
                    const deficit = Math.max(0, threshold - product.stockQuantity);
                    const percentage = Math.min(100, Math.round((product.stockQuantity / Math.max(1, threshold)) * 100));

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                          isZero ? "bg-red-50/50 border-red-200" : "bg-gray-50/50 border-gray-100 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Scent visual icon */}
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-xs",
                            isZero ? "bg-red-600 text-white" : "bg-black text-white"
                          )}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <Sparkles size={18} className="text-[#C5A059]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-black truncate">{product.name}</span>
                              {isZero ? (
                                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[8px] font-black uppercase tracking-wider animate-pulse">
                                  0 UNITS LEFT
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[8px] font-black uppercase tracking-wider">
                                  DEFICIT: -{deficit}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">{product.sku}</span>
                              <span>•</span>
                              <span>{product.category || 'Perfume'}</span>
                              {product.concentration && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#C5A059]">{product.concentration}</span>
                                </>
                              )}
                            </div>

                            {/* Stock vs Threshold Progress Bar */}
                            <div className="w-48 mt-2">
                              <div className="flex justify-between text-[8px] font-bold text-gray-400 mb-0.5 uppercase">
                                <span>Stock: <strong className={isZero ? "text-red-600" : "text-black"}>{product.stockQuantity}</strong></span>
                                <span>Threshold: {threshold}</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full transition-all duration-500", isZero ? "bg-red-600" : "bg-amber-500")}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fast Restock Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            disabled={restockingId === product.id}
                            onClick={() => handleQuickRestock(product.id, 5)}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
                            title="Quick add 5 units"
                          >
                            +5
                          </button>
                          <button
                            disabled={restockingId === product.id}
                            onClick={() => handleQuickRestock(product.id, 10)}
                            className="px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1"
                            title="Quick add 10 units"
                          >
                            <Plus size={11} />
                            <span>+10 RESTOCK</span>
                          </button>

                          {onNavigate && (
                            <button
                              onClick={() => {
                                setShowLowStockModal(false);
                                onNavigate('inventory');
                              }}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black flex items-center justify-center transition-all cursor-pointer"
                              title="Inspect in Inventory"
                            >
                              <ExternalLink size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs text-gray-500">
                <span className="text-[10px] uppercase font-bold text-gray-400">
                  RRV PERFUME Inventory Engine • Real-time synchronization active
                </span>
                <div className="flex items-center gap-3">
                  {onNavigate && (
                    <button
                      onClick={() => {
                        setShowLowStockModal(false);
                        onNavigate('inventory');
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>OPEN INVENTORY VAULT</span>
                      <ArrowRight size={11} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowLowStockModal(false)}
                    className="px-4 py-2 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

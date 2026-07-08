/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Sparkles, 
  Clock, 
  Settings, 
  Package, 
  RefreshCw, 
  Sliders, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Product, Sale, SaleItem, ProductType, Supplier, PaymentMethod } from '../types';
import { salesService, suppliersService, purchasesService, productsService } from '../lib/dbService';

interface ForecastingModuleProps {
  products: Product[];
  sales: Sale[];
}

export function ForecastingModule({ products, sales }: ForecastingModuleProps) {
  // Forecasting parameters state
  const [leadTime, setLeadTime] = useState<number>(7); // in days
  const [safetyStock, setSafetyStock] = useState<number>(5); // buffer units
  const [historyWindow, setHistoryWindow] = useState<number>(30); // days to look back for velocity
  const [targetCoverageDays, setTargetCoverageDays] = useState<number>(30); // secure runway target coverage (days)
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Critical' | 'Reorder' | 'Healthy' | 'High Sellers'>('All');
  
  // Selected product for live simulation trajectory
  const [simProductId, setSimProductId] = useState<string>('');

  // Sample Seeder Loading State
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Active collection subscription for suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  React.useEffect(() => {
    const unsub = suppliersService.subscribe(setSuppliers);
    return () => unsub();
  }, []);

  // RESTOCK Modal/Builder States
  const [restockProduct, setRestockProduct] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [restockCost, setRestockCost] = useState<number>(0);
  const [restockPaymentMethod, setRestockPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [restockStatus, setRestockStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid');
  const [isRestocking, setIsRestocking] = useState<boolean>(false);
  const [restockSuccessMessage, setRestockSuccessMessage] = useState<string>('');

  // 1. Calculate active history cutoff date
  const cutoffDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - historyWindow);
    return date;
  }, [historyWindow]);

  // 2. Compute Product Forecasting Analytics
  const forecastingData = useMemo(() => {
    // Standardize sales filter by date range & status
    const relevantSales = sales.filter(s => {
      if (s.status === 'cancelled' || s.status === 'refunded') return false;
      if (!s.createdAt) return false;
      const saleDate = new Date(s.createdAt);
      return saleDate >= cutoffDate;
    });

    // Sum quantities sold per product
    const qtySoldMap: Record<string, number> = {};
    relevantSales.forEach(sale => {
      (sale.items || []).forEach((item: SaleItem) => {
        qtySoldMap[item.productId] = (qtySoldMap[item.productId] || 0) + (item.quantity || 0);
      });
    });

    // Calculate dynamic threshold for High Seller flag (average sales of active items, min 3)
    const nonZeroSales = Object.values(qtySoldMap).filter(v => v > 0);
    const avgSales = nonZeroSales.length > 0 ? (nonZeroSales.reduce((sum, v) => sum + v, 0) / nonZeroSales.length) : 3;
    const highSellerThreshold = Math.max(3, parseFloat(avgSales.toFixed(1)));

    return products.map(product => {
      const totalSold = qtySoldMap[product.id] || 0;
      // Daily Velocity = total sold / window days
      const velocity = parseFloat((totalSold / historyWindow).toFixed(3));
      
      // Recommended Reorder Point (ROP) = (Velocity * Lead Time) + Safety Stock
      const rop = parseFloat(((velocity * leadTime) + safetyStock).toFixed(1));
      
      // Days of Stock Remaining = current stock / velocity
      let daysRemaining = Infinity;
      if (velocity > 0) {
        daysRemaining = parseFloat((product.stockQuantity / velocity).toFixed(1));
      }

      // High seller flag (sales are in top cluster)
      const isHighSeller = totalSold >= highSellerThreshold;

      // Recommended Reorder Quantity:
      // If stock is below or equal to ROP, we recommend restocking to cover safety stock + target coverage days
      // Restock target quantity = Math.ceil((velocity * targetCoverageDays) + safetyStock)
      // Recommended reorder quantity = Restock target quantity - current stock
      let recommendedReorderQty = 0;
      if (product.stockQuantity <= rop) {
        const targetInventory = Math.ceil((velocity * targetCoverageDays) + safetyStock);
        recommendedReorderQty = Math.max(1, targetInventory - product.stockQuantity);
      }

      // Risk status categorization
      let riskStatus: 'OUT_OF_STOCK' | 'EXTREME_RISK' | 'HIGH_RISK' | 'REORDER_TRIGGERED' | 'HEALTHY' = 'HEALTHY';
      if (product.stockQuantity <= 0) {
        riskStatus = 'OUT_OF_STOCK';
      } else if (daysRemaining <= 7) {
        riskStatus = 'EXTREME_RISK';
      } else if (daysRemaining <= 30) {
        riskStatus = 'HIGH_RISK';
      } else if (product.stockQuantity <= rop) {
        riskStatus = 'REORDER_TRIGGERED';
      }

      return {
        ...product,
        totalSold,
        velocity,
        rop,
        daysRemaining,
        isHighSeller,
        recommendedReorderQty,
        riskStatus
      };
    });
  }, [products, sales, cutoffDate, historyWindow, leadTime, safetyStock, targetCoverageDays]);

  // Set default selected product for simulation if none chosen yet
  React.useEffect(() => {
    if (forecastingData.length > 0 && !simProductId) {
      // Prefer products with sales velocity or high risk for more interesting initial simulation
      const idealProd = forecastingData.find(p => p.velocity > 0) || forecastingData[0];
      if (idealProd) setSimProductId(idealProd.id);
    }
  }, [forecastingData, simProductId]);

  // Categories list for filtering
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return forecastingData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                            item.sku.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      
      let matchesRisk = true;
      if (riskFilter === 'Critical') {
        matchesRisk = item.riskStatus === 'OUT_OF_STOCK' || item.riskStatus === 'EXTREME_RISK' || item.riskStatus === 'HIGH_RISK';
      } else if (riskFilter === 'Reorder') {
        matchesRisk = item.riskStatus === 'REORDER_TRIGGERED';
      } else if (riskFilter === 'Healthy') {
        matchesRisk = item.riskStatus === 'HEALTHY';
      } else if (riskFilter === 'High Sellers') {
        matchesRisk = item.isHighSeller;
      }

      return matchesSearch && matchesCategory && matchesRisk;
    });
  }, [forecastingData, searchQuery, categoryFilter, riskFilter]);

  // KPI Summary Metrics
  const summaryMetrics = useMemo(() => {
    let outOfStock = 0;
    let criticalRisk = 0; // Out of stock in 30 days (excluding 0 stock)
    let reorderTriggered = 0;
    let healthy = 0;
    let highSellersCount = 0;

    forecastingData.forEach(p => {
      if (p.isHighSeller) {
        highSellersCount++;
      }
      if (p.riskStatus === 'OUT_OF_STOCK') {
        outOfStock++;
      } else if (p.riskStatus === 'EXTREME_RISK' || p.riskStatus === 'HIGH_RISK') {
        criticalRisk++;
      } else if (p.riskStatus === 'REORDER_TRIGGERED') {
        reorderTriggered++;
      } else {
        healthy++;
      }
    });

    return { outOfStock, criticalRisk, reorderTriggered, healthy, highSellersCount };
  }, [forecastingData]);

  // Selected product simulation data
  const selectedProductSim = useMemo(() => {
    const prod = forecastingData.find(p => p.id === simProductId);
    if (!prod) return null;

    // Simulate stock draw-down day-by-day
    const timeline = Array.from({ length: 31 }, (_, t) => {
      const projected = Math.max(0, prod.stockQuantity - (prod.velocity * t));
      return {
        day: `Day ${t}`,
        "Projected Stock": parseFloat(projected.toFixed(1)),
        "Reorder Point": prod.rop,
        "Safety Stock": safetyStock
      };
    });

    return {
      product: prod,
      timeline
    };
  }, [forecastingData, simProductId, safetyStock]);

  // Reorder Gap Top 10 Products Chart Data
  const reorderGapChartData = useMemo(() => {
    return forecastingData
      .filter(p => p.stockQuantity <= p.rop && p.rop > 0)
      .map(p => {
        const gap = parseFloat((p.rop - p.stockQuantity).toFixed(1));
        return {
          name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
          "Current Stock": p.stockQuantity,
          "Reorder Point (ROP)": p.rop,
          "Deficit Gap": gap
        };
      })
      .sort((a, b) => b["Deficit Gap"] - a["Deficit Gap"])
      .slice(0, 10);
  }, [forecastingData]);

  // Seeding Sample Sales History helper
  const handleSeedSampleSales = async () => {
    if (products.length === 0) {
      alert("Please add some products to the Inventory first before seeding sales.");
      return;
    }
    setIsSeeding(true);
    setSeedSuccess(false);

    try {
      const now = new Date();
      // Generate 35 realistic transactions over the past 30 days
      for (let i = 0; i < 35; i++) {
        const daysAgo = Math.floor(Math.random() * 28); // 0 to 28 days ago
        const saleDate = new Date();
        saleDate.setDate(now.getDate() - daysAgo);
        
        // Randomly select 1-2 distinct products
        const shuffledProds = [...products].sort(() => 0.5 - Math.random());
        const numItems = Math.floor(Math.random() * 2) + 1; // 1 to 2 items
        const selectedForSale = shuffledProds.slice(0, numItems);

        const items: SaleItem[] = selectedForSale.map(prod => {
          const qty = Math.floor(Math.random() * 3) + 1; // 1 to 3 units
          const totalBeforeVat = qty * prod.sellingPrice;
          const vatAmount = totalBeforeVat * 0.05;
          return {
            productId: prod.id,
            name: prod.name,
            type: prod.type || ProductType.NEW,
            quantity: qty,
            unitPrice: prod.sellingPrice,
            unitCost: prod.costPrice,
            totalBeforeVat: parseFloat(totalBeforeVat.toFixed(2)),
            vatAmount: parseFloat(vatAmount.toFixed(2)),
            totalWithVat: parseFloat((totalBeforeVat + vatAmount).toFixed(2))
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.totalBeforeVat, 0);
        const vatTotal = items.reduce((sum, item) => sum + item.vatAmount, 0);
        const discount = Math.random() > 0.8 ? 15 : 0; // Occasional AED 15 discount
        const grandTotal = Math.max(5, subtotal + vatTotal - discount);

        const randomInvoiceNum = `INV-SEED-${100000 + Math.floor(Math.random() * 900000)}`;

        const payload = {
          invoiceNumber: randomInvoiceNum,
          customerName: "Scent Aficionado (Guest)",
          items,
          subtotal: parseFloat(subtotal.toFixed(2)),
          vatTotal: parseFloat(vatTotal.toFixed(2)),
          discount,
          grandTotal: parseFloat(grandTotal.toFixed(2)),
          paymentMethod: ['cash', 'card', 'bank_transfer'][Math.floor(Math.random() * 3)] as any,
          status: 'completed' as any,
          receivedAmount: grandTotal,
          changeAmount: 0,
          cashierId: 'demo-cashier',
          cashierName: 'Predictive Bot',
          createdAt: saleDate.toISOString(),
          notes: 'Synthesized history for demand forecasting validation.'
        };

        await salesService.add(payload);
      }

      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 5000);
    } catch (err) {
      console.error("Error seeding sample sales history: ", err);
      alert("Failed to seed sample sales. Check console for error details.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn" id="forecasting-workspace">
      
      {/* 1. Header Information & Seeder Utility */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between p-8 bg-black text-white rounded-[2.5rem] shadow-xl relative overflow-hidden gap-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-[#C5A059] text-black font-black text-[8px] tracking-widest uppercase rounded">PREDICTIVE AI</span>
            <h2 className="text-2xl font-black tracking-tight font-display uppercase">PREDICTIVE STOCK REPLENISHMENT ENGINE</h2>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed max-w-3xl">
            This module processes your historical Scents & Souls transaction logs in real-time to analyze your daily perfume sales velocity ($V_p$). It computes optimal reorder points ($ROP$) and signals warnings if stock depletion risks arise within the next 30 days.
          </p>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-stretch shrink-0">
          <button
            onClick={handleSeedSampleSales}
            disabled={isSeeding}
            className="flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSeeding ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                GENERATING TRANSACTIONS...
              </>
            ) : seedSuccess ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600" />
                HISTORY SEEDED!
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-500" />
                SEED SIMULATED SALES HISTORY
              </>
            )}
          </button>
          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-mono justify-center">
            <Activity size={12} className="text-[#C5A059] animate-pulse" />
            <span>SALES LOGS IN SYSTEM: {sales.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Parameters Panel */}
      <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#C5A059]">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight">FORECASTING SENSITIVITY CONFIG</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Adjust mathematical constants to adapt safety buffers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* History Window */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Calendar size={12} />
                Calculated Sales Window
              </label>
              <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-gray-100 rounded text-black">{historyWindow} Days</span>
            </div>
            <select
              value={historyWindow}
              onChange={e => setHistoryWindow(parseInt(e.target.value))}
              className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-tight focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all cursor-pointer"
            >
              <option value="7">Past 7 Days (Micro-trends)</option>
              <option value="14">Past 14 Days (Bi-weekly)</option>
              <option value="30">Past 30 Days (Standard Monthly)</option>
              <option value="90">Past 90 Days (Quarterly demand)</option>
            </select>
            <p className="text-[9px] text-gray-400 font-medium">Denominator used for historical daily velocity calculation (Daily Velocity = Total Quantity Sold / Window Days).</p>
          </div>

          {/* Supplier Lead Time */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Clock size={12} />
                Estimated Lead Time
              </label>
              <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-gray-100 rounded text-black">{leadTime} Days</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="30"
                value={leadTime}
                onChange={e => setLeadTime(parseInt(e.target.value))}
                className="flex-1 accent-black cursor-ew-resize"
              />
              <input
                type="number"
                min="1"
                max="90"
                value={leadTime}
                onChange={e => setLeadTime(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-3 py-2 bg-gray-50 text-center font-mono text-xs font-black border border-gray-200 rounded-xl"
              />
            </div>
            <p className="text-[9px] text-gray-400 font-medium">Days required for supplier to fulfill a restock order. Influences ROP trigger.</p>
          </div>

          {/* Safety Stock */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Settings size={12} />
                Safety Stock Buffer
              </label>
              <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-gray-100 rounded text-black">{safetyStock} Units</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={safetyStock}
                onChange={e => setSafetyStock(parseInt(e.target.value))}
                className="flex-1 accent-black cursor-ew-resize"
              />
              <input
                type="number"
                min="0"
                max="200"
                value={safetyStock}
                onChange={e => setSafetyStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 px-3 py-2 bg-gray-50 text-center font-mono text-xs font-black border border-gray-200 rounded-xl"
              />
            </div>
            <p className="text-[9px] text-gray-400 font-medium">Minimum cushion of units held to prevent stockouts from unexpected demand surges.</p>
          </div>

          {/* Target Restock Coverage */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Sparkles size={12} className="text-[#C5A059]" />
                Restock Runway Goal
              </label>
              <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-gray-100 rounded text-black">{targetCoverageDays} Days</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="7"
                max="90"
                value={targetCoverageDays}
                onChange={e => setTargetCoverageDays(parseInt(e.target.value))}
                className="flex-1 accent-black cursor-ew-resize"
              />
              <input
                type="number"
                min="7"
                max="365"
                value={targetCoverageDays}
                onChange={e => setTargetCoverageDays(Math.max(7, parseInt(e.target.value) || 7))}
                className="w-16 px-3 py-2 bg-gray-50 text-center font-mono text-xs font-black border border-gray-200 rounded-xl"
              />
            </div>
            <p className="text-[9px] text-gray-400 font-medium">Secured coverage days recommended for reorders (Recommended Qty = Target Inventory - Current Stock).</p>
          </div>
        </div>
      </div>

      {/* 3. KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Out Of Stock */}
        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Completely Out</p>
            <h3 className="text-3xl font-black font-display tracking-tight text-gray-900">{summaryMetrics.outOfStock}</h3>
            <span className="inline-block text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider bg-gray-100 text-gray-600 rounded">0 stock levels</span>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
            <Package size={20} />
          </div>
        </div>

        {/* Critical Depletion Risk (< 30 days) */}
        <div className="bg-red-50/50 border border-red-100/50 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Critical Risk (30 Days)</p>
            <h3 className="text-3xl font-black font-display tracking-tight text-red-700">{summaryMetrics.criticalRisk}</h3>
            <span className="inline-block text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider bg-red-100 text-red-700 rounded-lg">Out of stock soon</span>
          </div>
          <div className="w-12 h-12 bg-red-100/50 rounded-2xl flex items-center justify-center text-red-600">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Reorder Point Triggered */}
        <div className="bg-amber-50/50 border border-amber-100/50 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Reorder Triggered</p>
            <h3 className="text-3xl font-black font-display tracking-tight text-amber-700">{summaryMetrics.reorderTriggered}</h3>
            <span className="inline-block text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider bg-amber-100 text-amber-700 rounded-lg">Stock ≤ reorder point</span>
          </div>
          <div className="w-12 h-12 bg-amber-100/50 rounded-2xl flex items-center justify-center text-amber-600">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* High Selling Items */}
        <div className="bg-yellow-50/30 border border-yellow-100/50 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600">High Sellers</p>
            <h3 className="text-3xl font-black font-display tracking-tight text-yellow-700">{summaryMetrics.highSellersCount}</h3>
            <span className="inline-block text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 rounded-lg">Top demand perfumes</span>
          </div>
          <div className="w-12 h-12 bg-yellow-100/40 rounded-2xl flex items-center justify-center text-yellow-600">
            <Sparkles size={20} className="text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* Healthy Stock */}
        <div className="bg-emerald-50/50 border border-emerald-100/30 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Healthy Rotation</p>
            <h3 className="text-3xl font-black font-display tracking-tight text-emerald-700">{summaryMetrics.healthy}</h3>
            <span className="inline-block text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-lg">Secure runway</span>
          </div>
          <div className="w-12 h-12 bg-emerald-100/40 rounded-2xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* 4. Graphical Analytics Pane (Visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Visual 1: Product Drawdown Simulation Trajectory */}
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-display text-lg font-black uppercase tracking-tight">DEPLETION TIMELINE SIMULATION</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Select a product to map its estimated 30-day stock exhaustion vector</p>
              </div>
              <Activity size={20} className="text-[#C5A059]" />
            </div>

            <div className="pt-2">
              <select
                value={simProductId}
                onChange={e => setSimProductId(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-tight focus:bg-white outline-none transition-all cursor-pointer text-black"
              >
                <option value="" disabled>-- CHOOSE PRODUCT CLUSTER --</option>
                {forecastingData.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stockQuantity} | Daily Velocity: {p.velocity}/day)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {selectedProductSim ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={selectedProductSim.timeline}
                  margin={{ top: 10, right: 30, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }} 
                    stroke="#cccccc" 
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }} 
                    stroke="#cccccc" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F0F0F', 
                      borderRadius: '16px', 
                      color: '#ffffff', 
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Projected Stock" 
                    stroke="#000000" 
                    strokeWidth={3} 
                    dot={{ r: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="step" 
                    dataKey="Reorder Point" 
                    stroke="#C5A059" 
                    strokeDasharray="5 5" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                  <Line 
                    type="step" 
                    dataKey="Safety Stock" 
                    stroke="#ef4444" 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5} 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center text-gray-300">
                <AlertCircle size={32} className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-wider">No Products Available For Trajectory Mapping</span>
              </div>
            )}
          </div>

          {selectedProductSim && (
            <div className="bg-gray-50 p-5 rounded-2xl space-y-2 text-[10px] uppercase font-bold text-gray-500 leading-normal">
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span>ESTIMATED DAILY DEMAND:</span>
                <span className="font-mono font-black text-black">{selectedProductSim.product.velocity} units / day</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span>RECOMMENDED REORDER POINT:</span>
                <span className="font-mono font-black text-[#C5A059]">{selectedProductSim.product.rop} units</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span>STOCK DEPLETS TO ZERO IN:</span>
                <span className={cn(
                  "font-mono font-black",
                  selectedProductSim.product.daysRemaining <= 7 ? "text-red-600 animate-pulse" : 
                  selectedProductSim.product.daysRemaining <= 30 ? "text-amber-600" : "text-emerald-600"
                )}>
                  {selectedProductSim.product.daysRemaining === Infinity ? 'NEVER (NO RECENT DEMAND)' : `${selectedProductSim.product.daysRemaining} days`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Visual 2: Reorder Gap Deficit Analysis */}
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-display text-lg font-black uppercase tracking-tight">REORDER DEFICIT GAP</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Top understocked perfumes needing replenishment (Current vs. ROP Target)</p>
              </div>
              <TrendingDown size={20} className="text-[#C5A059]" />
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {reorderGapChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reorderGapChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 8, fontWeight: 'bold' }} 
                    stroke="#cccccc" 
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }} 
                    stroke="#cccccc" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F0F0F', 
                      borderRadius: '16px', 
                      color: '#ffffff', 
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} 
                  />
                  <Bar dataKey="Current Stock" fill="#000000" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Reorder Point (ROP)" fill="#C5A059" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center text-gray-300">
                <CheckCircle2 size={32} className="mb-2 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-wider">All Perfume Stock Levels Are Currently Above Reorder Thresholds</span>
              </div>
            )}
          </div>

          <div className="p-5 bg-amber-50/50 border border-amber-100/30 rounded-2xl text-[9px] font-bold text-amber-800 leading-normal uppercase tracking-wider">
            💡 PURCHASING ACTION REQUIRED:<br />
            Items shown in this graph have fallen below their computed safety levels. Place restocking orders immediately to account for lead-time shipping delays and avoid sales disruption.
          </div>
        </div>
      </div>

      {/* 5. Core Data Table Workspace */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        
        {/* Table Filters Header */}
        <div className="p-8 border-b border-gray-50 flex flex-col xl:flex-row xl:items-center gap-6 justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black border border-gray-100">
              <Filter size={18} />
            </div>
            <div>
              <h3 className="font-display text-lg font-black uppercase tracking-tight">DEMAND & REPLENISHMENT DIRECTORY</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Stock Ledger with live predicted runways and recommended purchase volumes</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-5xl justify-end">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="SEARCH PERFUME NAME OR SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 text-[10px] font-black uppercase tracking-tight bg-gray-50 border-transparent rounded-2xl focus:bg-white outline-none transition-all placeholder:text-gray-300 border border-gray-100"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-3.5 text-[10px] font-black uppercase tracking-tight bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white outline-none transition-all cursor-pointer text-black"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>

            {/* Risk Category Filter */}
            <div className="flex bg-gray-50 p-1 border border-gray-100 rounded-2xl text-[9px] font-black uppercase tracking-wider overflow-x-auto shrink-0">
              {['All', 'Critical', 'Reorder', 'Healthy', 'High Sellers'].map((rf) => (
                <button
                  key={rf}
                  onClick={() => setRiskFilter(rf as any)}
                  className={cn(
                    "px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0",
                    riskFilter === rf ? "bg-black text-white shadow-sm" : "text-gray-400 hover:text-black"
                  )}
                >
                  {rf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Data Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                <th className="py-6 px-8">Product Cluster</th>
                <th className="py-6 px-4 text-center">Current Stock</th>
                <th className="py-6 px-4 text-center">Daily Velocity ($V_p$)</th>
                <th className="py-6 px-4 text-center">Calculated ROP</th>
                <th className="py-6 px-4 text-center">Predicted Runway</th>
                <th className="py-6 px-4 text-center">Recommended Reorder</th>
                <th className="py-6 px-8 text-right">Replenishment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredData.length > 0 ? (
                filteredData.map(prod => {
                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Product details */}
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-black uppercase tracking-tight text-sm">{prod.name}</span>
                          {prod.isHighSeller && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[8px] font-black tracking-widest">
                              🔥 HIGH-SELLER
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          <span>SKU: {prod.sku}</span>
                          <span>•</span>
                          <span>{prod.brand || 'BESPOKE LAB'}</span>
                          <span>•</span>
                          <span className="text-[#C5A059]">{prod.category}</span>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-6 px-4 text-center font-mono font-black text-black text-sm">
                        {prod.stockQuantity}
                      </td>

                      {/* Sales Velocity */}
                      <td className="py-6 px-4 text-center">
                        <div className="font-mono font-black text-black">
                          {prod.velocity} <span className="text-[9px] text-gray-400">units</span>
                        </div>
                        <div className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                          Total Sold: {prod.totalSold} ({historyWindow}d)
                        </div>
                      </td>

                      {/* Calculated ROP */}
                      <td className="py-6 px-4 text-center font-mono font-black text-[#C5A059] text-sm">
                        {prod.rop} <span className="text-[9px] text-gray-400 font-bold">units</span>
                      </td>

                      {/* Predicted Runway */}
                      <td className="py-6 px-4 text-center">
                        <div className={cn(
                          "font-black tracking-tight",
                          prod.riskStatus === 'OUT_OF_STOCK' ? "text-gray-400" :
                          prod.riskStatus === 'EXTREME_RISK' ? "text-red-600 animate-pulse" :
                          prod.riskStatus === 'HIGH_RISK' ? "text-amber-600 font-bold" : "text-emerald-600"
                        )}>
                          {prod.daysRemaining === Infinity ? '∞ (No Demand)' : `${prod.daysRemaining} Days`}
                        </div>
                        <div className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                          {prod.riskStatus === 'OUT_OF_STOCK' ? 'Depleted' : 
                           prod.riskStatus === 'EXTREME_RISK' ? 'Depletes < 1 week' :
                           prod.riskStatus === 'HIGH_RISK' ? 'Depletes < 30 days' : 'Healthy allocation'}
                        </div>
                      </td>

                      {/* Recommended Reorder Quantity Column */}
                      <td className="py-6 px-4 text-center">
                        {prod.recommendedReorderQty > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-100 text-xs">
                              +{prod.recommendedReorderQty} units
                            </span>
                            <span className="text-[8px] text-gray-400 font-bold uppercase mt-1 tracking-wider">
                              To cover {targetCoverageDays}d
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 text-xs">
                              0 units
                            </span>
                            <span className="text-[8px] text-gray-400 font-bold uppercase mt-1 tracking-wider">
                              Stock Sufficient
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Recommended Action */}
                      <td className="py-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div>
                            {prod.riskStatus === 'OUT_OF_STOCK' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">
                                <AlertCircle size={10} />
                                OUT OF STOCK
                              </span>
                            )}
                            {prod.riskStatus === 'EXTREME_RISK' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                <AlertTriangle size={10} />
                                EXTREME REORDER
                              </span>
                            )}
                            {prod.riskStatus === 'HIGH_RISK' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertTriangle size={10} />
                                CRITICAL (30d)
                              </span>
                            )}
                            {prod.riskStatus === 'REORDER_TRIGGERED' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-orange-100 text-orange-800 border border-orange-200">
                                <ArrowUpRight size={10} />
                                REORDER POINT
                              </span>
                            )}
                            {prod.riskStatus === 'HEALTHY' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 size={10} />
                                SATISFACTORY
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setRestockProduct(prod);
                              setRestockQty(prod.recommendedReorderQty > 0 ? prod.recommendedReorderQty : 10);
                              setRestockCost(prod.costPrice || 0);
                              setSelectedSupplierId(prod.supplierId || (suppliers[0]?.id || ''));
                              setRestockPaymentMethod(PaymentMethod.CASH);
                              setRestockStatus('paid');
                              setRestockSuccessMessage('');
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-black hover:bg-gray-900 text-white transition-all cursor-pointer select-none active:scale-95"
                          >
                            <RefreshCw size={10} />
                            RESTOCK
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 px-8 text-center text-gray-300">
                    <AlertCircle size={32} className="mx-auto mb-2 text-gray-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest block">No Perfume Data Matches The Selection Criteria</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Ledger Count Footer */}
        <div className="p-8 border-t border-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
          LEDGER SEQUENCE RANGE: [ {filteredData.length} OF {forecastingData.length} PERFUME ENTRIES DISPLAYED ]
        </div>

      </div>

      {/* 6. RESTOCK PURCHASE INTEGRATION MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setRestockProduct(null)} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden border border-gray-100 animate-scaleIn">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#C5A059]">
                  <RefreshCw size={20} className="animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black uppercase tracking-tight">PREDICTIVE RESTOCK ENFORCER</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Deploy restock orders directly in firestore database</p>
                </div>
              </div>

              {/* Message Banner */}
              {restockSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                  ✅ {restockSuccessMessage}
                </div>
              )}

              {/* Product Info Summary */}
              <div className="bg-gray-50 p-5 rounded-2xl space-y-1.5 text-[10px] uppercase font-bold text-gray-500 leading-normal">
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span>PRODUCT:</span>
                  <span className="font-black text-black">{restockProduct.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span>SKU / CATEGORY:</span>
                  <span className="font-mono font-black text-black">{restockProduct.sku} / {restockProduct.category}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                  <span>CURRENT STOCK:</span>
                  <span className="font-mono font-black text-black">{restockProduct.stockQuantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span>RECOMMENDED RUNWAY PURCHASE:</span>
                  <span className="font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">+{restockProduct.recommendedReorderQty} units</span>
                </div>
              </div>

              {/* Restock Form Controls */}
              <div className="space-y-4 text-xs">
                
                {/* 1. Restock Quantity & Unit Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Order Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={restockQty}
                      onChange={e => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono font-black text-black focus:bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Unit Cost Price (AED)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={restockCost}
                      onChange={e => setRestockCost(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono font-black text-black focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* 2. Select Supplier */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Fulfillment Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-black uppercase tracking-tight focus:bg-white outline-none text-black"
                  >
                    <option value="">-- CHOOSE SUPPLIER --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name.toUpperCase()}</option>
                    ))}
                    {suppliers.length === 0 && (
                      <option value="default">BESPOKE BLENDS FRAGRANCES (DEFAULT)</option>
                    )}
                  </select>
                </div>

                {/* 3. Payment Method & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Payment Channel</label>
                    <select
                      value={restockPaymentMethod}
                      onChange={e => setRestockPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-black uppercase tracking-tight focus:bg-white outline-none text-black"
                    >
                      <option value="cash">CASH</option>
                      <option value="card">CREDIT CARD</option>
                      <option value="bank_transfer">BANK TRANSFER</option>
                      <option value="cheque">CHEQUE</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Invoice Status</label>
                    <select
                      value={restockStatus}
                      onChange={e => setRestockStatus(e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-black uppercase tracking-tight focus:bg-white outline-none text-black"
                    >
                      <option value="paid">PAID IN FULL</option>
                      <option value="unpaid">UNPAID (CREDIT)</option>
                      <option value="partial">PARTIALLY PAID</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Total Calculation Preview */}
              <div className="bg-gray-50 p-5 rounded-2xl flex justify-between items-center text-[10px] uppercase font-black">
                <span className="text-gray-500">ESTIMATED RESTOCK TOTAL (+5% VAT):</span>
                <span className="text-lg font-mono text-black">
                  {formatCurrency((restockQty * restockCost) * 1.05)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer text-center"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={isRestocking}
                  onClick={async () => {
                    setIsRestocking(true);
                    try {
                      const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || 'Bespoke Blends Ltd (Default)';
                      const subtotal = restockQty * restockCost;
                      const vatTotal = subtotal * 0.05;
                      const grandTotal = subtotal + vatTotal;
                      const restockInvoiceNum = `RESTOCK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

                      const purchasePayload = {
                        invoiceNumber: restockInvoiceNum,
                        supplierId: selectedSupplierId || 'default-supplier-id',
                        supplierName,
                        items: [{
                          productId: restockProduct.id,
                          name: restockProduct.name,
                          quantity: restockQty,
                          unitCost: restockCost,
                          vatAmount: parseFloat(vatTotal.toFixed(2)),
                          total: parseFloat(grandTotal.toFixed(2))
                        }],
                        subtotal: parseFloat(subtotal.toFixed(2)),
                        vatTotal: parseFloat(vatTotal.toFixed(2)),
                        grandTotal: parseFloat(grandTotal.toFixed(2)),
                        date: new Date().toISOString().split('T')[0],
                        paymentMethod: restockPaymentMethod,
                        status: restockStatus,
                        createdAt: new Date().toISOString()
                      } as any;

                      // 1. Add Purchase Invoice
                      await purchasesService.add(purchasePayload);

                      // 2. Adjust Product Inventory Stock level
                      const updatedStockQty = restockProduct.stockQuantity + restockQty;
                      await productsService.update(restockProduct.id, {
                        stockQuantity: updatedStockQty,
                        updatedAt: new Date().toISOString()
                      });

                      setRestockSuccessMessage(`SUCCESS: RESTOCK REGISTERED. STOCK INCREASED BY ${restockQty} UNITS!`);
                      setTimeout(() => {
                        setRestockProduct(null);
                      }, 2000);
                    } catch (err) {
                      console.error('Restocking error:', err);
                      alert('Restocking failed. Please check developer console logs.');
                    } finally {
                      setIsRestocking(false);
                    }
                  }}
                  className="flex-1 py-4 bg-[#C5A059] hover:bg-[#B38F4B] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer text-center disabled:opacity-50"
                >
                  {isRestocking ? 'ENFORCING RESTOCK...' : 'CONFIRM RESTOCK'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calculator, 
  Plus, 
  Search, 
  FileText, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  History,
  RotateCcw
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Voucher, VoucherType, PurchaseInvoice } from '../types';

import { vouchersService, purchasesService, salesService, businessProfileService, suppliersService, productsService } from '../lib/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, PlusCircle, Trash2 } from 'lucide-react';
import { Sale, Supplier, Product as ProductTypeData, PaymentMethod } from '../types';

export default function Accounting() {
  const [activeSubTab, setActiveSubTab] = React.useState<'vouchers' | 'purchases' | 'sales' | 'vat'>('vouchers');
  const [vouchers, setVouchers] = React.useState<Voucher[]>([]);
  const [purchases, setPurchases] = React.useState<PurchaseInvoice[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [expandedSaleId, setExpandedSaleId] = React.useState<string | null>(null);
  const [expandedPurchaseId, setExpandedPurchaseId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSupplier, setSelectedSupplier] = React.useState('All');
  const [saleStatusFilter, setSaleStatusFilter] = React.useState('All');
  const [salePaymentMethodFilter, setSalePaymentMethodFilter] = React.useState('All');
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });
  const [profile, setProfile] = React.useState<any>(null);
  
  // New Purchase state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = React.useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = React.useState(false);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [products, setProducts] = React.useState<ProductTypeData[]>([]);
  const [newVoucher, setNewVoucher] = React.useState<any>({
    type: 'receipt',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    reference: '',
    category: 'General',
    paymentMethod: 'Cash'
  });
  const [newPurchase, setNewPurchase] = React.useState<Partial<PurchaseInvoice>>({
    invoiceNumber: '',
    supplierId: '',
    supplierName: '',
    items: [],
    subtotal: 0,
    vatTotal: 0,
    grandTotal: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: PaymentMethod.CASH,
    status: 'paid'
  });

  React.useEffect(() => {
    const unsubVouchers = vouchersService.subscribe(setVouchers);
    const unsubPurchases = purchasesService.subscribe(setPurchases);
    const unsubSales = salesService.subscribe(setSales);
    const unsubSuppliers = suppliersService.subscribe(setSuppliers);
    const unsubProducts = productsService.subscribe(setProducts);
    
    businessProfileService.get().then(setProfile);
    
    setLoading(false);
    return () => {
      unsubVouchers();
      unsubPurchases();
      unsubSales();
      unsubSuppliers();
      unsubProducts();
    };
  }, []);

  const filteredSalesForVat = sales.filter(s => {
    const matchesDate = (!dateRange.start || new Date(s.createdAt) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(s.createdAt) <= new Date(dateRange.end));
    return matchesDate;
  });

  const filteredPurchasesForVat = purchases.filter(p => {
    const matchesDate = (!dateRange.start || new Date(p.date) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(p.date) <= new Date(dateRange.end));
    return matchesDate;
  });

  const totalVATonSales = filteredSalesForVat.reduce((acc, s) => acc + s.vatTotal, 0);
  const totalVATonPurchases = filteredPurchasesForVat.reduce((acc, p) => acc + p.vatTotal, 0);
  const totalTaxableSales = filteredSalesForVat.reduce((acc, s) => acc + s.subtotal, 0);
  const totalTaxablePurchases = filteredPurchasesForVat.reduce((acc, p) => acc + (p.subtotal || (p.grandTotal - p.vatTotal)), 0);
  const netVAT = totalVATonSales - totalVATonPurchases;

  const totalPurchases = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
  const totalSales = sales.reduce((acc, s) => acc + s.grandTotal, 0);

  const stats = [
    { label: 'Sales (Total)', value: totalSales, trend: '+12.4%', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Purchases (Total)', value: totalPurchases, trend: '+8.2%', icon: ArrowUpRight, color: 'text-red-500' },
    { label: 'VAT on Sales', value: totalVATonSales, trend: '+5.0%', icon: Percent, color: 'text-orange-500' },
    { label: 'VAT Payable', value: netVAT, trend: '', icon: Calculator, color: 'text-black' },
  ];

  const filteredSales = sales.filter(s => {
    const matchesQuery = s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.cashierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = (!dateRange.start || new Date(s.createdAt) >= new Date(dateRange.start)) &&
                      (!dateRange.end || new Date(s.createdAt) <= new Date(dateRange.end));
    const matchesStatus = saleStatusFilter === 'All' || s.status === saleStatusFilter;
    const matchesPayment = salePaymentMethodFilter === 'All' || s.paymentMethod === salePaymentMethodFilter;
    return matchesQuery && matchesDate && matchesStatus && matchesPayment;
  });

  const filteredVouchers = vouchers.filter(v => {
    const matchesQuery = v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.totalAmount.toString().includes(searchQuery);
    const matchesDate = (!dateRange.start || new Date(v.date) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(v.date) <= new Date(dateRange.end));
    return matchesQuery && matchesDate;
  });

  const filteredPurchases = purchases.filter(p => {
    const matchesQuery = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = selectedSupplier === 'All' || p.supplierName === selectedSupplier;
    const matchesDate = (!dateRange.start || new Date(p.date) >= new Date(dateRange.start)) &&
                      (!dateRange.end || new Date(p.date) <= new Date(dateRange.end));
    return matchesQuery && matchesSupplier && matchesDate;
  });

  const uniqueSuppliers = ['All', ...Array.from(new Set(purchases.map(p => p.supplierName)))];

  const handleAddPurchaseItem = () => {
    const firstProduct = products[0];
    if (!firstProduct) return;
    
    const newItem = {
      productId: firstProduct.id,
      name: firstProduct.name,
      quantity: 1,
      unitCost: firstProduct.costPrice,
      vatAmount: firstProduct.costPrice * 0.05,
      total: firstProduct.costPrice * 1.05
    };
    
    const updatedItems = [...(newPurchase.items || []), newItem];
    calculatePurchaseTotals(updatedItems);
  };

  const calculatePurchaseTotals = (items: any[]) => {
    const subtotal = items.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
    const vatTotal = items.reduce((acc, item) => acc + item.vatAmount, 0);
    const grandTotal = subtotal + vatTotal;
    
    setNewPurchase(prev => ({
      ...prev,
      items,
      subtotal,
      vatTotal,
      grandTotal
    }));
  };

  const handleUpdatePurchaseItem = (index: number, field: string, value: any) => {
    const items = [...(newPurchase.items || [])];
    const item = { ...items[index] };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.productId = product.id;
        item.name = product.name;
        item.unitCost = product.costPrice;
      }
    } else {
      (item as any)[field] = value;
    }
    
    item.vatAmount = item.unitCost * item.quantity * 0.05;
    item.total = (item.unitCost * item.quantity) + item.vatAmount;
    
    items[index] = item;
    calculatePurchaseTotals(items);
  };

  const handleRemovePurchaseItem = (index: number) => {
    const items = [...(newPurchase.items || [])];
    items.splice(index, 1);
    calculatePurchaseTotals(items);
  };

  const handleSavePurchase = async () => {
    if (!newPurchase.invoiceNumber || !newPurchase.supplierId || !newPurchase.items?.length) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Check for unique invoice number
    const isDuplicate = purchases.some(p => p.invoiceNumber.toLowerCase() === newPurchase.invoiceNumber?.toLowerCase());
    if (isDuplicate) {
      alert('UNIFORMITY ERROR: Invoice Number must be unique. This identifier already exists in the registry.');
      return;
    }

    const supplier = suppliers.find(s => s.id === newPurchase.supplierId);
    const purchaseData = {
      ...newPurchase,
      supplierName: supplier?.name || '',
      createdAt: new Date().toISOString()
    } as PurchaseInvoice;
    
    await purchasesService.add(purchaseData);
    
    // Update stock levels
    for (const item of purchaseData.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        await productsService.update(product.id, {
          stockQuantity: product.stockQuantity + item.quantity,
          costPrice: item.unitCost // Update cost price to latest purchase cost
        });
      }
    }
    
    setIsPurchaseModalOpen(false);
    setNewPurchase({
      invoiceNumber: '',
      supplierId: '',
      supplierName: '',
      items: [],
      subtotal: 0,
      vatTotal: 0,
      grandTotal: 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: PaymentMethod.CASH,
      status: 'paid'
    });
  };

  const handleRefund = async (sale: Sale) => {
    if (!window.confirm(`AUTHORIZE REFUND FOR INVOICE ${sale.invoiceNumber}? STOCK WILL BE REINTEGRATED.`)) return;
    
    try {
      // 1. Update Sale Status
      await salesService.update(sale.id, { status: 'cancelled' as any }); // or 'refunded' if added to enum
      
      // 2. Reintegrate Stock
      for (const item of sale.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await productsService.update(product.id, {
            stockQuantity: product.stockQuantity + item.quantity
          });
        }
      }
      
      alert('REFUND SEQUENCE SUCCESSFUL. INVENTORY CALIBRATED.');
    } catch (err) {
      console.error("Refund error:", err);
      alert('REFUND SEQUENCE FAILED.');
    }
  };

  const handleExportSalesCSV = () => {
    const headers = ['Invoice', 'Date', 'Cashier', 'Method', 'Status', 'Subtotal', 'VAT', 'Discount', 'Grand Total'];
    const rows = filteredSales.map(s => [
      s.invoiceNumber,
      new Date(s.createdAt).toLocaleString(),
      s.cashierName,
      s.paymentMethod,
      s.status,
      s.subtotal,
      s.vatTotal,
      s.discount,
      s.grandTotal
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPurchasesCSV = () => {
    const headers = ['Invoice', 'Supplier', 'Date', 'Method', 'Status', 'Subtotal', 'VAT', 'Grand Total'];
    const rows = filteredPurchases.map(p => [
      p.invoiceNumber,
      p.supplierName,
      new Date(p.date).toLocaleDateString(),
      p.paymentMethod,
      p.status,
      p.subtotal,
      p.vatTotal,
      p.grandTotal
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purchases_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeletePurchase = async (id: string) => {
    if (window.confirm('CRITICAL: PERMANENTLY PURGE PURCHASE RECORD?')) {
      await purchasesService.delete(id);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (window.confirm('CRITICAL: PURGE VOUCHER PROTOCOL FROM REGISTRY?')) {
      await vouchersService.delete(id);
    }
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const voucherNumber = `VCH-${Date.now().toString().slice(-6)}`;
      
      // Map flat structure to advanced Voucher interface
      const voucherData: Omit<Voucher, 'id'> = {
        voucherNumber,
        type: newVoucher.type as VoucherType,
        date: newVoucher.date,
        totalAmount: newVoucher.amount,
        reference: newVoucher.reference,
        notes: newVoucher.description,
        createdBy: 'Admin',
        createdAt: new Date().toISOString(),
        items: [
          {
            account: newVoucher.category,
            description: newVoucher.description,
            debit: newVoucher.type === 'receipt' ? newVoucher.amount : 0,
            credit: newVoucher.type === 'payment' ? newVoucher.amount : 0,
          }
        ]
      };

      await vouchersService.add(voucherData as any);
      setIsVoucherModalOpen(false);
      setNewVoucher({
        type: 'receipt',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
        reference: '',
        category: 'General',
        paymentMethod: 'Cash'
      });
    } catch (err) {
      console.error("Voucher save error:", err);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">FINANCIAL HUB</h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
             System Node: {profile?.companyName || 'SCENTS & SOULS PERFUME LAB'} • LEDGER CONTROL
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (activeSubTab === 'purchases') setIsPurchaseModalOpen(true);
              else if (activeSubTab === 'vouchers') setIsVoucherModalOpen(true);
              else setActiveSubTab('vouchers');
            }}
            className="bg-[#0F0F0F] text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all w-full md:w-auto shadow-[0_20px_40px_rgba(0,0,0,0.15)] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Plus size={20} strokeWidth={3} />
            {activeSubTab === 'purchases' ? 'LOG NEW PURCHASE' : 'NEW VOUCHER'}
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="advanced-3d-card p-10 bg-white group hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                  <stat.icon size={24} />
                </div>
                {stat.trend && (
                  <span className={cn("text-[10px] font-black px-2 py-1 rounded-full border", stat.trend.startsWith('+') ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100")}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{stat.label}</div>
              <div className="text-3xl font-black tracking-tighter">{formatCurrency(stat.value)}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 p-1.5 rounded-[2.5rem] w-fit border border-gray-100 shadow-inner">
        {[
          { id: 'vouchers', label: 'Vouchers', icon: Receipt },
          { id: 'purchases', label: 'Purchases', icon: FileText },
          { id: 'sales', label: 'Sales Registry', icon: TrendingUp },
          { id: 'vat', label: 'UAE VAT Return', icon: Percent },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
              activeSubTab === tab.id ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-black"
            )}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="advanced-3d-card min-h-[500px] bg-white overflow-hidden">
        {activeSubTab === 'sales' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
               <h2 className="text-2xl font-black font-display tracking-tight uppercase">SALES REGISTRY HUB</h2>
               <div className="flex flex-wrap items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search Invoice/Cashier..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
                      <select 
                        value={saleStatusFilter}
                        onChange={e => setSaleStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                      >
                        <option value="All">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Payment</label>
                      <select 
                        value={salePaymentMethodFilter}
                        onChange={e => setSalePaymentMethodFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                      >
                        <option value="All">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Start Date</label>
                      <input 
                        type="date"
                        value={dateRange.start}
                        onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">End Date</label>
                      <input 
                        type="date"
                        value={dateRange.end}
                        onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                      />
                    </div>
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Invoice ID</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Created At</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Operator</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Payment Method</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Taxable</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">VAT (5%)</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Registry Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSales.map(s => (
                    <React.Fragment key={s.id}>
                      <tr 
                        onClick={() => setExpandedSaleId(expandedSaleId === s.id ? null : s.id)}
                        className={cn(
                          "hover:bg-gray-50/30 transition-all group cursor-pointer",
                          expandedSaleId === s.id ? "bg-gray-50/50" : ""
                        )}
                      >
                        <td className="px-10 py-8 font-mono text-sm font-black uppercase flex items-center gap-4">
                          <button className="text-gray-300 group-hover:text-black transition-colors">
                            {expandedSaleId === s.id ? <Plus className="rotate-45 transition-transform" /> : <Plus />}
                          </button>
                          {s.invoiceNumber}
                        </td>
                        <td className="px-10 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="px-10 py-8">
                          <div className="text-sm font-black uppercase tracking-tighter">{s.cashierName}</div>
                        </td>
                        <td className="px-10 py-8">
                           <span className={cn(
                             "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                             s.paymentMethod === 'cash' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                           )}>
                             {s.paymentMethod}
                           </span>
                        </td>
                        <td className="px-10 py-8">
                           <span className={cn(
                             "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                             s.status === 'completed' ? "bg-green-100 text-green-700" : 
                             s.status === 'pending' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                           )}>
                             {s.status}
                           </span>
                        </td>
                        <td className="px-10 py-8 text-sm font-bold text-gray-600">{formatCurrency(s.subtotal)}</td>
                        <td className="px-10 py-8 text-sm font-bold text-red-500">{formatCurrency(s.vatTotal)}</td>
                        <td className="px-10 py-8 text-right text-xl font-black font-display tracking-tighter">
                          {formatCurrency(s.grandTotal)}
                        </td>
                      </tr>
                      <AnimatePresence>
                        {expandedSaleId === s.id && (
                          <tr>
                            <td colSpan={8} className="bg-gray-50/30 px-10 py-0 overflow-hidden">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="py-10 border-l-2 border-black ml-4 pl-10 space-y-10"
                              >
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                  <div className="lg:col-span-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Manifest Items</h4>
                                    <div className="space-y-4">
                                      {s.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                                          <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 font-black text-xs">
                                              {idx + 1}
                                            </div>
                                            <div>
                                              <p className="text-sm font-black uppercase tracking-tight">{item.name}</p>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                Qty: {item.quantity} • Unit: {formatCurrency(item.unitPrice)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-black">{formatCurrency(item.totalWithVat)}</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">Inc. 5% VAT</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-8">
                                    <div className="advanced-3d-card p-8 bg-white border border-gray-100">
                                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Financial Reconciliation</h4>
                                      <div className="space-y-4">
                                        <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                                          <span>Registry Subtotal</span>
                                          <span className="text-black">{formatCurrency(s.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                                          <span>VAT Calibrated</span>
                                          <span className="text-black">{formatCurrency(s.vatTotal)}</span>
                                        </div>
                                        {s.discount > 0 && (
                                          <div className="flex justify-between text-xs text-red-500 font-bold uppercase tracking-widest">
                                            <span>Adjustment (Disc)</span>
                                            <span>-{formatCurrency(s.discount)}</span>
                                          </div>
                                        )}
                                        <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                                          <span className="text-[10px] font-black uppercase tracking-widest">Grand Total</span>
                                          <span className="text-2xl font-black font-display tracking-tighter">{formatCurrency(s.grandTotal)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                       {s.status !== 'cancelled' && (
                                         <button 
                                           onClick={() => handleRefund(s)}
                                           className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-200/50"
                                         >
                                            <RotateCcw size={16} /> REFUND
                                         </button>
                                       )}
                                       <button className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl">
                                          <Printer size={16} /> PRINT INVOICE
                                       </button>
                                        <button 
                                          onClick={handleExportSalesCSV}
                                          className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-black transition-all border border-gray-100"
                                        >
                                           <Download size={16} /> EXPORT
                                        </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                  {sales.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-10 py-40 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-20">
                           <TrendingUp size={48} strokeWidth={1} />
                           <p className="font-black uppercase tracking-[0.5em] text-[10px]">No sales registries detected</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'vouchers' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-10 border-b border-gray-50 flex flex-col lg:row lg:items-center justify-between gap-8">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                <input 
                  type="text" 
                  placeholder="FILTER VOUCHER NODES..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 text-xs font-black uppercase tracking-tight bg-gray-50/50 border-transparent rounded-3xl shadow-inner focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-200"
                />
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Voucher Identifier</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Chronological Note</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Entity Type</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Registry Total</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredVouchers.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50/30 transition-all group">
                      <td className="px-10 py-8 font-mono text-sm font-black uppercase">{v.voucherNumber}</td>
                      <td className="px-10 py-8 text-sm font-bold text-gray-400 uppercase tracking-widest">{new Date(v.date).toLocaleDateString()}</td>
                      <td className="px-10 py-8">
                        <span className="text-[9px] font-black px-3 py-1.5 rounded-full bg-black text-white uppercase tracking-[0.2em]">
                          {v.type}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-xl font-black font-display tracking-tighter">{formatCurrency(v.totalAmount)}</td>
                      <td className="px-10 py-8">
                         <div className="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"><Printer size={18} /></button>
                            <button 
                              onClick={() => handleDeleteVoucher(v.id)}
                              className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {loading && [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-10 py-12 bg-gray-50/10" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'purchases' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
               <div className="relative flex-1 max-w-xl">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                 <input 
                   type="text" 
                   placeholder="SEARCH INVOICE / SUPPLIER..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full pl-14 pr-6 py-5 text-xs font-black uppercase tracking-tight bg-gray-50/50 border-transparent rounded-3xl shadow-inner focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-200"
                 />
               </div>
               <div className="flex flex-wrap items-center gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Supplier Authority</label>
                    <select 
                      value={selectedSupplier}
                      onChange={e => setSelectedSupplier(e.target.value)}
                      className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                    >
                      {uniqueSuppliers.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Start Date</label>
                    <input 
                      type="date"
                      value={dateRange.start}
                      onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">End Date</label>
                    <input 
                      type="date"
                      value={dateRange.end}
                      onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Invoice Node</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Supplier Authority</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Product Name</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Quantity</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Unit Cost</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Method</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sync Date</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Taxable</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">VAT (5%)</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Authorize</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPurchases.map(p => (
                    <React.Fragment key={p.id}>
                      <tr 
                        onClick={() => setExpandedPurchaseId(expandedPurchaseId === p.id ? null : p.id)}
                        className={cn(
                          "hover:bg-gray-50/30 transition-all group cursor-pointer",
                          expandedPurchaseId === p.id ? "bg-gray-50/50" : ""
                        )}
                      >
                        <td className="px-10 py-8 font-mono text-sm font-black uppercase flex items-center gap-4">
                          <button className="text-gray-300 group-hover:text-black transition-colors">
                            {expandedPurchaseId === p.id ? <Plus className="rotate-45 transition-transform" /> : <Plus />}
                          </button>
                          {p.invoiceNumber}
                        </td>
                        <td className="px-10 py-8">
                          <div className="text-sm font-black uppercase tracking-tighter">{p.supplierName}</div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="text-xs font-bold uppercase truncate max-w-[150px]">
                            {p.items?.[0]?.name || '-'}
                            {p.items && p.items.length > 1 && (
                              <span className="ml-2 text-[8px] text-gray-400">+{p.items.length - 1} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-8 text-sm font-black">
                           {p.items?.[0]?.quantity || '-'}
                        </td>
                        <td className="px-10 py-8 text-sm font-bold text-gray-600">
                           {p.items?.[0]?.unitCost ? formatCurrency(p.items[0].unitCost) : '-'}
                        </td>
                        <td className="px-10 py-8">
                          <span className={cn(
                            "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                            p.paymentMethod === PaymentMethod.CASH ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <span className={cn(
                            "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                            p.status === 'paid' ? "bg-green-100 text-green-700" : 
                            p.status === 'partial' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                          )}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {p.createdAt ? new Date(p.createdAt).toLocaleString() : new Date(p.date).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-8 text-sm font-bold">{formatCurrency(p.subtotal || (p.grandTotal - p.vatTotal))}</td>
                        <td className="px-10 py-8 text-sm font-black text-red-500">{formatCurrency(p.vatTotal)}</td>
                        <td className="px-10 py-8 text-right text-xl font-black font-display tracking-tighter">{formatCurrency(p.grandTotal)}</td>
                        <td className="px-10 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleDeletePurchase(p.id); }}
                               className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                               title="PURGE ENTRY"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {expandedPurchaseId === p.id && (
                          <tr>
                            <td colSpan={12} className="bg-gray-50/30 px-10 py-0 overflow-hidden">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="py-10 border-l-2 border-[#C5A059] ml-4 pl-10 space-y-10"
                              >
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                  <div className="lg:col-span-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Stock Manifest Items</h4>
                                    <div className="space-y-4">
                                      {p.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                                          <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#C5A059] font-black text-xs">
                                              {idx + 1}
                                            </div>
                                            <div>
                                              <p className="text-sm font-black uppercase tracking-tight">{item.name}</p>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                Qty Received: {item.quantity} • Unit Cost: {formatCurrency(item.unitCost)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-black">{formatCurrency(item.total)}</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">Inc. VAT Adjustment</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-8">
                                    <div className="advanced-3d-card p-8 bg-white border border-gray-100">
                                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Purchase Reconciliation</h4>
                                      <div className="space-y-4">
                                        <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                                          <span>Invoice Subtotal</span>
                                          <span className="text-black">{formatCurrency(p.subtotal || (p.grandTotal - p.vatTotal))}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                                          <span>Input VAT (5%)</span>
                                          <span className="text-red-500 font-black">{formatCurrency(p.vatTotal)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                                          <span className="text-[10px] font-black uppercase tracking-widest">Grand Total</span>
                                          <span className="text-2xl font-black font-display tracking-tighter">{formatCurrency(p.grandTotal)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                          onClick={handleExportPurchasesCSV}
                                          className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl"
                                        >
                                           <Download size={16} /> DOWNLOAD DOC
                                        </button>
                                       <button className="flex-1 bg-gray-50 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-black transition-all border border-gray-100">
                                          <Printer size={16} /> PRINT LABEL
                                       </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                  {purchases.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-10 py-40 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-20">
                           <FileText size={48} strokeWidth={1} />
                           <p className="font-black uppercase tracking-[0.5em] text-[10px]">No purchase nodes active</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'vat' && (
          <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-16">
            <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white rounded-[2rem] shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-black/20">
                     <Percent size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-display tracking-tight uppercase">UAE VAT RETURN RECONCILIATION</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-1">Audit Protocol FORM_201</p>
                  </div>
               </div>
               <div className="flex flex-wrap items-center gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Reporting Start</label>
                    <input 
                      type="date"
                      value={dateRange.start}
                      onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Reporting End</label>
                    <input 
                      type="date"
                      value={dateRange.end}
                      onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-black outline-none transition-all"
                    />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 ml-2">Taxable Supplies (Output VAT)</h3>
                  <div className="advanced-3d-card p-10 bg-white border border-gray-100">
                     <div className="space-y-6">
                        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400">
                           <span>Standard Rated (5%)</span>
                           <span className="text-black">{formatCurrency(totalTaxableSales)}</span>
                        </div>
                        <div className="pt-6 border-t border-dashed border-gray-100 flex justify-between items-end">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Total Output VAT</span>
                           <span className="text-4xl font-black font-display tracking-tighter text-red-500">{formatCurrency(totalVATonSales)}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 ml-2">Recoverable Supplies (Input VAT)</h3>
                  <div className="advanced-3d-card p-10 bg-white border border-gray-100">
                     <div className="space-y-6">
                        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-gray-400">
                           <span>Purchase Acquisitions</span>
                           <span className="text-black">{formatCurrency(totalTaxablePurchases)}</span>
                        </div>
                        <div className="pt-6 border-t border-dashed border-gray-100 flex justify-between items-end">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Total Input VAT</span>
                           <span className="text-4xl font-black font-display tracking-tighter text-green-500">{formatCurrency(totalVATonPurchases)}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* NET VAT PAYABLE SECTION - PROMINENT DISPLAY */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#C5A059] via-black to-[#C5A059] rounded-[3.5rem] blur-2xl opacity-10 animate-pulse" />
              <div className="relative p-14 bg-[#0F0F0F] text-white rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059] rounded-full blur-[150px] opacity-[0.05] -mr-48 -mt-48" />
                
                <div className="flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
                   <div className="flex-1 text-center lg:text-left">
                      <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C5A059]">NET AUDIT RECONCILIATION</span>
                      <h3 className="text-6xl font-black font-display tracking-tighter mt-4 uppercase">VAT PAYABLE BALANCE</h3>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-4">Authorized calculation for {dateRange.start || 'Beginning'} - {dateRange.end || 'Latest'}</p>
                   </div>

                   <div className="text-center lg:text-right space-y-6">
                      <div className={cn(
                        "text-8xl font-black font-display tracking-tighter",
                        netVAT >= 0 ? "text-white" : "text-green-400"
                      )}>
                        {formatCurrency(netVAT)}
                      </div>
                      <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 rounded-full border border-white/10">
                         <div className={cn("w-2 h-2 rounded-full animate-pulse", netVAT >= 0 ? "bg-red-500" : "bg-green-500")} />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                            STATUS: {netVAT >= 0 ? 'LIABILITY_PAYABLE' : 'TAX_REFUND_DUE'}
                         </span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* VAT AUDIT TRAIL TABLE */}
            <div className="space-y-8">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Transaction Audit Trail</h3>
                  <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:text-black transition-all">
                     <Printer size={16} /> PRINT RECONCILIATION
                  </button>
               </div>
               
               <div className="advanced-3d-card bg-white overflow-hidden border border-gray-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Type</th>
                        <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Date Node</th>
                        <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Reference ID</th>
                        <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Taxable Authority</th>
                        <th className="px-10 py-6 text-right text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">VAT (5.0%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        ...filteredSalesForVat.map(s => ({ ...s, vatType: 'Output' })),
                        ...filteredPurchasesForVat.map(p => ({ ...p, vatType: 'Input' }))
                      ]
                      .sort((a, b) => new Date(b.createdAt || (b as any).date).getTime() - new Date(a.createdAt || (a as any).date).getTime())
                      .map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/30 transition-all">
                          <td className="px-10 py-6">
                             <span className={cn(
                               "text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                               entry.vatType === 'Output' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                             )}>
                               {entry.vatType}
                             </span>
                          </td>
                          <td className="px-10 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                             {new Date(entry.createdAt || (entry as any).date).toLocaleDateString()}
                          </td>
                          <td className="px-10 py-6 font-mono text-[10px] font-black uppercase tracking-tight">{entry.invoiceNumber}</td>
                          <td className="px-10 py-6 text-xs font-bold text-gray-600">
                            {formatCurrency(
                              entry.vatType === 'Output' 
                                ? (entry as Sale).subtotal 
                                : ((entry as PurchaseInvoice).subtotal || ((entry as PurchaseInvoice).grandTotal - (entry as PurchaseInvoice).vatTotal))
                            )}
                          </td>
                          <td className="px-10 py-6 text-right text-sm font-black font-display tracking-tight text-black">
                            {formatCurrency(entry.vatTotal)}
                          </td>
                        </tr>
                      ))}
                      {(filteredSalesForVat.length === 0 && filteredPurchasesForVat.length === 0) && (
                        <tr>
                           <td colSpan={5} className="px-10 py-32 text-center">
                              <div className="flex flex-col items-center gap-6 opacity-20">
                                 <History size={48} strokeWidth={1} />
                                 <p className="font-black uppercase tracking-[0.5em] text-[10px]">No tax-bearing sequences detected in range</p>
                              </div>
                           </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      <AnimatePresence>
        {isPurchaseModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPurchaseModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-display tracking-tighter uppercase">PURCHASE <span className="text-[#C5A059]">REGISTRY ENTRY</span></h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">STOCK ARRIVAL PROTOCOL</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="p-4 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Invoice Reference</label>
                    <input 
                      type="text" 
                      value={newPurchase.invoiceNumber}
                      onChange={e => setNewPurchase(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold"
                      placeholder="INV-XXXXXXX"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Supplier Entity</label>
                    <select 
                      value={newPurchase.supplierId}
                      onChange={e => setNewPurchase(prev => ({ ...prev, supplierId: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold"
                    >
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Registry Date</label>
                    <input 
                      type="date" 
                      value={newPurchase.date}
                      onChange={e => setNewPurchase(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Payment Protocol</label>
                    <select 
                      value={newPurchase.paymentMethod}
                      onChange={e => setNewPurchase(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold"
                    >
                      {Object.values(PaymentMethod).map(m => (
                        <option key={m} value={m}>{m.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-dashed border-gray-100 pb-6 uppercase">
                    <h3 className="text-sm font-black tracking-widest">Line Item Manifest</h3>
                    <button 
                      onClick={handleAddPurchaseItem}
                      className="flex items-center gap-2 text-blue-500 font-black text-xs hover:scale-105 transition-all"
                    >
                      <PlusCircle size={16} /> ADD PRODUCT NODE
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newPurchase.items?.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 items-end bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                        <div className="col-span-5 space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Product System ID</label>
                          <select 
                            value={item.productId}
                            onChange={e => handleUpdatePurchaseItem(idx, 'productId', e.target.value)}
                            className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black outline-none transition-all text-xs font-bold"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Quantity</label>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={e => handleUpdatePurchaseItem(idx, 'quantity', parseInt(e.target.value))}
                            className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black outline-none transition-all text-xs font-bold"
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Unit Cost</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.unitCost}
                            onChange={e => handleUpdatePurchaseItem(idx, 'unitCost', parseFloat(e.target.value))}
                            className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black outline-none transition-all text-xs font-bold"
                          />
                        </div>
                        <div className="col-span-1 text-right py-3">
                           <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest leading-none mb-1">VAT (5%)</p>
                           <p className="text-xs font-bold">{formatCurrency(item.vatAmount)}</p>
                        </div>
                        <div className="col-span-1 text-right py-3 pr-2">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                           <p className="text-sm font-black font-display tracking-tight">{formatCurrency(item.total)}</p>
                        </div>
                        <div className="col-span-1 flex justify-end">
                           <button 
                            onClick={() => handleRemovePurchaseItem(idx)}
                            className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                    {(!newPurchase.items || newPurchase.items.length === 0) && (
                      <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2rem] opacity-20">
                         <PlusCircle size={48} className="mx-auto mb-4" strokeWidth={1} />
                         <p className="text-[10px] font-black uppercase tracking-[0.3em]">No items detected in current manifest</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-12">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxable Subtotal</p>
                      <p className="text-xl font-black tracking-tight">{formatCurrency(newPurchase.subtotal || 0)}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">VAT Calibrated (5%)</p>
                      <p className="text-xl font-black tracking-tight">{formatCurrency(newPurchase.vatTotal || 0)}</p>
                   </div>
                   <div className="pl-12 border-l border-gray-200">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest">Grand Total Balance</p>
                      <p className="text-3xl font-black font-display tracking-tighter">{formatCurrency(newPurchase.grandTotal || 0)}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsPurchaseModalOpen(false)}
                    className="px-10 py-4 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-black transition-all"
                  >
                    ABORT LOG
                  </button>
                  <button 
                    onClick={handleSavePurchase}
                    className="bg-black text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:bg-gray-800 transition-all flex items-center gap-3"
                  >
                    <Save size={18} /> SYNC TO REGISTRY
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* New Voucher Modal */}
      <AnimatePresence>
        {isVoucherModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsVoucherModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <form onSubmit={handleSaveVoucher}>
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black font-display tracking-tighter uppercase text-black">VOUCHER <span className="text-[#C5A059]">ENTRY PROTOCOL</span></h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">ACCOUNTING REGISTRY</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsVoucherModalOpen(false)} className="p-4 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                </div>

                <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Voucher Type</label>
                        <select 
                          value={newVoucher.type}
                          onChange={e => setNewVoucher({...newVoucher, type: e.target.value as VoucherType})}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none font-bold"
                        >
                           <option value="receipt">RECEIPT</option>
                           <option value="payment">PAYMENT</option>
                           <option value="journal">JOURNAL</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Registry Date</label>
                        <input 
                          type="date" 
                          value={newVoucher.date}
                          onChange={e => setNewVoucher({...newVoucher, date: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none font-bold"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Amount (AED)</label>
                        <input 
                          type="number" 
                          value={newVoucher.amount}
                          onChange={e => setNewVoucher({...newVoucher, amount: parseFloat(e.target.value)})}
                          className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none font-black text-3xl"
                          placeholder="0.00"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Reference/Chq No.</label>
                        <input 
                          type="text" 
                          value={newVoucher.reference}
                          onChange={e => setNewVoucher({...newVoucher, reference: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none font-bold placeholder:text-gray-200"
                          placeholder="REF-XXXX"
                        />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description / Narration</label>
                     <textarea 
                       value={newVoucher.description}
                       onChange={e => setNewVoucher({...newVoucher, description: e.target.value})}
                       className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none font-bold h-24"
                       placeholder="Enter transaction details..."
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                        <input 
                          type="text" 
                          value={newVoucher.category}
                          onChange={e => setNewVoucher({...newVoucher, category: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none font-bold"
                          placeholder="General"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Payment Method</label>
                        <select 
                          value={newVoucher.paymentMethod}
                          onChange={e => setNewVoucher({...newVoucher, paymentMethod: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none font-bold"
                        >
                           <option value="Cash">CASH</option>
                           <option value="Bank">BANK TRANSFER</option>
                           <option value="Cheque">CHEQUE</option>
                           <option value="Card">CARD</option>
                        </select>
                     </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                  <button type="button" onClick={() => setIsVoucherModalOpen(false)} className="px-8 py-4 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-black">CANCEL</button>
                  <button type="submit" className="bg-black text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:bg-gray-800 transition-all">SYNC VOUCHER</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Droplet, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  MoreVertical,
  Settings,
  Sparkles,
  Trash2,
  Save,
  PenTool,
  Calendar,
  DollarSign
} from 'lucide-react';
import { repairsService, customersService, businessProfileService } from '../lib/dbService';
import { Repair, RepairStatus, Customer, BusinessProfile } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export default function Repairs() {
  const [repairs, setRepairs] = React.useState<Repair[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedRepair, setSelectedRepair] = React.useState<Repair | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [newRepair, setNewRepair] = React.useState<Partial<Repair>>({
    jobId: `JOB-${Date.now().toString().slice(-6)}`,
    deviceModel: '',
    issue: '',
    estimatedCost: 0,
    advancePayment: 0,
    status: RepairStatus.RECEIVED,
    receivedDate: new Date().toISOString(),
    expectedDate: '',
    notes: '',
    partsUsed: []
  });

  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = React.useState('');

  React.useEffect(() => {
    const unsubRepairs = repairsService.subscribe(setRepairs);
    const unsubCustomers = customersService.subscribe(setCustomers);
    const unsubProfile = businessProfileService.subscribe(setProfile);
    setLoading(false);
    return () => {
      unsubRepairs();
      unsubCustomers();
      unsubProfile();
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newRepair.deviceModel || !newRepair.issue) return;

    const repairData: Omit<Repair, 'id'> = {
      ...(newRepair as Repair),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      balanceDue: (newRepair.estimatedCost || 0) - (newRepair.advancePayment || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repairsService.add(repairData);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewRepair({
      jobId: `JOB-${Date.now().toString().slice(-6)}`,
      deviceModel: '',
      issue: '',
      estimatedCost: 0,
      advancePayment: 0,
      status: RepairStatus.RECEIVED,
      receivedDate: new Date().toISOString(),
      expectedDate: '',
      notes: '',
      partsUsed: []
    });
    setSelectedCustomer(null);
  };

  const updateStatus = async (id: string, status: RepairStatus) => {
    const update: any = { status };
    if (status === RepairStatus.READY) update.completedDate = new Date().toISOString();
    if (status === RepairStatus.DELIVERED) update.deliveredDate = new Date().toISOString();
    
    await repairsService.update(id, update);
    if (selectedRepair?.id === id) {
      setSelectedRepair(prev => prev ? { ...prev, ...update } : null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('TERMINATE REPAIR RECORD IRREVERSIBLY?')) {
      await repairsService.delete(id);
    }
  };

  const filteredRepairs = repairs.filter(r => 
    r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.jobId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.RECEIVED: return "bg-yellow-50 text-yellow-600 border-yellow-100";
      case RepairStatus.DIAGNOSING: return "bg-blue-50 text-blue-600 border-blue-100";
      case RepairStatus.WAITING_PARTS: return "bg-orange-50 text-orange-600 border-orange-100";
      case RepairStatus.REPAIRING: return "bg-purple-50 text-purple-600 border-purple-100";
      case RepairStatus.TESTING: return "bg-pink-50 text-pink-600 border-pink-100";
      case RepairStatus.READY: return "bg-green-50 text-green-600 border-green-100";
      case RepairStatus.DELIVERED: return "bg-black text-[#C5A059] border-black";
      case RepairStatus.CANCELLED: return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-gray-50 text-gray-400 border-gray-100";
    }
  };

  const formatStatusLabel = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.RECEIVED: return "Scent Consultation";
      case RepairStatus.DIAGNOSING: return "Olfactory Profiling";
      case RepairStatus.WAITING_PARTS: return "Awaiting Essences";
      case RepairStatus.REPAIRING: return "LAB Formulation";
      case RepairStatus.TESTING: return "Maceration & QC Check";
      case RepairStatus.READY: return "Ready for Collection";
      case RepairStatus.DELIVERED: return "Delivered to Client";
      case RepairStatus.CANCELLED: return "Formula Voided";
      default: return (status as string || '').replace('_', ' ');
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">BESPOKE <span className="text-[#C5A059]">SCENT LAB</span></h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
             System Node: {profile?.companyName || 'Scents & Souls Perfume LAB'} • CUSTOM SCENT PROFILING & FORMULAS
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#0F0F0F] text-white px-10 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl shadow-black/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Sparkles size={20} strokeWidth={3} />
          CREATE BESPOKE PROFILE
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Statistics or Quick filters could go here */}
        <div className="lg:col-span-3 space-y-8">
          <div className="advanced-3d-card bg-white overflow-hidden">
            <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center gap-8">
               <div className="relative flex-1">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                 <input 
                   type="text" 
                   placeholder="SCAN JOB_ID OR FILTER BY CLIENT/DEVICE ENTITY..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full pl-16 pr-6 py-6 bg-gray-50/50 rounded-[2.5rem] border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none font-black text-xs tracking-widest placeholder:text-gray-200 transition-all shadow-inner"
                 />
               </div>
               <div className="flex items-center gap-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                    {filteredRepairs.length} CLUSTERS SYNCED
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Formula Ref</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Client / Connoisseur</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Fragrance Base & Accord</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Formulation Phase</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Price</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Nexus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRepairs.map((repair) => (
                    <tr 
                      key={repair.id} 
                      onClick={() => setSelectedRepair(repair)}
                      className="hover:bg-gray-50/50 transition-all cursor-pointer group"
                    >
                      <td className="px-10 py-8">
                        <div className="text-sm font-black font-mono tracking-tight text-gray-400">#{repair.jobId}</div>
                        <div className="text-[9px] font-bold text-gray-300 mt-1 uppercase tracking-widest leading-none">
                          In: {format(new Date(repair.receivedDate), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="text-sm font-black uppercase tracking-tighter group-hover:text-[#C5A059] transition-colors">{repair.customerName}</div>
                        <div className="text-[10px] text-gray-400 mt-1 font-bold tracking-[0.1em]">{repair.customerPhone}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-[#C5A059] group-hover:scale-110 transition-transform">
                              <Droplet size={20} />
                           </div>
                           <div>
                              <div className="text-sm font-black uppercase tracking-tighter">{repair.deviceModel}</div>
                              <div className="text-[10px] text-amber-600 font-bold uppercase tracking-tight mt-1 truncate max-w-[120px]">{repair.issue}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          getStatusColor(repair.status)
                        )}>
                          {formatStatusLabel(repair.status)}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                         <div className="text-lg font-black font-display tracking-tighter">{formatCurrency(repair.estimatedCost)}</div>
                         {repair.balanceDue > 0 && (
                           <div className="text-[9px] text-red-500 font-black uppercase tracking-widest mt-1">Due: {formatCurrency(repair.balanceDue)}</div>
                         )}
                      </td>
                      <td className="px-10 py-8 text-center">
                         <div className="flex justify-center">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-200 group-hover:bg-black group-hover:text-white transition-all">
                               <ChevronRight size={20} />
                            </div>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRepairs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-10 py-32 text-center">
                         <div className="flex flex-col items-center gap-6 opacity-20">
                            <Sparkles size={64} strokeWidth={1} />
                            <p className="font-black uppercase tracking-[0.8em] text-[10px]">Registry Vacuum Detected</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Repair Detail / Stats */}
        <div className="lg:col-span-1 space-y-8">
           <AnimatePresence mode="wait">
             {selectedRepair ? (
               <motion.div
                 key={selectedRepair.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="advanced-3d-card p-10 bg-white space-y-12 sticky top-8"
               >
                 <div className="flex items-center justify-between">
                    <div className="w-20 h-20 bg-black rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-black/20">
                       <Droplet size={32} />
                    </div>
                    <button 
                      onClick={() => setSelectedRepair(null)}
                      className="w-12 h-12 flex items-center justify-center text-gray-200 hover:text-black transition-all"
                    >
                      <X size={24} />
                    </button>
                 </div>

                 <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 leading-none">FORMULATION_ID</div>
                    <h2 className="text-4xl font-black font-display tracking-tighter uppercase leading-none">#{selectedRepair.jobId}</h2>
                    <div className="flex items-center gap-4 pt-4">
                       <span className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                          getStatusColor(selectedRepair.status)
                       )}>
                         {formatStatusLabel(selectedRepair.status)}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-8 border-t border-gray-50 pt-8">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black">
                          {selectedRepair.customerName.charAt(0)}
                       </div>
                       <div>
                          <p className="text-[13px] font-black uppercase tracking-tight">{selectedRepair.customerName}</p>
                          <p className="text-[10px] text-[#C5A059] font-bold mt-1">{selectedRepair.customerPhone}</p>
                       </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">SCENT DESIRED NOTES</p>
                       <p className="text-xs font-bold text-gray-600 leading-relaxed">{selectedRepair.issue}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-black text-white rounded-[2rem] flex flex-col justify-between h-32">
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">ESTIMATED</span>
                          <span className="text-2xl font-black font-display tracking-tight text-[#C5A059]">{formatCurrency(selectedRepair.estimatedCost)}</span>
                       </div>
                       <div className={cn(
                         "p-6 rounded-[2rem] flex flex-col justify-between h-32 border-2",
                         selectedRepair.balanceDue > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
                       )}>
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", selectedRepair.balanceDue > 0 ? "text-red-400" : "text-green-400")}>
                            {selectedRepair.balanceDue > 0 ? 'BALANCE DUE' : 'FULLY PAID'}
                          </span>
                          <span className={cn("text-2xl font-black font-display tracking-tight", selectedRepair.balanceDue > 0 ? "text-red-600" : "text-green-600")}>
                            {formatCurrency(selectedRepair.balanceDue)}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-1">Calibrate Level</p>
                    <div className="grid grid-cols-2 gap-3">
                       {[RepairStatus.DIAGNOSING, RepairStatus.REPAIRING, RepairStatus.READY, RepairStatus.DELIVERED].map(status => (
                         <button 
                           key={status}
                           onClick={() => updateStatus(selectedRepair.id, status)}
                           className={cn(
                             "py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                             selectedRepair.status === status ? "bg-[#C5A059] text-white border-[#C5A059]" : "bg-white text-gray-400 border-gray-100 hover:border-black"
                           )}
                         >
                           {status.replace('_', ' ')}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-4 pt-10">
                    <button className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-black hover:text-white transition-all group">
                       <Printer size={20} className="group-hover:rotate-12 transition-transform" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Job Card</span>
                    </button>
                    <button className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-[#C5A059] hover:text-white transition-all group">
                       <Save size={20} className="group-hover:scale-110 transition-transform" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Update</span>
                    </button>
                    <button 
                      onClick={() => { handleDelete(selectedRepair.id); setSelectedRepair(null); }}
                      className="w-20 h-full bg-red-50 text-red-300 rounded-3xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                    >
                       <Trash2 size={24} />
                    </button>
                 </div>
               </motion.div>
             ) : (
               <div className="advanced-3d-card p-12 bg-gray-50 border border-gray-100 h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                  <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center">
                    <Droplet size={64} className="text-[#C5A059]" strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Standby Selection</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest leading-loose">Select or search a bespoke fragrance formula <br/> card to load details</p>
                  </div>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-12 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                         <Sparkles size={28} />
                      </div>
                      <div>
                         <h2 className="text-3xl font-black font-display tracking-tight uppercase">SCENT FORMULA LAB</h2>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">Associate connoisseur to custom scent formula</p>
                      </div>
                   </div>
                   <button onClick={() => setShowAddModal(false)} className="w-14 h-14 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 hover:text-black transition-all">
                      <X size={28} />
                   </button>
                </div>

                <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
                   {/* Client Selection */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                         <label className="text-[10px] font-black uppercase tracking-[0.4em] text-black">CLIENT ASSOCIATION</label>
                      </div>
                      
                      {selectedCustomer ? (
                        <div className="p-8 bg-[#0F0F0F] rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white font-black text-2xl border border-white/10">
                                 {selectedCustomer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                 <div className="text-lg font-black uppercase tracking-tight">{selectedCustomer.name}</div>
                                 <div className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-1">{selectedCustomer.phone}</div>
                              </div>
                           </div>
                           <button onClick={() => setSelectedCustomer(null)} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-black text-[9px] uppercase tracking-widest">RE-ASSIGN</button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="relative">
                              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                              <input 
                                type="text" 
                                placeholder="FILTER CLIENT NODES (NAME, PHONE)..."
                                value={customerSearch}
                                onChange={e => setCustomerSearch(e.target.value)}
                                className="w-full pl-16 pr-6 py-6 bg-gray-50 rounded-3xl border-none outline-none font-bold text-xs tracking-tight focus:ring-1 focus:ring-black transition-all"
                              />
                           </div>
                           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                              {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).slice(0, 5).map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setSelectedCustomer(c)}
                                  className="px-8 py-5 bg-white border border-gray-100 rounded-3xl flex items-center gap-4 hover:border-black transition-all hover:shadow-xl shrink-0 group"
                                >
                                   <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xs font-black group-hover:bg-black group-hover:text-white transition-all">{c.name.charAt(0)}</div>
                                   <div className="text-left">
                                      <div className="text-[10px] font-black uppercase tracking-tight">{c.name}</div>
                                      <div className="text-[9px] text-[#C5A059] font-bold mt-0.5">{c.phone}</div>
                                   </div>
                                </button>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   {/* Device Details */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-10">
                         <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-black rounded-full" />
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-black">SCENT DESCRIPTION</label>
                         </div>
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Bespoke Fragrance / Accord Name</label>
                               <input 
                                 type="text" 
                                 required
                                 value={newRepair.deviceModel}
                                 onChange={e => setNewRepair({ ...newRepair, deviceModel: e.target.value })}
                                 className="w-full px-8 py-5 bg-gray-50 rounded-3xl focus:ring-1 focus:ring-black outline-none font-black uppercase text-sm border-transparent"
                                 placeholder="e.g. Oud Saffron Accord / Majestic Amber Blend"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Formulation Batch / Lot Code</label>
                               <input 
                                 type="text" 
                                 value={newRepair.imei}
                                 onChange={e => setNewRepair({ ...newRepair, imei: e.target.value })}
                                 className="w-full px-8 py-5 bg-gray-50 rounded-3xl focus:ring-1 focus:ring-black outline-none font-mono font-bold text-sm tracking-widest border-transparent uppercase"
                                 placeholder="SNS-BATCH-001"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Olfactory Goal & Ingredients</label>
                               <textarea 
                                 required
                                 rows={4}
                                 value={newRepair.issue}
                                 onChange={e => setNewRepair({ ...newRepair, issue: e.target.value })}
                                 className="w-full px-8 py-6 bg-gray-50 rounded-[2.5rem] focus:ring-1 focus:ring-black outline-none font-bold text-xs leading-relaxed border-transparent resize-none"
                                 placeholder="Describe the desired olfactory profile, scent notes, ingredients, or maceration goal (e.g., Warm Woody Oriental base with Saffron, Amberwood, Bulgarian Rose, and Oakmoss)..."
                               />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-10">
                         <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-black rounded-full" />
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-black">FINANCIAL PARAMETERS</label>
                         </div>
                         <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estimated Sequence (AED)</label>
                                  <div className="relative">
                                     <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                     <input 
                                       type="number" 
                                       required
                                       value={newRepair.estimatedCost || ''}
                                       onChange={e => setNewRepair({ ...newRepair, estimatedCost: parseFloat(e.target.value) || 0 })}
                                       className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-2xl focus:ring-1 focus:ring-black outline-none font-black text-xl"
                                     />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Advance Commitment (AED)</label>
                                  <div className="relative">
                                     <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                     <input 
                                       type="number" 
                                       value={newRepair.advancePayment || ''}
                                       onChange={e => setNewRepair({ ...newRepair, advancePayment: parseFloat(e.target.value) || 0 })}
                                       className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-2xl focus:ring-1 focus:ring-black outline-none font-black text-xl"
                                     />
                                  </div>
                               </div>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
                               <div className="space-y-2">
                                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Yield Balance</div>
                                  <div className="text-3xl font-black font-display tracking-tighter text-red-600">
                                     {formatCurrency((newRepair.estimatedCost || 0) - (newRepair.advancePayment || 0))}
                                  </div>
                               </div>
                               <div className="text-right space-y-2">
                                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Temporal Target</div>
                                  <input 
                                    type="date" 
                                    value={newRepair.expectedDate}
                                    onChange={e => setNewRepair({ ...newRepair, expectedDate: e.target.value })}
                                    className="bg-white border-gray-200 rounded-xl px-4 py-2 text-[10px] font-black outline-none focus:ring-1 focus:ring-black"
                                  />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="pt-12 border-t border-gray-50 flex items-center gap-6 sticky bottom-0 bg-white pb-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-6 bg-gray-50 text-gray-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-100 transition-all"
                      >
                         ABORT SEQUENCE
                      </button>
                      <button 
                         type="submit"
                         className="flex-[2] py-6 bg-[#0F0F0F] text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                      >
                         <Save size={20} strokeWidth={3} />
                         COMMIT FORMULA REGISTRY
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

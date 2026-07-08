/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Ticket, 
  X, 
  Save, 
  Calendar, 
  Tag, 
  Percent, 
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { promoVouchersService, businessProfileService } from '../lib/dbService';
import { PromoVoucher, PromoType, BusinessProfile } from '../types';
import { cn, formatCurrency } from '../lib/utils';

export default function Vouchers() {
  const [vouchers, setVouchers] = React.useState<PromoVoucher[]>([]);
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingVoucher, setEditingVoucher] = React.useState<PromoVoucher | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateError, setDateError] = React.useState('');

  const [newVoucher, setNewVoucher] = React.useState<Partial<PromoVoucher>>({
    code: '',
    type: PromoType.PERCENTAGE,
    value: 0,
    minPurchase: 0,
    isActive: true,
    usageCount: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  React.useEffect(() => {
    const unsubVouchers = promoVouchersService.subscribe((data) => {
      setVouchers(data as PromoVoucher[]);
      setLoading(false);
    });
    const unsubProfile = businessProfileService.subscribe(setProfile);
    return () => {
      unsubVouchers();
      unsubProfile();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Detailed validation
    if (!newVoucher.code) {
      alert("CRITICAL ERROR: CAMPAIGN CODE SIGNATURE REQUIRED");
      return;
    }
    
    // Validate Future Date
    const selectedDate = new Date(newVoucher.expiryDate || '');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate <= today) {
      setDateError('TEMPORAL ANOMALY: EXPIRY MUST BE IN THE FUTURE');
      return;
    }

    try {
      if (editingVoucher) {
        await promoVouchersService.update(editingVoucher.id, newVoucher);
      } else {
        await promoVouchersService.add(newVoucher as Omit<PromoVoucher, 'id'>);
      }
      setShowAddModal(false);
      setEditingVoucher(null);
      setDateError('');
      setNewVoucher({
        code: '',
        type: PromoType.PERCENTAGE,
        value: 0,
        minPurchase: 0,
        isActive: true,
        usageCount: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } catch (err) {
      console.error("Voucher save error:", err);
    }
  };

  const handleEdit = (voucher: PromoVoucher) => {
    setEditingVoucher(voucher);
    setNewVoucher(voucher);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('TERMINATE VOUCHER PROTOCOL?')) {
      await promoVouchersService.delete(id);
    }
  };

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <h1 className="font-display text-5xl font-black tracking-tighter uppercase">VOUCHER <span className="text-[#C5A059]">VAULT</span></h1>
           <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
              PROMOTIONAL PROTOCOLS • {profile?.companyName || 'SCENTS & SOULS PERFUME LAB'}
           </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-black text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 group relative overflow-hidden"
        >
          <Plus size={20} /> INITIALIZE CAMPAIGN
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-8">
           <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
              <input 
                type="text" 
                placeholder="SEARCH CAMPAIGN CODES..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 py-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl focus:ring-1 focus:ring-[#C5A059] outline-none font-black text-xs uppercase tracking-widest placeholder:text-gray-200"
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {loading ? (
               [1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
             ) : filteredVouchers.map(voucher => (
               <motion.div 
                 key={voucher.id}
                 layout
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="relative group overflow-hidden"
               >
                 {/* Ticket Style UI */}
                 <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 relative z-10">
                    <div className="flex justify-between items-start mb-8">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                            voucher.isActive ? "bg-black shadow-black/10" : "bg-gray-200"
                          )}>
                             <Ticket size={24} />
                          </div>
                          <div>
                             <h4 className="font-black text-xl tracking-tighter uppercase">{voucher.code}</h4>
                             <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  voucher.isActive ? "bg-green-500 animate-pulse" : "bg-red-400"
                                )} />
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                   {voucher.isActive ? 'ACTIVE_PROTOCOL' : 'TERMINATED'}
                                </span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                         <div className="bg-white p-1.5 rounded-xl shadow-lg border border-gray-100 group-hover:scale-110 transition-transform">
                            <QRCodeSVG 
                              value={`${profile?.promoPrefix || 'https://alqusaidatmobiles.com/promo/'}${voucher.code}`} 
                              size={48}
                              level="H"
                              includeMargin={false}
                            />
                         </div>
                         <button 
                           onClick={() => handleDelete(voucher.id)}
                           className="w-10 h-10 hover:bg-red-50 text-gray-200 hover:text-red-500 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 size={18} />
                         </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-6 border-y border-dashed border-gray-100 mb-6">
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 font-mono">Yield Factor</p>
                          <p className="text-2xl font-black text-[#C5A059]">
                             {voucher.type === PromoType.PERCENTAGE ? `${voucher.value}%` : formatCurrency(voucher.value)}
                             <span className="text-[10px] ml-1 font-bold text-gray-400">{voucher.type === PromoType.PERCENTAGE ? 'OFF' : 'VAL'}</span>
                          </p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 font-mono">Min Sequence</p>
                          <p className="text-2xl font-black text-black">
                             {formatCurrency(voucher.minPurchase || 0)}
                          </p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                       <div className="flex items-center gap-2">
                          <Calendar size={14} /> EXP: {new Date(voucher.expiryDate).toLocaleDateString()}
                       </div>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} /> {voucher.usageLimit ? `${voucher.usageCount || 0} / ${voucher.usageLimit}` : 'UNLIMITED'}
                       </div>
                    </div>
                 </div>
                 
                 {/* Decorative Dashed Line for Ticket Look */}
                 <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-50 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all border-y border-dashed border-gray-200" />
               </motion.div>
             ))}
           </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="advanced-3d-card p-10 bg-black text-white space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10 space-y-6">
                 <div className="w-16 h-16 bg-[#C5A059] rounded-3xl flex items-center justify-center text-black shadow-xl shadow-[#C5A059]/20">
                    <Tag size={32} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h3 className="font-display text-2xl font-black uppercase tracking-tight">CAMPAIGN METRICS</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mt-2 leading-relaxed">
                       PROMOTIONAL NODES BOOST VOLUMETRIC THROUGHPUT. USE SPARINGLY.
                    </p>
                 </div>
                 <div className="pt-6 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-white/40">TOTAL CAMPAIGNS</span>
                       <span>{vouchers.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-white/40">ACTIVE NODES</span>
                       <span>{vouchers.filter(v => v.isActive).length}</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-[#C5A059]" 
                         style={{ width: `${(vouchers.filter(v => v.isActive).length / (vouchers.length || 1)) * 100}%` }} 
                       />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Add Voucher Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12">
               <div className="flex items-center justify-between mb-10">
                 <div>
                    <h2 className="font-display text-4xl font-black uppercase tracking-tighter">NEW_CAMPAIGN</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">PARAMETERIZE PROMOTIONAL SEQUENCE</p>
                 </div>
                 <button onClick={() => { setShowAddModal(false); setDateError(''); }} className="w-14 h-14 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 transition-all">
                    <X size={28} />
                 </button>
               </div>

               <form onSubmit={handleSave} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">CAMPAIGN_CODE</label>
                    <input 
                      required
                      type="text" 
                      value={newVoucher.code}
                      onChange={e => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase().replace(/\s/g, '')})}
                      className="w-full px-8 py-6 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-2xl tracking-tighter uppercase"
                      placeholder="e.g. Eid_Offer_20"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">DISCOUNT_LOGIC</label>
                       <div className="flex gap-2">
                          {[PromoType.PERCENTAGE, PromoType.FIXED].map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewVoucher({...newVoucher, type})}
                              className={cn(
                                "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                newVoucher.type === type ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100"
                              )}
                            >
                              {type === PromoType.PERCENTAGE ? '%' : 'AED'}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">YIELD_VALUE</label>
                       <input 
                         required
                         type="number" 
                         value={newVoucher.value}
                         onChange={e => setNewVoucher({...newVoucher, value: parseFloat(e.target.value)})}
                         className="w-full px-8 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-xl"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono flex items-center gap-2">
                          <DollarSign size={12} /> MIN_BASKET
                       </label>
                       <input 
                         type="number" 
                         value={newVoucher.minPurchase}
                         onChange={e => setNewVoucher({...newVoucher, minPurchase: parseFloat(e.target.value)})}
                         className="w-full px-8 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono flex items-center gap-2">
                          <Calendar size={12} /> EXPIRY_NODE
                       </label>
                       <input 
                         required
                         type="date" 
                         value={newVoucher.expiryDate}
                         onChange={e => {
                           setNewVoucher({...newVoucher, expiryDate: e.target.value});
                           setDateError('');
                         }}
                         className={cn(
                           "w-full px-8 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm",
                           dateError ? "ring-1 ring-red-500 bg-red-50" : ""
                         )}
                       />
                       {dateError && (
                         <p className="text-[9px] font-black uppercase text-red-500 tracking-tighter mt-1">{dateError}</p>
                       )}
                    </div>
                 </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono flex items-center gap-2">
                           <Clock size={12} /> USAGE_LIMIT
                        </label>
                        <input 
                          type="number" 
                          value={newVoucher.usageLimit || ''}
                          onChange={e => setNewVoucher({...newVoucher, usageLimit: parseInt(e.target.value) || undefined})}
                          className="w-full px-8 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                          placeholder="UNLIMITED"
                        />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">STATUS_LOGIC</label>
                        <button
                          type="button"
                          onClick={() => setNewVoucher({...newVoucher, isActive: !newVoucher.isActive})}
                          className={cn(
                            "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2",
                            newVoucher.isActive ? "bg-green-500 text-white border-green-500" : "bg-red-500 text-white border-red-500"
                          )}
                        >
                          {newVoucher.isActive ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                          {newVoucher.isActive ? 'ACTIVE_PROTOCOL' : 'SUSPENDED'}
                        </button>
                     </div>
                  </div>

                 <button 
                   type="submit"
                   className="w-full py-6 mt-6 bg-black text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-black/20"
                 >
                   {editingVoucher ? 'SYNCHRONIZE UPDATE PACKAGE' : 'AUTHORIZE CAMPAIGN DEPLOYMENT'}
                 </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

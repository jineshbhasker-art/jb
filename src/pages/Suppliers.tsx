/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  MoreVertical, 
  Edit2, 
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Supplier } from '../types';
import { CATEGORIES } from '../constants';

const MOCK_SUPPLIERS: Supplier[] = [
  { 
    id: '1', 
    name: 'Al-Futtaim Electronics', 
    contactPerson: 'Ahmed Hassan', 
    phone: '+971 4 123 4567', 
    email: 'info@alfuttaim.com', 
    emirate: 'Dubai', 
    categories: ['Smartphones', 'Tablets'], 
    createdAt: '2024-01-10' 
  },
  { 
    id: '2', 
    name: 'Sharaf DG Wholesale', 
    contactPerson: 'Sanjay Kumar', 
    phone: '+971 4 987 6543', 
    email: 'wholesale@sharafdg.com', 
    emirate: 'Dubai', 
    categories: ['Accessories'], 
    createdAt: '2024-02-15' 
  },
];

import { suppliersService } from '../lib/dbService';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [newSupplier, setNewSupplier] = React.useState<Partial<Supplier>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    emirate: 'Dubai',
    categories: [],
    trn: '',
    isActive: true
  });

  React.useEffect(() => {
    const unsubSuppliers = suppliersService.subscribe((data) => {
      setSuppliers(data);
      setLoading(false);
    });
    
    import('../lib/dbService').then(m => {
       m.businessProfileService.get().then(setProfile);
    });

    return () => unsubSuppliers();
  }, []);

  const handleAddNew = () => {
    setIsEditing(false);
    setNewSupplier({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      emirate: 'Dubai',
      categories: [],
      trn: '',
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setIsEditing(true);
    setNewSupplier({ ...supplier });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && newSupplier.id) {
        await suppliersService.update(newSupplier.id, newSupplier);
      } else {
        await suppliersService.add(newSupplier as Omit<Supplier, 'id'>);
      }
      setShowAddModal(false);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('IRREVERSIBLE: TERMINATE SUPPLIER RELATIONSHIP?')) {
      await suppliersService.delete(id);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.phone.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || s.categories.includes(selectedCategory);
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">SUPPLY NETWORK</h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
             System Node: {profile?.companyName || 'SCENTS & SOULS PERFUME LAB'} • VENDOR ARCHIVE
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-[#0F0F0F] text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all w-full md:w-auto shadow-[0_20px_40px_rgba(0,0,0,0.15)] group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus size={20} strokeWidth={3} />
          REGISTER VENDOR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2">
           <div className="advanced-3d-card p-10 bg-white border-l-4 border-[#C5A059] h-full flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">SUPPLY REACH</div>
                <div className="text-5xl font-black tracking-tighter">{suppliers.length} <span className="text-xl text-gray-300">ACTIVE SOURCES</span></div>
              </div>
              <div className="mt-8 flex gap-2">
                {CATEGORIES.slice(0, 3).map(cat => (
                  <span key={cat} className="text-[8px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-gray-400">{cat}</span>
                ))}
              </div>
           </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
           <div className="advanced-3d-card p-10 bg-[#0F0F0F] text-white h-full">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">TAX COMPLIANCE</div>
              <div className="text-4xl font-black tracking-tighter text-[#C5A059]">
                {suppliers.filter(s => s.trn).length} <span className="text-sm uppercase tracking-widest text-[#C5A059]/60 font-black">TRN SYNCED</span>
              </div>
              <div className="w-12 h-1 bg-[#C5A059] rounded-full mt-8" />
           </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
           <div className="advanced-3d-card p-10 bg-white border border-gray-100 h-full">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">GLOBAL RELIABILITY</div>
              <div className="text-4xl font-black tracking-tighter uppercase">98.4<span className="text-xl">%</span></div>
              <p className="mt-6 text-[10px] text-gray-400 font-black uppercase tracking-widest leading-relaxed">System performance based on lead times</p>
           </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col p-12"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight">{isEditing ? 'RECALIBRATE' : 'NEW SOURCE'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">VENDOR_ENTRY_PROTOCOL_X1</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="w-12 h-12 hover:bg-gray-50 rounded-2xl transition-all text-gray-300 hover:text-black flex items-center justify-center"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-8 overflow-y-auto max-h-[60vh] pr-4 no-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Universal Vendor Identity</label>
                  <input 
                    type="text" 
                    required
                    value={newSupplier.name}
                    onChange={e => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                    placeholder="e.g. APPLE DISTRIBUTION CENTER"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Liaison Name</label>
                    <input 
                      type="text" 
                      required
                      value={newSupplier.contactPerson}
                      onChange={e => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Comm Channel (Phone)</label>
                    <input 
                      type="tel" 
                      required
                      value={newSupplier.phone}
                      onChange={e => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm underline-offset-4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Protocol Email</label>
                    <input 
                      type="email" 
                      value={newSupplier.email}
                      onChange={e => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">TRN Identifier</label>
                    <input 
                      type="text" 
                      value={newSupplier.trn}
                      onChange={e => setNewSupplier(prev => ({ ...prev, trn: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm uppercase"
                      placeholder="100XXXXXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Supply Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => {
                      const isSelected = newSupplier.categories?.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setNewSupplier(prev => {
                              const cats = prev.categories || [];
                              if (cats.includes(cat)) {
                                return { ...prev, categories: cats.filter(c => c !== cat) };
                              }
                              return { ...prev, categories: [...cats, cat] };
                            });
                          }}
                          className={cn(
                            "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                            isSelected 
                              ? "bg-[#0F0F0F] text-white border-black" 
                              : "bg-white text-gray-300 border-gray-100 hover:border-gray-200"
                          )}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Jurisdiction</label>
                      <select 
                         value={newSupplier.emirate}
                         onChange={e => setNewSupplier(prev => ({ ...prev, emirate: e.target.value }))}
                         className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-[10px] uppercase tracking-widest"
                      >
                        {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain'].map(e => (
                          <option key={e} value={e}>{e.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                </div>

                <div className="pt-12 flex gap-6 sticky bottom-0 bg-white pb-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-5 border-2 border-gray-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-400"
                  >
                    ABORT
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 bg-[#0F0F0F] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-gray-800 transition-all shadow-2xl shadow-black/20"
                  >
                    <Save size={18} strokeWidth={3} />
                    {isEditing ? 'COMMIT MOD' : 'INITIALIZE REGISTRY'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="advanced-3d-card overflow-hidden bg-white">
        <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
            <input 
              type="text" 
              placeholder="FILTER VENDOR STREAMS (NAME, PHONE, TRN)..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 text-xs font-black uppercase tracking-tight bg-gray-50/50 border-transparent rounded-3xl shadow-inner focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-200"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 whitespace-nowrap">Filter Domain:</label>
            <select 
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] focus:ring-1 focus:ring-black outline-none transition-all cursor-pointer"
            >
              <option value="All">All Sectors</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ORGANIZATION SIGNATURE</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">CONTACT HUB</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">GEOGRAPHIC SECTOR</th>
                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform shadow-sm relative overflow-hidden">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-black flex items-center gap-3 uppercase tracking-tighter">
                          {s.name}
                          {s.trn && (
                            <span className="bg-[#C5A059]/10 text-[#C5A059] text-[8px] font-black uppercase px-2 py-1 rounded-full tracking-widest border border-[#C5A059]/20">
                              TAX_SYNCED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 flex flex-wrap gap-2 mt-2">
                          {s.categories.map(cat => (
                            <span key={cat} className="font-black uppercase tracking-widest text-[#C5A059]">{cat}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="space-y-1.5">
                      <div className="text-sm font-black tracking-tight">{s.contactPerson}</div>
                      <div className="text-[10px] text-gray-400 font-bold flex items-center gap-2">
                        <Phone size={10} className="text-[#C5A059]" /> {s.phone}
                      </div>
                      <div className="text-[9px] text-gray-300 font-bold group-hover:text-black transition-colors">{s.email}</div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                     <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-100 px-4 py-2 rounded-2xl w-fit shadow-sm">
                      <MapPin size={12} className="text-[#C5A059]" />
                      {s.emirate.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => handleEdit(s)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-xl transition-all shadow-sm">
                         <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && [1,2,3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={4} className="px-10 py-12 border-b border-gray-50 bg-gray-50/10" />
                </tr>
              ))}
              {!loading && filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-40 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-20">
                       <Building2 size={64} strokeWidth={1} />
                       <p className="font-black uppercase tracking-[0.5em] text-[10px]">No Verified Vendor Fragments Detected</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

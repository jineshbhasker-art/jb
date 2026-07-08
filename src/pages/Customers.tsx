/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Customer } from '../types';

const MOCK_CUSTOMERS: Customer[] = [
  { 
    id: '1', 
    name: 'Mohammed Al-Sheerawi', 
    phone: '+971 50 123 4567', 
    email: 'm.sheerawi@email.com', 
    emirate: 'Sharjah', 
    totalSpent: 12500, 
    lastPurchaseDate: '2024-03-20',
    createdAt: '2023-11-05' 
  },
  { 
    id: '2', 
    name: 'Sarah Khalil', 
    phone: '+971 52 987 6543', 
    email: 'sarah.k@email.com', 
    emirate: 'Dubai', 
    totalSpent: 4200, 
    lastPurchaseDate: '2024-03-15',
    createdAt: '2024-01-12' 
  },
  { 
    id: '3', 
    name: 'Vision Tech Trading', 
    phone: '+971 4 333 4444', 
    trn: '100234567800003',
    emirate: 'Dubai', 
    totalSpent: 85000, 
    lastPurchaseDate: '2024-03-22',
    createdAt: '2023-08-15' 
  },
];

import { customersService } from '../lib/dbService';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Customers() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    emirate: 'Dubai',
    trn: '',
    totalSpent: 0
  });
  
  React.useEffect(() => {
    const unsubscribe = customersService.subscribe((data) => {
      setCustomers(data);
      setLoading(false);
    });
    
    // Simple fetch for profile if needed
    import('../lib/dbService').then(m => {
       m.businessProfileService.get().then(setProfile);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setIsEditing(false);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      emirate: 'Dubai',
      trn: '',
      totalSpent: 0
    });
    setShowAddModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setIsEditing(true);
    setNewCustomer({ ...customer });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && newCustomer.id) {
        await customersService.update(newCustomer.id, newCustomer);
      } else {
        await customersService.add(newCustomer as Omit<Customer, 'id'>);
      }
      setShowAddModal(false);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this customer record?')) {
      await customersService.delete(id);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.trn && c.trn.includes(searchQuery))
  );

  const totalCustomers = customers.length;
  const avgLtv = customers.length > 0 ? customers.reduce((acc, c) => acc + c.totalSpent, 0) / customers.length : 0;
  const recentCustomersCount = customers.filter(c => {
     const date = new Date(c.createdAt);
     const monthAgo = new Date();
     monthAgo.setMonth(monthAgo.getMonth() - 1);
     return date > monthAgo;
  }).length;

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">CLIENT DATABASE</h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
             System Node: {profile?.companyName || 'SCENTS & SOULS PERFUME LAB'} • CRM HUB
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-[#0F0F0F] text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all w-full md:w-auto shadow-[0_20px_40px_rgba(0,0,0,0.15)] group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus size={20} strokeWidth={3} />
          REGISTER CLIENT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="advanced-3d-card p-10 bg-white border-l-4 border-black">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">NETWORK REACH</div>
            <div className="text-4xl font-black tracking-tighter">{totalCustomers}</div>
            <div className="mt-6 flex items-center gap-3 text-[10px] text-green-600 font-black uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full w-fit">
              <CheckCircle2 size={12} strokeWidth={3} />
              ACTIVE NODES
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="advanced-3d-card p-10 bg-white">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">NEW ACQUISITIONS</div>
            <div className="text-4xl font-black tracking-tighter">{recentCustomersCount}</div>
            <p className="mt-6 text-[10px] text-gray-400 font-black uppercase tracking-widest">30 Day Sync Window</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="advanced-3d-card p-10 bg-[#0F0F0F] text-white">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">AVG LIFETIME VALUE</div>
            <div className="text-4xl font-black tracking-tighter text-[#C5A059]">
              {formatCurrency(avgLtv)}
            </div>
            <div className="w-12 h-1 bg-[#C5A059] rounded-full mt-6" />
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
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col p-12"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl shadow-black/20">
                    <User size={28} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight">{isEditing ? 'MODIFY ENTITY' : 'CLIENT REGISTRY'}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">CONTACT_DATA_SYNC_PROTOCOL</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="w-12 h-12 hover:bg-gray-50 rounded-2xl transition-all text-gray-300 hover:text-black flex items-center justify-center"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Universal Client Name</label>
                  <input 
                    type="text" 
                    required
                    value={newCustomer.name}
                    onChange={e => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                    placeholder="e.g. MOHAMMED AHMED"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Terminal (Phone)</label>
                    <input 
                      type="tel" 
                      required
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">TRN identifier (optional)</label>
                    <input 
                      type="text" 
                      value={newCustomer.trn}
                      onChange={e => setNewCustomer(prev => ({ ...prev, trn: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm uppercase"
                      placeholder="100XXXXXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Access Email Address</label>
                  <input 
                    type="email" 
                    value={newCustomer.email}
                    onChange={e => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Geographic Domain</label>
                    <select 
                       value={newCustomer.emirate}
                       onChange={e => setNewCustomer(prev => ({ ...prev, emirate: e.target.value }))}
                       className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                      {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain'].map(e => (
                        <option key={e} value={e}>{e.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sector / Area</label>
                    <input 
                      type="text" 
                      value={newCustomer.address}
                      onChange={e => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="pt-10 flex gap-6">
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
        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center gap-8">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
            <input 
              type="text" 
              placeholder="FILTER CLIENT NODES (NAME, PHONE, TRN)..." 
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
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ENTITY IDENTIFIER</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">COMMUNICATION NODES</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">LIFETIME SEQUENCE</th>
                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 font-black text-xl group-hover:scale-110 transition-transform shadow-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black flex items-center gap-3 uppercase tracking-tighter">
                          {c.name}
                          {c.trn && <span className="bg-[#C5A059]/10 text-[#C5A059] text-[8px] font-black uppercase px-2 py-1 rounded-full tracking-widest border border-[#C5A059]/20">TAX_ENABLED</span>}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-2 font-bold tracking-widest">
                          <MapPin size={10} className="text-[#C5A059]" /> {c.emirate.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-sm font-black tracking-tight underline decoration-gray-100 underline-offset-4">{c.phone}</div>
                       <div className="text-[10px] text-gray-400 font-bold tracking-[0.1em]">{c.email || 'SYSTEM_MAIL_NOT_LINKED'}</div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="text-xl font-black font-display tracking-tighter">
                       {formatCurrency(c.totalSpent)}
                    </div>
                    <div className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-2">Registry Origin: {new Date(c.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-10 py-10">
                     <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleEdit(c)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-xl transition-all shadow-sm"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
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
              {!loading && filteredCustomers.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-10 py-40 text-center">
                     <div className="flex flex-col items-center gap-6 opacity-20">
                        <User size={64} strokeWidth={1} />
                        <p className="font-black uppercase tracking-[0.5em] text-[10px]">No Neural Client Signatures Detected</p>
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

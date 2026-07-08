/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Filter, Receipt, Trash2, Calendar, X, FolderPlus } from 'lucide-react';
import { expensesService, expenseCategoriesService } from '../lib/dbService';
import { Expense, ExpenseCategory } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export default function Expenses() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [categories, setCategories] = React.useState<ExpenseCategory[]>([]);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [newCategoryName, setNewCategoryName] = React.useState('');
  
  const [newExpense, setNewExpense] = React.useState<Partial<Expense>>({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash'
  });

  React.useEffect(() => {
    const unsubExpenses = expensesService.subscribe(setExpenses);
    const unsubCategories = expenseCategoriesService.subscribe(async (data) => {
      if (data.length === 0) {
        // Seed default categories
        const defaults = ['Rent', 'Utilities', 'Salaries', 'Others'];
        for (const cat of defaults) {
          await expenseCategoriesService.add({ name: cat, createdAt: new Date().toISOString() });
        }
      } else {
        setCategories(data);
      }
    });

    return () => {
      unsubExpenses();
      unsubCategories();
    };
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    await expenseCategoriesService.add({
      name: newCategoryName.trim(),
      createdAt: new Date().toISOString()
    });
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category? Expenses linked to it will remain but without category reference.')) {
      await expenseCategoriesService.delete(id);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.category || !newExpense.amount) return;
    
    await expensesService.add(newExpense as Omit<Expense, 'id'>);
    setIsAddOpen(false);
    setNewExpense({
      category: '',
      amount: 0,
      vatAmount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash'
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense?')) {
      await expensesService.delete(id);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-display tracking-tight">EXPENSES</h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Operating Costs & Outflow</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-[#0F0F0F] text-white rounded-[1.5rem] font-bold text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          RECORD EXPENSE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="advanced-3d-card p-8 bg-black text-white"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Receipt className="text-white" size={24} />
            </div>
            <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Monthly Total</span>
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-black font-display tracking-tight underline decoration-white/20 underline-offset-8">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-4">Calculated from {filteredExpenses.length} entries</p>
          </div>
        </motion.div>

        <div className="md:col-span-2 advanced-3d-card p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-1.5 h-6 bg-black rounded-full" />
             <h3 className="font-display text-xl font-bold">Expense Calibration</h3>
          </div>
          <div className="flex gap-4">
             {categories.slice(0, 4).map((cat) => (
                <div key={cat.id} className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <p className="text-[10px] text-gray-400 uppercase font-black">{cat.name}</p>
                   <p className="text-lg font-bold">
                     {formatCurrency(expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0))}
                   </p>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div className="advanced-3d-card overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter expenses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-transparent rounded-[1.5rem] text-sm focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-300 font-bold"
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="p-4 hover:bg-gray-50 rounded-2xl text-gray-400 transition-colors border border-gray-50">
                <Filter size={18} />
             </button>
             <div className="w-[1px] h-8 bg-gray-100 mx-2" />
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{filteredExpenses.length} ENTRIES</span>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Date & Category</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Description</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Method</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Amount</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.map((expense) => (
                <motion.tr 
                  key={expense.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <Calendar size={18} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{expense.category}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-gray-600">{expense.description || 'No description'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {expense.paymentMethod}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="font-black text-lg">{formatCurrency(expense.amount)}</p>
                    {expense.vatAmount ? (
                       <p className="text-[8px] text-green-500 font-bold uppercase tracking-widest mt-0.5">
                          VAT Recoverable: {formatCurrency(expense.vatAmount)}
                       </p>
                    ) : (
                       <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-0.5">
                          No VAT registered
                       </p>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => expense.id && handleDelete(expense.id)}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                       <Receipt size={48} strokeWidth={1} />
                       <p className="font-black uppercase tracking-[0.3em] text-[10px]">No expenses recorded</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Drawer */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white shadow-2xl p-12 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-black font-display tracking-tight">NEW RECORD</h2>
                  <p className="text-[10px] text-[#C5A059] font-black uppercase tracking-[0.2em]">Add Operational Expense</p>
                </div>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gross Amount (AED)</label>
                          <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">Incl. VAT</span>
                       </div>
                      <input 
                        type="number" 
                        required
                        step="0.01"
                        value={newExpense.amount || ''}
                        onChange={(e) => {
                           const val = Number(e.target.value);
                           setNewExpense({ ...newExpense, amount: val });
                        }}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">VAT Amount (5%)</label>
                          <button 
                            type="button"
                            onClick={() => {
                               if (newExpense.amount) {
                                  // In UAE, typically expenses are quoted gross. 
                                  // Taxable = Gross / 1.05. VAT = Gross - Taxable.
                                  const gross = newExpense.amount;
                                  const taxable = gross / 1.05;
                                  const vat = gross - taxable;
                                  setNewExpense({ ...newExpense, vatAmount: Number(vat.toFixed(2)) });
                               }
                            }}
                            className="text-[8px] text-black font-black uppercase tracking-widest hover:underline"
                          >
                             CALC INPUT TAX
                          </button>
                       </div>
                      <input 
                        type="number" 
                        step="0.01"
                        value={newExpense.vatAmount || ''}
                        onChange={(e) => setNewExpense({ ...newExpense, vatAmount: Number(e.target.value) })}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Transaction date</label>
                    <input 
                      type="date" 
                      required
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                      <button 
                        type="button" 
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <Plus size={10} strokeWidth={3} /> Add New
                      </button>
                    </div>
                    <select 
                      required
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                    <textarea 
                      rows={4}
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold resize-none"
                      placeholder="Enter details..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Cash', 'Card', 'Bank', 'Cheque'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setNewExpense({ ...newExpense, paymentMethod: method })}
                          className={cn(
                            "py-4 rounded-xl border font-bold text-xs transition-all",
                            newExpense.paymentMethod === method
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-400 border-gray-100 hover:border-black"
                          )}
                        >
                          {method.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-[#0F0F0F] text-white rounded-[1.5rem] font-black tracking-[0.2em] text-xs hover:bg-gray-800 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.15)] active:scale-[0.98]"
                >
                  COMMIT RECORD
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsCategoryModalOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black font-display tracking-tight uppercase">MANAGE_CATEGORIES</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Configure Expense Nodes</p>
                </div>
                <button 
                  onClick={() => setIsCategoryModalOpen(false)} 
                  className="w-10 h-10 hover:bg-gray-50 rounded-xl flex items-center justify-center text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">New Category Name</label>
                  <input 
                    required
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold"
                    placeholder="e.g. Travel, Licensing..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl active:scale-95"
                >
                  Initialize Category
                </button>
              </form>

              <div className="mt-12 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 border-b border-gray-50 pb-2">Registered Nodes</p>
                <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group">
                      <span className="text-xs font-bold uppercase tracking-tight">{cat.name}</span>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

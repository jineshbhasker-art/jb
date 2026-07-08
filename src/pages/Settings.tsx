/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Save, 
  Upload, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Tag,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Shield,
  Database,
  Monitor,
  Bell,
  Printer,
  CreditCard,
  Languages,
  DollarSign,
  Clock,
  UserPlus,
  Users,
  Key,
  ShieldCheck,
  UserX,
  Trash2,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  businessProfileService, 
  salesService, 
  purchasesService, 
  productsService, 
  vouchersService, 
  customersService, 
  suppliersService,
  usersService,
  AppUser,
  concentrationAlertRulesService,
  exportDatabaseJSON,
  restoreDatabaseJSON,
  purgeAllDatabase
} from '../lib/dbService';
import { cn, generateBarcode } from '../lib/utils';
import { BusinessProfile, ProductType, Product, ConcentrationAlertRule } from '../types';
import { PrintTemplates } from '../components/PrintTemplates';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../AuthContext';
import { Fingerprint } from 'lucide-react';
import { 
  isBiometricSupported, 
  enrollBiometric, 
  isUserEnrolled, 
  deEnrollUser 
} from '../lib/webAuthn';

function BiometricSecuritySection() {
  const { user } = useAuth();
  const [supported, setSupported] = React.useState(false);
  const [enrolled, setEnrolled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  React.useEffect(() => {
    setSupported(isBiometricSupported());
    if (user && user.username) {
      setEnrolled(isUserEnrolled(user.username));
    }
  }, [user]);

  if (!user) return null;

  const handleEnroll = async () => {
    if (!user.username) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await enrollBiometric(user.username, user.name);
      if (res.success) {
        setEnrolled(true);
        setFeedback({
          type: 'success',
          message: 'BIOMETRIC SIGNATURE ACQUIRED: This device is now linked to your secure profile.'
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to register biometric credentials.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'An unexpected error occurred.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeEnroll = () => {
    if (!user.username) return;
    if (confirm('RESCIND BIOMETRIC PROFILE? You will need to enter your passphrase on next login.')) {
      deEnrollUser(user.username);
      setEnrolled(false);
      setFeedback({
        type: 'info',
        message: 'BIOMETRIC SIGNATURE CLEARED: Device credential has been deleted locally.'
      });
    }
  };

  return (
    <section className="advanced-3d-card p-12 bg-white space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 bg-[#C5A059] rounded-full animate-pulse" />
          <h2 className="text-xl font-black uppercase tracking-tight">Biometric Node Enrollment</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-gray-300 font-mono">SECURE_ENCLAVE_v1</span>
        </div>
      </div>

      <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#C5A059]/5 rounded-full blur-2xl" />
        <div className="flex items-start gap-6 relative z-10">
          <div className="p-6 bg-white rounded-3xl shadow-md text-[#C5A059] group-hover:scale-105 transition-transform shrink-0">
            <Fingerprint size={36} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-tight text-sm">Secure Biometric Login</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed max-w-xl">
              Enable instant, cryptographic, passwordless logins using your physical device's biometric sensors (Touch ID, Face ID, Windows Hello, or Android Biometric). Your private biometric key remains safely within your hardware's secure enclave and is never transmitted over the network.
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <span className={cn(
                "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                supported 
                  ? "bg-green-50 text-green-500 border-green-100" 
                  : "bg-red-50 text-red-500 border-red-100"
              )}>
                DEVICE SUPPORTED: {supported ? 'TRUE' : 'FALSE'}
              </span>
              <span className={cn(
                "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                enrolled 
                  ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20" 
                  : "bg-gray-100 text-gray-400 border-transparent"
              )}>
                ENROLLMENT: {enrolled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {supported ? (
          <div className="shrink-0 relative z-10">
            {enrolled ? (
              <button
                type="button"
                onClick={handleDeEnroll}
                className="px-8 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-red-200"
              >
                RESCIND CREDENTIAL
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleEnroll}
                className="px-8 py-5 bg-black hover:bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
              >
                {loading ? 'ENROLLING...' : 'ENROLL THIS DEVICE'}
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-[200px] shrink-0 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-[8px] font-bold uppercase text-amber-600 leading-normal">
            WebAuthn requires HTTPS/localhost. If you are inside an iframe preview, open this app in a new tab to enable biometrics.
          </div>
        )}
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-[2rem] border flex items-center gap-4",
            feedback.type === 'success' ? "bg-green-50 border-green-100 text-green-600" :
            feedback.type === 'error' ? "bg-red-50 border-red-100 text-red-600" :
            "bg-blue-50 border-blue-100 text-blue-600"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-black",
            feedback.type === 'success' ? "bg-green-500" :
            feedback.type === 'error' ? "bg-red-500" : "bg-blue-500"
          )}>
            !
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider">{feedback.message}</p>
        </motion.div>
      )}
    </section>
  );
}

function UserManagementSection() {
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newUser, setNewUser] = React.useState({
    name: '',
    username: '',
    password: '',
    role: 'Staff'
  });

  const fetchUsers = async () => {
    const data = await usersService.getAll();
    setUsers(data);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await usersService.add({
      ...newUser,
      isActive: true,
      createdAt: new Date().toISOString()
    } as any);
    setShowAddModal(false);
    setNewUser({ name: '', username: '', password: '', role: 'Staff' });
    fetchUsers();
  };

  const toggleUserStatus = async (user: AppUser) => {
    await usersService.update(user.id, { isActive: !user.isActive });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('TERMINATE USER NODE? This action is irreversible.')) return;
    await usersService.delete(id);
    fetchUsers();
  };

  return (
    <section className="advanced-3d-card p-12 bg-white space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 bg-black rounded-full" />
          <h2 className="text-xl font-black uppercase tracking-tight">User Security Registry</h2>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          type="button"
          className="px-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          <UserPlus size={16} /> Deploy New Agent
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-50 rounded-3xl" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
             <Users size={48} className="mx-auto text-gray-200 mb-6" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NO EXTERNAL AGENTS REGISTERED</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map(user => (
              <div key={user.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg transition-transform group-hover:scale-110",
                    user.isActive ? "bg-black shadow-black/10" : "bg-gray-200"
                  )}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-black uppercase tracking-tight text-sm">{user.name}</h4>
                      <span className="px-3 py-1 bg-white rounded-full text-[8px] font-black uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/10">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1 uppercase">@{user.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <button 
                     type="button"
                     onClick={() => toggleUserStatus(user)}
                     className={cn(
                       "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                       user.isActive ? "bg-green-50 text-green-500 hover:bg-green-100" : "bg-gray-200 text-gray-400"
                     )}
                     title={user.isActive ? "Deactivate" : "Activate"}
                   >
                     <ShieldCheck size={18} />
                   </button>
                   <button 
                     type="button"
                     onClick={() => deleteUser(user.id)}
                     className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 text-black">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12">
               <div className="flex items-center justify-between mb-10">
                 <div>
                    <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-black">AGENT_ENROLLMENT</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">INITIALIZE NEW SECURITY IDENTITY</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="w-12 h-12 hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 transition-all">
                    <X size={24} />
                 </button>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">Agent Name</label>
                    <input 
                      required
                      type="text" 
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                      className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black uppercase text-xs text-black"
                      placeholder="e.g. MOE TAHIR"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">Username</label>
                       <input 
                         required
                         type="text" 
                         value={newUser.username}
                         onChange={e => setNewUser({...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                         className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs text-black"
                         placeholder="moe.staff"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono">Role Access</label>
                       <select 
                         value={newUser.role}
                         onChange={e => setNewUser({...newUser, role: e.target.value})}
                         className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black uppercase text-xs text-black"
                       >
                         <option value="Staff">STAFF AGENT</option>
                         <option value="Manager">LEVEL 2 MANAGER</option>
                         <option value="Technician">SR. TECHNICIAN</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-mono flex items-center gap-2">
                       <Key size={12} /> Access Passphrase
                    </label>
                    <input 
                      required
                      type="password" 
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs text-black"
                      placeholder="••••••••"
                    />
                 </div>

                 <button 
                   type="button"
                   onClick={handleAddUser}
                   className="w-full py-6 mt-8 bg-black text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-black/20"
                 >
                   AUTHORIZE DEPLOYMENT
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = React.useState<'business' | 'pos' | 'localization' | 'data' | 'alerts' | 'print'>('business');
  const [profile, setProfile] = React.useState<Partial<BusinessProfile>>({
    companyName: '',
    trn: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    termsAndConditions: '',
    footerNote: '',
    logoBase64: '',
    promoPrefix: 'https://alqusaidatmobiles.com/promo/',
    selectedA4Template: 'corporate',
    selectedThermalTemplate: 'standard',
    primaryColor: '#000000',
    accentColor: '#C5A059',
    showLogo: true,
    showSignatureLine: true,
    showVatSummary: true,
    thermalWidth: 80,
    fontFamily: 'sans',
    autoSaveBackup: false,
    autoSaveIntervalMinutes: 30
  });
  
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [alertRules, setAlertRules] = React.useState<ConcentrationAlertRule[]>([]);

  React.useEffect(() => {
    const unsub = concentrationAlertRulesService.subscribe((rules) => {
      if (rules && rules.length > 0) {
        setAlertRules(rules);
      } else {
        const initialRules: ConcentrationAlertRule[] = [
          { id: 'rule-edp', concentration: 'Eau de Parfum (EDP) (15-20%)', minStockThreshold: 15, isActive: true },
          { id: 'rule-parfum', concentration: 'Parfum (20-30%)', minStockThreshold: 10, isActive: true },
          { id: 'rule-extrait', concentration: 'Extrait de Parfum (20-40%)', minStockThreshold: 10, isActive: true },
          { id: 'rule-oil', concentration: 'Concentrated Perfume Oil (Attar)', minStockThreshold: 20, isActive: true },
          { id: 'rule-edt', concentration: 'Eau de Toilette (EDT) (5-15%)', minStockThreshold: 12, isActive: true }
        ];
        setAlertRules(initialRules);
      }
    });
    return () => unsub();
  }, []);

  // System Settings state (local for now)
  const [systemSettings, setSystemSettings] = React.useState({
    currency: 'AED',
    dateFormat: 'DD/MM/YYYY',
    taxRate: 5,
    autoPrintReceipt: true,
    lowStockThreshold: 5,
    language: 'English',
    theme: 'Light'
  });

  const [seeding, setSeeding] = React.useState(false);

  const handleSeedPremiumData = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      const existingProducts = await productsService.getAll() || [];
      const existingSKUs = new Set(existingProducts.map(p => p.sku));

      const premiumScentLibrary = [
        // CREED
        {
          name: 'Aventus',
          sku: 'CRD-AVN-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Creed',
          costPrice: 950,
          sellingPrice: 1450,
          stockQuantity: 25,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Citrus & Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Pineapple, Bergamot, Blackcurrant, Apple',
          middleNotes: 'Birch, Patchouli, Moroccan Jasmine, Rose',
          baseNotes: 'Musk, Oakmoss, Ambergris, Vanilla'
        },
        {
          name: 'Green Irish Tweed',
          sku: 'CRD-GIT-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Creed',
          costPrice: 850,
          sellingPrice: 1250,
          stockQuantity: 15,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Fougère & Fresh',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Lemon Verbena, Iris',
          middleNotes: 'Violet Leaves',
          baseNotes: 'Ambergris, Sandalwood'
        },
        {
          name: 'Silver Mountain Water',
          sku: 'CRD-SMW-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Creed',
          costPrice: 880,
          sellingPrice: 1300,
          stockQuantity: 12,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Marine & Citrus',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Bergamot, Mandarin Orange',
          middleNotes: 'Green Tea, Blackcurrant',
          baseNotes: 'Musk, Sandalwood, Galbanum'
        },
        {
          name: 'Millesime Imperial',
          sku: 'CRD-MIL-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Creed',
          costPrice: 900,
          sellingPrice: 1350,
          stockQuantity: 10,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Citrus Marine',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Fruity Notes, Sea Salt',
          middleNotes: 'Sicilian Lemon, Bergamot, Iris, Mandarin Orange',
          baseNotes: 'Sea Notes, Musk, Woody Notes'
        },
        {
          name: 'Original Santal',
          sku: 'CRD-OS-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Creed',
          costPrice: 920,
          sellingPrice: 1380,
          stockQuantity: 8,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Oriental Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Sandalwood, Cinnamon, Coriander, Juniper Berry',
          middleNotes: 'Ginger, Lavender, Rosemary, Orange Blossom',
          baseNotes: 'Vanilla, Tonka Bean'
        },

        // MAISON FRANCIS KURKDJIAN (MFK)
        {
          name: 'Baccarat Rouge 540',
          sku: 'MFK-BR540-70',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Maison Francis Kurkdjian',
          costPrice: 920,
          sellingPrice: 1400,
          stockQuantity: 30,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Floral',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Saffron, Jasmine',
          middleNotes: 'Amberwood, Ambergris',
          baseNotes: 'Fir Resin, Cedar'
        },
        {
          name: 'Baccarat Rouge 540 Extrait',
          sku: 'MFK-BR540E-70',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Maison Francis Kurkdjian',
          costPrice: 1200,
          sellingPrice: 1850,
          stockQuantity: 15,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Woody',
          concentration: 'Extrait de Parfum (25-40%)',
          topNotes: 'Bitter Almond, Saffron',
          middleNotes: 'Egyptian Jasmine, Cedar',
          baseNotes: 'Ambergris, Woody Notes, Musk'
        },
        {
          name: 'Grand Soir',
          sku: 'MFK-GRS-70',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Maison Francis Kurkdjian',
          costPrice: 680,
          sellingPrice: 980,
          stockQuantity: 20,
          minStockLevel: 4,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Spanish Labdanum',
          middleNotes: 'Siam Benzoin, Tonka Bean',
          baseNotes: 'Amber, Vanilla'
        },
        {
          name: 'Oud Satin Mood',
          sku: 'MFK-OSM-70',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Maison Francis Kurkdjian',
          costPrice: 950,
          sellingPrice: 1450,
          stockQuantity: 14,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Bulgarian Rose, Blue Chamomile',
          middleNotes: 'Turkish Rose, Oud Wood, Violet',
          baseNotes: 'Bourbon Vanilla, Amber'
        },
        {
          name: 'Gentle Fluidity Gold',
          sku: 'MFK-GFG-70',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Maison Francis Kurkdjian',
          costPrice: 680,
          sellingPrice: 995,
          stockQuantity: 16,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Vanilla',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Juniper Berries, Coriander',
          middleNotes: 'Nutmeg, Rose',
          baseNotes: 'Amber, Vanilla, Woodsy Notes, Musk'
        },

        // AMOUAGE
        {
          name: 'Reflection Man',
          sku: 'AMG-REF-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Amouage',
          costPrice: 820,
          sellingPrice: 1200,
          stockQuantity: 18,
          minStockLevel: 4,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Floral Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Rosemary, Red Pepper Berries, Bitter Orange Leaves',
          middleNotes: 'Neroli, Orris, Jasmine, Ylang-Ylang',
          baseNotes: 'Vetiver, Patchouli, Sandalwood, Cedarwood'
        },
        {
          name: 'Interlude Man',
          sku: 'AMG-INT-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Amouage',
          costPrice: 890,
          sellingPrice: 1350,
          stockQuantity: 10,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Bergamot, Oregano, Pimento Berry Oil',
          middleNotes: 'Amber, Frankincense, Cistus, Opoponax',
          baseNotes: 'Leather, Agarwood Smoke, Patchouli, Sandalwood'
        },
        {
          name: 'Jubilation XXV Man',
          sku: 'AMG-JUB-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Amouage',
          costPrice: 910,
          sellingPrice: 1400,
          stockQuantity: 8,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Fougère',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Blackberry, Frankincense, Coriander, Orange, Labdanum',
          middleNotes: 'Honey, Bay Leaf, Cinnamon, Orchid',
          baseNotes: 'Oud, Myrrh, Patchouli, Ambergris, Immortelle'
        },
        {
          name: 'Beach Hut Man',
          sku: 'AMG-BHM-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Amouage',
          costPrice: 850,
          sellingPrice: 1280,
          stockQuantity: 11,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Green Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Mint, Galbanum, Orange Blossom',
          middleNotes: 'Vetiver, Ivy, Moss',
          baseNotes: 'Patchouli, Myrrh, Woody Notes'
        },
        {
          name: 'Guidance',
          sku: 'AMG-GDC-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Amouage',
          costPrice: 950,
          sellingPrice: 1450,
          stockQuantity: 15,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Floral Amber',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Pear, Frankincense, Hazelnut',
          middleNotes: 'Saffron, Rose, Jasmine Sambac, Osmanthus',
          baseNotes: 'Cistus, Sandalwood, Akigalawood, Ambergris, Vanilla'
        },

        // ROJA PARFUMS
        {
          name: 'Elysium Pour Homme',
          sku: 'ROJ-ELY-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Roja Parfums',
          costPrice: 780,
          sellingPrice: 1200,
          stockQuantity: 12,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Fougère & Fresh',
          concentration: 'Parfum Cologne (15-20%)',
          topNotes: 'Grapefruit, Lemon, Bergamot, Lime, Thyme',
          middleNotes: 'Vetiver, Juniper Berries, Blackcurrant, Apple, Jasmine',
          baseNotes: 'Ambergris, Leather, Vanilla, Benzoin, Labdanum'
        },
        {
          name: 'Enigma Pour Homme',
          sku: 'ROJ-ENG-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Roja Parfums',
          costPrice: 850,
          sellingPrice: 1350,
          stockQuantity: 6,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Spicy',
          concentration: 'Parfum (20-30%)',
          topNotes: 'Bergamot, Heliotrope, Jasmine',
          middleNotes: 'Rose, Neroli, Geranium',
          baseNotes: 'Cognac, Vanilla, Tobacco, Benzoin, Ambergris, Ginger'
        },
        {
          name: 'Apex',
          sku: 'ROJ-APX-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Roja Parfums',
          costPrice: 800,
          sellingPrice: 1250,
          stockQuantity: 9,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Leather Woody',
          concentration: 'Parfum Cologne (15-20%)',
          topNotes: 'Orange, Bergamot, Mandarin, Lemon',
          middleNotes: 'Jasmine, Cistus, Pineapple',
          baseNotes: 'Leather, Cypress, Patchouli, Oakmoss, Fir Balsam, Sandalwood'
        },

        // TOM FORD
        {
          name: 'Tobacco Vanille',
          sku: 'TFD-TBV-50',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Tom Ford',
          costPrice: 750,
          sellingPrice: 1150,
          stockQuantity: 15,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Warm & Sweet',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Tobacco Leaf, Spicy Notes',
          middleNotes: 'Vanilla, Cacao, Tonka Bean, Tobacco Blossom',
          baseNotes: 'Dried Fruits, Woody Notes'
        },
        {
          name: 'Oud Wood',
          sku: 'TFD-ODW-50',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Tom Ford',
          costPrice: 750,
          sellingPrice: 1150,
          stockQuantity: 18,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Woody',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Rosewood, Cardamom, Chinese Pepper',
          middleNotes: 'Oud, Sandalwood, Vetiver',
          baseNotes: 'Tonka Bean, Vanilla, Amber'
        },
        {
          name: 'Lost Cherry',
          sku: 'TFD-LCH-50',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'French Florals',
          brand: 'Tom Ford',
          costPrice: 800,
          sellingPrice: 1250,
          stockQuantity: 12,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Floral Gourmand',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Black Cherry, Cherry Liqueur, Bitter Almond',
          middleNotes: 'Griotte Syrup, Turkish Rose, Jasmine Sambac',
          baseNotes: 'Peru Balsam, Roasted Tonka Bean, Sandalwood, Vetiver, Cedarwood'
        },
        {
          name: 'Tuscan Leather',
          sku: 'TFD-TL-50',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Tom Ford',
          costPrice: 750,
          sellingPrice: 1150,
          stockQuantity: 10,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Leather',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Raspberry, Saffron, Thyme',
          middleNotes: 'Olibanum, Jasmine',
          baseNotes: 'Leather, Suede, Woody Notes, Amber'
        },
        {
          name: 'Noir Extreme',
          sku: 'TFD-NX-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Tom Ford',
          costPrice: 480,
          sellingPrice: 720,
          stockQuantity: 22,
          minStockLevel: 4,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Woody Spicy',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Cardamom, Nutmeg, Saffron, Mandarin Orange, Neroli',
          middleNotes: 'Kulfi, Rose, Mastich, Orange Blossom, Jasmine',
          baseNotes: 'Vanilla, Amber, Woody Notes, Sandalwood'
        },

        // LATTAFA
        {
          name: 'Khamrah',
          sku: 'LTF-KHM-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Lattafa',
          costPrice: 80,
          sellingPrice: 180,
          stockQuantity: 150,
          minStockLevel: 15,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Sweet Amber',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Cognac, Cinnamon, Tonka Bean',
          middleNotes: 'Oak, Praline, Dates',
          baseNotes: 'Vanilla, Sandalwood'
        },
        {
          name: 'Asad',
          sku: 'LTF-ASD-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Lattafa',
          costPrice: 70,
          sellingPrice: 150,
          stockQuantity: 120,
          minStockLevel: 10,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Warm Spicy',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Black Pepper, Pineapple, Tobacco',
          middleNotes: 'Coffee, Patchouli, Iris',
          baseNotes: 'Amber, Vanilla, Dry Wood, Benzoin'
        },
        {
          name: 'Bade\'e Al Oud (Oud for Glory)',
          sku: 'LTF-OFG-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Lattafa',
          costPrice: 90,
          sellingPrice: 195,
          stockQuantity: 80,
          minStockLevel: 8,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Oud Spicy',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Saffron, Nutmeg, Lavender',
          middleNotes: 'Agarwood (Oud), Patchouli',
          baseNotes: 'Agarwood (Oud), Patchouli, Musk'
        },
        {
          name: 'Yara',
          sku: 'LTF-YRA-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Lattafa',
          costPrice: 75,
          sellingPrice: 165,
          stockQuantity: 110,
          minStockLevel: 10,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Sweet Floral Gourmand',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Heliotrope, Orchid, Tangerine',
          middleNotes: 'Gourmand Accord, Tropical Fruits',
          baseNotes: 'Vanilla, Sandalwood, Musk'
        },

        // SWISS ARABIAN
        {
          name: 'Shaghaf Oud',
          sku: 'SWA-SGF-75',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Swiss Arabian',
          costPrice: 90,
          sellingPrice: 220,
          stockQuantity: 80,
          minStockLevel: 8,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Oud & Amber',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Saffron, Oud',
          middleNotes: 'Rose, Praline',
          baseNotes: 'Agarwood, Vanilla'
        },
        {
          name: 'Casablanca',
          sku: 'SWA-CSB-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Swiss Arabian',
          costPrice: 110,
          sellingPrice: 250,
          stockQuantity: 60,
          minStockLevel: 6,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Sweet Amber',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Apple, Grapes',
          middleNotes: 'Patchouli, Iris',
          baseNotes: 'Amber, Caramel, Suede, Liquid Musk'
        },
        {
          name: 'Layali',
          sku: 'SWA-LYL-50',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'French Florals',
          brand: 'Swiss Arabian',
          costPrice: 85,
          sellingPrice: 185,
          stockQuantity: 45,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Fruity Floral',
          concentration: 'Concentrated Perfume Oil',
          topNotes: 'Cherry, Blackcurrant, Orange Blossom',
          middleNotes: 'Ylang-Ylang, Rose, Jasmine',
          baseNotes: 'Agarwood, Amber'
        },

        // RASASI
        {
          name: 'Hawas for Him',
          sku: 'RSS-HWS-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Rasasi',
          costPrice: 120,
          sellingPrice: 260,
          stockQuantity: 90,
          minStockLevel: 10,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Fresh Aquatic',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Apple, Grapefruit, Bergamot, Cinnamon',
          middleNotes: 'Watery Notes, Plum, Orange Blossom, Cardamom',
          baseNotes: 'Ambergris, Musk, Driftwood, Patchouli'
        },
        {
          name: 'Hawas for Her',
          sku: 'RSS-HWH-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Rasasi',
          costPrice: 125,
          sellingPrice: 275,
          stockQuantity: 55,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Fruity Floral Gourmet',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Apple, Grapefruit, Pomegranate',
          middleNotes: 'Jasmine Sambac, Iris, Citrus',
          baseNotes: 'Patchouli, Vetiver, Praline'
        },
        {
          name: 'La Yuqawam Pour Homme',
          sku: 'RSS-LYQ-75',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Rasasi',
          costPrice: 190,
          sellingPrice: 380,
          stockQuantity: 40,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Leather',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Raspberry, Saffron, Thyme',
          middleNotes: 'Olibanum, Jasmine',
          baseNotes: 'Leather, Suede, Amber, Woody Notes'
        },
        {
          name: 'Dareej Pour Homme',
          sku: 'RSS-DRJ-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Rasasi',
          costPrice: 95,
          sellingPrice: 195,
          stockQuantity: 75,
          minStockLevel: 6,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Oriental Spicy',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Cardamom, Mugwort, Cumin',
          middleNotes: 'Rose, Orris',
          baseNotes: 'Sandalwood, Patchouli, Amber, Musk, Vanilla, Tonka Bean'
        },

        // ARABIAN OUD
        {
          name: 'Kalemat',
          sku: 'ARO-KLM-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Arabian Oud',
          costPrice: 240,
          sellingPrice: 450,
          stockQuantity: 35,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Sweet Oriental',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Blueberry, Anise',
          middleNotes: 'Rosemary, Cashmere Wood, Floral Notes',
          baseNotes: 'Amber, Honey, Musk'
        },
        {
          name: 'Resala',
          sku: 'ARO-RSL-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Arabian Oud',
          costPrice: 320,
          sellingPrice: 590,
          stockQuantity: 20,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Oud Woody Rose',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Saffron',
          middleNotes: 'Rose, Vanilla',
          baseNotes: 'Oud (Agarwood), Chocolate'
        },
        {
          name: 'Madawi',
          sku: 'ARO-MDW-90',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Musk & Amber',
          brand: 'Arabian Oud',
          costPrice: 300,
          sellingPrice: 550,
          stockQuantity: 25,
          minStockLevel: 4,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Fruity Musk',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Peach, Apple Blossom',
          middleNotes: 'Pineapple Blossom',
          baseNotes: 'Wild Rose, Musk, Patchouli'
        },

        // PARFUMS DE MARLY (PDM)
        {
          name: 'Layton',
          sku: 'PDM-LYT-125',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Parfums de Marly',
          costPrice: 650,
          sellingPrice: 990,
          stockQuantity: 18,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Floral Spicy',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Apple, Lavender, Bergamot, Mandarin Orange',
          middleNotes: 'Geranium, Violet, Jasmine',
          baseNotes: 'Vanilla, Cardamom, Sandalwood, Guaiac Wood, Patchouli'
        },
        {
          name: 'Herod',
          sku: 'PDM-HRD-125',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Parfums de Marly',
          costPrice: 650,
          sellingPrice: 990,
          stockQuantity: 14,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Woody Spicy Tobacco',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Cinnamon, Pepper Wood',
          middleNotes: 'Tobacco Leaf, Incense, Osmanthus, Labdanum',
          baseNotes: 'Vanilla, Iso E Super, Musk, Cedarwood, Cypriol Oil, Vetiver'
        },
        {
          name: 'Percival',
          sku: 'PDM-PRC-125',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Parfums de Marly',
          costPrice: 620,
          sellingPrice: 950,
          stockQuantity: 15,
          minStockLevel: 3,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Citrus Fougère',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Lavender, Mandarin Orange, Bergamot, Geranium',
          middleNotes: 'Hedione, Coriander, Jasmine, Cinnamon, Violet',
          baseNotes: 'Ambroxan, Amberwood, Fir Balsam, Musk, Clearwood'
        },

        // XERJOFF
        {
          name: 'Naxos',
          sku: 'XER-NX-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Woody & Spicy',
          brand: 'Xerjoff',
          costPrice: 690,
          sellingPrice: 1050,
          stockQuantity: 10,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Aromatic Spicy Tobacco',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Lavender, Bergamot, Lemon',
          middleNotes: 'Honey, Cinnamon, Cashmeran, Jasmine Sambac',
          baseNotes: 'Tobacco Leaf, Vanilla, Tonka Bean'
        },
        {
          name: 'Erba Pura',
          sku: 'XER-EP-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Citrus & Fresh',
          brand: 'Xerjoff',
          costPrice: 650,
          sellingPrice: 995,
          stockQuantity: 12,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Fruity',
          concentration: 'Eau de Parfum (EDP) (15-20%)',
          topNotes: 'Sicilian Orange, Calabrian Bergamot, Sicilian Lemon',
          middleNotes: 'Mediterranean Fruits',
          baseNotes: 'White Musk, Amber, Madagascar Vanilla'
        },
        {
          name: 'Alexandria II',
          sku: 'XER-AX2-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Oud & Oriental',
          brand: 'Xerjoff',
          costPrice: 1100,
          sellingPrice: 1750,
          stockQuantity: 5,
          minStockLevel: 2,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Amber Woody Oud',
          concentration: 'Parfum (20-30%)',
          topNotes: 'Rosewood, Lavender, Cinnamon, Apple',
          middleNotes: 'Rose, Cedarwood, Lily-of-the-Valley',
          baseNotes: 'Laotian Oud, Sandalwood, Vanilla, Amber, Musk'
        },

        // SCENTS & SOULS (HOUSE SPECIFIC)
        {
          name: 'Imperial Saffron',
          sku: 'SAS-IMS-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'Bespoke Blends',
          brand: 'Scents & Souls',
          costPrice: 450,
          sellingPrice: 950,
          stockQuantity: 50,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Bespoke Oriental',
          concentration: 'Extrait de Parfum (25-40%)',
          topNotes: 'Royal Oud, Saffron Dust, White Truffle',
          middleNotes: 'Damask Rose, Midnight Amber, Frankincense',
          baseNotes: 'Siberian Musk, Warm Vetiver, Sandalwood Tears'
        },
        {
          name: 'Midnight Rose',
          sku: 'SAS-MDR-100',
          barcode: generateBarcode(),
          type: ProductType.NEW,
          category: 'French Florals',
          brand: 'Scents & Souls',
          costPrice: 400,
          sellingPrice: 850,
          stockQuantity: 40,
          minStockLevel: 5,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'Floral Oriental',
          concentration: 'Extrait de Parfum (25-40%)',
          topNotes: 'Saffron, Bergamot, Pink Pepper',
          middleNotes: 'Midnight Rose, Jasmine Sambac, Violet',
          baseNotes: 'Amber, Patchouli, Sweet Vanilla, Musk'
        },
        {
          name: 'Luxury Presentation Box',
          sku: 'SAS-BOX-PRE',
          barcode: generateBarcode(),
          type: ProductType.ACCESSORY,
          category: 'Accessories (Bottles/Boxes)',
          brand: 'Scents & Souls',
          costPrice: 25,
          sellingPrice: 65,
          stockQuantity: 100,
          minStockLevel: 10,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'N/A',
          topNotes: 'Premium Packaging Accord',
          middleNotes: 'Velvet Lining',
          baseNotes: 'Magnetic Seal'
        },
        {
          name: 'Travel Atomizer Gold 10ml',
          sku: 'SAS-ATO-GLD',
          barcode: generateBarcode(),
          type: ProductType.ACCESSORY,
          category: 'Accessories (Bottles/Boxes)',
          brand: 'Scents & Souls',
          costPrice: 10,
          sellingPrice: 30,
          stockQuantity: 200,
          minStockLevel: 20,
          imeiRequired: false,
          vatRate: 0.05,
          isActive: true,
          scentFamily: 'N/A',
          topNotes: 'Anodized Gold Aluminum',
          middleNotes: 'Glass Vial Insert',
          baseNotes: 'Pressure Leak-proof'
        }
      ];

      let addedCount = 0;
      let updatedCount = 0;
      for (const item of premiumScentLibrary) {
        if (!existingSKUs.has(item.sku)) {
          await productsService.add(item as any);
          addedCount++;
        } else {
          // Sync existing items to enrich them with full detailed notes and scent families
          const existing = existingProducts.find(p => p.sku === item.sku);
          if (existing) {
            await productsService.update(existing.id, {
              scentFamily: item.scentFamily,
              concentration: item.concentration,
              topNotes: item.topNotes,
              middleNotes: item.middleNotes,
              baseNotes: item.baseNotes,
              category: item.category,
              brand: item.brand,
              costPrice: item.costPrice,
              sellingPrice: item.sellingPrice,
              stockQuantity: item.stockQuantity
            });
            updatedCount++;
          }
        }
      }

      setMessage({ 
        type: 'success', 
        text: `INFUSION DEPLOYED: Loaded ${addedCount} new perfume nodes and updated ${updatedCount} existing models with comprehensive brand-wise scent pyramids!` 
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'INFUSION FAILED: Error writing perfume nodes to database.' });
    } finally {
      setSeeding(false);
    }
  };

  React.useEffect(() => {
    const fetchProfile = async () => {
      const data = await businessProfileService.get();
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Supported formats check: PNG, JPEG, BMP
      const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
      if (!supportedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'CRITICAL ERROR: UNSUPPORTED IMAGE SIGNATURE. USE PNG, JPEG, OR BMP.' });
        return;
      }

      if (file.size > 1024 * 1024) { 
        setMessage({ type: 'error', text: 'CRITICAL ERROR: SEQUENCE SIZE EXCEEDS 1MB LIMIT.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await businessProfileService.save(profile);
      await concentrationAlertRulesService.save(alertRules);
      setMessage({ type: 'success', text: 'Configuration synchronized successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Synchronization failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSystem = async () => {
    if (!confirm('CRITICAL ACTION: This will permanently and irreversibly delete ALL sales, purchases, customers, suppliers, expenses, vouchers, shifts, and consultations in Firestore, but will KEEP your luxury product inventory intact for easy use. Are you absolutely sure?')) return;
    
    setSaving(true);
    try {
      await purgeAllDatabase(true);
      setMessage({ type: 'success', text: 'SYSTEM PURGE COMPLETE: All transactional and auxiliary records have been reset while preserving products inventory. Refreshing...' });
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (error) {
      setMessage({ type: 'error', text: 'PURGE FAILED: Could not wipe Firestore database.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    setSaving(true);
    try {
      const data = await exportDatabaseJSON();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      downloadAnchor.setAttribute('download', `scents_souls_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setMessage({ type: 'success', text: 'BACKUP EXPORTED: JSON database archive downloaded successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'EXPORT FAILED: Unable to generate backup file.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('WARNING: Restoring this file will overwrite your active database entirely. Continue?')) {
      e.target.value = '';
      return;
    }

    setSaving(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          await restoreDatabaseJSON(parsed);
          setMessage({ type: 'success', text: 'RESTORE SUCCESSFUL: Database synchronized and restored. Reloading page...' });
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        } catch (err) {
          setMessage({ type: 'error', text: 'RESTORE FAILED: Invalid JSON backup schema.' });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setMessage({ type: 'error', text: 'RESTORE FAILED: Unable to read file.' });
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-black border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'business', label: 'Business Profile', icon: Building2 },
    { id: 'pos', label: 'POS Terminal', icon: Monitor },
    { id: 'localization', label: 'Regional Settings', icon: Globe },
    { id: 'print', label: 'Print Customizer', icon: Printer },
    { id: 'data', label: 'Users & Security', icon: Shield },
    { id: 'alerts', label: 'Concentration Alerts', icon: Bell },
  ];

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase">CORE <span className="text-[#C5A059]">CONFIGURATION</span></h1>
          <p className="text-gray-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">
             System Control Interface • V2.4.0-STABLE
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-[2rem] border border-gray-100 shadow-inner">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={cn(
                 "px-6 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                 activeTab === tab.id ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
               )}
             >
               <tab.icon size={14} /> {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="space-y-12">
            <AnimatePresence mode="wait">
              {activeTab === 'business' && (
                <motion.div 
                  key="business"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  {/* Branding Section */}
                  <section className="advanced-3d-card p-12 bg-white space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Corporate Identity Nodes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                      <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 group relative overflow-hidden">
                         <div className="w-32 h-32 bg-white rounded-3xl shadow-xl overflow-hidden flex items-center justify-center mb-6 relative z-10">
                            {profile.logoBase64 ? (
                              <img src={profile.logoBase64} alt="Company Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="text-gray-100" size={64} />
                            )}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all backdrop-blur-[2px]">
                              <Upload className="text-white" size={24} />
                              <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.bmp" onChange={handleLogoUpload} />
                            </label>
                         </div>
                         <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center relative z-10">
                           {profile.logoBase64 ? 'CHANGE BRAND ASSET' : 'UPLOAD CORPORATE LOGO'}
                         </div>
                      </div>

                      <div className="md:col-span-2 space-y-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Legal Entity Name</label>
                          <input 
                            type="text" 
                            value={profile.companyName}
                            onChange={e => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                            required
                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black uppercase text-sm"
                            placeholder="SCENTS & SOULS PERFUME LAB LLC"
                          />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tax Registration (TRN)</label>
                           <input 
                             type="text" 
                             value={profile.trn}
                             onChange={e => setProfile(prev => ({ ...prev, trn: e.target.value }))}
                             required
                             className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-mono font-bold text-sm"
                             placeholder="100XXXXXXXXXXXX"
                           />
                        </div>
                      </div>
                    </div>
                  </section>
 
                  {/* Contact Section */}
                  <section className="advanced-3d-card p-12 bg-white space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Sync & Localization Channels</h2>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       {[
                         { label: 'E-Mail Node', icon: Mail, value: profile.email, key: 'email', placeholder: 'lab@scentsandsouls.ae' },
                         { label: 'Mobile Frequency', icon: Phone, value: profile.phone, key: 'phone', placeholder: '+971 50 XXXXXXX' },
                         { label: 'Cloud Domain', icon: Globe, value: profile.website || '', key: 'website', placeholder: 'https://scentsandsouls.ae' },
                         { label: 'Promotional Prefix', icon: Tag, value: profile.promoPrefix || '', key: 'promoPrefix', placeholder: 'https://scentsandsouls.ae/promo/' },
                         { label: 'Physical Coordinates', icon: MapPin, value: profile.address, key: 'address', placeholder: 'Dubai Retail Center, UAE' },
                       ].map(field => (
                         <div key={field.key} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                              <field.icon size={12} /> {field.label}
                            </label>
                            <input 
                              type="text" 
                              value={field.value}
                              onChange={e => setProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                              placeholder={field.placeholder}
                            />
                         </div>
                       ))}
                    </div>
                  </section>

                  {/* Legal Section */}
                  <section className="advanced-3d-card p-12 bg-white space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Protocol Documentation</h2>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Standard Terms of Trade</label>
                        <textarea 
                          value={profile.termsAndConditions}
                          onChange={e => setProfile(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                          className="w-full px-8 py-6 bg-gray-50 border-transparent rounded-[2.5rem] focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all min-h-[150px] text-[10px] font-bold uppercase leading-relaxed resize-none no-scrollbar"
                          placeholder="DEFIE TRADE PROTOCOLS HERE..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Registry Footer Tag</label>
                        <input 
                          type="text" 
                          value={profile.footerNote}
                          onChange={e => setProfile(prev => ({ ...prev, footerNote: e.target.value }))}
                          className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black uppercase text-[10px] tracking-wider"
                          placeholder="SYSTEM GENERATED VIA SCENTS & SOULS"
                        />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'pos' && (
                <motion.div 
                  key="pos"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <section className="advanced-3d-card p-12 bg-white space-y-12">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Operational Parameters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Receipt Print Behavior</label>
                          <div className="flex items-center gap-4">
                             <button 
                               type="button"
                               onClick={() => setSystemSettings(prev => ({ ...prev, autoPrintReceipt: true }))}
                               className={cn(
                                 "flex-1 p-6 rounded-[2rem] border transition-all text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-4",
                                 systemSettings.autoPrintReceipt ? "bg-black text-white border-black" : "bg-gray-50 text-gray-400 border-transparent"
                               )}
                             >
                                <Printer size={24} />
                                AUTO-PRINT ACTIVATED
                             </button>
                             <button 
                               type="button"
                               onClick={() => setSystemSettings(prev => ({ ...prev, autoPrintReceipt: false }))}
                               className={cn(
                                 "flex-1 p-6 rounded-[2rem] border transition-all text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-4",
                                 !systemSettings.autoPrintReceipt ? "bg-black text-white border-black" : "bg-gray-50 text-gray-400 border-transparent"
                               )}
                             >
                                <Shield size={24} />
                                MANUAL PROTOCOL
                             </button>
                          </div>
                       </div>

                       <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Low Stock Awareness Threshold</label>
                            <input 
                              type="number" 
                              value={systemSettings.lowStockThreshold}
                              onChange={e => setSystemSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) }))}
                              className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                            />
                            <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-2 ml-1">Nodes with quantity below this value trigger alerts.</p>
                         </div>
                       </div>
                    </div>
                  </section>

                  <section className="advanced-3d-card p-12 bg-white space-y-12">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Payment Gateway & Logic</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {['CASH', 'CARD', 'BANK TRANSFER', 'CHEQUE'].map(method => (
                         <div key={method} className="p-6 bg-gray-50 rounded-3xl flex items-center justify-between border border-gray-100">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400">
                               <CreditCard size={18} />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest">{method}</span>
                           </div>
                           <div className="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                         </div>
                       ))}
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'localization' && (
                <motion.div 
                  key="localization"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <section className="advanced-3d-card p-12 bg-white space-y-12">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-black rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Registry Localization</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                            <DollarSign size={12} /> Unit of Currency
                          </label>
                          <select 
                            value={systemSettings.currency}
                            onChange={e => setSystemSettings(prev => ({ ...prev, currency: e.target.value }))}
                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                          >
                            <option value="AED">AED (UAE DIRHAM)</option>
                            <option value="USD">USD (US DOLLAR)</option>
                            <option value="SAR">SAR (SAUDI RIYAL)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-1">
                            <Clock size={12} /> Temporal Format
                          </label>
                          <select 
                            value={systemSettings.dateFormat}
                            onChange={e => setSystemSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                          >
                            <option value="DD/MM/YYYY">DD / MM / YYYY</option>
                            <option value="MM/DD/YYYY">MM / DD / YYYY</option>
                            <option value="YYYY-MM-DD">YYYY - MM - DD</option>
                          </select>
                       </div>
                       <div className="space-y-2 text-red-500">
                          <label className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2 ml-1">
                            <Languages size={12} /> Display Language
                          </label>
                          <select 
                            disabled
                            className="w-full px-8 py-5 bg-red-50 border-transparent rounded-3xl focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm cursor-not-allowed opacity-50"
                          >
                            <option value="English">ENGLISH (CORE)</option>
                            <option value="Arabic">ARABIC (UPCOMING)</option>
                          </select>
                          <p className="text-[8px] uppercase tracking-widest mt-2 ml-1">RTL Support scheduled for next deployment cycle.</p>
                       </div>
                    </div>
                  </section>
                </motion.div>
              )}              {activeTab === 'data' && (
                <motion.div 
                  key="data"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                   {/* User Management Section */}
                   <UserManagementSection />

                   {/* Biometric Security Section */}
                   <BiometricSecuritySection />

                   <section className="advanced-3d-card p-12 bg-white space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Root Data Governance</h2>
                    </div>

                    <div className="space-y-8">
                       {/* Premium Scent Lab Automatic Seeder Card */}
                       <div className="p-10 bg-gradient-to-br from-amber-50/60 to-orange-50/30 rounded-[3rem] border border-amber-100/50 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
                         <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#C5A059]/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-1000" />
                         <div className="space-y-2 relative z-10">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-pulse" />
                              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#C5A059]">Bespoke Seed Protocol</span>
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-tight text-gray-900">SYSTEM LABORATORY POPULATOR</h4>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-loose max-w-xl">
                               Automatically deploy 22 authentic brand-wise luxury perfumes (Amouage, Creed, Tom Ford, Lattafa, etc.) directly to your active inventory catalog with pre-calculated scent pyramids, concentrations, and cost structures.
                            </p>
                         </div>
                         <button 
                           type="button"
                           disabled={seeding}
                           onClick={handleSeedPremiumData}
                           className="bg-black text-[#C5A059] px-10 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl hover:bg-gray-900 transition-all active:scale-95 shrink-0 disabled:opacity-50 flex items-center gap-3 relative z-10 border border-[#C5A059]/20"
                         >
                           {seeding ? 'INFUSING SCENT PYRAMIDS...' : 'DEPLOY PREMIUM LIBRARY'}
                         </button>
                       </div>

                       <div className="p-10 bg-red-50 rounded-[3rem] border border-red-100 flex items-center justify-between gap-12">
                          <div className="space-y-2">
                             <h4 className="text-lg font-black uppercase tracking-tight text-red-600">SYTEM RESET PROTOCOL</h4>
                             <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-loose max-w-xl">
                                Executing this command will irreversibly terminate all sales registries, purchase logs, student nodes, and ledger documents. This action cannot be undone.
                             </p>
                          </div>
                          <button 
                            type="button"
                            onClick={handleResetSystem}
                            className="bg-red-600 text-white px-10 py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 shrink-0"
                          >
                            INITIATE WIPE
                          </button>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <button 
                            type="button"
                            onClick={handleExportBackup}
                            className="p-8 bg-gray-50 rounded-[2.5rem] flex items-center justify-between border border-gray-100 group text-left cursor-pointer hover:bg-black hover:text-white transition-all w-full"
                          >
                             <div className="space-y-1">
                               <p className="text-xs font-black uppercase tracking-tight">EXPORT SECURE DATABASE</p>
                               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-white/60">Generate structured JSON archive</p>
                             </div>
                             <div className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-black transition-all">
                                <FileText size={20} />
                             </div>
                          </button>

                          <label className="p-8 bg-gray-50 rounded-[2.5rem] flex items-center justify-between border border-gray-100 group text-left cursor-pointer hover:bg-black hover:text-white transition-all w-full relative">
                             <input 
                               type="file" 
                               accept=".json" 
                               onChange={handleRestoreBackup}
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]" 
                             />
                             <div className="space-y-1">
                               <p className="text-xs font-black uppercase tracking-tight">RESTORE FROM ARCHIVE</p>
                               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-white/60">Upload previously saved JSON backup</p>
                             </div>
                             <div className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-black transition-all">
                                <Upload size={20} />
                             </div>
                          </label>
                       </div>

                       {/* Auto Save Backup Card */}
                       <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                         <div className="space-y-1 text-left">
                            <h4 className="text-xs font-black uppercase tracking-tight">AUTO BACKUP CHRONICLER</h4>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                               When activated, the system automatically schedules a secure background backup log at specified intervals.
                            </p>
                         </div>
                         <div className="flex items-center gap-4">
                            <select 
                              value={profile.autoSaveIntervalMinutes || 30}
                              onChange={e => setProfile(prev => ({ ...prev, autoSaveIntervalMinutes: parseInt(e.target.value) }))}
                              disabled={!profile.autoSaveBackup}
                              className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none disabled:opacity-40"
                            >
                              <option value="15">Every 15 Min</option>
                              <option value="30">Every 30 Min</option>
                              <option value="60">Every 1 Hour</option>
                              <option value="360">Every 6 Hours</option>
                            </select>
                            <button 
                              type="button"
                              onClick={() => setProfile(prev => ({ ...prev, autoSaveBackup: !prev.autoSaveBackup }))}
                              className={cn(
                                "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                profile.autoSaveBackup 
                                  ? "bg-green-50 text-green-600 border-green-100" 
                                  : "bg-gray-200 text-gray-400 border-transparent"
                              )}
                            >
                              {profile.autoSaveBackup ? 'AUTO-SAVE ACTIVE' : 'INACTIVE'}
                            </button>
                         </div>
                       </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'print' && (
                <motion.div 
                   key="print"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-12"
                >
                   <section className="advanced-3d-card p-12 bg-white space-y-10 text-left">
                      <div className="flex items-center gap-4">
                         <div className="w-1.5 h-6 bg-[#C5A059] rounded-full" />
                         <h2 className="text-xl font-black uppercase tracking-tight">Print Layout & Brand Customizer</h2>
                      </div>
                      
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
                         Choose from 10 FTA-approved A4 Tax Invoice templates and 3 receipt styles to match your brand's aesthetic. Changes are synchronized and visible instantly.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         {/* A4 Template selector */}
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">A4 Tax Invoice Layout (UAE FTA Compliant)</label>
                            <select 
                               value={profile.selectedA4Template || 'corporate'}
                               onChange={(e) => setProfile(prev => ({ ...prev, selectedA4Template: e.target.value }))}
                               className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                            >
                               <option value="corporate">Template 1: Corporate Classic (Bilingual Accent)</option>
                               <option value="minimalist">Template 2: Minimalist Swiss (High White Space)</option>
                               <option value="modern_tech">Template 3: Modern Tech (Matrix Grid)</option>
                               <option value="elegance">Template 4: Classic Elegance (Editorial Serif)</option>
                               <option value="brutalist">Template 5: Bold Brutalist (High Contrast Border)</option>
                               <option value="emerald">Template 6: UAE Emerald (Executive Gold/Green)</option>
                               <option value="double_column">Template 7: Double Column Grid (Side Panel Specs)</option>
                               <option value="split_top">Template 8: Split Top Header (Bilingual Parallel)</option>
                               <option value="compact_grid">Template 9: Compact Grid (Dense Catalog Mode)</option>
                               <option value="elite_gold">Template 10: Elite Gold & Dark (Premium Perfumery)</option>
                            </select>
                         </div>

                         {/* Thermal POS Template selector */}
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Thermal Receipt Layout (POS Roll)</label>
                            <select 
                               value={profile.selectedThermalTemplate || 'standard'}
                               onChange={(e) => setProfile(prev => ({ ...prev, selectedThermalTemplate: e.target.value }))}
                               className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                            >
                               <option value="standard">Standard POS layout (80mm)</option>
                               <option value="compact">Slim POS layout (58mm compact)</option>
                               <option value="premium">Premium Scented Roll layout (Detailed notes)</option>
                            </select>
                         </div>

                         {/* Colors & Typography presets */}
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Primary Color (Headers, Titles)</label>
                            <div className="flex items-center gap-4">
                               <input 
                                  type="color"
                                  value={profile.primaryColor || '#000000'}
                                  onChange={(e) => setProfile(prev => ({ ...prev, primaryColor: e.target.value }))}
                                  className="w-12 h-12 bg-transparent border-0 outline-none rounded-xl cursor-pointer"
                               />
                               <input 
                                  type="text"
                                  value={profile.primaryColor || '#000000'}
                                  onChange={(e) => setProfile(prev => ({ ...prev, primaryColor: e.target.value }))}
                                  className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-xs font-mono border-transparent focus:ring-1 focus:ring-black outline-none uppercase font-black"
                               />
                            </div>
                         </div>

                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Accent Accentuation Color</label>
                            <div className="flex items-center gap-4">
                               <input 
                                  type="color"
                                  value={profile.accentColor || '#C5A059'}
                                  onChange={(e) => setProfile(prev => ({ ...prev, accentColor: e.target.value }))}
                                  className="w-12 h-12 bg-transparent border-0 outline-none rounded-xl cursor-pointer"
                               />
                               <input 
                                  type="text"
                                  value={profile.accentColor || '#C5A059'}
                                  onChange={(e) => setProfile(prev => ({ ...prev, accentColor: e.target.value }))}
                                  className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-xs font-mono border-transparent focus:ring-1 focus:ring-black outline-none uppercase font-black"
                               />
                            </div>
                         </div>

                         {/* Typography Preset select */}
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Print Font Family Style</label>
                            <select 
                               value={profile.fontFamily || 'sans'}
                               onChange={(e) => setProfile(prev => ({ ...prev, fontFamily: e.target.value }))}
                               className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                            >
                               <option value="sans">Inter Sans-Serif (Modern, Clean)</option>
                               <option value="serif">Playfair Serif (Classic, Luxury Elegance)</option>
                               <option value="mono">JetBrains Mono (Technical, Brutalist)</option>
                            </select>
                         </div>

                         {/* Paper Width selector for thermal */}
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Thermal Receipt Width</label>
                            <select 
                               value={profile.thermalWidth || 80}
                               onChange={(e) => setProfile(prev => ({ ...prev, thermalWidth: parseInt(e.target.value) }))}
                               className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                            >
                               <option value="80">80mm (Standard Desktop Receipt Roll)</option>
                               <option value="58">58mm (Handheld POS Roll / Mobile)</option>
                            </select>
                         </div>

                         {/* Toggle details options */}
                         <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-4">
                               <button 
                                  type="button"
                                  onClick={() => setProfile(prev => ({ ...prev, showLogo: !prev.showLogo }))}
                                  className={cn(
                                     "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                     profile.showLogo !== false ? "bg-black text-white" : "bg-gray-100 text-gray-400 border-transparent"
                                  )}
                               >
                                  {profile.showLogo !== false ? "LOGO VISIBLE" : "LOGO HIDDEN"}
                               </button>
                               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Brand Mark</span>
                            </div>

                            <div className="flex items-center gap-4">
                               <button 
                                  type="button"
                                  onClick={() => setProfile(prev => ({ ...prev, showSignatureLine: !prev.showSignatureLine }))}
                                  className={cn(
                                     "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                     profile.showSignatureLine !== false ? "bg-black text-white" : "bg-gray-100 text-gray-400 border-transparent"
                                  )}
                               >
                                  {profile.showSignatureLine !== false ? "SIGNATURE ACTIVE" : "SIGNATURE HIDDEN"}
                               </button>
                               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Signature Box</span>
                            </div>

                            <div className="flex items-center gap-4">
                               <button 
                                  type="button"
                                  onClick={() => setProfile(prev => ({ ...prev, showVatSummary: !prev.showVatSummary }))}
                                  className={cn(
                                     "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                     profile.showVatSummary !== false ? "bg-black text-white" : "bg-gray-100 text-gray-400 border-transparent"
                                  )}
                               >
                                  {profile.showVatSummary !== false ? "VAT SUMMARY ACTIVE" : "VAT SUMMARY HIDDEN"}
                               </button>
                               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">FTA VAT Summary</span>
                            </div>
                         </div>
                      </div>
                   </section>

                   {/* Interactive Live Preview Panel */}
                   <section className="advanced-3d-card p-12 bg-white space-y-8 text-left">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-black rounded-full" />
                            <h2 className="text-xl font-black uppercase tracking-tight">Interactive Live Preview</h2>
                         </div>
                         <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => {
                                 const previewElement = document.getElementById('a4-preview-scroll-container');
                                 if (previewElement) {
                                    previewElement.scrollIntoView({ behavior: 'smooth' });
                                 }
                                 window.print();
                              }}
                              className="px-6 py-3.5 bg-gray-100 hover:bg-black hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                               <Printer size={14} /> Direct Print Test
                            </button>
                            <button 
                              type="button"
                              onClick={async () => {
                                 const element = document.getElementById('a4-print-preview-content');
                                 if (!element) return;
                                 setSaving(true);
                                 try {
                                    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
                                    const imgData = canvas.toDataURL('image/png');
                                    const pdf = new jsPDF('p', 'mm', 'a4');
                                    const imgWidth = 210;
                                    const pageHeight = 295;
                                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                                    let heightLeft = imgHeight;
                                    let position = 0;

                                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                                    heightLeft -= pageHeight;

                                    while (heightLeft >= 0) {
                                       position = heightLeft - imgHeight;
                                       pdf.addPage();
                                       pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                                       heightLeft -= pageHeight;
                                    }
                                    pdf.save(`tax_invoice_preview_${profile.selectedA4Template}.pdf`);
                                    setMessage({ type: 'success', text: 'PDF GENERATED: Document downloaded.' });
                                 } catch (err) {
                                    console.error(err);
                                    setMessage({ type: 'error', text: 'PDF FAILED: Could not convert node.' });
                                 } finally {
                                    setSaving(false);
                                 }
                              }}
                              disabled={saving}
                              className="px-6 py-3.5 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                               <FileText size={14} /> Export PDF
                            </button>
                         </div>
                      </div>

                      <div id="a4-preview-scroll-container" className="p-8 bg-gray-100 rounded-[2.5rem] flex justify-center max-h-[700px] overflow-y-auto shadow-inner border border-gray-200">
                         <div id="a4-print-preview-content" className="w-[210mm] bg-white shadow-2xl p-8 my-4 transform origin-top shrink-0 border border-gray-100">
                            {/* Render PrintTemplates with a mock invoice */}
                            <PrintTemplates 
                               businessProfile={{
                                  companyName: profile.companyName || 'SCENTS & SOULS PERFUMERY CO',
                                  trn: profile.trn || '100452367400003',
                                  phone: profile.phone || '+971 4 555 1234',
                                  email: profile.email || 'info@scentsandsouls.ae',
                                  address: profile.address || 'Showroom 4, Al Maktoum Road, Deira, Dubai, UAE',
                                  website: profile.website || 'www.scentsandsouls.ae',
                                  termsAndConditions: profile.termsAndConditions || '1. Goods sold are not exchangeable or refundable. 2. Payment terms: COD.',
                                  footerNote: profile.footerNote || 'Thank you for choosing Scents & Souls - Crafting Memories.',
                                  logoBase64: profile.logoBase64 || '',
                                  promoPrefix: profile.promoPrefix || 'https://scentsandsouls.ae/promo/',
                                  selectedA4Template: profile.selectedA4Template as any || 'corporate',
                                  selectedThermalTemplate: profile.selectedThermalTemplate as any || 'standard',
                                  primaryColor: profile.primaryColor || '#000000',
                                  accentColor: profile.accentColor || '#C5A059',
                                  showLogo: profile.showLogo !== false,
                                  showSignatureLine: profile.showSignatureLine !== false,
                                  showVatSummary: profile.showVatSummary !== false,
                                  thermalWidth: profile.thermalWidth || 80,
                                  fontFamily: profile.fontFamily || 'sans',
                               }}
                               invoiceType="sales"
                               data={{
                                  id: 'INV-2026-0812',
                                  createdAt: new Date().toISOString(),
                                  customerName: 'Ahmad Al Hashimi (Guest Customer)',
                                  customerTrn: '100488277300003',
                                  customerPhone: '+971 50 123 4567',
                                  subtotal: 1250.00,
                                  vatTotal: 62.50,
                                  discount: 50.00,
                                  grandTotal: 1262.50,
                                  items: [
                                     { id: '1', name: 'Creed Aventus (Eau de Parfum - 100ml)', sku: 'CRD-AVN-100', quantity: 1, unitPrice: 1450.00, totalPrice: 1450.00, discount: 200.00 },
                                     { id: '2', name: 'Amouage Reflection Man (Perfume Oil - 30ml)', sku: 'AMG-REF-30', quantity: 1, unitPrice: 450.00, totalPrice: 450.00, discount: 0 }
                                  ],
                                  payments: [
                                     { id: 'pay-1', amount: 1262.50, method: 'CARD', timestamp: new Date().toISOString() }
                                  ]
                               }}
                            />
                         </div>
                      </div>
                   </section>
                </motion.div>
              )}

              {activeTab === 'alerts' && (
                <motion.div 
                   key="alerts"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-12"
                >
                  <section className="advanced-3d-card p-12 bg-white space-y-10">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-1.5 h-6 bg-black rounded-full" />
                           <h2 className="text-xl font-black uppercase tracking-tight">Scent Concentration Alerts</h2>
                        </div>
                        <button 
                           type="button"
                           onClick={() => {
                              const newRule: ConcentrationAlertRule = {
                                 id: 'rule-' + Date.now(),
                                 concentration: 'Eau de Parfum (EDP) (15-20%)',
                                 minStockThreshold: 10,
                                 isActive: true
                              };
                              setAlertRules([...alertRules, newRule]);
                           }}
                           className="px-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                        >
                           <Plus size={16} /> ADD SENSOR NODE
                        </button>
                     </div>

                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
                        Set low-stock alert thresholds for specific perfume concentrations. Whenever an active product's stock falls below its concentration-specific threshold, a system-wide alert is triggered in the notification center.
                     </p>

                     <div className="space-y-6">
                        {alertRules.length === 0 ? (
                           <div className="p-12 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                              <Bell size={48} className="mx-auto text-gray-200 mb-6 animate-bounce" />
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NO SENSOR NODES DEFINED</p>
                           </div>
                        ) : (
                           <div className="space-y-4">
                              {alertRules.map((rule, index) => (
                                 <div key={rule.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fragrance Concentration Formula</label>
                                          <select 
                                             value={rule.concentration}
                                             onChange={(e) => {
                                                const updated = [...alertRules];
                                                updated[index].concentration = e.target.value;
                                                setAlertRules(updated);
                                             }}
                                             className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all font-bold text-xs"
                                          >
                                             <option value="Eau de Parfum (EDP) (15-20%)">Eau de Parfum (EDP) (15-20%)</option>
                                             <option value="Parfum (20-30%)">Parfum (20-30%)</option>
                                             <option value="Extrait de Parfum (20-40%)">Extrait de Parfum (20-40%)</option>
                                             <option value="Extrait de Parfum (25-40%)">Extrait de Parfum (25-40%)</option>
                                             <option value="Concentrated Perfume Oil (Attar)">Concentrated Perfume Oil (Attar)</option>
                                             <option value="Eau de Toilette (EDT) (5-15%)">Eau de Toilette (EDT) (5-15%)</option>
                                             <option value="Eau de Cologne (EDC) (2-4%)">Eau de Cologne (EDC) (2-4%)</option>
                                             <option value="Scented Oil">Scented Oil</option>
                                             <option value="Pure Perfume Oil">Pure Perfume Oil</option>
                                          </select>
                                       </div>

                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sensor Alert Threshold (Units)</label>
                                          <div className="flex items-center gap-4">
                                             <input 
                                                type="number"
                                                value={rule.minStockThreshold}
                                                onChange={(e) => {
                                                   const updated = [...alertRules];
                                                   updated[index].minStockThreshold = Math.max(0, parseInt(e.target.value) || 0);
                                                   setAlertRules(updated);
                                                }}
                                                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
                                                min="0"
                                             />
                                          </div>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end md:self-center">
                                       <button 
                                          type="button"
                                          onClick={() => {
                                             const updated = [...alertRules];
                                             updated[index].isActive = !updated[index].isActive;
                                             setAlertRules(updated);
                                          }}
                                          className={cn(
                                             "px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                             rule.isActive 
                                                ? "bg-green-50 text-green-600 border-green-100" 
                                                : "bg-gray-100 text-gray-400 border-transparent"
                                          )}
                                       >
                                          {rule.isActive ? "ACTIVE" : "STANDBY"}
                                       </button>

                                       <button 
                                          type="button"
                                          onClick={() => {
                                             setAlertRules(alertRules.filter(r => r.id !== rule.id));
                                          }}
                                          className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-all shadow-sm"
                                          title="Decommission rule"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="advanced-3d-card p-8 bg-black text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-8">
                 <div className="space-y-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#C5A059]">
                       <SettingsIcon size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black font-display tracking-tight uppercase">CONFIGURATION PERSISTENCE</h3>
                       <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-2 leading-relaxed">Changes to core parameters are applied instantly across all terminal nodes.</p>
                    </div>
                 </div>
                 
                 <button 
                   onClick={handleSave}
                   disabled={saving}
                   className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                 >
                   {saving ? 'SYNCING...' : 'FORCE SYNC CORE'}
                   <Save size={18} />
                 </button>
              </div>
           </div>

           <div className="advanced-3d-card p-8 bg-gray-50 border border-gray-100 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">System Activity Feed</h4>
              <div className="space-y-4">
                 {[
                   { msg: 'Business profile nodes updated', time: '12m ago', icon: Building2 },
                   { msg: 'POS print protocol changed', time: '1h ago', icon: Printer },
                   { msg: 'New supplier added to registry', time: '4h ago', icon: Globe },
                 ].map((log, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-300 mt-1">
                        <log.icon size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-600 line-clamp-1">{log.msg}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">{log.time}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {message && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className={cn(
                 "p-6 rounded-[2rem] border flex items-center gap-4 shadow-xl",
                 message.type === 'success' ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
               )}
             >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", message.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-wider">{message.text}</p>
                </div>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}

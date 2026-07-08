/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck,
  CreditCard,
  Calculator, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Ticket,
  AlertTriangle,
  UserCheck,
  Wifi,
  WifiOff,
  Film
} from 'lucide-react';
import { cn } from './lib/utils';
import { useAuth } from './AuthContext';
import { businessProfileService, productsService, concentrationAlertRulesService } from './lib/dbService';
import { BusinessProfile, Product, ConcentrationAlertRule, ConcentrationAlert } from './types';
import { ScentAndSoulLogo } from './components/ScentAndSoulLogo';

interface SidebarItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 group relative",
      active 
        ? "text-black font-semibold" 
        : "text-gray-400 hover:text-black hover:bg-gray-50/50"
    )}
  >
    {active && (
      <motion.div 
        layoutId="active-indicator"
        className="absolute left-0 w-1.5 h-8 bg-black rounded-r-full"
      />
    )}
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    {!collapsed && (
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] font-black uppercase tracking-widest"
      >
        {label}
      </motion.span>
    )}
  </button>
);

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AppLayout({ children, activeTab, setActiveTab }: AppLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, signOut, deviceType, calibration: sysCalibration } = useAuth();
  const [profile, setProfile] = React.useState<BusinessProfile | null>(null);
  
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [alertRules, setAlertRules] = React.useState<ConcentrationAlertRule[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  React.useEffect(() => {
    const unsubProfile = businessProfileService.subscribe(setProfile);
    const unsubProducts = productsService.subscribe((prods) => {
      setAllProducts(prods || []);
    });
    const unsubRules = concentrationAlertRulesService.subscribe((rules) => {
      if (rules && rules.length > 0) {
        setAlertRules(rules);
      } else {
        const defaultRules: ConcentrationAlertRule[] = [
          { id: 'rule-edp', concentration: 'Eau de Parfum (EDP) (15-20%)', minStockThreshold: 15, isActive: true },
          { id: 'rule-parfum', concentration: 'Parfum (20-30%)', minStockThreshold: 10, isActive: true },
          { id: 'rule-extrait', concentration: 'Extrait de Parfum (20-40%)', minStockThreshold: 10, isActive: true },
          { id: 'rule-oil', concentration: 'Concentrated Perfume Oil (Attar)', minStockThreshold: 20, isActive: true },
          { id: 'rule-edt', concentration: 'Eau de Toilette (EDT) (5-15%)', minStockThreshold: 12, isActive: true }
        ];
        setAlertRules(defaultRules);
      }
    });
    return () => {
      unsubProfile();
      unsubProducts();
      unsubRules();
    };
  }, []);

  const activeAlerts: ConcentrationAlert[] = React.useMemo(() => {
    const alerts: ConcentrationAlert[] = [];
    const activeRules = alertRules.filter(r => r.isActive);

    allProducts.forEach(product => {
      if (!product.isActive) return;
      
      const matchingRule = activeRules.find(rule => {
        if (!product.concentration || !rule.concentration) return false;
        const p = product.concentration.toLowerCase().trim();
        const r = rule.concentration.toLowerCase().trim();
        if (p === r) return true;
        
        if (r.includes('edp') && (p.includes('edp') || p.includes('eau de parfum'))) return true;
        if (r.includes('edt') && (p.includes('edt') || p.includes('eau de toilette'))) return true;
        if (r.includes('oil') && (p.includes('oil') || p.includes('attar'))) return true;
        if (r.includes('extrait') && p.includes('extrait')) return true;
        if (r.includes('parfum') && p.includes('parfum') && !r.includes('eau de') && !p.includes('eau de')) return true;
        return p.includes(r) || r.includes(p);
      });

      if (matchingRule) {
        if (product.stockQuantity <= matchingRule.minStockThreshold) {
          alerts.push({
            id: `alert-${product.id}`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            concentration: product.concentration || 'Unknown',
            stockQuantity: product.stockQuantity,
            threshold: matchingRule.minStockThreshold,
            isActiveRule: true,
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    return alerts;
  }, [allProducts, alertRules]);

  // Sync menu state with screen size
  React.useEffect(() => {
    if (!sysCalibration.isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [sysCalibration.isMobile]);

  const menuItems = [
    { id: 'dashboard', label: 'Perfume Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Scent Register', icon: ShoppingCart },
    { id: 'repairs', label: 'Fragrance LAB', icon: Sparkles },
    { id: 'brand-lab', label: 'Brand Video Lab', icon: Film },
    { id: 'inventory', label: 'Perfume Vault', icon: Package },
    { id: 'expenses', label: 'LAB Expenses', icon: CreditCard },
    { id: 'customers', label: 'Connoisseurs / Clients', icon: Users },
    { id: 'staff', label: 'Staff Portal', icon: UserCheck },
    { id: 'suppliers', label: 'Scent Distributors', icon: Truck },
    { id: 'accounting', label: 'Ledger Ledger', icon: Calculator },
    { id: 'vouchers', label: 'Campaign Vouchers', icon: Ticket },
    { id: 'reports', label: 'Market Analytics', icon: BarChart3 },
    { id: 'settings', label: 'LAB Config', icon: Settings },
  ];

  // System-wide calibration adjustment
  const layoutCalibration = {
    paddingTop: deviceType === 'ios' ? 'pt-[env(safe-area-inset-top,40px)]' : 'pt-0',
    paddingBottom: deviceType === 'ios' ? 'pb-[env(safe-area-inset-bottom,20px)]' : 'pb-0',
    headerHeight: sysCalibration.isMobile ? 'h-20' : 'h-20'
  };

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className={cn(
      "flex h-screen bg-[#FDFDFD] overflow-hidden selection:bg-black selection:text-white",
      layoutCalibration.paddingBottom
    )}>
      {/* Dynamic Sliding Sidebar (Desktop) */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r border-[#F0F0F0] bg-white transition-all duration-300 ease-in-out relative z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-6 flex items-center gap-3 h-20 shrink-0">
          {profile?.logoBase64 ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center p-0.5 bg-white">
               <img src={profile.logoBase64} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 shrink-0">
              <ScentAndSoulLogo size="sm" showText={false} />
            </div>
          )}
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display text-[15px] font-black truncate tracking-tighter uppercase"
            >
              {profile?.companyName || 'SCENTS & SOULS PERFUME LAB'}
            </motion.div>
          )}
        </div>

        <nav className="flex-1 mt-2 overflow-y-auto no-scrollbar py-4">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-[#F0F0F0] bg-gray-50/10">
          <button 
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 text-gray-400 hover:text-black hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-95"
          >
            {collapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-3"><ChevronLeft size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">Collapse Node</span></div>}
          </button>
        </div>
      </aside>

      {/* Main Content Integration */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Advanced Top Navigation */}
        <header className={cn(
          "border-b border-[#F0F0F0] bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-20 shrink-0 sticky top-0",
          layoutCalibration.headerHeight,
          layoutCalibration.paddingTop
        )}>
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="lg:hidden w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl text-black transition-all active:scale-90"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
            <div className={`relative max-w-[280px] w-full hidden md:block`}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="PROXIMITY SEARCH..." 
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-black/10 focus:bg-white focus:border-black/20 focus:outline-none transition-all placeholder:text-gray-300"
              />
            </div>
            {/* Contextual Identification */}
            <div className="lg:hidden flex items-center gap-2">
               {profile?.logoBase64 ? (
                 <img src={profile.logoBase64} alt="L" className="w-6 h-6 object-contain grayscale opacity-20" />
               ) : (
                 <div className="w-7 h-7 shrink-0 opacity-80">
                   <ScentAndSoulLogo size="sm" showText={false} />
                 </div>
               )}
               <div className="font-display font-black text-sm uppercase tracking-tighter truncate max-w-[120px]">
                 {menuItems.find(i => i.id === activeTab)?.label}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={cn(
                  "relative w-10 h-10 flex items-center justify-center rounded-xl transition-all xs:flex",
                  activeAlerts.length > 0 
                    ? "text-red-500 bg-red-50 hover:bg-red-100" 
                    : "text-gray-400 hover:text-black hover:bg-gray-50"
                )}
                title="Scent Monitor Alerts"
              >
                <Bell size={20} strokeWidth={2} className={cn(activeAlerts.length > 0 && "animate-bounce")} />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-pulse">
                    {activeAlerts.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotificationsDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotificationsDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 z-50 origin-top-right space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-amber-500" />
                          <h3 className="text-xs font-black uppercase tracking-wider">LAB SENSOR WARNS</h3>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {activeAlerts.length} Critical
                        </span>
                      </div>

                      <div className="max-h-[320px] overflow-y-auto no-scrollbar space-y-3">
                        {activeAlerts.length === 0 ? (
                          <div className="py-12 text-center text-gray-400">
                            <Bell size={32} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest">SENSORS SAFE • ALL STOCKS STABLE</p>
                          </div>
                        ) : (
                          activeAlerts.map(alert => (
                            <button
                              key={alert.id}
                              onClick={() => {
                                setActiveTab(alert.productId ? 'inventory' : 'dashboard');
                                setShowNotificationsDropdown(false);
                              }}
                              className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-100 transition-all flex items-start gap-3 group animate-fadeIn"
                            >
                              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                <AlertTriangle size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black uppercase tracking-tight text-gray-900 group-hover:text-black transition-colors truncate">
                                  {alert.productName}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-black/5 text-gray-500 rounded uppercase tracking-wider">
                                    {alert.sku}
                                  </span>
                                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-50 text-red-600 rounded uppercase tracking-wider">
                                    {alert.concentration}
                                  </span>
                                </div>
                                <div className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wide flex items-center gap-1">
                                  STOCK: <span className="text-red-600 font-black">{alert.stockQuantity}</span> / REQUIRED: {alert.threshold}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {activeAlerts.length > 0 && (
                        <button
                          onClick={() => {
                            setActiveTab('inventory');
                            setShowNotificationsDropdown(false);
                          }}
                          className="w-full py-4 bg-black text-white hover:bg-gray-900 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all text-center flex items-center justify-center gap-2"
                        >
                          OPEN PERFUME VAULT <ChevronRight size={12} />
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Online / Offline Sync State Badge */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest shrink-0 transition-all",
              isOnline 
                ? "bg-green-50 border-green-100 text-green-600" 
                : "bg-red-50 border-red-100 text-red-600 animate-pulse"
            )}>
              {isOnline ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-500" />}
              <span className="hidden xs:inline">{isOnline ? "SYNC ONLINE" : "OFFLINE VAULT"}</span>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50/50 rounded-2xl p-1 md:pl-4 md:pr-1 border border-gray-100/50">
              <div className="text-right hidden md:block pr-2">
                <div className="text-[10px] font-black leading-none uppercase tracking-tight">{user?.name}</div>
                <div className="text-[8px] text-gray-400 uppercase tracking-widest mt-1 font-black leading-none">{user?.role}</div>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm shrink-0">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'admin'}`} 
                  alt="U" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                onClick={signOut}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                title="TERMINATE SESSION"
              >
                <LogOut size={16} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </header>

        {/* Global Viewport Frame */}
        <div className="flex-1 overflow-y-auto bg-[#FDFDFD] no-scrollbar relative p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              className="max-w-[1600px] mx-auto w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Advanced Mobile Slide Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-[20px_0_80px_rgba(0,0,0,0.3)] flex flex-col"
            >
              <div className="p-8 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-sm">
                    {profile?.companyName?.[0] || 'Q'}
                  </div>
                  <div className="font-display text-sm font-black tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                    {profile?.companyName || 'SCENTS & SOULS PERFUME LAB'}
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 active:scale-90 transition-all hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 no-scrollbar">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all relative group overflow-hidden",
                      activeTab === item.id 
                        ? "bg-black text-white shadow-xl shadow-black/10" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    )}
                  >
                    <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                    {activeTab === item.id && (
                      <motion.div 
                        layoutId="mobile-indicator"
                        className="absolute right-4 w-1 h-1 bg-white rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'admin'}`} 
                      alt="U" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase truncate">{user?.name}</div>
                    <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{user?.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

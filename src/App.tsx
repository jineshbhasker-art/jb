/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AppLayout from './AppLayout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Repairs from './pages/Repairs';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Vouchers from './pages/Vouchers';
import StaffTracker from './pages/StaffTracker';
import CustomerHub from './pages/CustomerHub';
import PublicProductProfile from './pages/PublicProductProfile';
import { AuthProvider, useAuth } from './AuthContext';
import { LuxuryLogo } from './components/LuxuryLogo';
import { ScentAndSoulLogo } from './components/ScentAndSoulLogo';
import { LaunchVideoSimulator } from './components/LaunchVideoSimulator';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sparkles, Fingerprint, Lock, Delete, Film, Play } from 'lucide-react';
import { cn } from './lib/utils';
import { 
  isBiometricSupported, 
  getEnrolledUsernames, 
  authenticateBiometric 
} from './lib/webAuthn';

function AppContent() {
  const { user, loading: authLoading, login, loginBiometrically, loginByPin, deviceType, calibration: sysCalibration } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [showSplash, setShowSplash] = React.useState(true);
  const [playingSplashVideo, setPlayingSplashVideo] = React.useState(false);
  const [showBioModal, setShowBioModal] = React.useState(false);
  const [enrolledUsers, setEnrolledUsers] = React.useState<string[]>([]);
  const [isBioSupported, setIsBioSupported] = React.useState(false);
  const [authMethod, setAuthMethod] = React.useState<'credentials' | 'pin'>('credentials');
  const [pinCode, setPinCode] = React.useState('');

  const handlePinLogin = React.useCallback(async (pinVal: string) => {
    setError('');
    const success = await loginByPin(pinVal);
    if (success) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 40, 40]); // High-end double success pulse
      }
    } else {
      setError('INVALID PASS CODE. ACCESS DENIED.');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 100, 150]); // Warning signature vibration
      }
    }
  }, [loginByPin]);

  const handleKeypadPress = React.useCallback((digit: string) => {
    setError('');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12); // Elegant click haptic
    }
    setPinCode(prev => {
      const next = prev + digit;
      if (next.length === 4) {
        handlePinLogin(next);
        return '';
      }
      if (next.length > 4) return prev;
      return next;
    });
  }, [handlePinLogin]);

  React.useEffect(() => {
    if (authMethod !== 'pin' || user) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        setPinCode(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setPinCode('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authMethod, user, handleKeypadPress]);

  React.useEffect(() => {
    setIsBioSupported(isBiometricSupported());
    setEnrolledUsers(getEnrolledUsernames());
  }, []);

  const handleBiometricLogin = async (selectedUser?: string) => {
    setError('');
    const targetUser = selectedUser || username;

    if (!targetUser) {
      const enrolled = getEnrolledUsernames();
      if (enrolled.length === 0) {
        setError('NO BIOMETRIC PROFILES FOUND. Enrolling is required in Settings first.');
        return;
      } else if (enrolled.length === 1) {
        setUsername(enrolled[0]);
        await performBiometricAuth(enrolled[0]);
      } else {
        setEnrolledUsers(enrolled);
        setShowBioModal(true);
      }
      return;
    }

    await performBiometricAuth(targetUser);
  };

  const performBiometricAuth = async (targetUser: string) => {
    setError('');
    try {
      const res = await authenticateBiometric(targetUser);
      if (res.success) {
        const loggedIn = await loginBiometrically(targetUser);
        if (loggedIn) {
          setShowBioModal(false);
        } else {
          setError('BIOMETRIC VALID, BUT AGENT NOT FOUND OR DEACTIVATED.');
        }
      } else {
        setError(res.error || 'Biometric authentication failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected biometric error occurred.');
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const invoiceQuery = urlParams.get('invoice');
  const productProfileQuery = urlParams.get('product-profile');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!playingSplashVideo) {
        setShowSplash(false);
      }
    }, 5500);
    return () => clearTimeout(timer);
  }, [playingSplashVideo]);

  if (invoiceQuery) {
    return <CustomerHub invoiceNumber={invoiceQuery} />;
  }

  if (productProfileQuery) {
    return <PublicProductProfile productId={productProfileQuery} />;
  }

  if (showSplash) {
    if (playingSplashVideo) {
      return (
        <div className="h-screen w-full bg-black flex items-center justify-center p-4 z-[9999] relative">
          <div className="w-full max-w-5xl">
            <LaunchVideoSimulator 
              standalone={false} 
              onClose={() => {
                setPlayingSplashVideo(false);
                setShowSplash(false);
              }} 
            />
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen w-full bg-[#0A0A0A] flex flex-col items-center justify-center text-white overflow-hidden relative" id="brand-launch-screen">
        {/* Cinematic ambient lighting radial rings */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.06)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black pointer-events-none" />
        
        {/* Center Stage Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center z-10 px-6 max-w-lg w-full text-center"
        >
          {/* Scent & Soul Animated Logo Emblem */}
          <div className="mb-6 relative">
            <motion.div
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              className="p-1 bg-gradient-to-tr from-white/5 to-white/10 rounded-[3rem] border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl relative z-10"
            >
              <ScentAndSoulLogo size="xl" showText={false} animated={true} />
            </motion.div>
            
            {/* Halo glow behind emblem */}
            <div className="absolute inset-0 bg-[#C5A059]/10 filter blur-3xl rounded-full scale-125 animate-pulse" />
          </div>

          {/* Luxury Typography Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="space-y-3"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-[0.15em] text-white">
              SCENT <span className="text-[#C5A059] italic font-normal">&</span> SOUL
            </h1>
            <p className="text-[10px] tracking-[0.45em] uppercase text-[#C5A059] font-semibold">
              FRAGRANCE OF THE SOUL
            </p>
          </motion.div>

          {/* Interactive Cinematic Action Triggers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-14 w-full flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* Play Brand Intro (Cinematic Video) */}
            <button
              onClick={() => setPlayingSplashVideo(true)}
              className="w-full sm:w-auto px-8 py-4 bg-[#C5A059] hover:bg-[#D7B46E] text-black font-black text-[10px] tracking-widest uppercase rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-amber-500/5 hover:shadow-amber-500/10"
            >
              <Film size={14} />
              PLAY INTRO VIDEO
            </button>

            {/* Skip / Enter */}
            <button
              onClick={() => setShowSplash(false)}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900/80 hover:bg-zinc-800 text-gray-300 hover:text-white font-black text-[10px] tracking-widest uppercase rounded-2xl border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              ENTER WORKSPACE
            </button>
          </motion.div>

          {/* Systems Status Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="mt-16 flex items-center gap-6 text-[8px] font-mono tracking-widest uppercase text-gray-400"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              <span>LAB LIVE</span>
            </div>
            <span>|</span>
            <span>SECURE VAULT ACTIVE</span>
            <span>|</span>
            <span>v2.0</span>
          </motion.div>
        </motion.div>

        {/* Ambient bottom timeline loading bar (auto enters if untouched) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 5.5, ease: "linear" }}
            className="w-full h-full bg-gradient-to-r from-[#C5A059] to-white"
          />
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFDFD] calibrate-grid opacity-10">
        <div className="w-16 h-16 border-[1px] border-black/5 rounded-2xl flex items-center justify-center animate-spin">
           <div className="w-2 h-2 bg-black rounded-full" />
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (!success) {
      setError('ACCESS DENIED. VERIFY CREDENTIALS.');
    }
  };

  if (!user) {
    return (
      <div className={cn(
        "min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 relative overflow-hidden calibrate-grid",
        deviceType === 'ios' ? "pt-12" : "pt-6"
      )}>
        {/* Background Decors */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-[#C5A059]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-black/5 rounded-full blur-[120px]" />

        <div className="w-full max-w-lg space-y-12 z-10">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-28 h-28 mx-auto"
            >
              <ScentAndSoulLogo size="lg" showText={false} />
            </motion.div>
            <div className="space-y-1">
              <h1 className="font-display text-5xl font-black tracking-tighter uppercase">SCENTS & SOULS</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C5A059]">Bespoke Scent Registry</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="advanced-3d-card p-10 bg-white/80 backdrop-blur-xl space-y-8"
          >
            {/* Authenticator Mode Selector */}
            <div className="flex bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('credentials');
                  setError('');
                }}
                className={cn(
                  "flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer",
                  authMethod === 'credentials'
                    ? "bg-black text-white shadow-lg shadow-black/10"
                    : "text-gray-400 hover:text-black"
                )}
              >
                CREDENTIAL KEY
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('pin');
                  setError('');
                  setPinCode('');
                }}
                className={cn(
                  "flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer",
                  authMethod === 'pin'
                    ? "bg-black text-white shadow-lg shadow-black/10"
                    : "text-gray-400 hover:text-black"
                )}
              >
                SECURE PIN (1234)
              </button>
            </div>

            {authMethod === 'credentials' ? (
              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Security Identifier</label>
                      <span className="text-[8px] text-gray-300 font-mono">#AUTH_SYS_v2</span>
                    </div>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="USERNAME"
                      className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-[#C5A059] outline-none transition-all font-bold tracking-wider placeholder:text-gray-300 text-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Access Key</label>
                      <span className="text-[8px] text-gray-300 font-mono">AES-256-GCM</span>
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-[#C5A059] outline-none transition-all font-bold tracking-widest placeholder:text-gray-300 text-black"
                    />
                  </div>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3"
                    >
                      <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-[9px] text-red-500 font-black tracking-widest uppercase">{error}</p>
                    </motion.div>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 px-8 bg-[#0F0F0F] text-white rounded-[1.5rem] font-black tracking-[0.2em] text-xs hover:bg-[#1A1A1A] transition-all active:scale-95 shadow-[0_15px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-4 group cursor-pointer"
                >
                  INITIALIZE SYNC
                  <div className="w-5 h-[1px] bg-white/30 group-hover:w-8 transition-all" />
                </button>

                {isBioSupported && (
                  <>
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-100" />
                      <span className="flex-shrink mx-4 text-[8px] font-mono text-gray-300 uppercase tracking-widest">or secondary security node</span>
                      <div className="flex-grow border-t border-gray-100" />
                    </div>

                    <button 
                      type="button"
                      onClick={() => handleBiometricLogin()}
                      className="w-full py-4 px-8 bg-white border border-gray-100 hover:border-[#C5A059] text-gray-700 hover:text-black rounded-[1.5rem] font-black tracking-[0.2em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3 group shadow-[0_5px_15px_rgba(0,0,0,0.02)] cursor-pointer"
                    >
                      <Fingerprint size={16} className="text-[#C5A059]" />
                      AUTHENTICATE BIOMETRICS
                    </button>
                  </>
                )}
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Secure Node PIN Code</label>
                    <p className="text-[8px] text-gray-300 font-mono tracking-widest">ENTER 4-DIGIT AUTHORIZED CODE (e.g. 1234)</p>
                  </div>
                  
                  {/* secure dots visual feedback */}
                  <div className="flex gap-4 justify-center py-4">
                    {[0, 1, 2, 3].map((idx) => (
                      <motion.div
                        key={idx}
                        animate={{
                          scale: pinCode.length > idx ? [1, 1.25, 1] : 1,
                          backgroundColor: pinCode.length > idx ? '#C5A059' : '#E5E7EB'
                        }}
                        className={cn(
                          "w-5 h-5 rounded-full border border-gray-200 transition-colors shadow-inner"
                        )}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 w-full"
                    >
                      <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-[9px] text-red-500 font-black tracking-widest uppercase">{error}</p>
                    </motion.div>
                  )}
                </div>

                {/* Tactile digital keypad */}
                <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px] mx-auto pb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num.toString())}
                      className="w-16 h-16 rounded-full border border-gray-100 hover:border-[#C5A059] flex items-center justify-center font-display text-xl font-black transition-all hover:bg-gray-50 active:scale-90 select-none text-black cursor-pointer shadow-sm hover:shadow"
                    >
                      {num}
                    </button>
                  ))}
                    <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate(10);
                      }
                      setPinCode('');
                    }}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all hover:bg-gray-50 active:scale-90 select-none cursor-pointer"
                  >
                    CLEAR
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="w-16 h-16 rounded-full border border-gray-100 hover:border-[#C5A059] flex items-center justify-center font-display text-xl font-black transition-all hover:bg-gray-50 active:scale-90 select-none text-black cursor-pointer shadow-sm"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate(10);
                      }
                      setPinCode(prev => prev.slice(0, -1));
                    }}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-gray-400 hover:text-black transition-all hover:bg-gray-50 active:scale-90 select-none cursor-pointer"
                  >
                    <Delete size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Biometric User Selection Modal */}
          <AnimatePresence>
            {showBioModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 text-black">
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  onClick={() => setShowBioModal(false)} 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  exit={{ scale: 0.9, opacity: 0 }} 
                  className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 space-y-8 z-10 border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-black uppercase tracking-tighter text-black flex items-center gap-2">
                        <Fingerprint className="text-[#C5A059]" /> SELECT AGENT
                      </h3>
                      <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">ACTIVE BIOMETRIC NODE SELECTOR</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowBioModal(false)} 
                      className="w-10 h-10 hover:bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 transition-all font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    {enrolledUsers.map((enrolledUser) => (
                      <button
                        key={enrolledUser}
                        type="button"
                        onClick={() => {
                          setShowBioModal(false);
                          performBiometricAuth(enrolledUser);
                        }}
                        className="w-full p-6 bg-gray-50 hover:bg-[#0F0F0F] hover:text-white border border-gray-100 rounded-2xl flex items-center justify-between transition-all group font-bold"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#C5A059]/10 text-[#C5A059] rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-wider">
                            {enrolledUser.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-wider">{enrolledUser}</p>
                            <p className="text-[8px] text-gray-400 font-bold tracking-widest mt-0.5 group-hover:text-white/60">BIOMETRIC ACTIVE</p>
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-[#C5A059] group-hover:border-[#C5A059] group-hover:text-white transition-all">
                          →
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          
          <div className="flex flex-col items-center gap-4">
             <div className="flex gap-12 opacity-30">
                <div className="flex flex-col items-center">
                   <span className="text-[8px] font-bold">SCENT SYNC</span>
                   <div className="w-8 h-[1px] bg-black mt-1" />
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[8px] font-bold">EST. 2026</span>
                   <div className="w-8 h-[1px] bg-black mt-1" />
                </div>
             </div>
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em] text-center px-12 leading-relaxed">
               Proprietary Scent Registry System • Scents & Souls Perfume LAB UAE 
               <br />
               <span className="text-[8px] opacity-50">Authorized Use Only</span>
             </p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'repairs':
        return <Repairs />;
      case 'inventory':
        return <Inventory />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        );
      case 'customers':
        return <Customers />;
      case 'staff':
        return (
          <ProtectedRoute>
            <StaffTracker />
          </ProtectedRoute>
        );
      case 'suppliers':
        return <Suppliers />;
      case 'accounting':
        return (
          <ProtectedRoute>
            <Accounting />
          </ProtectedRoute>
        );
      case 'vouchers':
        return (
          <ProtectedRoute>
            <Vouchers />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        );
      case 'brand-lab':
        return <LaunchVideoSimulator standalone={true} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}



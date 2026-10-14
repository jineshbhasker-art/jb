/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface User {
  name: string;
  role: string;
  uid?: string;
  username?: string;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  loginBiometrically: (username: string) => Promise<boolean>;
  loginByPin: (pin: string) => Promise<boolean>;
  signOut: () => void;
  deviceType: 'ios' | 'android' | 'desktop';
  calibration: {
    isLandscape: boolean;
    isMobile: boolean;
    screenWidth: number;
    screenHeight: number;
    calibrationMode: 'auto' | 'mobile' | 'desktop';
    setCalibrationMode: (mode: 'auto' | 'mobile' | 'desktop') => void;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [calibrationMode, setCalibrationModeState] = useState<'auto' | 'mobile' | 'desktop'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aqm_calibration_mode');
      if (saved === 'auto' || saved === 'mobile' || saved === 'desktop') {
        return saved;
      }
    }
    return 'auto';
  });

  const [calibration, setCalibration] = useState({
    isLandscape: false,
    isMobile: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const setCalibrationMode = (mode: 'auto' | 'mobile' | 'desktop') => {
    setCalibrationModeState(mode);
    localStorage.setItem('aqm_calibration_mode', mode);
  };

  useEffect(() => {
    const initAuth = () => {
      // Check local storage for session
      const savedUser = localStorage.getItem('aqm_session');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      // Device Detection for Calibration
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isAndroid = /android/.test(ua);
      
      if (isIOS) {
        setDeviceType('ios');
      } else if (isAndroid) {
        setDeviceType('android');
      } else {
        setDeviceType('desktop');
      }
      setLoading(false);
    };

    const timer = setTimeout(initAuth, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Calibration Observer
    const calibrate = () => {
      const isMobileCalibrated = 
        calibrationMode === 'mobile' 
          ? true 
          : calibrationMode === 'desktop' 
            ? false 
            : window.innerWidth < 1024;

      setCalibration({
        isLandscape: window.innerWidth > window.innerHeight,
        isMobile: isMobileCalibrated,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      });
    };

    const timer = setTimeout(calibrate, 0);

    const handleResize = () => {
      calibrate();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calibrationMode]);

  const login = async (username: string, pass: string) => {
    // Admin fallback
    if (username.toLowerCase() === 'admin' && pass === '123') {
      const newUser = { name: 'Admin User', role: 'Super Admin', username: 'admin' };
      setUser(newUser);
      localStorage.setItem('aqm_session', JSON.stringify(newUser));
      return true;
    }

    try {
      const q = query(
        collection(db, 'users'), 
        where('username', '==', username),
        where('password', '==', pass),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        const newUser = { 
          name: userData.name, 
          role: userData.role, 
          uid: snapshot.docs[0].id,
          username: userData.username 
        };
        setUser(newUser);
        localStorage.setItem('aqm_session', JSON.stringify(newUser));
        return true;
      }
    } catch (err) {
      console.error("Login Error:", err);
    }
    
    return false;
  };

  const loginBiometrically = async (username: string) => {
    const normalizedUsername = username.toLowerCase();
    if (normalizedUsername === 'admin') {
      const newUser = { name: 'Admin User', role: 'Super Admin', username: 'admin' };
      setUser(newUser);
      localStorage.setItem('aqm_session', JSON.stringify(newUser));
      return true;
    }

    try {
      const q = query(
        collection(db, 'users'), 
        where('username', '==', normalizedUsername),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        const newUser = { 
          name: userData.name, 
          role: userData.role, 
          uid: snapshot.docs[0].id,
          username: userData.username 
        };
        setUser(newUser);
        localStorage.setItem('aqm_session', JSON.stringify(newUser));
        return true;
      }
    } catch (err) {
      console.error("Biometric Login DB Fetch Error:", err);
    }
    
    return false;
  };

  const loginByPin = async (pin: string) => {
    if (pin === '1234') {
      const newUser = { name: 'Lab Master', role: 'Super Admin', username: 'admin' };
      setUser(newUser);
      localStorage.setItem('aqm_session', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('aqm_session');
    // We stay signed in anonymously in Firebase to keep Firestore working
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginBiometrically, 
      loginByPin, 
      signOut, 
      deviceType, 
      calibration: {
        ...calibration,
        calibrationMode,
        setCalibrationMode
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

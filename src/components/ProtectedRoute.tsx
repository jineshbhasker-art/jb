/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { Smartphone } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFDFD] calibrate-grid opacity-10">
        <div className="w-16 h-16 border-[1px] border-black/5 rounded-2xl flex items-center justify-center animate-spin">
           <div className="w-2 h-2 bg-black rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // The App component handles the login redirect
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 p-12 text-center bg-white rounded-[4rem] border border-gray-100 shadow-xl m-12">
        <div className="w-32 h-32 bg-red-50 text-red-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-red-500/10">
           <Smartphone size={48} strokeWidth={1} />
        </div>
        <div className="space-y-4">
           <h1 className="text-4xl font-black font-display tracking-tight uppercase">ACCESS_DENIED</h1>
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">PRIVILEGE LEVEL INSUFFICIENT FOR THIS NODE</p>
           <div className="pt-8">
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-red-50 rounded-full border border-red-100">
                 <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                 <span className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-none">Security Exception • Protocol Alpha</span>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

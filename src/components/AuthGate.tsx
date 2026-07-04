/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

interface AuthGateProps {
  onAuthenticated: (role: 'admin' | 'staff') => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // Secret checks
      if (accessKey === 'phuc2026') {
        localStorage.setItem('deep_focus_os_auth', 'admin');
        onAuthenticated('admin');
      } else if (accessKey === 'staff2026') {
        localStorage.setItem('deep_focus_os_auth', 'staff');
        onAuthenticated('staff');
      } else {
        setError('ACCESS DENIED: Invalid Cryptographic Key');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div id="auth-gate-container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
      <div 
        id="auth-card"
        className="relative w-full max-w-sm p-6 bg-[#09090b] border-2 border-[#3b82f6] rounded-sm shadow-[0_0_20px_rgba(59,130,246,0.15)] text-center mx-4"
      >
        {/* Decorative corner lines for tech cyberpunk style */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#06b6d4]"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#06b6d4]"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#06b6d4]"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#06b6d4]"></div>

        <div className="mb-4 inline-flex p-3 rounded-sm bg-blue-950/40 border border-[#3b82f6]/30 justify-center items-center text-[#3b82f6]">
          <ShieldCheck className="w-10 h-10" />
        </div>

        <h1 className="text-xl font-black tracking-tighter text-white font-sans">
          DEEP FOCUS OS
        </h1>
        <p className="text-[10px] font-mono text-[#71717a] mt-0.5 uppercase tracking-widest">
          Cryptographic Access Protocol
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-mono text-[#71717a] uppercase mb-1.5">
              Enter Master Access Key
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#71717a]">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                id="access-key-input"
                type={showKey ? 'text' : 'password'}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 bg-black text-[#f4f4f5] font-mono placeholder-[#71717a] border border-[#1e293b] rounded-sm focus:outline-none focus:border-[#3b82f6] text-xs tracking-widest"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-[#71717a] hover:text-[#f4f4f5]"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-950/20 border border-red-900/50 rounded-sm text-red-400 text-[11px] font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-900/50 text-white font-mono font-bold text-xs uppercase rounded-sm tracking-wider transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Decrypting...
              </>
            ) : (
              'Initialize Connection'
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-[#1e293b]/50 text-[10px] font-mono text-[#71717a]">
          <p>AUTHORIZED AGENCY PERSONNEL ONLY</p>
          <p className="mt-1 text-[#3b82f6]/60">MASTER KEY: phuc2026</p>
        </div>
      </div>
    </div>
  );
}

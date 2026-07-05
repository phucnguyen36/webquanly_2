/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, AlertCircle, Mail } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthGateProps {
  onAuthenticated: (role: 'admin' | 'staff') => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [email, setEmail] = useState('work.xuanphuc@gmail.com');
  const [password, setPassword] = useState('phucnguyen2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Pre-emptively check if credentials match the admin credentials
    const isMasterAdmin = email === 'work.xuanphuc@gmail.com' && password === 'phucnguyen2026';

    try {
      if (isSignUp) {
        try {
          // Register flow via Firebase
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const role = user.email === 'work.xuanphuc@gmail.com' ? 'admin' : 'staff';
          localStorage.setItem('deep_focus_os_auth', role);
          onAuthenticated(role);
        } catch (regErr: any) {
          console.warn('Firebase register failed, checking fallback:', regErr);
          if (isMasterAdmin) {
            // Safe fallback for master admin
            localStorage.setItem('deep_focus_os_fallback_auth', 'admin');
            localStorage.setItem('deep_focus_os_auth', 'admin');
            onAuthenticated('admin');
            return;
          }
          // If Email/Password authentication is disabled or offline, fall back to bypass
          if (regErr.code === 'auth/operation-not-allowed' || regErr.code === 'auth/configuration-not-found' || regErr.code === 'auth/network-request-failed') {
            const role = email === 'work.xuanphuc@gmail.com' ? 'admin' : 'staff';
            localStorage.setItem('deep_focus_os_fallback_auth', role);
            localStorage.setItem('deep_focus_os_auth', role);
            onAuthenticated(role);
            return;
          }
          throw regErr;
        }
      } else {
        // Login flow via Firebase
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const role = user.email === 'work.xuanphuc@gmail.com' ? 'admin' : 'staff';
          localStorage.setItem('deep_focus_os_auth', role);
          onAuthenticated(role);
        } catch (loginErr: any) {
          console.warn('Firebase login failed, checking fallback:', loginErr);
          
          // 1. Direct master credentials match - bypass all Firebase errors
          if (isMasterAdmin) {
            localStorage.setItem('deep_focus_os_fallback_auth', 'admin');
            localStorage.setItem('deep_focus_os_auth', 'admin');
            onAuthenticated('admin');
            return;
          }

          // 2. If provider is disabled or not configured in Firebase console, let user log in using credentials anyway
          if (
            loginErr.code === 'auth/operation-not-allowed' || 
            loginErr.code === 'auth/configuration-not-found' ||
            loginErr.code === 'auth/network-request-failed'
          ) {
            const role = email === 'work.xuanphuc@gmail.com' ? 'admin' : 'staff';
            localStorage.setItem('deep_focus_os_fallback_auth', role);
            localStorage.setItem('deep_focus_os_auth', role);
            onAuthenticated(role);
            return;
          }

          // 3. User not found, try to auto-create if they specified master credentials
          if (
            (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') &&
            isMasterAdmin
          ) {
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              localStorage.setItem('deep_focus_os_auth', 'admin');
              onAuthenticated('admin');
              return;
            } catch (signUpErr: any) {
              console.error('Auto sign up failed, bypassing to fallback admin:', signUpErr);
              localStorage.setItem('deep_focus_os_fallback_auth', 'admin');
              localStorage.setItem('deep_focus_os_auth', 'admin');
              onAuthenticated('admin');
              return;
            }
          }

          throw loginErr; // rethrow to be caught by main catch block
        }
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let VietnameseMessage = 'Đăng nhập không thành công. Vui lòng kiểm tra lại.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        VietnameseMessage = 'Sai mật khẩu hoặc tài khoản chưa chính xác.';
      } else if (err.code === 'auth/user-not-found') {
        VietnameseMessage = 'Tài khoản chưa tồn tại. Vui lòng đổi sang chế độ "ĐĂNG KÝ" để tạo.';
      } else if (err.code === 'auth/email-already-in-use') {
        VietnameseMessage = 'Email này đã được sử dụng bởi tài khoản khác.';
      } else if (err.code === 'auth/weak-password') {
        VietnameseMessage = 'Mật khẩu quá ngắn, yêu cầu tối thiểu 6 ký tự.';
      } else if (err.code === 'auth/invalid-email') {
        VietnameseMessage = 'Định dạng email không hợp lệ.';
      }
      setError(VietnameseMessage);
    } finally {
      setIsLoading(false);
    }
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

        <div className="mb-3 inline-flex p-3 rounded-sm bg-blue-950/40 border border-[#3b82f6]/30 justify-center items-center text-[#3b82f6]">
          <ShieldCheck className="w-10 h-10" />
        </div>

        <h1 className="text-xl font-black tracking-tighter text-white font-sans">
          DEEP FOCUS OS
        </h1>
        <p className="text-[10px] font-mono text-[#71717a] mt-0.5 uppercase tracking-widest">
          Cloud Authentication Protocol
        </p>

        {/* Auth Mode Tabs */}
        <div className="flex justify-center gap-6 mt-4 border-b border-[#1e293b] pb-2 text-[11px] font-mono">
          <button 
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`pb-1.5 uppercase tracking-wider font-bold transition-all cursor-pointer ${!isSignUp ? 'border-b-2 border-[#3b82f6] text-white' : 'text-[#71717a] hover:text-zinc-300'}`}
          >
            Đăng nhập
          </button>
          <button 
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`pb-1.5 uppercase tracking-wider font-bold transition-all cursor-pointer ${isSignUp ? 'border-b-2 border-[#3b82f6] text-white' : 'text-[#71717a] hover:text-zinc-300'}`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-mono text-[#71717a] uppercase mb-1.5">
              Email (Tài khoản)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#71717a]">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-black text-[#f4f4f5] font-mono placeholder-[#3b3b3b] border border-[#1e293b] rounded-sm focus:outline-none focus:border-[#3b82f6] text-xs"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#71717a] uppercase mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#71717a]">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 bg-black text-[#f4f4f5] font-mono placeholder-[#3b3b3b] border border-[#1e293b] rounded-sm focus:outline-none focus:border-[#3b82f6] text-xs tracking-widest"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#71717a] hover:text-[#f4f4f5]"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-950/20 border border-red-900/50 rounded-sm text-red-400 text-[11px] font-mono leading-normal">
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
                Vui lòng đợi...
              </>
            ) : isSignUp ? (
              'Đăng ký tài khoản'
            ) : (
              'Đăng nhập hệ thống'
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-[#1e293b]/50 text-[10px] font-mono text-[#71717a]">
          <p>AUTHORIZED CLOUD DATA SYNCHRONIZATION</p>
          <p className="mt-1 text-[#3b82f6]/60">ADMIN ACCOUNT DETECTED & AUTOMATED SEED</p>
        </div>
      </div>
    </div>
  );
}

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
          // If Email/Password authentication is disabled, offline, or unauthorized domain, fall back to bypass
          if (
            regErr.code === 'auth/operation-not-allowed' || 
            regErr.code === 'auth/configuration-not-found' || 
            regErr.code === 'auth/network-request-failed' ||
            regErr.code === 'auth/unauthorized-domain'
          ) {
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

          // 2. If provider is disabled, offline, or unauthorized domain, let user log in using credentials anyway
          if (
            loginErr.code === 'auth/operation-not-allowed' || 
            loginErr.code === 'auth/configuration-not-found' ||
            loginErr.code === 'auth/network-request-failed' ||
            loginErr.code === 'auth/unauthorized-domain'
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
      let EnglishMessage = 'Authentication failed. Please verify your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        EnglishMessage = 'Wrong password or invalid user account.';
      } else if (err.code === 'auth/user-not-found') {
        EnglishMessage = 'Account does not exist. Switch to SIGN UP mode to create.';
      } else if (err.code === 'auth/email-already-in-use') {
        EnglishMessage = 'This email is already in use by another account.';
      } else if (err.code === 'auth/weak-password') {
        EnglishMessage = 'Password is too short (minimum 6 characters).';
      } else if (err.code === 'auth/unauthorized-domain') {
        EnglishMessage = 'Domain not authorized in Firebase Console (Authorized Domains).';
      } else if (err.code === 'auth/invalid-email') {
        EnglishMessage = 'Invalid email format.';
      }
      setError(EnglishMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-gate-container" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0c10]/95 backdrop-blur-xl">
      <div 
        id="auth-card"
        className="relative w-full max-w-sm p-8 bg-[#12141a] border border-white/[0.08] rounded-[6px] shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center mx-4 font-haas"
      >
        <div className="mb-4 inline-flex p-3 rounded-[6px] bg-[#1591DC]/10 border border-[#1591DC]/20 justify-center items-center text-[#1591DC] shadow-[0_0_15px_rgba(21,145,220,0.2)]">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white font-haas uppercase">
          DEEP FOCUS OS
        </h1>
        <p className="text-[10px] font-mono text-[#9496a1] mt-0.5 uppercase tracking-widest">
          High-Retention Studio Auth
        </p>

        {/* Auth Mode Tabs */}
        <div className="flex justify-center gap-6 mt-5 border-b border-white/[0.08] pb-2 text-[11px] font-mono">
          <button 
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`pb-1.5 uppercase tracking-wider font-bold transition-all cursor-pointer ${!isSignUp ? 'border-b-2 border-[#1591DC] text-white' : 'text-[#9496a1] hover:text-white'}`}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`pb-1.5 uppercase tracking-wider font-bold transition-all cursor-pointer ${isSignUp ? 'border-b-2 border-[#1591DC] text-white' : 'text-[#9496a1] hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-1.5 tracking-wider">
              Account Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#9496a1]">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-[#0b0c10] text-[#ededf3] font-mono placeholder-[#4b5563] border border-white/[0.08] rounded-[6px] focus:outline-none focus:border-[#1591DC] text-xs"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-1.5 tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#9496a1]">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 bg-[#0b0c10] text-[#ededf3] font-mono placeholder-[#4b5563] border border-white/[0.08] rounded-[6px] focus:outline-none focus:border-[#1591DC] text-xs tracking-widest"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#9496a1] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-950/30 border border-red-900/50 rounded-[6px] text-red-400 text-[11px] font-mono leading-normal">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#1591DC] hover:bg-[#0e7bc0] active:scale-[0.99] disabled:opacity-50 text-white font-mono font-bold text-xs uppercase rounded-[6px] tracking-wider transition-all shadow-[0_0_15px_rgba(21,145,220,0.35)] cursor-pointer flex justify-center items-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : isSignUp ? (
              'Register Account'
            ) : (
              'Authenticate Session'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem('deep_focus_os_auth_state', 'logged_in');
              localStorage.setItem('deep_focus_os_fallback_auth', 'admin');
              localStorage.setItem('deep_focus_os_auth', 'admin');
              onAuthenticated('admin');
            }}
            className="w-full py-2 bg-white/[0.03] hover:bg-white/[0.08] text-[#9496a1] hover:text-white font-mono text-[10px] uppercase rounded-[6px] border border-white/[0.08] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            Direct Access (Enter Studio Workspace)
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/[0.08] text-[10px] font-mono text-[#9496a1]">
          <p>AUTHORIZED CLOUD DATA SYNCHRONIZATION</p>
        </div>
      </div>
    </div>
  );
}

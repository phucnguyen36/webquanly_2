/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, Eye, EyeOff, Volume2, VolumeX, Shield, User, Sliders, Image as ImageIcon, Upload } from 'lucide-react';

export interface UserProfile {
  name: string;
  avatarUrl: string;
  role: string;
  bio: string;
  focusMode: boolean;
  lowMarginAlert: boolean;
  denseLayout: boolean;
  soundEnabled: boolean;
}

interface ProfileSettingsModalProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onClose: () => void;
}

// Preset Premium Avatar/Workspace Photos from Unsplash
const AVATAR_PRESETS = [
  {
    name: 'Executive Studio',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cyberpunk Editor',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Content Director',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Apex Filmmaker',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sleek Aesthetic',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  },
];

// High-Tech Web Audio Synthesizer
const playSynthChime = (type: 'confirm' | 'toggle' | 'click') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'toggle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'confirm') {
      const now = ctx.currentTime;
      // Beautiful major arpeggio
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.05);
        gain.gain.setValueAtTime(0.08, now + index * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.05);
        osc.stop(now + index * 0.05 + 0.25);
      });
    }
  } catch (error) {
    console.warn('Audio synthesis failed:', error);
  }
};

export default function ProfileSettingsModal({ profile, onSave, onClose }: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'modes'>('profile');
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [customAvatarInput, setCustomAvatarInput] = useState(profile.avatarUrl);
  
  // Settings Modes state
  const [focusMode, setFocusMode] = useState(profile.focusMode);
  const [lowMarginAlert, setLowMarginAlert] = useState(profile.lowMarginAlert);
  const [denseLayout, setDenseLayout] = useState(profile.denseLayout);
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, currentVal: boolean) => {
    setter(!currentVal);
    if (soundEnabled || (!currentVal && setter === setSoundEnabled)) {
      playSynthChime('toggle');
    }
  };

  const handlePresetSelect = (url: string) => {
    setAvatarUrl(url);
    setCustomAvatarInput(url);
    if (soundEnabled) playSynthChime('click');
  };

  const handleCustomAvatarBlur = () => {
    if (customAvatarInput.trim()) {
      setAvatarUrl(customAvatarInput.trim());
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        setAvatarUrl(base64);
        setCustomAvatarInput(base64);
        if (soundEnabled) playSynthChime('toggle');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updated: UserProfile = {
      name: name.trim() || profile.name,
      role: role.trim() || profile.role,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || profile.avatarUrl,
      focusMode,
      lowMarginAlert,
      denseLayout,
      soundEnabled,
    };
    
    if (soundEnabled) playSynthChime('confirm');
    onSave(updated);
    onClose();
  };

  return (
    <div id="profile-settings-overlay" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in font-haas">
      <div 
        id="profile-settings-card"
        className="w-full max-w-lg bg-[#070708] border border-zinc-800 rounded-[6px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-[#0c0c0e]">
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
              [SYSTEM PREFERENCES]
            </h2>
            <h3 className="text-base font-extrabold text-white uppercase tracking-tight mt-0.5">
              Profile & Workspace Mode Settings
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-[6px] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-zinc-800 bg-[#09090b] text-xs font-mono">
          <button
            onClick={() => { setActiveTab('profile'); if (soundEnabled) playSynthChime('click'); }}
            className={`flex-1 py-3 text-center border-b-2 uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Personal Profile
          </button>
          <button
            onClick={() => { setActiveTab('modes'); if (soundEnabled) playSynthChime('click'); }}
            className={`flex-1 py-3 text-center border-b-2 uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'modes'
                ? 'border-blue-500 text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Operational Modes
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Avatar section */}
              <div className="space-y-3">
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Profile Avatar Image
                </label>
                
                <div className="flex items-center gap-4">
                  <img 
                    src={avatarUrl} 
                    alt="Current Avatar" 
                    className="w-16 h-16 rounded-[6px] object-cover border border-zinc-700 shadow-lg bg-zinc-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Choose from preset high-res avatars or paste a custom image URL below.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handlePresetSelect(preset.url)}
                          className={`w-7 h-7 rounded-[6px] overflow-hidden border transition-all cursor-pointer ${
                            avatarUrl === preset.url 
                              ? 'border-blue-500 ring-2 ring-blue-500/50' 
                              : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-[6px]" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 px-3 py-1.5 rounded-[6px]">
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="url"
                      value={customAvatarInput}
                      onChange={(e) => setCustomAvatarInput(e.target.value)}
                      onBlur={handleCustomAvatarBlur}
                      placeholder="Paste Unsplash image link or direct URL..."
                      className="bg-transparent text-xs text-zinc-300 focus:outline-none w-full font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center justify-center gap-3 border border-dashed border-zinc-700 hover:border-blue-500 bg-white/[0.02] hover:bg-white/[0.05] p-3 cursor-pointer transition-all rounded-[6px]">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <div className="text-left">
                      <span className="text-xs text-zinc-300 font-medium block">Upload New Avatar</span>
                      <span className="text-[9px] text-zinc-400 font-mono">Accepts PNG, JPG, WebP up to 1MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name and Role Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Xuan Phuc"
                    className="w-full px-3 py-2 bg-[#09090b] text-zinc-100 font-sans text-xs border border-zinc-800 rounded-[6px] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Master Editor"
                    className="w-full px-3 py-2 bg-[#09090b] text-zinc-100 font-sans text-xs border border-zinc-800 rounded-[6px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Bio description */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Personal Tagline / Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a brief tagline about your studio..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#09090b] text-zinc-300 font-sans text-xs border border-zinc-800 rounded-[6px] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="space-y-4 font-sans">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                Workspace Operational Modes
              </span>

              {/* 1. Focus Mode */}
              <div className="p-4 bg-white/[0.02] border border-zinc-800 rounded-[6px] flex items-start gap-3 hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  id="mode-focus"
                  checked={focusMode}
                  onChange={() => handleToggle(setFocusMode, focusMode)}
                  className="mt-1 accent-blue-600 h-3.5 w-3.5 cursor-pointer rounded-[4px]"
                />
                <div className="flex-1">
                  <label htmlFor="mode-focus" className="text-xs font-bold text-zinc-200 block cursor-pointer">
                    FOCUS MODE
                  </label>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Hide secondary sidebar widgets and focus purely on managing the matrix workspace.
                  </p>
                </div>
                {focusMode ? (
                  <span className="text-[9px] font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 uppercase rounded-[4px]">Active</span>
                ) : (
                  <span className="text-[9px] font-mono bg-zinc-900 text-zinc-500 px-1.5 py-0.5 uppercase rounded-[4px]">Disabled</span>
                )}
              </div>

              {/* 2. Dense Layout Mode */}
              <div className="p-4 bg-white/[0.02] border border-zinc-800 rounded-[6px] flex items-start gap-3 hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  id="mode-dense"
                  checked={denseLayout}
                  onChange={() => handleToggle(setDenseLayout, denseLayout)}
                  className="mt-1 accent-blue-600 h-3.5 w-3.5 cursor-pointer rounded-[4px]"
                />
                <div className="flex-1">
                  <label htmlFor="mode-dense" className="text-xs font-bold text-zinc-200 block cursor-pointer">
                    DENSE WORKSPACE LAYOUT
                  </label>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Compact row heights and padding to maximize visible data on screen.
                  </p>
                </div>
                {denseLayout ? (
                  <span className="text-[9px] font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 uppercase rounded-[4px]">Active</span>
                ) : (
                  <span className="text-[9px] font-mono bg-zinc-900 text-zinc-500 px-1.5 py-0.5 uppercase rounded-[4px]">Disabled</span>
                )}
              </div>

              {/* 3. Low Margin Alert */}
              <div className="p-4 bg-white/[0.02] border border-zinc-800 rounded-[6px] flex items-start gap-3 hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  id="mode-low-margin"
                  checked={lowMarginAlert}
                  onChange={() => handleToggle(setLowMarginAlert, lowMarginAlert)}
                  className="mt-1 accent-blue-600 h-3.5 w-3.5 cursor-pointer rounded-[4px]"
                />
                <div className="flex-1">
                  <label htmlFor="mode-low-margin" className="text-xs font-bold text-zinc-200 block cursor-pointer">
                    LOW MARGIN ALERTS
                  </label>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Automatically flag video tasks with profit yield under 35% to protect studio revenue.
                  </p>
                </div>
                {lowMarginAlert ? (
                  <span className="text-[9px] font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 uppercase rounded-[4px]">Active</span>
                ) : (
                  <span className="text-[9px] font-mono bg-zinc-900 text-zinc-500 px-1.5 py-0.5 uppercase rounded-[4px]">Disabled</span>
                )}
              </div>

              {/* 4. Sound Synthesis Toggle */}
              <div className="p-4 bg-white/[0.02] border border-zinc-800 rounded-[6px] flex items-start gap-3 hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  id="mode-sound"
                  checked={soundEnabled}
                  onChange={() => handleToggle(setSoundEnabled, soundEnabled)}
                  className="mt-1 accent-blue-600 h-3.5 w-3.5 cursor-pointer rounded-[4px]"
                />
                <div className="flex-1">
                  <label htmlFor="mode-sound" className="text-xs font-bold text-zinc-200 block cursor-pointer">
                    SOUND SYNTHESIS EFFECTS
                  </label>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Play synthesized Audio API feedback chimes when clicking, saving, or toggling preferences.
                  </p>
                </div>
                {soundEnabled ? (
                  <span className="text-[9px] font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 uppercase flex items-center gap-1 rounded-[4px]">
                    <Volume2 className="w-2.5 h-2.5" /> ON
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-zinc-900 text-zinc-500 px-1.5 py-0.5 uppercase flex items-center gap-1 rounded-[4px]">
                    <VolumeX className="w-2.5 h-2.5" /> OFF
                  </span>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer controls */}
        <div className="bg-[#0c0c0e] p-6 border-t border-zinc-800 flex justify-end gap-3 font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs uppercase rounded-[6px] border border-zinc-800 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs uppercase font-extrabold rounded-[6px] cursor-pointer transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

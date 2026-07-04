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
    <div id="profile-settings-overlay" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div 
        id="profile-settings-card"
        className="w-full max-w-lg bg-[#070708] border border-zinc-900 rounded-none overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-900 bg-[#0c0c0e]">
          <div>
            <h2 className="text-sm font-mono font-bold tracking-widest text-zinc-400 uppercase">
              [SYSTEM PREFERENCES]
            </h2>
            <h3 className="text-lg font-serif font-light text-zinc-100 uppercase mt-0.5">
              Cài đặt Profile & Chế độ Workspace
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-zinc-900 bg-[#09090b] text-[10px] font-mono">
          <button
            onClick={() => { setActiveTab('profile'); if (soundEnabled) playSynthChime('click'); }}
            className={`flex-1 py-3 text-center border-b uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-white text-white bg-[#0e0e11]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User className="w-3 h-3" />
            Thông tin Cá nhân
          </button>
          <button
            onClick={() => { setActiveTab('modes'); if (soundEnabled) playSynthChime('click'); }}
            className={`flex-1 py-3 text-center border-b uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'modes'
                ? 'border-white text-white bg-[#0e0e11]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Các chế độ cài đặt
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Avatar section */}
              <div className="space-y-3">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Ảnh đại diện (Profile Image)
                </label>
                
                <div className="flex items-center gap-4">
                  <img 
                    src={avatarUrl} 
                    alt="Current Avatar" 
                    className="w-16 h-16 rounded-none object-cover border border-zinc-800 shadow-[0_0_15px_rgba(255,255,255,0.05)] bg-zinc-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Chọn nhanh từ thư viện Preset chất lượng cao, hoặc dán URL ảnh tùy chỉnh ở dưới.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handlePresetSelect(preset.url)}
                          className={`w-7 h-7 rounded-none overflow-hidden border transition-all cursor-pointer ${
                            avatarUrl === preset.url 
                              ? 'border-white ring-1 ring-white/50' 
                              : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-2 bg-[#09090b] border border-zinc-900 px-3 py-1.5 rounded-none">
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
                    <input
                      type="url"
                      value={customAvatarInput}
                      onChange={(e) => setCustomAvatarInput(e.target.value)}
                      onBlur={handleCustomAvatarBlur}
                      placeholder="Dán link ảnh Unsplash hoặc bất kỳ URL nào..."
                      className="bg-transparent text-xs text-zinc-300 focus:outline-none w-full font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center justify-center gap-3 border border-dashed border-zinc-850 hover:border-zinc-700 bg-[#09090b]/40 hover:bg-[#0c0c0e]/60 p-3 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-[#F97316]" />
                    <div className="text-left">
                      <span className="text-xs text-zinc-300 font-medium block">Tải ảnh đại diện mới</span>
                      <span className="text-[9px] text-zinc-500 font-mono">Chấp nhận PNG, JPG, WebP tối đa 1MB</span>
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
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Xuan Phuc"
                    className="w-full px-3 py-2 bg-[#09090b] text-zinc-100 font-sans text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                    Vai trò (Role Title)
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Master Editor"
                    className="w-full px-3 py-2 bg-[#09090b] text-zinc-100 font-sans text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Bio description */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  Tiểu sử / Khẩu hiệu cá nhân (Tagline)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Viết một câu mô tả ngắn về bản thân..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#09090b] text-zinc-300 font-sans text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700 resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                Workspace Operational Modes
              </span>

              {/* 1. Focus Mode */}
              <div className="p-4 bg-[#09090b] border border-zinc-900 rounded-none flex items-start gap-3 hover:border-zinc-800 transition-colors">
                <input
                  type="checkbox"
                  id="mode-focus"
                  checked={focusMode}
                  onChange={() => handleToggle(setFocusMode, focusMode)}
                  className="mt-1 accent-white h-3.5 w-3.5 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="mode-focus" className="text-xs font-bold text-zinc-200 block cursor-pointer">
                    CHẾ ĐỘ TẬP TRUNG (FOCUS MODE)
                  </label>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Ẩn bớt các mục phụ trên sidebar (Hộp Quick-Add) và bảng thống kê rườm rà dưới footer để bạn hoàn toàn tập trung vào xử lý bảng ma trận dự án.
                  </p>
                </div>
                {focusMode ? (
                  <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 uppercase">Kích hoạt</span>
                ) : (
                  <span className="text-[9px] font-mono bg-zinc-950 text-zinc-600 px-1.5 py-0.5 uppercase">Tắt</span>
                )}
              </div>

              {/* 2. Dense Layout Mode */}
              <div className="p-4 bg-[#09090b] border border-zinc-900 rounded-none flex items-start gap-3 hover:border-zinc-800 transition-colors">
                <input
                  type="checkbox"
                  id="mode-dense"
                  checked={denseLayout}
                  onChange={() => handleToggle(setDenseLayout, denseLayout)}
                  className="mt-1 accent-white h-3.5 w-3.5 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="mode-dense" className="text-xs font-bold text-zinc-200 block cursor-pointer">
                    GIAO DIỆN SIÊU THU GỌN (DENSE WORKSPACE)
                  </label>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Thu nhỏ kích thước hàng trong bảng ma trận, giảm lề đệm giúp hiển thị nhiều dữ liệu hơn trên cùng một màn hình điều khiển.
                  </p>
                </div>
                {denseLayout ? (
                  <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 uppercase">Kích hoạt</span>
                ) : (
                  <span className="text-[9px] font-mono bg-zinc-950 text-zinc-600 px-1.5 py-0.5 uppercase">Tắt</span>
                )}
              </div>

              {/* 3. Low Margin Alert */}
              <div className="p-4 bg-[#09090b] border border-zinc-900 rounded-none flex items-start gap-3 hover:border-zinc-800 transition-colors">
                <input
                  type="checkbox"
                  id="mode-low-margin"
                  checked={lowMarginAlert}
                  onChange={() => handleToggle(setLowMarginAlert, lowMarginAlert)}
                  className="mt-1 accent-white h-3.5 w-3.5 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="mode-low-margin" className="text-xs font-bold text-zinc-200 block cursor-pointer">
                    CẢNH BÁO LỢI NHUẬN THẤP (LOW MARGIN ALERTS)
                  </label>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Tự động gắn thẻ cảnh báo màu cam nhấp nháy cho bất kỳ dự án Video nào có biên lợi nhuận chênh lệch dưới 35% giúp bảo toàn ngân sách.
                  </p>
                </div>
                {lowMarginAlert ? (
                  <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 uppercase">Kích hoạt</span>
                ) : (
                  <span className="text-[9px] font-mono bg-zinc-950 text-zinc-600 px-1.5 py-0.5 uppercase">Tắt</span>
                )}
              </div>

              {/* 4. Sound Synthesis Toggle */}
              <div className="p-4 bg-[#09090b] border border-zinc-900 rounded-none flex items-start gap-3 hover:border-zinc-800 transition-colors">
                <input
                  type="checkbox"
                  id="mode-sound"
                  checked={soundEnabled}
                  onChange={() => handleToggle(setSoundEnabled, soundEnabled)}
                  className="mt-1 accent-white h-3.5 w-3.5 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="mode-sound" className="text-xs font-bold text-zinc-200 block cursor-pointer">
                    HIỆU ỨNG ÂM THANH TỔNG HỢP (SOUND SYNTH)
                  </label>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Phát các âm thanh bíp công nghệ cao (được tổng hợp trực tiếp qua chip Web Audio API) mỗi khi click, lưu cài đặt, hoặc đổi chế độ.
                  </p>
                </div>
                {soundEnabled ? (
                  <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 uppercase flex items-center gap-1">
                    <Volume2 className="w-2.5 h-2.5" /> Bật
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-zinc-950 text-zinc-600 px-1.5 py-0.5 uppercase flex items-center gap-1">
                    <VolumeX className="w-2.5 h-2.5" /> Tắt
                  </span>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer controls */}
        <div className="bg-[#0c0c0e] p-6 border-t border-zinc-900 flex justify-end gap-3 font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white text-[10px] uppercase rounded-none border border-zinc-800 cursor-pointer transition-colors"
          >
            Hủy (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-white hover:bg-zinc-200 text-black text-[10px] uppercase font-bold rounded-none cursor-pointer transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Lưu cài đặt (Save)
          </button>
        </div>
      </div>
    </div>
  );
}

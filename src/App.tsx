/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ClientObject, VideoTaskObject, StaffObject, TaskStatus, PaymentStatus, FinancialSummary } from './types';
import { INITIAL_CLIENTS, INITIAL_STAFF, INITIAL_TASKS } from './initialData';

import AuthGate from './components/AuthGate';
import KpiRibbon from './components/KpiRibbon';
import ClientSettingsHub from './components/ClientSettingsHub';
import TaskModal from './components/TaskModal';
import ProjectMatrix from './components/ProjectMatrix';
import TeamPipeline from './components/TeamPipeline';
import ArbitrageLedger from './components/ArbitrageLedger';
import GanttTimeline from './components/GanttTimeline';
import TaskCalendar from './components/TaskCalendar';
import ProfileSettingsModal, { UserProfile } from './components/ProfileSettingsModal';

import { 
  auth,
  loadWorkspaceData, 
  saveClient, 
  deleteClient, 
  saveStaff, 
  deleteStaff, 
  saveTask, 
  deleteTask, 
  saveProfile,
  clearAllWorkspaceData,
  resetWorkspaceDataToDefault
} from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import { 
  Layers, TrendingUp, Users, Settings, LogOut, 
  Clock, Database, RefreshCw,
  Menu, X, Calendar, Trash2, User, Sliders, Download, Upload
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'staff'>('staff');

  // Profile & Workspace Settings State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('deep_focus_os_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    return {
      name: 'Xuan Phuc',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Master Editor',
      bio: 'Xây dựng đế chế video ngắn hiệu suất cao.',
      focusMode: false,
      lowMarginAlert: true,
      denseLayout: false,
      soundEnabled: true,
    };
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core Data States
  const [clients, setClients] = useState<ClientObject[]>([]);
  const [tasks, setTasks] = useState<VideoTaskObject[]>([]);
  const [staff, setStaff] = useState<StaffObject[]>([]);

  // Month & Year Filtering States
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return localStorage.getItem('deep_focus_os_selected_year') || '2026';
  });

  const [selectedMonthOnly, setSelectedMonthOnly] = useState<string>(() => {
    return localStorage.getItem('deep_focus_os_selected_month_only') || '07';
  });

  // Navigation / UI States
  const [activeTab, setActiveTab] = useState<'matrix' | 'ledger' | 'staff' | 'timeline' | 'calendar'>('matrix');
  const [currency, setCurrency] = useState<'USD' | 'VND'>('USD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<VideoTaskObject | undefined>(undefined);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Real-time Clock
  const [time, setTime] = useState<string>('');

  // 1. Initialize & Seed State Engine from Firestore (with LocalStorage cache fallback) and Auth Observer
  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const data = await loadWorkspaceData();
        if (active) {
          setClients(data.clients);
          setStaff(data.staff);
          setTasks(data.tasks);
          if (data.profile) {
            setProfile(data.profile);
          }
        }
      } catch (err) {
        console.error("Failed to load Cloud Firestore data, falling back to localStorage cache:", err);
        if (active) {
          const savedClients = localStorage.getItem('deep_focus_os_clients');
          setClients(savedClients ? JSON.parse(savedClients) : INITIAL_CLIENTS);

          const savedStaff = localStorage.getItem('deep_focus_os_staff');
          setStaff(savedStaff ? JSON.parse(savedStaff) : INITIAL_STAFF);

          const savedTasks = localStorage.getItem('deep_focus_os_tasks');
          setTasks(savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        const role = user.email === 'work.xuanphuc@gmail.com' ? 'admin' : 'staff';
        setUserRole(role);
        localStorage.setItem('deep_focus_os_auth', role);
        loadData();
      } else {
        // Safe check for bypass/fallback local authenticated session
        const fallbackRole = localStorage.getItem('deep_focus_os_fallback_auth');
        if (fallbackRole === 'admin' || fallbackRole === 'staff') {
          setIsAuthenticated(true);
          setUserRole(fallbackRole as 'admin' | 'staff');
          loadData();
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('deep_focus_os_auth');
          loadData();
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Sync chosen Year and Month to localStorage
  useEffect(() => {
    localStorage.setItem('deep_focus_os_selected_year', selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    localStorage.setItem('deep_focus_os_selected_month_only', selectedMonthOnly);
  }, [selectedMonthOnly]);

  // Dynamically extract unique years and months from active tasks list to ensure the dropdowns are complete
  const availableYears = useMemo(() => {
    const yearsInTasks = tasks
      .map(t => {
        const match = t.internalDeadline.match(/^(\d{4})/);
        return match ? match[1] : '';
      })
      .filter(y => y !== '');
    const defaultYears = ['2025', '2026', '2027', '2028'];
    return Array.from(new Set([...defaultYears, ...yearsInTasks])).sort();
  }, [tasks]);

  const availableMonths = useMemo(() => {
    return ['all', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  }, []);

  // Filter tasks strictly by Year and Month selectors
  const tasksFilteredByMonth = useMemo(() => {
    return tasks.filter(t => {
      const taskYear = t.internalDeadline ? t.internalDeadline.substring(0, 4) : '';
      const taskMonth = t.internalDeadline ? t.internalDeadline.substring(5, 7) : '';
      
      const matchYear = selectedYear === 'all' || taskYear === selectedYear;
      const matchMonth = selectedMonthOnly === 'all' || taskMonth === selectedMonthOnly;
      
      return matchYear && matchMonth;
    });
  }, [tasks, selectedYear, selectedMonthOnly]);

  // Sync to LocalStorage on modifications
  const syncClientsToLocal = (updatedClients: ClientObject[]) => {
    setClients(updatedClients);
    localStorage.setItem('deep_focus_os_clients', JSON.stringify(updatedClients));
  };

  const syncStaffToLocal = (updatedStaff: StaffObject[]) => {
    setStaff(updatedStaff);
    localStorage.setItem('deep_focus_os_staff', JSON.stringify(updatedStaff));
  };

  const syncTasksToLocal = (updatedTasks: VideoTaskObject[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('deep_focus_os_tasks', JSON.stringify(updatedTasks));
    
    // Recalculate staff active workloads
    const updatedStaff = staff.map(member => {
      const activeCount = updatedTasks.filter(t => t.assignedEditorId === member.id && t.status !== 'Approved').length;
      return { ...member, activeTaskCount: activeCount };
    });
    setStaff(updatedStaff);
    localStorage.setItem('deep_focus_os_staff', JSON.stringify(updatedStaff));
  };

  // Real-time local clock (Format: YYYY-MM-DD HH:MM:SS)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      const sc = String(now.getSeconds()).padStart(2, '0');
      setTime(`${yr}-${mo}-${dy} ${hr}:${mi}:${sc}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Financial Summary Computations (Part 3 formulas) based on filtered tasks
  const getFinancialSummary = (): FinancialSummary => {
    const grossRevenue = tasksFilteredByMonth.reduce((sum, t) => sum + t.clientPay, 0);
    const subEditorPayout = tasksFilteredByMonth.reduce((sum, t) => sum + t.subPay, 0);
    const netProfit = grossRevenue - subEditorPayout;
    const arbitrageEfficiency = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return {
      grossRevenue,
      subEditorPayout,
      netProfit,
      arbitrageEfficiency
    };
  };

  // 3. Operational Logic handlers (Part 1, 2, 3)
  const handleAddClient = (newClient: ClientObject) => {
    const updated = [...clients, newClient];
    syncClientsToLocal(updated);
    saveClient(newClient);
  };

  const handleDeleteClient = (clientId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Client Segment',
      message: 'Bạn có chắc chắn muốn xóa Client Segment này khỏi hệ thống? Tất cả các video task thuộc client này sẽ không có Client được gắn nữa.',
      onConfirm: () => {
        const updated = clients.filter(c => c.id !== clientId);
        syncClientsToLocal(updated);
        deleteClient(clientId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveTask = (task: VideoTaskObject) => {
    const exists = tasks.some(t => t.id === task.id);
    let updated: VideoTaskObject[];
    
    if (exists) {
      updated = tasks.map(t => t.id === task.id ? task : t);
    } else {
      updated = [...tasks, task];
    }
    
    syncTasksToLocal(updated);
    saveTask(task);
    setIsTaskModalOpen(false);
    setEditingTask(undefined);
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Video Task',
      message: 'Bạn có chắc chắn muốn xóa Video Task này khỏi hệ thống?',
      onConfirm: () => {
        const updated = tasks.filter(t => t.id !== taskId);
        syncTasksToLocal(updated);
        deleteTask(taskId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteTasks = (taskIds: string[]) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa các Video Task đã chọn',
      message: `Bạn có chắc chắn muốn xóa ${taskIds.length} Video Task đã chọn khỏi hệ thống?`,
      onConfirm: () => {
        const updated = tasks.filter(t => !taskIds.includes(t.id));
        syncTasksToLocal(updated);
        taskIds.forEach(id => deleteTask(id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus, updates?: Partial<VideoTaskObject>) => {
    let taskToSave: VideoTaskObject | null = null;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const ut = { 
          ...t, 
          status, 
          ...updates 
        };
        taskToSave = ut;
        return ut;
      }
      return t;
    });
    syncTasksToLocal(updated);
    if (taskToSave) saveTask(taskToSave);
  };

  const handleUpdatePaymentStatus = (taskId: string, type: 'client' | 'sub', value: string) => {
    let taskToSave: VideoTaskObject | null = null;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const ut = type === 'client'
          ? { ...t, clientPaidStatus: value as PaymentStatus }
          : { ...t, subPaidStatus: value as 'Unpaid' | 'Paid' };
        taskToSave = ut;
        return ut;
      }
      return t;
    });
    syncTasksToLocal(updated);
    if (taskToSave) saveTask(taskToSave);
  };

  const handleReassignTask = (taskId: string, newEditorId: string) => {
    let taskToSave: VideoTaskObject | null = null;
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const ut = { ...t, assignedEditorId: newEditorId };
        taskToSave = ut;
        return ut;
      }
      return t;
    });
    syncTasksToLocal(updated);
    if (taskToSave) saveTask(taskToSave);
  };

  // Workforce Pipeline management
  const handleAddStaff = (newMember: StaffObject) => {
    const updated = [...staff, newMember];
    syncStaffToLocal(updated);
    saveStaff(newMember);
  };

  const handleUpdateStaff = (updatedMember: StaffObject) => {
    const updated = staff.map(s => s.id === updatedMember.id ? updatedMember : s);
    syncStaffToLocal(updated);
    saveStaff(updatedMember);
  };

  const handleDeleteStaff = (staffId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Editor',
      message: 'Bạn có chắc chắn muốn xóa Editor này khỏi hệ thống?',
      onConfirm: () => {
        const updated = staff.filter(s => s.id !== staffId);
        syncStaffToLocal(updated);
        deleteStaff(staffId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('deep_focus_os_auth');
    localStorage.removeItem('deep_focus_os_fallback_auth');
    setIsAuthenticated(false);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('deep_focus_os_profile', JSON.stringify(updatedProfile));
    saveProfile(updatedProfile);
  };

  const handleExportToCSV = () => {
    const headers = [
      'ID Task',
      'ID Khach Hang',
      'Ten Video',
      'Link Footage Goc',
      'Trang Thai',
      'Han Chot (Deadline)',
      'ID Nguoi Dung (Editor)',
      'Ghi Chu',
      'Chi Tra Khach Hang ($)',
      'Chi Tra Editor ($)',
      'Thanh Toan Khach Hang',
      'Thanh Toan Editor',
      'Link Rough Cut',
      'Link Final'
    ];

    const rows = tasks.map(t => [
      t.id,
      t.clientId,
      t.title,
      t.rawFootageLink || '',
      t.status,
      t.internalDeadline || '',
      t.assignedEditorId || '',
      t.notes || '',
      t.clientPay,
      t.subPay,
      t.clientPaidStatus,
      t.subPaidStatus,
      t.roughCutUrl || '',
      t.finalUrl || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const str = String(val ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
    ].join('\n');

    // Add UTF-8 BOM to prevent Vietnamese text corruption in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `deep_focus_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          alert('File CSV rỗng hoặc không hợp lệ.');
          return;
        }

        const parseCSVLine = (text: string) => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
              if (inQuotes && text[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const parsedTasks: VideoTaskObject[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const columns = parseCSVLine(lines[i]);
          if (columns.length < 3) continue;

          const id = columns[0] || `task_${Date.now()}_${i}`;
          const clientId = columns[1] || 'unassigned';
          const title = columns[2] || 'Untitled Video';
          const rawFootageLink = columns[3] || '';
          const status = (columns[4] || 'Unassigned') as TaskStatus;
          const internalDeadline = columns[5] || '';
          const assignedEditorId = columns[6] || 'Unassigned';
          const notes = columns[7] || '';
          const clientPay = Number(columns[8]) || 0;
          const subPay = Number(columns[9]) || 0;
          const clientPaidStatus = (columns[10] || 'Unpaid') as PaymentStatus;
          const subPaidStatus = (columns[11] || 'Unpaid') as 'Unpaid' | 'Paid';
          const roughCutUrl = columns[12] || '';
          const finalUrl = columns[13] || '';

          parsedTasks.push({
            id,
            clientId,
            title,
            rawFootageLink,
            status,
            internalDeadline,
            assignedEditorId,
            notes,
            clientPay,
            subPay,
            clientPaidStatus,
            subPaidStatus,
            roughCutUrl,
            finalUrl
          });
        }

        if (parsedTasks.length > 0) {
          setIsLoading(true);
          const updatedTasks = [...tasks];
          for (const pt of parsedTasks) {
            const idx = updatedTasks.findIndex(t => t.id === pt.id);
            if (idx >= 0) {
              updatedTasks[idx] = pt;
            } else {
              updatedTasks.push(pt);
            }
            await saveTask(pt);
          }
          syncTasksToLocal(updatedTasks);
          setIsLoading(false);
          alert(`Đã import thành công ${parsedTasks.length} video tasks vào hệ thống Cloud Firebase!`);
        }
      } catch (err) {
        console.error('Error importing CSV:', err);
        setIsLoading(false);
        alert('Đã xảy ra lỗi khi parse file CSV. Vui lòng kiểm tra định dạng.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSeedReset = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Dữ Liệu Mẫu',
      message: 'Bạn có chắc chắn muốn reset toàn bộ dữ liệu mẫu ban đầu trên Cloud Firebase? Tất cả thay đổi hiện tại của bạn sẽ bị ghi đè.',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await resetWorkspaceDataToDefault(clients, staff, tasks);
          setClients(INITIAL_CLIENTS);
          setStaff(INITIAL_STAFF);
          setTasks(INITIAL_TASKS);
          localStorage.setItem('deep_focus_os_clients', JSON.stringify(INITIAL_CLIENTS));
          localStorage.setItem('deep_focus_os_staff', JSON.stringify(INITIAL_STAFF));
          localStorage.setItem('deep_focus_os_tasks', JSON.stringify(INITIAL_TASKS));
        } catch (e) {
          console.error("Failed to seed database:", e);
        } finally {
          setIsLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleClearAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'XÓA SẠCH TOÀN BỘ DỮ LIỆU',
      message: 'BẠN CÓ CHẮC CHẮN MUỐN XÓA SẠCH TOÀN BỘ DỮ LIỆU TRÊN CLOUD? Hành động này sẽ xóa tất cả các task, editor và client hiện tại của bạn.',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await clearAllWorkspaceData(clients, staff, tasks);
          setClients([]);
          setStaff([]);
          setTasks([]);
          localStorage.setItem('deep_focus_os_clients', JSON.stringify([]));
          localStorage.setItem('deep_focus_os_staff', JSON.stringify([]));
          localStorage.setItem('deep_focus_os_tasks', JSON.stringify([]));
        } catch (e) {
          console.error("Failed to clear cloud database:", e);
        } finally {
          setIsLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Auth Guard Gate
  if (!isAuthenticated) {
    return <AuthGate onAuthenticated={(role) => {
      setIsAuthenticated(true);
      setUserRole(role);
    }} />;
  }

  // Loading screen for Cloud Database synchronization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0C0A08] flex flex-col items-center justify-center p-6 text-center select-none antialiased">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full border border-[#F97316]/20 animate-ping duration-1000"></div>
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#F97316] animate-spin flex items-center justify-center">
            <Database className="w-6 h-6 text-[#F97316]" />
          </div>
        </div>
        <h2 className="text-sm font-black tracking-widest text-[#F0E6D8] uppercase mb-2">
          DEEP FOCUS CLOUD SYSTEM
        </h2>
        <div className="text-[10px] font-mono text-[#F97316]/80 tracking-widest animate-pulse uppercase flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin" />
          ESTABLISHING FIREBASE CLOUD SYNC...
        </div>
        <div className="mt-8 border border-[rgba(249,115,22,0.15)] bg-[#161210]/60 p-3 rounded-sm text-[8px] font-mono text-zinc-500 max-w-xs text-left uppercase leading-relaxed">
          <p className="mb-1 text-emerald-500">▶ SYS_INIT: Connecting to gen-lang-client...</p>
          <p className="mb-1 text-emerald-500">▶ DB_AUTH: Accessing custom secure database...</p>
          <p>▶ SYNC_STATE: Synchronizing client pipelines, sub-editor balances, and active video segments...</p>
        </div>
      </div>
    );
  }

  const summary = getFinancialSummary();

  return (
    <div id="app-root" className="min-h-screen bg-[#0C0A08] text-[#F0E6D8] font-sans flex flex-col md:flex-row antialiased select-none tracking-tight">
      
      {/* 1. Left Sidebar Navigation Panel (APEX Editors / Warm Creator Tone Style) */}
      <aside id="sidebar-panel" className="w-full md:w-64 bg-[#161210] border-r border-[rgba(249,115,22,0.15)] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-[rgba(249,115,22,0.15)] flex items-center justify-between bg-[#161210]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#F97316] flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                <span className="text-black font-black text-lg italic tracking-tighter">DF</span>
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tighter uppercase leading-none text-white">
                  DEEP FOCUS OS
                </h1>
                <p className="text-[9px] text-[#71717a] font-mono tracking-widest mt-1 uppercase">
                  COMMAND v4.0.26
                </p>
              </div>
            </div>
            {/* Mobile Hamburger toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden text-[#71717a] hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Nav Items (Desktop visible, Mobile dynamic toggle) */}
          <nav className={`p-4 space-y-2 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] px-2 block mb-2">
              Management Modules
            </span>

            <button
              onClick={() => { setActiveTab('matrix'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all border-l-2 cursor-pointer ${
                activeTab === 'matrix' 
                  ? 'bg-[#1E1810] border-[#F97316] text-[#F97316] font-black' 
                  : 'bg-transparent border-transparent text-[#B8967D] hover:text-white hover:bg-[#1E1810]/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>PROJECT MATRIX</span>
              </span>
              <span className="text-[9px] font-mono opacity-60">[{tasksFilteredByMonth.length}]</span>
            </button>

            <button
              onClick={() => { setActiveTab('ledger'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all border-l-2 cursor-pointer ${
                activeTab === 'ledger' 
                  ? 'bg-[#1E1810] border-[#E8B849] text-[#E8B849] font-black' 
                  : 'bg-transparent border-transparent text-[#B8967D] hover:text-white hover:bg-[#1E1810]/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>ARBITRAGE LEDGER</span>
              </span>
              <span className="text-[9px] font-mono opacity-60">[$]</span>
            </button>

            <button
              onClick={() => { setActiveTab('staff'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all border-l-2 cursor-pointer ${
                activeTab === 'staff' 
                  ? 'bg-[#1E1810] border-[#F97316] text-[#F97316] font-black' 
                  : 'bg-transparent border-transparent text-[#B8967D] hover:text-white hover:bg-[#1E1810]/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>WORKFORCE PIPELINE</span>
              </span>
              <span className="text-[9px] font-mono opacity-60">[{staff.length}]</span>
            </button>

            <button
              onClick={() => { setActiveTab('timeline'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all border-l-2 cursor-pointer ${
                activeTab === 'timeline' 
                  ? 'bg-[#1E1810] border-[#F97316] text-[#F97316] font-black' 
                  : 'bg-transparent border-transparent text-[#B8967D] hover:text-white hover:bg-[#1E1810]/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>GANTT TIMELINE</span>
              </span>
              <span className="text-[9px] font-mono opacity-60">[📊]</span>
            </button>

            <button
              onClick={() => { setActiveTab('calendar'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all border-l-2 cursor-pointer ${
                activeTab === 'calendar' 
                  ? 'bg-[#1E1810] border-[#F97316] text-[#F97316] font-black' 
                  : 'bg-transparent border-transparent text-[#B8967D] hover:text-white hover:bg-[#1E1810]/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>TASK CALENDAR</span>
              </span>
              <span className="text-[9px] font-mono opacity-60">[{tasksFilteredByMonth.length}]</span>
            </button>

            <div className="h-px bg-[rgba(249,115,22,0.15)] my-4"></div>
            
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] px-2 block mb-2">
              Data Synchronization
            </span>

            <button
              onClick={handleExportToCSV}
              className="w-full text-left px-3 py-2 text-xs font-medium text-[#B8967D] hover:text-[#10b981] hover:bg-[#1E1810]/40 transition-all flex items-center gap-2 cursor-pointer"
              title="Xuất dữ liệu Tasks ra Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 shrink-0 text-[#10b981]" />
              <span>XUẤT EXCEL / CSV</span>
            </button>

            <label
              className="w-full text-left px-3 py-2 text-xs font-medium text-[#B8967D] hover:text-[#06b6d4] hover:bg-[#1E1810]/40 transition-all flex items-center gap-2 cursor-pointer"
              title="Nhập dữ liệu Tasks từ file CSV"
            >
              <Upload className="w-3.5 h-3.5 shrink-0 text-[#06b6d4]" />
              <span>NHẬP EXCEL / CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportFromCSV}
                className="hidden"
              />
            </label>

            <div className="h-px bg-[rgba(249,115,22,0.15)] my-4"></div>
            
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] px-2 block mb-2">
              System Configuration
            </span>

            <button
              onClick={() => setIsClientModalOpen(true)}
              className="w-full text-left px-3 py-2 text-xs font-medium text-[#B8967D] hover:text-white hover:bg-[#1E1810]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>CONFIGURE CLIENTS</span>
            </button>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full text-left px-3 py-2 text-xs font-medium text-[#B8967D] hover:text-white hover:bg-[#1E1810]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0 text-[#F97316]/80" />
              <span>PROFILE & MODES</span>
            </button>

            <button
              onClick={handleSeedReset}
              className="w-full text-left px-3 py-2 text-xs font-medium text-[#B8967D] hover:text-[#F97316] hover:bg-[#1E1810]/40 transition-all flex items-center gap-2 cursor-pointer"
              title="Reset về dữ liệu mẫu"
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>RESET DATABASE (MẪU)</span>
            </button>

            <button
              onClick={handleClearAllData}
              className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:text-red-500 hover:bg-red-950/20 transition-all flex items-center gap-2 cursor-pointer"
              title="Xóa tất cả để tạo mới"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span className="font-bold">XÓA SẠCH DỮ LIỆU</span>
            </button>
          </nav>

          {/* Quick task-add micro container */}
          {!profile.focusMode && (
            <div className="p-4 mx-4 my-2 bg-[#F97316]/5 border border-[#F97316]/20 rounded-sm hidden md:block">
              <h4 className="text-[10px] font-black uppercase text-[#F97316] mb-2 tracking-wider">Project Quick-Add</h4>
              <button 
                onClick={() => { setEditingTask(undefined); setIsTaskModalOpen(true); }}
                className="w-full py-1.5 bg-[#F97316] hover:bg-[#ea6c0a] text-white text-[10px] font-black uppercase rounded-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.3)]"
              >
                Deploy New Task
              </button>
            </div>
          )}
        </div>

        {/* User profile footer bar */}
        <div className="p-4 border-t border-[rgba(249,115,22,0.15)] bg-[#161210]">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 text-left flex-1 min-w-0 group cursor-pointer"
              title="Cấu hình Profile & Workspace"
            >
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-8 h-8 rounded-sm object-cover border border-[rgba(249,115,22,0.15)] group-hover:border-white transition-all shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#F0E6D8] truncate group-hover:text-white transition-colors">
                  {profile.name}
                </p>
                <span className="text-[9px] font-mono text-[#71717a] block uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
                  {profile.role || (userRole === 'admin' ? 'SYS_ADMIN' : 'CONTRACTOR')}
                </span>
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-950/20 text-[#71717a] hover:text-red-400 rounded-md transition-colors cursor-pointer"
              title="Terminate session Connection"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Executive Workspace Content Area */}
      <main id="main-content-panel" className="flex-1 bg-[#0C0A08] overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-8 md:p-10 space-y-10">
          
          {/* Top Control Header bar */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-zinc-900 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white flex items-center justify-center rounded-none shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                <span className="text-black font-serif font-bold text-lg italic">df</span>
              </div>
              <div>
                <h1 className="text-3xl font-serif font-light tracking-tight text-zinc-100">
                  Deep Focus OS
                </h1>
                <p className="text-[10px] text-[#71717a] font-mono tracking-widest mt-1 uppercase">
                  Production Command Center v4.0.26
                </p>
              </div>
            </div>

          <div className="flex items-center gap-4 flex-wrap w-full lg:w-auto lg:justify-end">
            
            {/* Realtime Year & Month Filters */}
            <div className="flex items-center gap-2">
              {/* Year Selector */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-none text-xs font-mono text-zinc-300">
                <span className="text-zinc-500 font-bold text-[10px] uppercase">Năm:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-zinc-300 font-bold border-none focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-zinc-950 text-zinc-300">Tất cả năm (All)</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr} className="bg-zinc-950 text-zinc-300">
                      Năm {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-none text-xs font-mono text-zinc-300">
                <span className="text-zinc-500 font-bold text-[10px] uppercase">Tháng:</span>
                <select
                  value={selectedMonthOnly}
                  onChange={(e) => setSelectedMonthOnly(e.target.value)}
                  className="bg-transparent text-zinc-300 font-bold border-none focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-zinc-950 text-zinc-300">Tất cả tháng (All)</option>
                  {availableMonths.filter(m => m !== 'all').map(mo => (
                    <option key={mo} value={mo} className="bg-zinc-950 text-zinc-300">
                      Tháng {mo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-zinc-900 hidden lg:block"></div>

            {/* Session tracking parameters */}
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Session Active</span>
              <span className="text-xs font-mono text-zinc-300">SYS_ADMIN: {userRole.toUpperCase()}</span>
            </div>

            <div className="h-6 w-[1px] bg-zinc-900 hidden lg:block"></div>

            {/* Realtime Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-none text-[10px] font-mono text-zinc-400">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{time || 'Syncing Local Time...'}</span>
            </div>

            {/* Currency selector parameter */}
            <div className="flex items-center gap-0.5 bg-zinc-950 border border-zinc-900 p-0.5 rounded-none text-[9px] font-mono">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded-none cursor-pointer ${currency === 'USD' ? 'bg-white text-black font-bold' : 'text-zinc-600 hover:text-white'}`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('VND')}
                className={`px-2 py-1 rounded-none cursor-pointer ${currency === 'VND' ? 'bg-white text-black font-bold' : 'text-zinc-600 hover:text-white'}`}
              >
                VND (₫)
              </button>
            </div>
          </div>
        </header>

        {/* Real-Time Executive KPIs Dashboard (Part 3) */}
        <KpiRibbon summary={summary} currency={currency} />

        {/* Dynamic Display Panels switcher */}
        <section id="workspace-dynamic-view" className="bg-zinc-950/20 border-none p-0">
          {activeTab === 'matrix' && (
            <ProjectMatrix 
              tasks={tasksFilteredByMonth}
              clients={clients}
              staff={staff}
              role={userRole}
              onAddTaskClick={() => { setEditingTask(undefined); setIsTaskModalOpen(true); }}
              onEditTaskClick={(task) => { setEditingTask(task); setIsTaskModalOpen(true); }}
              onDeleteTask={handleDeleteTask}
              onDeleteTasks={handleDeleteTasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onSaveTask={handleSaveTask}
              currency={currency}
              denseLayout={profile.denseLayout}
              lowMarginAlert={profile.lowMarginAlert}
            />
          )}

          {activeTab === 'ledger' && (
            <ArbitrageLedger 
              tasks={tasksFilteredByMonth}
              clients={clients}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              currency={currency}
            />
          )}

          {activeTab === 'staff' && (
            <TeamPipeline 
              staff={staff}
              tasks={tasks}
              onReassignTask={handleReassignTask}
              currency={currency}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {activeTab === 'timeline' && (
            <GanttTimeline 
              tasks={tasksFilteredByMonth}
              clients={clients}
              staff={staff}
              onEditTaskClick={(task) => { setEditingTask(task); setIsTaskModalOpen(true); }}
              onSaveTask={handleSaveTask}
              selectedYear={selectedYear}
              selectedMonthOnly={selectedMonthOnly}
              currency={currency}
            />
          )}

          {activeTab === 'calendar' && (
            <TaskCalendar 
              tasks={tasksFilteredByMonth}
              clients={clients}
              staff={staff}
              onAddTaskClick={() => { setEditingTask(undefined); setIsTaskModalOpen(true); }}
              onEditTaskClick={(task) => { setEditingTask(task); setIsTaskModalOpen(true); }}
              onSaveTask={handleSaveTask}
              selectedYear={selectedYear}
              selectedMonthOnly={selectedMonthOnly}
              currency={currency}
            />
          )}
        </section>

        </div>

        {/* Footer info block */}
        <div className="max-w-6xl mx-auto px-8 md:px-10 pb-8">
          <footer className="flex flex-col sm:flex-row justify-between items-center py-4 border-t border-zinc-900 gap-3">
            <div className="flex flex-wrap items-center gap-6 text-[10px] text-[#71717a] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
                DATABASE SYNCED
              </div>
              {profile.focusMode ? (
                <div className="text-[#10b981] font-bold tracking-widest animate-pulse">[FOCUS WORKSPACE ACTIVE]</div>
              ) : (
                <>
                  <div>Uptime: 242:12:05</div>
                  <div>Latency: 14ms</div>
                </>
              )}
            </div>
            <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
              PROPRIETARY TECHNOLOGY OF APEX EDITORS &copy; 2026
            </div>
          </footer>
        </div>
      </main>

      {/* 3. Overlay Modal Components */}
      {/* Client Matrix Configurations */}
      {isClientModalOpen && (
        <ClientSettingsHub 
          clients={clients}
          onAddClient={handleAddClient}
          onDeleteClient={handleDeleteClient}
          onClose={() => setIsClientModalOpen(false)}
        />
      )}

      {/* Profile & Workspace Modes Settings */}
      {isProfileModalOpen && (
        <ProfileSettingsModal 
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* Task Creation & Editing specs Modal */}
      {isTaskModalOpen && (
        <TaskModal 
          task={editingTask}
          clients={clients}
          staff={staff}
          onSave={handleSaveTask}
          onClose={() => { setIsTaskModalOpen(false); setEditingTask(undefined); }}
          selectedMonth={selectedYear !== 'all' && selectedMonthOnly !== 'all' ? `${selectedYear}-${selectedMonthOnly}` : '2026-07'}
        />
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 bg-zinc-950 border border-zinc-900 rounded-none shadow-2xl mx-4">
            <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase mb-3 flex items-center gap-2">
              [SYSTEM CONFIRMATION]
            </h3>
            <h4 className="text-sm font-serif font-light text-zinc-100 uppercase mb-2">
              {confirmModal.title}
            </h4>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-6 whitespace-pre-line">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 font-mono">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white text-[10px] uppercase rounded-none border border-zinc-800 cursor-pointer transition-colors"
              >
                Hủy (Cancel)
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-[10px] uppercase font-bold rounded-none cursor-pointer transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                Xác nhận (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

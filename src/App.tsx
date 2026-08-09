/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ProfileSettingsModal, { UserProfile } from './components/ProfileSettingsModal';
import InvoiceGeneratorModal from './components/InvoiceGeneratorModal';
import { convertToUSD } from './utils/currency';

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
  Clock, Database, RefreshCw, BarChart3,
  Menu, X, Calendar, Trash2, User, Sliders, Download, Upload,
  CloudOff, AlertTriangle, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen,
  FileText
} from 'lucide-react';

const THEME_COLORS = [
  { id: 'sapphire', name: 'ThomasVisual Sapphire Blue', hexColor: '#2563EB', hoverColor: '#1d4ed8' },
  { id: 'amber', name: 'Cyberpunk Amber', hexColor: '#F97316', hoverColor: '#ea6c0a' },
  { id: 'emerald', name: 'Forest Emerald', hexColor: '#10B981', hoverColor: '#059669' },
  { id: 'violet', name: 'Royal Violet', hexColor: '#8B5CF6', hoverColor: '#7C3AED' },
  { id: 'cyan', name: 'Electric Ice', hexColor: '#06B6D4', hoverColor: '#0891B2' },
];

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'staff'>('staff');

  // Sidebar Collapse / Hide State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Dynamic Theme Customization Color State
  const [themeColorId, setThemeColorId] = useState<string>(() => {
    return localStorage.getItem('deep_focus_os_theme_color_id') || 'sapphire';
  });

  const activeThemeColor = useMemo(() => {
    return THEME_COLORS.find(c => c.id === themeColorId) || THEME_COLORS[0];
  }, [themeColorId]);

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
  const [isCloudSyncFailed, setIsCloudSyncFailed] = useState<boolean>(false);
  const [cloudErrorMsg, setCloudErrorMsg] = useState<string>('');

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
  const [activeTab, setActiveTab] = useState<'analytics' | 'matrix' | 'ledger' | 'staff' | 'timeline' | 'calendar'>('matrix');
  const [currency, setCurrency] = useState<'USD' | 'VND'>('USD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
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
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadWorkspaceData();
      
      // Auto-repair missing clients from task clientId attributes if user deleted clients
      const loadedClients = [...(data.clients || [])];
      const loadedTasks = data.tasks || [];
      const uniqueTaskClientIds = Array.from(new Set(loadedTasks.map(t => t.clientId))).filter(id => id && id !== 'unassigned');
      
      let clientsRepaired = false;
      for (const cId of uniqueTaskClientIds) {
        if (!loadedClients.some(c => c.id === cId || c.displayName === cId)) {
          const newClient: ClientObject = {
            id: cId,
            displayName: cId,
            tier: 'Standard',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            totalSpend: 0,
            contractValue: 0
          };
          loadedClients.push(newClient);
          saveClient(newClient);
          clientsRepaired = true;
        }
      }

      setClients(loadedClients);
      setStaff(data.staff);
      setTasks(loadedTasks);
      if (clientsRepaired) {
        localStorage.setItem('deep_focus_os_clients', JSON.stringify(loadedClients));
      }
      if (data.profile) {
        setProfile(data.profile);
      }
      setIsCloudSyncFailed(false);
      setCloudErrorMsg('');
    } catch (err: any) {
      console.error("Failed to load Cloud Firestore data, falling back to localStorage cache:", err);
      setIsCloudSyncFailed(true);
      setCloudErrorMsg(err?.message || String(err));
      const savedClients = localStorage.getItem('deep_focus_os_clients');
      setClients(savedClients ? JSON.parse(savedClients) : INITIAL_CLIENTS);

      const savedStaff = localStorage.getItem('deep_focus_os_staff');
      setStaff(savedStaff ? JSON.parse(savedStaff) : INITIAL_STAFF);

      const savedTasks = localStorage.getItem('deep_focus_os_tasks');
      setTasks(savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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
      unsubscribe();
    };
  }, [loadData]);

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
    const grossRevenue = tasksFilteredByMonth.reduce((sum, t) => sum + convertToUSD(t.clientPay || 0, t.currency || 'USD'), 0);
    const subEditorPayout = tasksFilteredByMonth.reduce((sum, t) => sum + convertToUSD(t.subPay || 0, t.currency || 'USD'), 0);
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

  const handleUpdateClient = (updatedClient: ClientObject) => {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    syncClientsToLocal(updated);
    saveClient(updatedClient);
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
          const updatedClients = [...clients];

          // Auto-detect and create missing clients from imported tasks
          const uniqueClientIds = Array.from(new Set(parsedTasks.map(t => t.clientId)))
            .filter(id => id && id.trim() !== '' && id !== 'unassigned');

          let newClientsCount = 0;
          for (const cId of uniqueClientIds) {
            const exists = updatedClients.some(c => c.id === cId || c.displayName === cId);
            if (!exists) {
              const newClient: ClientObject = {
                id: cId,
                displayName: cId,
                tier: 'Standard',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                totalSpend: 0,
                contractValue: 0
              };
              updatedClients.push(newClient);
              await saveClient(newClient);
              newClientsCount++;
            }
          }

          if (newClientsCount > 0) {
            syncClientsToLocal(updatedClients);
          }

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
          alert(`Đã import thành công ${parsedTasks.length} video tasks và tự động nhận diện/tạo mới ${newClientsCount} khách hàng vào Cloud Firebase!`);
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
      loadData();
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
    <div id="app-root" className="min-h-screen bg-black text-white font-sans flex flex-col md:flex-row antialiased select-none tracking-tight relative overflow-x-hidden">
      {/* Tactile Film Grain Noise & Ambient Edit Blur Spots from Portfolio */}
      <div className="noise-overlay" />
      <div className="bg-edit-blur-1 top-10 left-1/4" />
      <div className="bg-edit-blur-2 top-1/2 -right-20" />
      <div className="bg-edit-blur-amber bottom-20 left-10" />
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-accent: ${activeThemeColor.hexColor};
          --primary-accent-glow: ${activeThemeColor.hexColor}40;
          --primary-accent-border: ${activeThemeColor.hexColor}20;
        }
        /* Override orange text and background classes dynamically */
        .text-\\[\\#F97316\\] { color: ${activeThemeColor.hexColor} !important; }
        .text-\\[rgba\\(249\\,115\\,22\\,0\\.8\\)\\] { color: ${activeThemeColor.hexColor}cc !important; }
        .hover\\:text-\\[\\#F97316\\]:hover { color: ${activeThemeColor.hexColor} !important; }
        .bg-\\[\\#F97316\\] { background-color: ${activeThemeColor.hexColor} !important; }
        .hover\\:bg-\\[\\#ea6c0a\\]:hover { background-color: ${activeThemeColor.hoverColor} !important; }
        .bg-\\[\\#F97316\\]\\/5 { background-color: ${activeThemeColor.hexColor}0d !important; }
        .bg-\\[\\#F97316\\]\\/2 { background-color: ${activeThemeColor.hexColor}05 !important; }
        .bg-\\[\\#F97316\\]\\/10 { background-color: ${activeThemeColor.hexColor}1a !important; }
        .border-\\[\\#F97316\\] { border-color: ${activeThemeColor.hexColor} !important; }
        .border-\\[\\#F97316\\]\\/20 { border-color: ${activeThemeColor.hexColor}33 !important; }
        .border-\\[\\#F97316\\]\\/50 { border-color: ${activeThemeColor.hexColor}80 !important; }
        .ring-\\[\\#F97316\\]\\/50 { --tw-ring-color: ${activeThemeColor.hexColor}80 !important; }
        .ring-\\[\\#F97316\\]\\/10 { --tw-ring-color: ${activeThemeColor.hexColor}1a !important; }
        .shadow-\\[\\#F97316\\] { --tw-shadow-color: ${activeThemeColor.hexColor} !important; }
        .shadow-\\[0_0_15px_rgba\\(249\\,115\\,22\\,0\\.5\\)\\] { box-shadow: 0 0 15px ${activeThemeColor.hexColor}80 !important; }
        .shadow-\\[0_0_10px_rgba\\(249\\,115\\,22\\,0\\.3\\)\\] { box-shadow: 0 0 10px ${activeThemeColor.hexColor}4d !important; }
        .shadow-\\[0_0_15px_rgba\\(249\\,115\\,22\\,0\\.1\\)\\] { box-shadow: 0 0 15px ${activeThemeColor.hexColor}1a !important; }
        .border-\\[rgba\\(249\\,115\\,22\\,0\\.15\\)\\] { border-color: ${activeThemeColor.hexColor}26 !important; }
        .from-\\[\\#F97316\\] { --tw-gradient-from: ${activeThemeColor.hexColor} !important; }
        .to-\\[\\#F97316\\] { --tw-gradient-to: ${activeThemeColor.hexColor} !important; }
        /* Extra styles to ensure complete branding takeover */
        .border-t-2.border-r-2.border-\\[\\#F97316\\] { border-color: ${activeThemeColor.hexColor} !important; }
        .text-\\[\\#F97316\\]\\/80 { color: ${activeThemeColor.hexColor}cc !important; }
        .border-\\[rgba\\(249\\,115\\,22\\,0\\.15\\)\\] { border-color: ${activeThemeColor.hexColor}26 !important; }
        .text-\\[\\#E8B849\\] { color: ${activeThemeColor.hexColor} !important; }
        .border-\\[\\#E8B849\\] { border-color: ${activeThemeColor.hexColor} !important; }
        .bg-\\[\\#1E1810\\] { background-color: ${activeThemeColor.hexColor}15 !important; }
        .bg-\\[\\#1E1810\\]\\/40 { background-color: ${activeThemeColor.hexColor}08 !important; }
      `}} />
      
      {/* 1. Left Sidebar Navigation Panel - Translucent Glass, Minimal Icon + Name & Collapsible */}
      <aside 
        id="sidebar-panel" 
        className={`bg-black/60 border-r border-white/10 backdrop-blur-2xl flex flex-col justify-between shrink-0 font-haas relative z-20 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'
        }`}
      >
        <div>
          {/* Logo Brand Header & Collapse Toggle */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-[6px] shadow-[0_0_15px_rgba(37,99,235,0.6)] shrink-0">
                <span className="text-white font-black text-xs italic tracking-tighter">DF</span>
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-xs font-extrabold tracking-tight uppercase leading-none text-white font-haas truncate">
                    DEEP FOCUS OS
                  </h1>
                  <p className="text-[9px] text-slate-400 font-mono tracking-widest mt-1 uppercase truncate">
                    COMMAND v4.0.26
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Collapse/Expand Toggle Button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-[6px] transition-colors cursor-pointer"
                title={isSidebarCollapsed ? "Mở rộng Panel" : "Thu gọn Panel"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-blue-400" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>

              {/* Mobile Hamburger toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden text-slate-400 hover:text-white p-1"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Nav Items */}
          <nav className={`p-3 space-y-1.5 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 px-2 block mb-2">
                MODULES
              </span>
            )}

            {[
              { id: 'analytics', label: 'ANALYTICS DASHBOARD', icon: BarChart3 },
              { id: 'matrix', label: 'PROJECT MATRIX', icon: Layers },
              { id: 'ledger', label: 'ARBITRAGE LEDGER', icon: TrendingUp },
              { id: 'staff', label: 'WORKFORCE PIPELINE', icon: Users },
              { id: 'timeline', label: 'GANTT TIMELINE', icon: Clock },
              { id: 'calendar', label: 'TASK CALENDAR', icon: Calendar }
            ].map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer rounded-[6px] ${
                    isActive 
                      ? 'bg-blue-600/20 border-l-2 border-blue-500 text-white font-extrabold shadow-[0_0_12px_rgba(37,99,235,0.3)]' 
                      : 'bg-transparent border-l-2 border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="uppercase tracking-tight truncate">{item.label}</span>
                  )}
                </button>
              );
            })}

            <div className="h-px bg-white/10 my-3" />

            {!isSidebarCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 px-2 block mb-2">
                DATA & SYSTEM
              </span>
            )}

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Xuất Hóa đơn PDF / In biên nhận cho Khách hàng cuối tháng"
            >
              <FileText className="w-4 h-4 shrink-0 text-blue-400" />
              {!isSidebarCollapsed && <span>XUẤT HÓA ĐƠN CUỐI THÁNG</span>}
            </button>

            <button
              onClick={handleExportToCSV}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Xuất dữ liệu Tasks ra Excel/CSV"
            >
              <Download className="w-4 h-4 shrink-0 text-slate-400" />
              {!isSidebarCollapsed && <span>XUẤT EXCEL / CSV</span>}
            </button>

            <label
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Nhập dữ liệu Tasks từ file CSV"
            >
              <Upload className="w-4 h-4 shrink-0 text-slate-400" />
              {!isSidebarCollapsed && <span>NHẬP EXCEL / CSV</span>}
              <input
                type="file"
                accept=".csv"
                onChange={handleImportFromCSV}
                className="hidden"
              />
            </label>

            <button
              onClick={loadData}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold transition-all cursor-pointer rounded-[6px] text-slate-400 hover:text-white hover:bg-white/5 ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Click để kết nối lại và đồng bộ với Cloud Firestore Database"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isCloudSyncFailed ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
              {!isSidebarCollapsed && <span>{isCloudSyncFailed ? 'KẾT NỐI CLOUD' : 'ĐÃ ĐỒNG BỘ CLOUD'}</span>}
            </button>

            <div className="h-px bg-white/10 my-3" />

            <button
              onClick={() => setIsClientModalOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Configure Clients"
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              {!isSidebarCollapsed && <span>CONFIGURE CLIENTS</span>}
            </button>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Profile & Modes"
            >
              <Sliders className="w-4 h-4 shrink-0 text-slate-400" />
              {!isSidebarCollapsed && <span>PROFILE & MODES</span>}
            </button>

            <button
              onClick={handleSeedReset}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Reset to initial demo database"
            >
              <Database className="w-4 h-4 shrink-0 text-slate-400" />
              {!isSidebarCollapsed && <span>RESET DEMO DATABASE</span>}
            </button>

            <button
              onClick={handleClearAllData}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Purge all workspace data"
            >
              <Trash2 className="w-4 h-4 shrink-0 text-slate-400" />
              {!isSidebarCollapsed && <span>PURGE ALL DATA</span>}
            </button>
          </nav>

          {/* Quick task-add micro container */}
          {!profile.focusMode && !isSidebarCollapsed && (
            <div className="p-3 mx-3 my-2 bg-white/[0.02] border border-white/10 rounded-[6px] hidden md:block">
              <h4 className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-2 tracking-widest">PROJECT QUICK-ADD</h4>
              <button 
                onClick={() => { setEditingTask(undefined); setIsTaskModalOpen(true); }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold uppercase rounded-[6px] transition-all cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.5)]"
              >
                Deploy New Task
              </button>
            </div>
          )}
        </div>

        {/* User profile footer bar */}
        <div className="p-3 border-t border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 text-left flex-1 min-w-0 group cursor-pointer"
              title="Configure Profile & Workspace"
            >
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-blue-400 transition-all shrink-0"
              />
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {profile.name}
                  </p>
                  <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                    {profile.role || (userRole === 'admin' ? 'SYS_ADMIN' : 'CONTRACTOR')}
                  </span>
                </div>
              )}
            </button>
            {!isSidebarCollapsed && (
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-[6px] transition-colors cursor-pointer"
                title="Terminate session Connection"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Executive Workspace Content Area */}
      <main id="main-content-panel" className="flex-1 bg-[#0C0A08] overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-8 md:p-10 space-y-10">
          
          {/* Cloud Sync Status Indicator */}
          {isCloudSyncFailed && (
            <div id="cloud-sync-error-banner" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-orange-950/25 border-2 border-orange-500/30 rounded-sm text-orange-200 text-xs font-mono shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-950/50 border border-orange-500/20 text-orange-500 rounded-sm animate-pulse">
                  <CloudOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-orange-400 uppercase tracking-wider">NOTIFICATION: CLOUD FIRESTORE DISCONNECTED</h4>
                  <p className="text-[10px] text-orange-300/80 mt-0.5 leading-normal max-w-xl">
                    System is running in Offline Local Storage mode. Firebase Database has been configured on Cloud. Click <strong className="text-white">CONNECT CLOUD</strong> to initiate realtime data synchronization.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6c0a] text-white font-mono font-black text-[10px] uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.3)] cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  CONNECT CLOUD
                </button>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping"></span>
                  <span className="text-[9px] uppercase tracking-widest text-orange-400 bg-orange-950/60 px-2 py-1 border border-orange-500/20">OFFLINE</span>
                </div>
              </div>
            </div>
          )}

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
            
            {/* Cloud Database Status Badge */}
            <div className="flex items-center">
              {isCloudSyncFailed ? (
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 px-3 py-1 bg-orange-950/40 hover:bg-orange-900/40 border border-orange-500/30 rounded-none text-[10px] font-mono text-orange-400 cursor-pointer transition-colors"
                  title="Firestore Cloud connection failed. Click to retry."
                >
                  <CloudOff className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  <span>CLOUD: OFFLINE (RETRY)</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-none text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
                  <span>CLOUD: ONLINE</span>
                </div>
              )}
            </div>

            {/* Realtime Year & Month Filters */}
            <div className="flex items-center gap-2">
              {/* Year Selector */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-none text-xs font-mono text-zinc-300">
                <span className="text-zinc-500 font-bold text-[10px] uppercase">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-zinc-300 font-bold border-none focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-zinc-950 text-zinc-300">All Years</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr} className="bg-zinc-950 text-zinc-300">
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-none text-xs font-mono text-zinc-300">
                <span className="text-zinc-500 font-bold text-[10px] uppercase">Month:</span>
                <select
                  value={selectedMonthOnly}
                  onChange={(e) => setSelectedMonthOnly(e.target.value)}
                  className="bg-transparent text-zinc-300 font-bold border-none focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-zinc-950 text-zinc-300">All Months</option>
                  {availableMonths.filter(m => m !== 'all').map(mo => (
                    <option key={mo} value={mo} className="bg-zinc-950 text-zinc-300">
                      Month {mo}
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
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              clients={clients}
              tasks={tasksFilteredByMonth}
              staff={staff}
              summary={summary}
              currency={currency}
              selectedYear={selectedYear}
              selectedMonthOnly={selectedMonthOnly}
            />
          )}

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
                {isCloudSyncFailed ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] animate-pulse"></span>
                    <span className="text-orange-400 font-bold">DATABASE OFFLINE (LOCAL CACHE)</span>
                    <button 
                      onClick={loadData}
                      className="ml-1 px-1.5 py-0.5 bg-orange-950/40 text-orange-400 hover:text-white border border-orange-800/40 text-[9px] font-mono uppercase tracking-wider cursor-pointer transition-colors"
                      title="Thử lại đồng bộ Cloud Firestore"
                    >
                      THỬ LẠI KẾT NỐI (RETRY)
                    </button>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
                    <span className="text-emerald-400 font-bold">DATABASE CLOUD SYNCED</span>
                  </>
                )}
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
          onUpdateClient={handleUpdateClient}
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

      {/* Automated Invoice & Client Billing Generator Modal */}
      {isInvoiceModalOpen && (
        <InvoiceGeneratorModal 
          clients={clients}
          tasks={tasks}
          currency={currency}
          onClose={() => setIsInvoiceModalOpen(false)}
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

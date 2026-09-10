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
  resetWorkspaceDataToDefault,
  uploadLocalDataToCloud
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
  { id: 'cyan', name: 'Thomas Electric Cyan', hexColor: '#1591DC', hoverColor: '#0e7bc0' },
  { id: 'emerald', name: 'Studio Emerald', hexColor: '#10B981', hoverColor: '#059669' },
  { id: 'violet', name: 'Royal Violet', hexColor: '#8B5CF6', hoverColor: '#7C3AED' },
  { id: 'amber', name: 'Studio Amber', hexColor: '#F59E0B', hoverColor: '#d97706' },
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

    const handleOnline = () => {
      console.log('Browser online event detected, attempting Cloud Firestore reconnection...');
      loadData();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, [loadData]);

  const handleUploadLocalToCloud = async () => {
    setIsLoading(true);
    try {
      await uploadLocalDataToCloud(clients, staff, tasks, profile);
      setIsCloudSyncFailed(false);
      setCloudErrorMsg('');
      alert('Đã kết nối và đẩy thành công 100% dữ liệu từ máy của bạn lên Cloud Firestore!');
    } catch (err: any) {
      console.error('Failed to upload local data to Cloud Firestore:', err);
      alert('Chưa thể đẩy dữ liệu lên Cloud Firestore. Vui lòng kiểm tra lại kết nối đường truyền mạng hoặc tường lửa.');
    } finally {
      setIsLoading(false);
    }
  };

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
      title: 'Delete Video Task',
      message: 'Are you sure you want to delete this Video Task from the system?',
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
      title: 'Delete Selected Video Tasks',
      message: `Are you sure you want to delete ${taskIds.length} selected video tasks from the system?`,
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
      title: 'Delete Operator Profile',
      message: 'Are you sure you want to delete this editor from the workforce pipeline?',
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
      'Link Final',
      'Loai Tien Te'
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
      t.finalUrl || '',
      t.currency || 'USD'
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
          const currency = (columns[14] || 'USD').trim().toUpperCase() as CurrencyCode;

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
            finalUrl,
            currency: currency || 'USD'
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
          alert(`Successfully imported ${parsedTasks.length} video tasks and auto-initialized ${newClientsCount} client matrix segments into Cloud Firebase!`);
        }
      } catch (err) {
        console.error('Error importing CSV:', err);
        setIsLoading(false);
        alert('An error occurred while parsing the CSV file. Please verify formatting.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSeedReset = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Seed Database',
      message: 'Are you sure you want to reset to default workspace data on Cloud Firebase? All current modifications will be overwritten.',
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
      title: 'PURGE ALL WORKSPACE DATA',
      message: 'ARE YOU SURE YOU WANT TO PURGE ALL DATA ON CLOUD? This action will permanently erase all active tasks, operators, and client matrix segments.',
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
      <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center p-6 text-center select-none antialiased">
        <div className="relative mb-6">
          <div className="w-12 h-12 rounded-full border-2 border-white/[0.08] border-t-[#1591DC] animate-spin flex items-center justify-center shadow-[0_0_20px_rgba(21,145,220,0.2)]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1591DC] shadow-[0_0_12px_#1591DC]"></div>
          </div>
        </div>
        <h2 className="text-xs font-bold tracking-widest text-white uppercase mb-1 font-haas">
          DEEP FOCUS OS
        </h2>
        <div className="text-[10px] font-mono text-[#9496a1] tracking-wider uppercase">
          Synchronizing Workspace Data...
        </div>
      </div>
    );
  }

  const summary = getFinancialSummary();

  return (
    <div id="app-root" className="min-h-screen bg-[#0b0c10] text-[#ededf3] font-sans flex flex-col md:flex-row antialiased select-none tracking-tight relative overflow-x-hidden">
      {/* Tactile Film Grain Noise & Ambient Edit Blur Spots from Portfolio */}
      <div className="noise-overlay" />
      <div className="bg-edit-blur-1 top-10 left-1/4" />
      <div className="bg-edit-blur-2 top-1/2 -right-20" />
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-accent: ${activeThemeColor.hexColor};
          --primary-accent-glow: ${activeThemeColor.hexColor}40;
          --primary-accent-border: ${activeThemeColor.hexColor}20;
        }
      `}} />
      
      {/* 1. Left Sidebar Navigation Panel - Translucent Glass, Minimal Icon + Name & Collapsible */}
      <aside 
        id="sidebar-panel" 
        className={`bg-[#0b0c10] border-r border-white/[0.08] flex flex-col justify-between shrink-0 font-haas relative z-20 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'
        }`}
      >
        <div>
          {/* Logo Brand Header & Collapse Toggle */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-[#1591DC] flex items-center justify-center rounded-full shadow-[0_0_12px_rgba(21,145,220,0.4)] ring-1 ring-white/20 shrink-0">
                <span className="text-white font-black text-xs tracking-tighter">DF</span>
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-xs font-bold tracking-tight uppercase leading-none text-white font-haas truncate">
                    DEEP FOCUS OS
                  </h1>
                  <p className="text-[9px] text-[#9496a1] font-mono tracking-widest mt-1 uppercase truncate">
                    STUDIO COMMAND
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Collapse/Expand Toggle Button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1.5 text-[#9496a1] hover:text-white hover:bg-white/[0.06] rounded-[6px] transition-colors cursor-pointer"
                title={isSidebarCollapsed ? "Mở rộng Panel" : "Thu gọn Panel"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-[#1591DC]" /> : <PanelLeftClose className="w-4 h-4" />}
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
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold transition-all cursor-pointer rounded-[6px] ${
                    isActive 
                      ? 'bg-[#1591DC]/15 border-l-2 border-[#1591DC] text-white font-bold shadow-[0_0_12px_rgba(21,145,220,0.25)]' 
                      : 'bg-transparent border-l-2 border-transparent text-[#9496a1] hover:text-white hover:bg-white/[0.04]'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1591DC]' : 'text-[#9496a1]'}`} />
                  {!isSidebarCollapsed && (
                    <span className="uppercase tracking-tight truncate text-left">{item.label}</span>
                  )}
                </button>
              );
            })}

            <div className="h-px bg-white/[0.08] my-3" />

            {!isSidebarCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9496a1] px-2 block mb-2">
                DATA & SYSTEM
              </span>
            )}

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-semibold text-[#1591DC] bg-[#1591DC]/10 hover:bg-[#1591DC] hover:text-white border border-[#1591DC]/30 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Generate & Print Commercial Month-End Invoices"
            >
              <FileText className="w-4 h-4 shrink-0 text-[#1591DC]" />
              {!isSidebarCollapsed && <span className="uppercase tracking-tight truncate text-left">MONTH-END INVOICE</span>}
            </button>

            <button
              onClick={handleExportToCSV}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-medium text-[#9496a1] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Export tasks to CSV/Excel"
            >
              <Download className="w-4 h-4 shrink-0 text-[#9496a1]" />
              {!isSidebarCollapsed && <span className="uppercase tracking-tight truncate text-left">EXPORT EXCEL / CSV</span>}
            </button>

            <label
              className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-medium text-[#9496a1] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Import tasks from CSV file"
            >
              <Upload className="w-4 h-4 shrink-0 text-[#9496a1]" />
              {!isSidebarCollapsed && <span className="uppercase tracking-tight truncate text-left">IMPORT EXCEL / CSV</span>}
              <input
                type="file"
                accept=".csv"
                onChange={handleImportFromCSV}
                className="hidden"
              />
            </label>

            <button
              onClick={loadData}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-semibold transition-all cursor-pointer rounded-[6px] text-[#9496a1] hover:text-white hover:bg-white/[0.04] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Click to reconnect and sync with Cloud Firestore Database"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isCloudSyncFailed ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
              {!isSidebarCollapsed && <span className="uppercase tracking-tight truncate text-left">{isCloudSyncFailed ? 'CONNECT CLOUD' : 'CLOUD SYNCED'}</span>}
            </button>

            <div className="h-px bg-white/[0.08] my-3" />

            <button
              onClick={() => setIsClientModalOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-medium text-[#9496a1] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Configure Clients"
            >
              <Settings className="w-4 h-4 shrink-0 text-[#9496a1]" />
              {!isSidebarCollapsed && <span className="uppercase tracking-tight truncate text-left">CONFIGURE CLIENTS</span>}
            </button>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-medium text-[#9496a1] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Profile & Modes"
            >
              <Sliders className="w-4 h-4 shrink-0 text-[#9496a1]" />
              {!isSidebarCollapsed && <span className="uppercase tracking-tight truncate text-left">PROFILE & MODES</span>}
            </button>

            <button
              onClick={handleSeedReset}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-medium text-[#9496a1] hover:text-amber-300 hover:bg-amber-950/20 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Reset to default workspace dataset"
            >
              <RefreshCw className="w-4 h-4 shrink-0 text-[#9496a1]" />
              {!isSidebarCollapsed && <span>RESET DEMO DATABASE</span>}
            </button>

            <button
              onClick={handleClearAllData}
              className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-medium text-[#9496a1] hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer rounded-[6px] ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Purge all workspace data"
            >
              <Trash2 className="w-4 h-4 shrink-0 text-[#9496a1]" />
              {!isSidebarCollapsed && <span>PURGE ALL DATA</span>}
            </button>
          </nav>

          {/* Quick task-add micro container */}
          {!profile.focusMode && !isSidebarCollapsed && (
            <div className="p-3 mx-3 my-2 bg-[#12141a] border border-white/[0.08] rounded-[6px] hidden md:block">
              <h4 className="text-[10px] font-mono font-bold uppercase text-[#9496a1] mb-2 tracking-widest">PROJECT QUICK-ADD</h4>
              <button 
                onClick={() => { setEditingTask(undefined); setIsTaskModalOpen(true); }}
                className="w-full py-2 bg-[#1591DC] hover:bg-[#0e7bc0] text-white text-[11px] font-bold uppercase rounded-[6px] transition-all cursor-pointer shadow-[0_0_12px_rgba(21,145,220,0.3)]"
              >
                Deploy New Task
              </button>
            </div>
          )}
        </div>

        {/* User profile footer bar */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0b0c10]">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 text-left flex-1 min-w-0 group cursor-pointer"
              title="Configure Profile & Workspace"
            >
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-8 h-8 rounded-full object-cover border border-white/20 group-hover:border-[#1591DC] transition-all shrink-0"
              />
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#1591DC] transition-colors font-haas">
                    {profile.name}
                  </p>
                  <span className="text-[9px] font-mono text-[#9496a1] block uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                    {profile.role || (userRole === 'admin' ? 'SYS_ADMIN' : 'CONTRACTOR')}
                  </span>
                </div>
              )}
            </button>
            {!isSidebarCollapsed && (
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-white/[0.06] text-[#9496a1] hover:text-white rounded-[6px] transition-colors cursor-pointer"
                title="Terminate session Connection"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Executive Workspace Content Area */}
      <main id="main-content-panel" className="flex-1 bg-[#0b0c10] overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-8 md:p-10 space-y-10">
          
          {/* Cloud Sync Status Indicator */}
          {isCloudSyncFailed && (
            <div id="cloud-sync-error-banner" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-[#12141a] border border-white/[0.08] rounded-[6px] text-[#ededf3] text-xs font-haas shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-start md:items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-[6px] shrink-0">
                  <CloudOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase tracking-wider text-xs">CHẾ ĐỘ OFFLINE LOCAL STORAGE</h4>
                  <p className="text-[11px] text-[#9496a1] mt-0.5 leading-normal max-w-xl">
                    Dữ liệu đang được lưu trữ an toàn trên thiết bị của bạn. Bấm <strong className="text-white">THỬ KẾT NỐI LẠI</strong> hoặc <strong className="text-[#1591DC]">ĐỒNG BỘ LOCAL LÊN CLOUD</strong> để cập nhật dữ liệu lên server.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 flex-wrap">
                <button
                  onClick={loadData}
                  className="px-3.5 py-2 bg-[#1591DC] hover:bg-[#0e7bc0] text-white font-mono font-bold text-[11px] uppercase rounded-[6px] shadow-[0_0_12px_rgba(21,145,220,0.3)] cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  THỬ KẾT NỐI LẠI
                </button>
                <button
                  onClick={handleUploadLocalToCloud}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[11px] uppercase rounded-[6px] shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  ĐỒNG BỘ LOCAL LÊN CLOUD
                </button>
              </div>
            </div>
          )}

          {/* Top Control Header bar */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-white/[0.08] pb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1591DC] flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(21,145,220,0.4)] ring-2 ring-white/10 shrink-0">
                <span className="text-white font-bold text-sm tracking-tighter">DF</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-haas">
                  Deep Focus OS
                </h1>
                <p className="text-[10px] text-[#9496a1] font-mono tracking-widest mt-0.5 uppercase">
                  Production Command & Video Retention Matrix
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto lg:justify-end">
              {/* Cloud Database Status Badge */}
              <div className="flex items-center">
                {isCloudSyncFailed ? (
                  <button
                    onClick={loadData}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-[6px] text-[10px] font-mono text-amber-400 cursor-pointer transition-colors"
                    title="Firestore Cloud connection failed. Click to retry."
                  >
                    <CloudOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>CLOUD: OFFLINE (RETRY)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12141a] border border-white/[0.08] rounded-[6px] text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                    <span>CLOUD: ONLINE</span>
                  </div>
                )}
              </div>

              {/* Realtime Year & Month Filters */}
              <div className="flex items-center gap-2">
                {/* Year Selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12141a] border border-white/[0.08] rounded-[6px] text-xs font-mono text-[#ededf3]">
                  <span className="text-[#9496a1] font-bold text-[10px] uppercase">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent text-white font-bold border-none focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all" className="bg-[#12141a] text-white">All Years</option>
                    {availableYears.map(yr => (
                      <option key={yr} value={yr} className="bg-[#12141a] text-white">
                        Year {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12141a] border border-white/[0.08] rounded-[6px] text-xs font-mono text-[#ededf3]">
                  <span className="text-[#9496a1] font-bold text-[10px] uppercase">Month:</span>
                  <select
                    value={selectedMonthOnly}
                    onChange={(e) => setSelectedMonthOnly(e.target.value)}
                    className="bg-transparent text-white font-bold border-none focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all" className="bg-[#12141a] text-white">All Months</option>
                    {availableMonths.filter(m => m !== 'all').map(mo => (
                      <option key={mo} value={mo} className="bg-[#12141a] text-white">
                        Month {mo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-6 w-[1px] bg-white/[0.08] hidden lg:block"></div>

              {/* Realtime Clock */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12141a] border border-white/[0.08] rounded-[6px] text-[10px] font-mono text-[#9496a1]">
                <Clock className="w-3.5 h-3.5 text-[#9496a1]" />
                <span>{time || 'Syncing Local Time...'}</span>
              </div>

              {/* Currency selector parameter */}
              <div className="flex items-center gap-0.5 bg-[#12141a] border border-white/[0.08] p-0.5 rounded-[6px] text-[10px] font-mono">
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-2.5 py-1 rounded-[4px] cursor-pointer transition-all ${currency === 'USD' ? 'bg-[#1591DC] text-white font-bold shadow-[0_0_8px_rgba(21,145,220,0.3)]' : 'text-[#9496a1] hover:text-white'}`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency('VND')}
                  className={`px-2.5 py-1 rounded-[4px] cursor-pointer transition-all ${currency === 'VND' ? 'bg-[#1591DC] text-white font-bold shadow-[0_0_8px_rgba(21,145,220,0.3)]' : 'text-[#9496a1] hover:text-white'}`}
                >
                  VND (₫)
                </button>
              </div>
            </div>
          </header>

          {/* Real-Time Executive KPIs Dashboard */}
          <KpiRibbon summary={summary} currency={currency} />
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

        </div>

        {/* Footer info block */}
        <div className="max-w-6xl mx-auto px-8 md:px-10 pb-8 font-haas">
          <footer className="flex flex-col sm:flex-row justify-between items-center py-4 border-t border-white/[0.08] gap-3">
            <div className="flex flex-wrap items-center gap-6 text-[10px] text-[#9496a1] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-2">
                {isCloudSyncFailed ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse"></span>
                    <span className="text-amber-400 font-bold">DATABASE OFFLINE (LOCAL CACHE)</span>
                    <button 
                      onClick={loadData}
                      className="ml-1 px-2 py-0.5 bg-[#1591DC]/15 text-[#1591DC] hover:bg-[#1591DC]/30 border border-[#1591DC]/30 rounded-[3px] text-[9px] font-mono uppercase tracking-wider cursor-pointer transition-colors"
                      title="Thử lại đồng bộ Cloud Firestore"
                    >
                      THỬ LẠI KẾT NỐI (RETRY)
                    </button>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                    <span className="text-emerald-400 font-bold">DATABASE CLOUD SYNCED</span>
                  </>
                )}
              </div>
              {profile.focusMode ? (
                <div className="text-emerald-400 font-bold tracking-widest animate-pulse">[FOCUS WORKSPACE ACTIVE]</div>
              ) : (
                <>
                  <div>Uptime: 242:12:05</div>
                  <div>Latency: 14ms</div>
                </>
              )}
            </div>
            <div className="text-[10px] text-[#9496a1] font-mono tracking-widest uppercase">
              DEEP FOCUS OS &bull; THOMAS NGUYEN MEDIA &copy; 2026
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
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-[10px] uppercase font-bold rounded-none cursor-pointer transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

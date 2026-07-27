/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { VideoTaskObject, ClientObject, StaffObject, TaskStatus } from '../types';
import { 
  Plus, Edit, Trash2, Link, Calendar, User, 
  Layers, CheckCircle2, PlayCircle, Eye, AlertCircle, Copy, Check, Star,
  Settings, ChevronDown, ChevronUp, ArrowUpDown, EyeOff, Trash, MoveLeft, MoveRight,
  ListFilter, X
} from 'lucide-react';

interface ProjectMatrixProps {
  tasks: VideoTaskObject[];
  clients: ClientObject[];
  staff: StaffObject[];
  role: 'admin' | 'staff';
  onAddTaskClick: () => void;
  onEditTaskClick: (task: VideoTaskObject) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteTasks?: (taskIds: string[]) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus, updates?: Partial<VideoTaskObject>) => void;
  currency: 'USD' | 'VND';
  denseLayout?: boolean;
  lowMarginAlert?: boolean;
  onSaveTask?: (task: VideoTaskObject) => void;
}

interface ColDef {
  id: string;
  label: string;
  visible: boolean;
  type: 'id' | 'text' | 'money' | 'status' | 'editor' | 'date' | 'link' | 'notes' | 'actions';
}

export default function ProjectMatrix({ 
  tasks, 
  clients, 
  staff, 
  role, 
  onAddTaskClick, 
  onEditTaskClick, 
  onDeleteTask, 
  onDeleteTasks,
  onUpdateTaskStatus,
  currency,
  denseLayout = false,
  lowMarginAlert = false,
  onSaveTask
}: ProjectMatrixProps) {
  // Navigation active tab for filtering clients
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Customization: Column Configuration
  const [columns, setColumns] = useState<ColDef[]>(() => {
    const saved = localStorage.getItem('apex_matrix_columns_v2');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'id', label: 'BLOCK ID', visible: true, type: 'id' },
      { id: 'title', label: 'Video Name', visible: true, type: 'text' },
      { id: 'clientPay', label: 'Client Pay', visible: true, type: 'money' },
      { id: 'subPay', label: 'Sub Pay', visible: true, type: 'money' },
      { id: 'netProfit', label: 'Profit Yield', visible: true, type: 'money' },
      { id: 'status', label: 'Workflow Status', visible: true, type: 'status' },
      { id: 'editor', label: 'Operator', visible: true, type: 'editor' },
      { id: 'deadline', label: 'Deadline Target', visible: true, type: 'date' },
      { id: 'rawFootage', label: 'Raw Footage Link', visible: true, type: 'link' },
      { id: 'roughCut', label: 'Rough Cut Link', visible: true, type: 'link' },
      { id: 'finalUrl', label: 'Final Delivery Link', visible: true, type: 'link' },
      { id: 'actions', label: 'Actions', visible: true, type: 'actions' },
    ];
  });

  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'deck'>('table');
  
  // Row selection for bulk actions
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkDeleteConfirming, setIsBulkDeleteConfirming] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Persistence of column configuration
  useEffect(() => {
    localStorage.setItem('apex_matrix_columns_v2', JSON.stringify(columns));
  }, [columns]);

  // Column Width Resizing State & Event Handlers
  const [columnWidths, setColumnWidths] = useState<{ [colId: string]: number }>(() => {
    const saved = localStorage.getItem('deep_focus_col_widths_v2');
    if (saved) return JSON.parse(saved);
    return {
      id: 70,
      title: 180,
      clientPay: 100,
      subPay: 100,
      netProfit: 110,
      status: 125,
      editor: 135,
      deadline: 135,
      rawFootage: 160,
      roughCut: 160,
      finalUrl: 160,
      actions: 90
    };
  });

  useEffect(() => {
    localStorage.setItem('deep_focus_col_widths_v2', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Notion-style filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'not-done' | 'custom'>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [editorFilter, setEditorFilter] = useState<string>('all');
  const [clientPaidFilter, setClientPaidFilter] = useState<string>('all'); // 'all' | 'Paid' | 'Unpaid' | 'Invoiced'
  const [subPaidFilter, setSubPaidFilter] = useState<string>('all'); // 'all' | 'Paid' | 'Unpaid'
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<'status' | 'editor' | 'clientPaid' | 'subPaid' | null>(null);

  // List of active columns to render in table header/body
  const activeColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  // Calculate total table width to make custom column resizing fluid and reliable
  const totalTableWidth = useMemo(() => {
    const colsWidth = activeColumns.reduce((sum, col) => sum + (columnWidths[col.id] || 120), 0);
    return colsWidth + 40; // 40px for bulk checkbox column
  }, [activeColumns, columnWidths]);

  const handleResizeStart = (colId: string, startEvent: React.MouseEvent) => {
    startEvent.preventDefault();
    startEvent.stopPropagation();
    const startX = startEvent.clientX;
    const startWidth = columnWidths[colId] || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(45, startWidth + deltaX);
      setColumnWidths(prev => ({
        ...prev,
        [colId]: newWidth
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.displayName : 'Unknown Client';
  };

  const getClientTier = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.tier : 'Volume-Arbitrage';
  };

  const getEditorName = (editorId: string) => {
    if (editorId === 'Unassigned') return 'Claimable Pool';
    if (editorId === 'Phuc') return 'Phuc (Master Editor)';
    const ed = staff.find(s => s.id === editorId);
    return ed ? ed.name : 'Unknown Editor';
  };

  // Toggle dynamic column visibility
  const toggleColumnVisibility = (colId: string) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, visible: !c.visible } : c));
  };

  // Reorder columns: shift left or right in UI array
  const moveColumn = (index: number, direction: 'left' | 'right') => {
    const nextIndex = direction === 'left' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= columns.length) return;
    
    setColumns(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      return updated;
    });
  };

  // Update customized column label text
  const renameColumnLabel = (colId: string, newLabel: string) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, label: newLabel } : c));
  };

  // Filtering based on search query, active tab, and Notion-style filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Client tab filter
      const matchesTab = activeTab === 'all' || 
                         task.clientId === activeTab ||
                         (activeTab === 'unassigned' && (!task.clientId || !clients.some(c => c.id === task.clientId)));
      
      // 2. Search query filter
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            getEditorName(task.assignedEditorId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                            getClientName(task.clientId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.id.toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Status filter (Done: Approved, Not Done: Anything else, Custom: selected array)
      let matchesStatus = true;
      if (statusFilter === 'done') {
        matchesStatus = task.status === 'Approved';
      } else if (statusFilter === 'not-done') {
        matchesStatus = task.status !== 'Approved';
      } else if (statusFilter === 'custom') {
        matchesStatus = selectedStatuses.includes(task.status);
      }

      // 4. Editor filter
      const matchesEditor = editorFilter === 'all' || task.assignedEditorId === editorFilter;

      // 5. Client Paid Status filter
      const matchesClientPaid = clientPaidFilter === 'all' || task.clientPaidStatus === clientPaidFilter;

      // 6. Sub Paid Status filter
      const matchesSubPaid = subPaidFilter === 'all' || task.subPaidStatus === subPaidFilter;

      return matchesTab && matchesSearch && matchesStatus && matchesEditor && matchesClientPaid && matchesSubPaid;
    });
  }, [tasks, activeTab, searchQuery, staff, clients, statusFilter, selectedStatuses, editorFilter, clientPaidFilter, subPaidFilter]);

  // Sorting
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    sorted.sort((a, b) => {
      let valA: any = a[sortField as keyof VideoTaskObject] || '';
      let valB: any = b[sortField as keyof VideoTaskObject] || '';

      if (sortField === 'id') {
        valA = parseInt(a.id.replace(/\D/g, '')) || 0;
        valB = parseInt(b.id.replace(/\D/g, '')) || 0;
      } else if (sortField === 'netProfit') {
        valA = a.clientPay - a.subPay;
        valB = b.clientPay - b.subPay;
      } else if (sortField === 'editor') {
        valA = getEditorName(a.assignedEditorId);
        valB = getEditorName(b.assignedEditorId);
      } else if (sortField === 'clientName') {
        valA = getClientName(a.clientId);
        valB = getClientName(b.clientId);
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTasks, sortField, sortAsc, staff, clients]);

  // Group tasks by client for the "Grouped Table View" when tab is "all"
  const tasksByClient = useMemo(() => {
    const groups: { [clientId: string]: VideoTaskObject[] } = {};
    clients.forEach(c => {
      groups[c.id] = [];
    });
    
    sortedTasks.forEach(task => {
      if (!groups[task.clientId]) {
        groups[task.clientId] = [];
      }
      groups[task.clientId].push(task);
    });
    return groups;
  }, [sortedTasks, clients]);

  // Check if there are any tasks with no active client
  const hasOrphanedTasks = useMemo(() => {
    return tasks.some(task => !clients.some(c => c.id === task.clientId));
  }, [tasks, clients]);

  // Client groups to render in matrix tables list
  const clientGroupsToRender = useMemo(() => {
    const baseClients = clients.filter(c => activeTab === 'all' || c.id === activeTab);
    
    // Check if we have any orphaned tasks in the current sorted list
    const orphanedInSorted = sortedTasks.some(task => !clients.some(c => c.id === task.clientId));
    
    if (orphanedInSorted && (activeTab === 'all' || activeTab === 'unassigned')) {
      return [
        ...baseClients,
        { id: 'unassigned', displayName: 'Unassigned & Detached Video Tasks', tier: 'High-Ticket' as const }
      ];
    }
    return baseClients;
  }, [clients, sortedTasks, activeTab]);

  const handleHeaderSortClick = (field: string) => {
    if (sortField === field) {
      setSortAsc(prev => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getDeadlineStyle = (deadlineStr: string, status: TaskStatus) => {
    if (status === 'Approved') return 'text-[#71717a]';
    try {
      const taskDate = new Date(deadlineStr.replace(' ', 'T'));
      const now = new Date();
      const diffMs = taskDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0) return 'text-red-500 font-bold'; // overdue
      if (diffHours < 24) return 'text-amber-500 font-bold'; // under 24 hours
      return 'text-emerald-500';
    } catch {
      return 'text-zinc-400';
    }
  };

  const formatPrice = (val: number) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val * 25000);
    }
    return `$${val}`;
  };

  // Bulk operation handlers
  const handleSelectAllRows = (taskIds: string[], checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(prev => Array.from(new Set([...prev, ...taskIds])));
    } else {
      setSelectedTaskIds(prev => prev.filter(id => !taskIds.includes(id)));
    }
  };

  const handleSelectRow = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(prev => [...prev, taskId]);
    } else {
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleBulkStatusChange = (status: TaskStatus) => {
    selectedTaskIds.forEach(id => {
      onUpdateTaskStatus(id, status);
    });
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (onDeleteTasks) {
      onDeleteTasks(selectedTaskIds);
    } else {
      selectedTaskIds.forEach(id => {
        onDeleteTask(id);
      });
    }
    setSelectedTaskIds([]);
    setIsBulkDeleteConfirming(false);
  };

  // Quick inline creation templates
  const [quickTitle, setQuickTitle] = useState<{ [clientId: string]: string }>({});

  const handleQuickAdd = (clientId: string) => {
    const titleText = quickTitle[clientId]?.trim();
    if (!titleText) return;

    // Get today's date formatted as YYYY-MM-DD HH:MM
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const defaultDeadline = `${year}-${month}-${day} 18:00`;

    const dummyTask: VideoTaskObject = {
      id: `task_${Date.now()}`,
      clientId,
      title: titleText,
      rawFootageLink: '',
      status: 'Unassigned',
      internalDeadline: defaultDeadline,
      assignedEditorId: 'Unassigned',
      notes: 'Quick inline added.',
      clientPay: 0,
      subPay: 0,
      clientPaidStatus: 'Unpaid',
      subPaidStatus: 'Unpaid',
      roughCutUrl: '',
      finalUrl: ''
    };

    if (onSaveTask) {
      onSaveTask(dummyTask);
    } else {
      onEditTaskClick(dummyTask);
    }
    setQuickTitle(prev => ({ ...prev, [clientId]: '' }));
  };


  return (
    <div id="project-matrix-panel" className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-2xl font-serif font-light tracking-tight text-zinc-100 uppercase">
            Production Matrix Workspace
          </h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">
            Elite custom matrix sheet configured for APEX Editors [SECURED V2]
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-zinc-950/40 border border-zinc-900 p-0.5 rounded-none text-[9px] font-mono">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-none uppercase tracking-wider cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-zinc-900 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Interactive Sheet
            </button>
            <button
              onClick={() => setViewMode('deck')}
              className={`px-3 py-1 rounded-none uppercase tracking-wider cursor-pointer transition-colors ${viewMode === 'deck' ? 'bg-zinc-900 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Classic Deck
            </button>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm task, client, editor..."
            className="px-3 py-1.5 bg-zinc-950/20 text-zinc-200 font-mono placeholder-zinc-600 border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700 text-[10px] w-full sm:w-44"
          />

          <button
            id="add-task-btn"
            onClick={onAddTaskClick}
            className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-[10px] uppercase rounded-none transition-colors flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          >
            <Plus className="w-3.5 h-3.5" /> Deploy Project
          </button>

          {/* Column Config Dropdown Toggle */}
          <button
            onClick={() => setIsColumnConfigOpen(!isColumnConfigOpen)}
            className={`px-4 py-1.5 bg-transparent hover:bg-zinc-950 text-zinc-300 font-mono text-[10px] uppercase rounded-none border transition-colors flex items-center gap-1.5 cursor-pointer ${isColumnConfigOpen ? 'border-zinc-400 text-white' : 'border-zinc-800'}`}
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" /> Customize Columns
          </button>
        </div>
      </div>

      {/* Column Customizer Panel (Slide-out menu/Popover style) */}
      {isColumnConfigOpen && (
        <div className="bg-black/80 border border-[#1e293b] rounded-sm p-4 text-xs space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.08)]">
          <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-[#ef4444]" />
              APEX Column Configurator Panel
            </span>
            <button 
              onClick={() => setIsColumnConfigOpen(false)}
              className="text-[#71717a] hover:text-[#f4f4f5] font-mono text-[9px]"
            >
              [CLOSE]
            </button>
          </div>

          <p className="text-[10px] font-sans text-[#71717a] leading-normal">
            Configure visible columns, rename column headers, or shift their positions. Your preferences are saved automatically.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.map((col, idx) => (
              <div key={col.id} className="flex items-center justify-between p-2 bg-[#09090b] border border-zinc-900 rounded-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => toggleColumnVisibility(col.id)}
                    className="accent-[#ef4444] cursor-pointer"
                    id={`col-chk-${col.id}`}
                  />
                  {/* Dynamic Column Label Input */}
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => renameColumnLabel(col.id, e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-[#ef4444] text-[#f4f4f5] text-[10px] font-mono focus:outline-none w-full px-1 py-0.5 truncate"
                    title="Click to rename"
                  />
                </div>

                <div className="flex gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveColumn(idx, 'left')}
                    className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded-sm text-zinc-400 cursor-pointer"
                    title="Move column left"
                  >
                    <MoveLeft className="w-3 h-3" />
                  </button>
                  <button
                    disabled={idx === columns.length - 1}
                    onClick={() => moveColumn(idx, 'right')}
                    className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded-sm text-zinc-400 cursor-pointer"
                    title="Move column right"
                  >
                    <MoveRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APEX-Style Segment Tab Filter */}
      <div id="apex-segment-tabs" className="flex items-center gap-2 py-1 border-b border-zinc-900 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-[10px] font-mono font-bold uppercase rounded-none tracking-wider transition-all shrink-0 ${
            activeTab === 'all' 
              ? 'text-white border-b-2 border-white' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          [ALL MATRIX WORKSPACE]
        </button>
        {clients.map(client => (
          <button
            key={client.id}
            onClick={() => setActiveTab(client.id)}
            className={`px-4 py-2 text-[10px] font-mono font-medium rounded-none tracking-wider transition-all shrink-0 ${
              activeTab === client.id 
                ? 'text-white border-b-2 border-white font-bold' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {client.displayName}
          </button>
        ))}
        {hasOrphanedTasks && (
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-4 py-2 text-[10px] font-mono font-bold uppercase rounded-none tracking-wider transition-all shrink-0 ${
              activeTab === 'unassigned' 
                ? 'text-red-400 border-b-2 border-red-400' 
                : 'text-red-500/60 hover:text-red-400'
            }`}
          >
            [UNASSIGNED/ORPHANED]
          </button>
        )}
      </div>

      {/* NOTION-STYLE MULTI-FILTER BAR */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-950/20 border border-zinc-900 rounded-none text-[11px] font-mono select-none">
        <div className="flex items-center gap-1.5 text-zinc-500 mr-1 shrink-0">
          <ListFilter className="w-3.5 h-3.5" />
          <span className="uppercase text-[9px] tracking-wider font-bold">Bộ Lọc:</span>
        </div>

        {/* 1. STATUS FILTER PILL */}
        <div className="relative">
          <button
            onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'status' ? null : 'status')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm border transition-all text-[10px] uppercase font-bold cursor-pointer ${
              statusFilter !== 'all'
                ? 'bg-[#F97316]/10 border-[#F97316]/40 text-[#F97316]'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>Trạng thái: </span>
            <span className="text-white">
              {statusFilter === 'all' && 'Tất cả'}
              {statusFilter === 'done' && 'Đã xong (Approved) ✓'}
              {statusFilter === 'not-done' && 'Chưa xong (In Progress) ⏳'}
              {statusFilter === 'custom' && `Tùy chọn (${selectedStatuses.length})`}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {activeFilterDropdown === 'status' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
              <div className="absolute left-0 mt-1 w-64 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl z-40 p-2 space-y-1 animate-fade-in">
                <div className="px-2 py-1 text-[9px] text-zinc-500 font-bold uppercase border-b border-zinc-900 mb-1">
                  Chọn bộ lọc trạng thái
                </div>
                {[
                  { value: 'all', label: 'Tất cả trạng thái (Show All)' },
                  { value: 'not-done', label: 'Chưa xong (In Progress / Active)' },
                  { value: 'done', label: 'Đã xong (Approved / Done)' },
                  { value: 'custom', label: 'Chọn thủ công (Custom Selection...)' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusFilter(opt.value as any);
                      if (opt.value === 'custom' && selectedStatuses.length === 0) {
                        setSelectedStatuses(['Unassigned', 'Rough Cut', 'Final Polish', 'Client Review']);
                      }
                      if (opt.value !== 'custom') {
                        setActiveFilterDropdown(null);
                      }
                    }}
                    className={`w-full text-left px-2 py-1.5 hover:bg-zinc-900 rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                      statusFilter === opt.value ? 'text-[#F97316] font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.value && <Check className="w-3 h-3 text-[#F97316]" />}
                  </button>
                ))}

                {statusFilter === 'custom' && (
                  <div className="pt-1.5 border-t border-zinc-900 mt-1 space-y-1 pl-1">
                    {['Unassigned', 'Rough Cut', 'Final Polish', 'Client Review', 'Approved'].map(st => {
                      const isChecked = selectedStatuses.includes(st as TaskStatus);
                      return (
                        <label
                          key={st}
                          className="flex items-center gap-2 px-2 py-1 text-[10px] text-zinc-400 hover:text-white cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStatuses(prev => [...prev, st as TaskStatus]);
                              } else {
                                setSelectedStatuses(prev => prev.filter(item => item !== st));
                              }
                            }}
                            className="accent-[#F97316] cursor-pointer"
                          />
                          <span>{st}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 2. EDITOR FILTER PILL */}
        <div className="relative">
          <button
            onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'editor' ? null : 'editor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm border transition-all text-[10px] uppercase font-bold cursor-pointer ${
              editorFilter !== 'all'
                ? 'bg-[#F97316]/10 border-[#F97316]/40 text-[#F97316]'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>Người dựng: </span>
            <span className="text-white">
              {editorFilter === 'all' && 'Tất cả'}
              {editorFilter === 'Unassigned' && 'Claimable Pool (Chưa nhận)'}
              {editorFilter === 'Phuc' && 'Phuc (Lead)'}
              {editorFilter !== 'all' && editorFilter !== 'Unassigned' && editorFilter !== 'Phuc' && (staff.find(s => s.id === editorFilter)?.name || editorFilter)}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {activeFilterDropdown === 'editor' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
              <div className="absolute left-0 mt-1 w-64 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl z-40 p-2 space-y-1 max-h-72 overflow-y-auto animate-fade-in">
                <div className="px-2 py-1 text-[9px] text-zinc-500 font-bold uppercase border-b border-zinc-900 mb-1">
                  Lọc theo Người Dựng (Editor)
                </div>
                <button
                  onClick={() => {
                    setEditorFilter('all');
                    setActiveFilterDropdown(null);
                  }}
                  className={`w-full text-left px-2 py-1.5 hover:bg-zinc-900 rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                    editorFilter === 'all' ? 'text-[#F97316] font-bold' : 'text-zinc-400'
                  }`}
                >
                  <span>Tất cả người dựng (Show All)</span>
                  {editorFilter === 'all' && <Check className="w-3 h-3 text-[#F97316]" />}
                </button>
                <button
                  onClick={() => {
                    setEditorFilter('Unassigned');
                    setActiveFilterDropdown(null);
                  }}
                  className={`w-full text-left px-2 py-1.5 hover:bg-zinc-900 rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                    editorFilter === 'Unassigned' ? 'text-[#F97316] font-bold' : 'text-zinc-400'
                  }`}
                >
                  <span>Claimable Pool (Chưa ai nhận)</span>
                  {editorFilter === 'Unassigned' && <Check className="w-3 h-3 text-[#F97316]" />}
                </button>
                <button
                  onClick={() => {
                    setEditorFilter('Phuc');
                    setActiveFilterDropdown(null);
                  }}
                  className={`w-full text-left px-2 py-1.5 hover:bg-zinc-900 rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                    editorFilter === 'Phuc' ? 'text-[#F97316] font-bold' : 'text-zinc-400'
                  }`}
                >
                  <span>Phuc (Lead)</span>
                  {editorFilter === 'Phuc' && <Check className="w-3 h-3 text-[#F97316]" />}
                </button>
                {staff.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setEditorFilter(s.id);
                      setActiveFilterDropdown(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 hover:bg-zinc-900 rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                      editorFilter === s.id ? 'text-[#F97316] font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <span>{s.name}</span>
                    {editorFilter === s.id && <Check className="w-3 h-3 text-[#F97316]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 3. CLIENT PAID FILTER PILL */}
        <div className="relative">
          <button
            onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'clientPaid' ? null : 'clientPaid')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm border transition-all text-[10px] uppercase font-bold cursor-pointer ${
              clientPaidFilter !== 'all'
                ? 'bg-[#F97316]/10 border-[#F97316]/40 text-[#F97316]'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>Thanh toán khách: </span>
            <span className="text-white">
              {clientPaidFilter === 'all' && 'Tất cả'}
              {clientPaidFilter === 'Paid' && 'Đã trả (Paid)'}
              {clientPaidFilter === 'Unpaid' && 'Chưa trả (Unpaid)'}
              {clientPaidFilter === 'Invoiced' && 'Đã xuất hóa đơn (Invoiced)'}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {activeFilterDropdown === 'clientPaid' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
              <div className="absolute left-0 mt-1 w-64 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl z-40 p-2 space-y-1 animate-fade-in">
                <div className="px-2 py-1 text-[9px] text-zinc-500 font-bold uppercase border-b border-zinc-900 mb-1">
                  Lọc Trạng thái Khách Thanh Toán
                </div>
                {[
                  { value: 'all', label: 'Tất cả thanh toán (Show All)' },
                  { value: 'Unpaid', label: 'Chưa thanh toán (Unpaid)' },
                  { value: 'Invoiced', label: 'Đã gửi hóa đơn (Invoiced)' },
                  { value: 'Paid', label: 'Đã thanh toán (Paid)' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setClientPaidFilter(opt.value);
                      setActiveFilterDropdown(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 hover:bg-zinc-900 rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                      clientPaidFilter === opt.value ? 'text-[#F97316] font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {clientPaidFilter === opt.value && <Check className="w-3 h-3 text-[#F97316]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 4. SUB PAID FILTER PILL */}
        <div className="relative">
          <button
            onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'subPaid' ? null : 'subPaid')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm border transition-all text-[10px] uppercase font-bold cursor-pointer ${
              subPaidFilter !== 'all'
                ? 'bg-[#F97316]/10 border-[#F97316]/40 text-[#F97316]'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>Thanh toán Editor: </span>
            <span className="text-white">
              {subPaidFilter === 'all' && 'Tất cả'}
              {subPaidFilter === 'Paid' && 'Đã trả (Paid)'}
              {subPaidFilter === 'Unpaid' && 'Chưa trả (Unpaid)'}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {activeFilterDropdown === 'subPaid' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setActiveFilterDropdown(null)} />
              <div className="absolute left-0 mt-1 w-64 bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl z-40 p-2 space-y-1 animate-fade-in">
                <div className="px-2 py-1 text-[9px] text-zinc-500 font-bold uppercase border-b border-zinc-900 mb-1">
                  Lọc Trạng thái Editor Thanh Toán
                </div>
                {[
                  { value: 'all', label: 'Tất cả (Show All)' },
                  { value: 'Unpaid', label: 'Chưa thanh toán (Unpaid)' },
                  { value: 'Paid', label: 'Đã thanh toán (Paid)' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSubPaidFilter(opt.value);
                      setActiveFilterDropdown(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 hover:bg-zinc-900 rounded-sm flex items-center justify-between cursor-pointer transition-colors ${
                      subPaidFilter === opt.value ? 'text-[#F97316] font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {subPaidFilter === opt.value && <Check className="w-3 h-3 text-[#F97316]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 5. CLEAR FILTERS BUTTON */}
        {(statusFilter !== 'all' || editorFilter !== 'all' || clientPaidFilter !== 'all' || subPaidFilter !== 'all') && (
          <button
            onClick={() => {
              setStatusFilter('all');
              setSelectedStatuses([]);
              setEditorFilter('all');
              setClientPaidFilter('all');
              setSubPaidFilter('all');
              setActiveFilterDropdown(null);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-sm border border-[#ef4444]/30 hover:border-[#ef4444] bg-[#ef4444]/5 hover:bg-[#ef4444]/20 text-[#ef4444] text-[10px] uppercase font-bold cursor-pointer transition-all ml-auto shrink-0"
          >
            <X className="w-3 h-3" />
            <span>Xóa bộ lọc (Reset)</span>
          </button>
        )}
      </div>

      {/* Bulk Action Controls */}
      {selectedTaskIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-sm text-xs font-mono text-[#f4f4f5] animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#ef4444] rounded-full animate-ping"></span>
            <span>Selected <strong>{selectedTaskIds.length}</strong> videos for batch operations:</span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Change Status:</span>
            {['Unassigned', 'Rough Cut', 'Final Polish', 'Client Review', 'Approved'].map(st => (
              <button
                key={st}
                onClick={() => handleBulkStatusChange(st as TaskStatus)}
                className="px-2 py-0.5 bg-zinc-900 hover:bg-[#ef4444] hover:text-white text-[9px] uppercase font-bold border border-zinc-800 rounded-sm transition-colors cursor-pointer"
              >
                {st}
              </button>
            ))}
            <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
            {isBulkDeleteConfirming ? (
              <div className="flex items-center gap-1.5 bg-red-950/40 p-1 border border-red-700/30 rounded-sm">
                <span className="text-[9px] uppercase font-black text-red-400">Bạn có chắc chắn?</span>
                <button
                  onClick={handleBulkDelete}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] uppercase font-black rounded-sm cursor-pointer"
                >
                  Xác nhận xóa ({selectedTaskIds.length})
                </button>
                <button
                  onClick={() => setIsBulkDeleteConfirming(false)}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9px] uppercase font-bold rounded-sm cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsBulkDeleteConfirming(true)}
                className="px-2.5 py-0.5 bg-red-950/80 border border-red-700/50 hover:bg-red-800 text-white hover:text-white text-[9px] uppercase font-bold rounded-sm transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash className="w-3 h-3" /> Delete Selected
              </button>
            )}
            <button
              onClick={() => setSelectedTaskIds([])}
              className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[#71717a] hover:text-white text-[9px] uppercase rounded-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {sortedTasks.length === 0 ? (
        <div className="p-12 border border-[#1e293b] border-dashed rounded-sm text-center bg-[#09090b]/40">
          <AlertCircle className="w-7 h-7 text-[#71717a] mx-auto mb-3" />
          <p className="text-xs font-mono text-[#71717a]">NO ACTIVE VIDEO TASK VECTORS CAPTURED IN THIS SPHERE</p>
          {role === 'admin' && (
            <button 
              onClick={onAddTaskClick}
              className="mt-4 px-4 py-1.5 bg-zinc-900 border border-[#1e293b] text-[#f4f4f5] font-mono text-[10px] uppercase hover:bg-zinc-800 rounded-sm cursor-pointer"
            >
              Add First Task Blueprint
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* SPREADSHEET TABLE VIEW (Mainly requested) */
        <div className="space-y-6">
          {/* Render individual tables per client group, including virtual groups */}
          {clientGroupsToRender
            .map(client => {
              const clientTasks = activeTab === 'all' 
                ? (client.id === 'unassigned' 
                    ? sortedTasks.filter(task => !clients.some(c => c.id === task.clientId)) 
                    : tasksByClient[client.id] || []) 
                : sortedTasks;
              if (activeTab === 'all' && clientTasks.length === 0) return null;

              return (
                <div key={client.id} className="bg-zinc-950/20 backdrop-blur-xl border-none py-6 space-y-4">
                  {/* Table Header Section */}
                  <div className="pb-4 border-b border-zinc-900 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${client.id === 'unassigned' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-[#10b981] shadow-[0_0_8px_#10b981]'}`}></span>
                      <h3 className="text-sm font-serif font-light text-zinc-100 tracking-tight uppercase">
                        {client.displayName}
                      </h3>
                      <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/40 border border-zinc-900 px-2 py-0.5 rounded-none uppercase tracking-widest">
                        {client.tier}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase">
                        QUANTITY: <strong>{clientTasks.length} ITEMS</strong>
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Quick title add..."
                          value={quickTitle[client.id] || ''}
                          onChange={(e) => setQuickTitle({ ...quickTitle, [client.id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(client.id); }}
                          className="bg-transparent border-b border-zinc-800 focus:border-white text-[9px] font-mono focus:outline-none w-32 text-zinc-300 py-0.5 px-1"
                        />
                        <button
                          onClick={() => handleQuickAdd(client.id)}
                          className="px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white text-[9px] font-mono rounded-none cursor-pointer transition-colors"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Spreadsheet Scroll Panel */}
                  <div className="overflow-x-auto select-text">
                    <table className="table-fixed text-left border-collapse" style={{ width: totalTableWidth, minWidth: totalTableWidth }}>
                      <thead>
                        <tr className="text-[9px] font-mono text-zinc-500 uppercase border-b border-zinc-900 tracking-wider select-none">
                          <th className="py-2.5 px-3 text-center w-8 min-w-8 max-w-8">
                            <input
                              type="checkbox"
                              checked={clientTasks.length > 0 && clientTasks.every(t => selectedTaskIds.includes(t.id))}
                              onChange={(e) => handleSelectAllRows(clientTasks.map(t => t.id), e.target.checked)}
                              className="accent-[#ef4444] cursor-pointer"
                            />
                          </th>
                          {activeColumns.map(col => {
                            let sortKey = col.id;
                            if (col.id === 'editor') sortKey = 'assignedEditorId';
                            const colWidth = columnWidths[col.id] || 120;
                            return (
                              <th 
                                key={col.id} 
                                style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                className={`relative py-2.5 px-3 hover:text-white transition-colors group select-none ${
                                  col.type === 'money' ? 'text-right' : ''
                                }`}
                              >
                                <div 
                                  onClick={() => handleHeaderSortClick(sortKey)}
                                  className={`flex items-center gap-1 cursor-pointer truncate ${col.type === 'money' ? 'justify-end' : ''}`}
                                >
                                  {col.label}
                                  <ArrowUpDown className="w-2.5 h-2.5 opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
                                </div>
                                {/* Column drag resizer handle */}
                                <div
                                  onMouseDown={(e) => handleResizeStart(col.id, e)}
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                  className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#F97316]/50 active:bg-[#F97316] transition-colors z-20"
                                  title="Kéo để chỉnh độ rộng cột"
                                />
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 font-mono text-xs">
                        {clientTasks.map((task, rIdx) => {
                          const profit = task.clientPay - task.subPay;
                          const isSelected = selectedTaskIds.includes(task.id);

                          return (
                            <tr 
                              key={task.id} 
                              className={`hover:bg-zinc-950/60 transition-colors ${
                                isSelected ? 'bg-[#ef4444]/5' : rIdx % 2 === 0 ? 'bg-[#000000]' : 'bg-[#050505]'
                              }`}
                            >
                              {/* Checkbox Select */}
                              <td className={`${denseLayout ? 'py-1 px-2' : 'py-2.5 px-3'} text-center`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleSelectRow(task.id, e.target.checked)}
                                  className="accent-[#ef4444] cursor-pointer"
                                />
                              </td>

                              {/* Visible Columns Renderer */}
                              {activeColumns.map(col => {
                                const colWidth = columnWidths[col.id] || 120;
                                if (col.id === 'id') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-1 px-2' : 'py-2.5 px-3'} text-[#71717a] font-bold text-[10px] truncate`}
                                    >
                                      {task.id.replace('task_', 'TX_')}
                                    </td>
                                  );
                                }

                                if (col.id === 'title') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} truncate`}
                                    >
                                      <input
                                        type="text"
                                        value={task.title}
                                        onChange={(e) => onUpdateTaskStatus(task.id, task.status, { title: e.target.value })}
                                        className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-[#ef4444] text-[#f4f4f5] font-sans text-xs font-semibold focus:outline-none w-full px-1 py-0.5 truncate text-left"
                                        title="Click to edit name directly"
                                      />
                                    </td>
                                  );
                                }

                                if (col.id === 'clientPay') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} text-right truncate`}
                                    >
                                      <div className="flex items-center justify-end w-full">
                                        <span className="text-zinc-600 mr-0.5">$</span>
                                        <input
                                          type="number"
                                          value={task.clientPay}
                                          onChange={(e) => onUpdateTaskStatus(task.id, task.status, { clientPay: Number(e.target.value) })}
                                          className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-[#F97316] text-[#F0E6D8] text-right font-mono text-xs focus:outline-none w-full max-w-[80px] px-1"
                                          title="Click to edit client pay directly"
                                        />
                                      </div>
                                    </td>
                                  );
                                }

                                if (col.id === 'subPay') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} text-right truncate`}
                                    >
                                      <div className="flex items-center justify-end w-full">
                                        <span className="text-zinc-600 mr-0.5">$</span>
                                        <input
                                          type="number"
                                          value={task.subPay}
                                          onChange={(e) => onUpdateTaskStatus(task.id, task.status, { subPay: Number(e.target.value) })}
                                          className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-[#F97316] text-zinc-300 text-right font-mono text-xs focus:outline-none w-full max-w-[80px] px-1"
                                          title="Click to edit sub pay directly"
                                        />
                                      </div>
                                    </td>
                                  );
                                }

                                if (col.id === 'netProfit') {
                                  const marginPercent = task.clientPay > 0 ? ((task.clientPay - task.subPay) / task.clientPay) * 100 : 0;
                                  const showWarning = lowMarginAlert && marginPercent < 35 && task.clientPay > 0 && profit > 0;
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-1 px-2' : 'py-2.5 px-3'} text-right font-black ${profit > 0 ? 'text-emerald-400' : 'text-zinc-500'} truncate`}
                                    >
                                      <div className="flex flex-col items-end w-full">
                                        <span className="truncate">{formatPrice(profit)}</span>
                                        {showWarning && (
                                          <span className="text-[8px] text-amber-500 font-mono font-bold animate-pulse uppercase tracking-tight truncate">
                                            ⚠️ LOW ({marginPercent.toFixed(0)}%)
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }

                                if (col.id === 'status') {
                                  const getStatusColor = (st: TaskStatus) => {
                                    if (st === 'Approved') return 'bg-emerald-500';
                                    if (st === 'Client Review') return 'bg-amber-500';
                                    if (st === 'Final Polish') return 'bg-red-500';
                                    if (st === 'Rough Cut') return 'bg-cyan-400';
                                    return 'bg-zinc-500';
                                  };
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} truncate`}
                                    >
                                      <div className="flex items-center gap-1.5 select-none w-full overflow-hidden">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(task.status)}`} />
                                        <select
                                          value={task.status}
                                          onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                                          className="bg-transparent border-none text-zinc-300 text-[10px] font-bold uppercase focus:outline-none cursor-pointer p-0 select-none tracking-wider w-full truncate"
                                        >
                                          <option value="Unassigned" className="bg-black text-zinc-400">Unassigned</option>
                                          <option value="Rough Cut" className="bg-black text-cyan-400">Rough Cut</option>
                                          <option value="Final Polish" className="bg-black text-red-500">Final Polish</option>
                                          <option value="Client Review" className="bg-black text-amber-500">Review</option>
                                          <option value="Approved" className="bg-black text-emerald-400">Approved</option>
                                        </select>
                                      </div>
                                    </td>
                                  );
                                }

                                if (col.id === 'editor') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} truncate`}
                                    >
                                      <select
                                        value={task.assignedEditorId}
                                        onChange={(e) => onUpdateTaskStatus(task.id, task.status, { assignedEditorId: e.target.value })}
                                        className="bg-transparent border-b border-transparent hover:border-zinc-800 text-zinc-300 text-[10px] font-sans focus:outline-none cursor-pointer w-full truncate"
                                      >
                                        <option value="Unassigned">Unassigned</option>
                                        <option value="Phuc">Phuc (Lead)</option>
                                        {staff.filter(s => s.id !== 'Phuc').map(ed => (
                                          <option key={ed.id} value={ed.id}>{ed.name}</option>
                                        ))}
                                      </select>
                                    </td>
                                  );
                                }

                                if (col.id === 'deadline') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} truncate`}
                                    >
                                      <input
                                        type="text"
                                        value={task.internalDeadline}
                                        onChange={(e) => onUpdateTaskStatus(task.id, task.status, { internalDeadline: e.target.value })}
                                        className={`bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-[#ef4444] text-[10px] font-mono focus:outline-none w-full ${getDeadlineStyle(task.internalDeadline, task.status)}`}
                                        title="Format: YYYY-MM-DD HH:MM. Click to edit."
                                      />
                                    </td>
                                  );
                                }

                                if (col.id === 'rawFootage') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} truncate`}
                                    >
                                      <div className="flex items-center gap-1 w-full overflow-hidden">
                                        <input
                                          type="text"
                                          value={task.rawFootageLink}
                                          onChange={(e) => onUpdateTaskStatus(task.id, task.status, { rawFootageLink: e.target.value })}
                                          className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-[#ef4444] text-zinc-400 font-mono text-[9px] focus:outline-none w-full truncate px-0.5"
                                        />
                                        {task.rawFootageLink && (
                                          <a
                                            href={task.rawFootageLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 hover:bg-zinc-900 rounded-sm text-[#ef4444] shrink-0"
                                            title="Open link"
                                          >
                                            <Link className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }

                                if (col.id === 'roughCut') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} truncate`}
                                    >
                                      <div className="flex items-center gap-1 w-full overflow-hidden">
                                        <input
                                          type="text"
                                          placeholder="Empty link..."
                                          value={task.roughCutUrl || ''}
                                          onChange={(e) => onUpdateTaskStatus(task.id, task.status, { roughCutUrl: e.target.value })}
                                          className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-[#ef4444] text-[#06b6d4] font-mono text-[9px] focus:outline-none w-full truncate px-0.5"
                                        />
                                        {task.roughCutUrl && (
                                          <a
                                            href={task.roughCutUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 hover:bg-zinc-900 rounded-sm text-cyan-400 shrink-0"
                                            title="Open Link"
                                          >
                                            <Eye className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }

                                if (col.id === 'finalUrl') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-0.5 px-2' : 'py-1 px-3'} truncate`}
                                    >
                                      <div className="flex items-center gap-1 w-full overflow-hidden">
                                        <input
                                          type="text"
                                          placeholder="Empty final..."
                                          value={task.finalUrl || ''}
                                          onChange={(e) => onUpdateTaskStatus(task.id, task.status, { finalUrl: e.target.value })}
                                          className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-white text-emerald-400 font-mono text-[9px] focus:outline-none w-full truncate px-0.5"
                                        />
                                        {task.finalUrl && (
                                          <a
                                            href={task.finalUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 hover:bg-zinc-900 rounded-sm text-emerald-400 shrink-0"
                                            title="Open Final"
                                          >
                                            <CheckCircle2 className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }

                                if (col.id === 'actions') {
                                  return (
                                    <td 
                                      key={col.id} 
                                      style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                      className={`${denseLayout ? 'py-1 px-2' : 'py-2.5 px-3'} truncate`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => onEditTaskClick(task)}
                                          className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-sm cursor-pointer transition-colors"
                                          title="Edit Specs Blueprint"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => onDeleteTask(task.id)}
                                          className="p-1 text-zinc-500 hover:text-red-500 hover:bg-zinc-900 rounded-sm cursor-pointer transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  );
                                }

                                return null;
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        /* CLASSIC DECK VIEW (Styled in Red APEX theme) */
        <div id="tasks-matrix-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-4 select-text">
          {sortedTasks.map(task => {
            const clientName = getClientName(task.clientId);
            const clientTier = getClientTier(task.clientId);
            const editorName = getEditorName(task.assignedEditorId);
            const profit = task.clientPay - task.subPay;

            return (
              <div 
                key={task.id}
                className={`relative bg-[#161210] border-2 rounded-sm p-4 transition-all duration-300 flex flex-col justify-between ${
                  task.status === 'Approved' 
                    ? 'border-emerald-500/30' 
                    : task.status === 'Final Polish'
                    ? 'border-[#F97316] shadow-[0_0_15px_rgba(249,115,22,0.15)] bg-[#1E1810]'
                    : 'border-[rgba(249,115,22,0.15)] hover:border-[#F97316]/50'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-black/80 border border-zinc-800 rounded-sm text-[9px] font-mono tracking-wider uppercase text-[#F0E6D8]">
                  <span className={`w-1 h-1 rounded-full ${
                    task.status === 'Approved' ? 'bg-emerald-400' :
                    task.status === 'Client Review' ? 'bg-amber-400' :
                    task.status === 'Final Polish' ? 'bg-[#F97316]' : 'bg-[#F97316]'
                  }`}></span>
                  {task.status}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-mono bg-zinc-900 text-[#71717a] border border-zinc-800 px-1 py-0.2 rounded-sm">
                      ID: {task.id.replace('task_', 'TX_')}
                    </span>
                    <span className="text-xs font-mono text-[#F97316] font-bold">
                      {clientName}
                    </span>
                    <span className="text-[8px] font-mono uppercase px-1 py-0.2 bg-zinc-800 text-zinc-400 rounded-sm border border-zinc-900">
                      {clientTier}
                    </span>
                  </div>

                  <h3 className="text-sm font-black tracking-tight text-white mt-2 font-sans leading-tight">
                    {task.title}
                  </h3>

                  {task.notes && (
                    <div className="mt-2.5 p-2 bg-black/60 border border-zinc-900 rounded-sm text-[11px] font-sans text-zinc-500">
                      <span className="text-[8px] font-mono text-[#F97316] uppercase block mb-0.5">// GUIDELINES:</span>
                      {task.notes}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-900">
                    <div>
                      <span className="text-[8px] font-mono uppercase text-[#71717a] block">
                        Operator
                      </span>
                      <div className="flex items-center gap-1 mt-0.5 text-xs font-mono font-bold text-white">
                        <User className="w-3 h-3 text-zinc-500" />
                        <span>{editorName}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[8px] font-mono uppercase text-[#71717a] block">
                        Target Deadline
                      </span>
                      <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono text-zinc-300">
                        <Calendar className="w-3 h-3 text-[#F97316]" />
                        <span className={getDeadlineStyle(task.internalDeadline, task.status)}>{task.internalDeadline}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resource Link box */}
                  <div className="mt-3 flex items-center gap-2 justify-between bg-[#0C0A08] px-2.5 py-1.5 rounded-sm border border-[rgba(249,115,22,0.1)]">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Link className="w-3 h-3 text-[#F97316] shrink-0" />
                      <span className="text-[9px] font-mono text-zinc-500 truncate">
                        {task.rawFootageLink}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <a 
                        href={task.rawFootageLink}
                        target="_blank" 
                        rel="noreferrer"
                        className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[9px] font-mono text-white rounded-sm border border-zinc-800 uppercase"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card footer details */}
                <div className="mt-4 pt-3 border-t border-zinc-900 space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 bg-black/40 px-2.5 py-1 rounded-sm border border-zinc-900">
                    <span>Client Pay: <strong className="text-zinc-300">{formatPrice(task.clientPay)}</strong></span>
                    <span>Sub Pay: <strong className="text-zinc-300">{formatPrice(task.subPay)}</strong></span>
                    <span>Profit: <strong className="text-[#F97316] font-bold">{formatPrice(profit)}</strong></span>
                  </div>

                  <div className="flex justify-end gap-3 pt-1 text-[10px]">
                    <button
                      onClick={() => onEditTaskClick(task)}
                      className="text-[#B8967D] hover:text-[#F97316] font-mono flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" /> Edit Specs
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-zinc-500 hover:text-red-500 font-mono flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

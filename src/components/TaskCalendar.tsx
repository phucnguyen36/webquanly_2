/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TaskCalendar with HTML5 Drag-and-Drop Deadline Rescheduling
 */

import React, { useState, useMemo } from 'react';
import { VideoTaskObject, ClientObject, StaffObject, TaskStatus } from '../types';
import { 
  Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, 
  Layers, Plus, Grid, ListFilter, AlertCircle, Sparkles, Check, Edit, Activity, GripVertical, Move
} from 'lucide-react';

interface TaskCalendarProps {
  tasks: VideoTaskObject[];
  clients: ClientObject[];
  staff: StaffObject[];
  onAddTaskClick: () => void;
  onEditTaskClick: (task: VideoTaskObject) => void;
  onSaveTask: (task: VideoTaskObject) => void;
  selectedYear: string;
  selectedMonthOnly: string;
  currency: 'USD' | 'VND';
}

type CalendarViewMode = 'month' | 'week';

export default function TaskCalendar({
  tasks,
  clients,
  staff,
  onAddTaskClick,
  onEditTaskClick,
  onSaveTask,
  selectedYear,
  selectedMonthOnly,
  currency
}: TaskCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);
  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(0);

  // Year & Month state
  const year = useMemo(() => selectedYear === 'all' ? 2026 : parseInt(selectedYear), [selectedYear]);
  const monthIdx = useMemo(() => selectedMonthOnly === 'all' ? 6 : parseInt(selectedMonthOnly) - 1, [selectedMonthOnly]);

  // Helper to resolve names
  const getClientName = (id: string) => {
    const c = clients.find(item => item.id === id);
    return c ? c.displayName : 'Vãng lai';
  };

  const getEditorName = (id: string) => {
    if (id === 'Phuc') return 'Phuc (Lead)';
    const s = staff.find(item => item.id === id);
    return s ? s.name : 'Chưa giao';
  };

  const monthName = useMemo(() => {
    const date = new Date(year, monthIdx, 1);
    return date.toLocaleString('vi-VN', { month: 'long' });
  }, [year, monthIdx]);

  // Calendar configuration for Month Grid
  const calendarCells = useMemo(() => {
    const cells: { date: Date; isCurrentMonth: boolean; dayNum: number; tasks: VideoTaskObject[] }[] = [];
    
    const firstDayDate = new Date(year, monthIdx, 1);
    const startWeekday = firstDayDate.getDay();
    const totalDays = new Date(year, monthIdx + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, monthIdx, 0).getDate();
    
    // Previous month tail days
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevDate = new Date(year, monthIdx - 1, d);
      cells.push({
        date: prevDate,
        isCurrentMonth: false,
        dayNum: d,
        tasks: []
      });
    }
    
    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, monthIdx, d);
      const dayTasks = tasks.filter(t => {
        if (!t.internalDeadline) return false;
        const taskDate = new Date(t.internalDeadline);
        return (
          taskDate.getDate() === d &&
          taskDate.getMonth() === monthIdx &&
          taskDate.getFullYear() === year
        );
      });

      cells.push({
        date: curDate,
        isCurrentMonth: true,
        dayNum: d,
        tasks: dayTasks
      });
    }
    
    // Next month head days
    const currentCellsLength = cells.length;
    const remainingCells = 42 - currentCellsLength;
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(year, monthIdx + 1, d);
      cells.push({
        date: nextDate,
        isCurrentMonth: false,
        dayNum: d,
        tasks: []
      });
    }

    return cells;
  }, [tasks, year, monthIdx]);

  // Partition calendar cells into weeks
  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows.push(calendarCells.slice(i, i + 7));
    }
    return rows;
  }, [calendarCells]);

  const activeWeekDays = useMemo(() => {
    const clampedIndex = Math.min(Math.max(0, activeWeekIndex), weeks.length - 1);
    return weeks[clampedIndex] || weeks[0] || [];
  }, [weeks, activeWeekIndex]);

  // Unscheduled or pending tasks pool (tasks that can be dragged into calendar)
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(t => !t.internalDeadline || t.status === 'Unassigned');
  }, [tasks]);

  // Drag and Drop Handler
  const handleDropTaskToDate = (taskId: string, targetDate: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    const newDeadline = `${y}-${m}-${d}`;

    if (task.internalDeadline === newDeadline) return;

    const updatedTask: VideoTaskObject = {
      ...task,
      internalDeadline: newDeadline
    };
    onSaveTask(updatedTask);
  };

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case 'Unassigned':
        return 'border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:border-zinc-600';
      case 'Rough Cut':
        return 'border-amber-900/60 bg-amber-950/60 text-amber-300 hover:border-amber-700';
      case 'Final Polish':
        return 'border-purple-900/60 bg-purple-950/60 text-purple-300 hover:border-purple-700';
      case 'Client Review':
        return 'border-cyan-900/60 bg-cyan-950/60 text-cyan-300 hover:border-cyan-700';
      case 'Approved':
        return 'border-emerald-900/60 bg-emerald-950/60 text-emerald-300 hover:border-emerald-600';
    }
  };

  const getStatusDotColor = (status: TaskStatus) => {
    switch (status) {
      case 'Unassigned': return 'bg-zinc-500';
      case 'Rough Cut': return 'bg-amber-500';
      case 'Final Polish': return 'bg-purple-500';
      case 'Client Review': return 'bg-cyan-500';
      case 'Approved': return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-6 font-haas select-none">
      
      {/* Header and Controls */}
      <div className="spatial-card p-5 bg-black/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-black tracking-widest text-white uppercase font-haas">
              DRAG & DROP TASK CALENDAR COMMAND
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {viewMode === 'month' ? 'Lịch Tháng' : 'Lịch Tuần'} • {monthName} {year} • <span className="text-blue-400 font-bold">Gắp thả Task trực tiếp để đổi Deadline</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
          {viewMode === 'week' && (
            <div className="flex items-center gap-1 bg-black/90 p-1 rounded-[6px] border border-white/10">
              <button
                onClick={() => setActiveWeekIndex(prev => Math.max(0, prev - 1))}
                disabled={activeWeekIndex === 0}
                className="p-1 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[10px] uppercase font-bold text-slate-300">
                Tuần {activeWeekIndex + 1} / {weeks.length}
              </span>
              <button
                onClick={() => setActiveWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
                disabled={activeWeekIndex === weeks.length - 1}
                className="p-1 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-black/90 p-1 rounded-[6px] border border-white/10">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-[10px] uppercase font-extrabold rounded-[4px] cursor-pointer transition-all ${
                viewMode === 'month' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => { setViewMode('week'); setActiveWeekIndex(0); }}
              className={`px-3 py-1 text-[10px] uppercase font-extrabold rounded-[4px] cursor-pointer transition-all ${
                viewMode === 'week' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Week View
            </button>
          </div>

          <button
            onClick={onAddTaskClick}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold uppercase text-[10px] rounded-[6px] flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            <Plus className="w-3.5 h-3.5" />
            NEW TASK
          </button>
        </div>
      </div>

      {/* Unscheduled Tasks Drag Tray (Hộp chứa task chờ kéo thả) */}
      {unscheduledTasks.length > 0 && (
        <div className="spatial-card p-4 bg-blue-950/20 border border-blue-500/30 rounded-[6px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 animate-bounce" />
              TASK CHỜ GẮP THẢ LÊN LỊCH ({unscheduledTasks.length} tasks)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Gắp thả vào ô ngày bên dưới để xếp Deadline</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {unscheduledTasks.map(t => (
              <div
                key={t.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', t.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggingTaskId(t.id);
                }}
                onDragEnd={() => setDraggingTaskId(null)}
                className={`p-2 bg-black/80 border border-blue-500/40 rounded-[6px] text-xs flex items-center gap-2 cursor-grab active:cursor-grabbing hover:border-blue-400 min-w-[180px] ${
                  draggingTaskId === t.id ? 'opacity-40 ring-2 ring-blue-500' : ''
                }`}
              >
                <GripVertical className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="font-bold text-white text-[11px] truncate">{t.title}</div>
                  <div className="text-[9px] text-slate-400 font-mono">{getClientName(t.clientId)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. MONTH VIEW CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="spatial-card border border-white/10 overflow-hidden rounded-[6px]">
          
          {/* Weekday Titles */}
          <div className="grid grid-cols-7 border-b border-white/10 bg-black/60 text-center font-mono text-[10px] text-slate-400 font-bold uppercase py-2.5">
            <div>CN (Sun)</div>
            <div>T2 (Mon)</div>
            <div>T3 (Tue)</div>
            <div>T4 (Wed)</div>
            <div>T5 (Thu)</div>
            <div>T6 (Fri)</div>
            <div>T7 (Sat)</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/10 bg-black/40 min-h-[520px]">
            {calendarCells.map((cell, idx) => {
              const dateIsoStr = cell.date.toISOString();
              const isToday = new Date().getDate() === cell.dayNum && 
                              new Date().getMonth() === monthIdx && 
                              new Date().getFullYear() === year &&
                              cell.isCurrentMonth;
              const isDragOver = dragOverDateStr === dateIsoStr;

              return (
                <div 
                  key={idx}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverDateStr(dateIsoStr);
                  }}
                  onDragLeave={() => setDragOverDateStr(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDateStr(null);
                    const taskId = e.dataTransfer.getData('text/plain');
                    if (taskId) {
                      handleDropTaskToDate(taskId, cell.date);
                    }
                  }}
                  className={`p-2 flex flex-col justify-between min-h-[115px] h-full transition-all relative ${
                    cell.isCurrentMonth ? 'bg-black/20' : 'bg-black/80 opacity-30'
                  } ${isToday ? 'ring-1 ring-inset ring-blue-500 bg-blue-500/5' : ''} ${
                    isDragOver ? 'bg-blue-600/20 border-2 border-blue-500 ring-2 ring-blue-500/50' : ''
                  }`}
                >
                  
                  {/* Day Header */}
                  <div className="flex justify-between items-center mb-1.5">
                    <span 
                      className={`text-[11px] font-mono font-bold ${
                        isToday 
                          ? 'text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded-[4px]' 
                          : cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    
                    {cell.isCurrentMonth && (
                      <button 
                        onClick={onAddTaskClick}
                        className="text-slate-600 hover:text-blue-400 p-0.5 cursor-pointer rounded"
                        title="Thêm task cho ngày này"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Tasks list inside this Day Cell (Draggable) */}
                  <div className="flex-1 space-y-1 mt-1 pb-1">
                    {cell.tasks.map(task => (
                      <div
                        key={task.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData('text/plain', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingTaskId(task.id);
                        }}
                        onDragEnd={() => setDraggingTaskId(null)}
                        onClick={() => onEditTaskClick(task)}
                        className={`p-1.5 text-[10px] border rounded-[6px] font-sans flex flex-col cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all ${getStatusBadgeClass(task.status)} ${
                          draggingTaskId === task.id ? 'opacity-30' : ''
                        }`}
                        title={`Gắp thả để đổi ngày deadline!\nDeadline: ${task.internalDeadline}\nEditor: ${getEditorName(task.assignedEditorId)}`}
                      >
                        <div className="font-extrabold truncate text-white leading-tight flex items-center justify-between gap-1">
                          <span className="truncate">{task.title}</span>
                          <GripVertical className="w-2.5 h-2.5 text-slate-400 shrink-0 opacity-60" />
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 font-mono truncate">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(task.status)}`} />
                          <span className="truncate">{getEditorName(task.assignedEditorId)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 2. WEEK VIEW DETAILED DASHBOARD */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {activeWeekDays.map((cell, idx) => {
            const dateIsoStr = cell.date.toISOString();
            const isToday = new Date().getDate() === cell.dayNum && 
                            new Date().getMonth() === monthIdx && 
                            new Date().getFullYear() === year &&
                            cell.isCurrentMonth;
            const isDragOver = dragOverDateStr === dateIsoStr;
            const dayOfWeekName = cell.date.toLocaleString('vi-VN', { weekday: 'short' });

            return (
              <div 
                key={idx}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverDateStr(dateIsoStr);
                }}
                onDragLeave={() => setDragOverDateStr(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverDateStr(null);
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) {
                    handleDropTaskToDate(taskId, cell.date);
                  }
                }}
                className={`spatial-card p-3 flex flex-col justify-between min-h-[360px] transition-all rounded-[6px] ${
                  isToday ? 'border-blue-500 bg-blue-500/5' : ''
                } ${isDragOver ? 'border-2 border-blue-500 bg-blue-600/20' : ''}`}
              >
                {/* Day Header */}
                <div className="border-b border-white/10 pb-2 mb-3 flex justify-between items-center font-mono">
                  <div>
                    <h3 className={`text-xs font-black uppercase ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                      {dayOfWeekName}
                    </h3>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {cell.date.toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={`text-sm font-black ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>
                    {cell.dayNum}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {cell.tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-10 font-mono text-[9px] uppercase">
                      <Activity className="w-4 h-4 text-slate-700 mb-1" />
                      Kéo thả task vào đây
                    </div>
                  ) : (
                    cell.tasks.map(task => (
                      <div
                        key={task.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData('text/plain', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingTaskId(task.id);
                        }}
                        onDragEnd={() => setDraggingTaskId(null)}
                        onClick={() => onEditTaskClick(task)}
                        className={`p-2.5 bg-black/60 border rounded-[6px] transition-all cursor-grab active:cursor-grabbing hover:border-blue-400 ${getStatusBadgeClass(task.status)} ${
                          draggingTaskId === task.id ? 'opacity-30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="text-xs font-extrabold text-white leading-tight">
                            {task.title}
                          </div>
                          <GripVertical className="w-3 h-3 text-slate-500 shrink-0" />
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 mt-1">
                          Khách: {getClientName(task.clientId)}
                        </div>

                        <div className="border-t border-white/10 pt-1.5 mt-2 flex items-center justify-between text-[9px] font-mono">
                          <span className="text-slate-400">{getEditorName(task.assignedEditorId)}</span>
                          <span className="font-bold text-emerald-400">
                            {currency === 'USD' ? `$${task.clientPay}` : `${(task.clientPay * 25400).toLocaleString()}₫`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={onAddTaskClick}
                  className="w-full mt-3 py-1.5 border border-dashed border-white/10 hover:border-blue-500 hover:bg-blue-500/10 text-slate-400 hover:text-white transition-all font-mono text-[9px] uppercase rounded-[6px] cursor-pointer"
                >
                  + Add Task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Legend */}
      <div className="spatial-card p-3 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="uppercase font-bold text-white">TRẠNG THÁI TASK:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500" /> UNASSIGNED</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> ROUGH CUT</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> FINAL POLISH</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /> CLIENT REVIEW</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> APPROVED</span>
        </div>
        
        <div className="text-slate-300 font-bold">
          💡 Bấm giữ & kéo thả Task để thay đổi ngày Deadline tự động.
        </div>
      </div>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { VideoTaskObject, ClientObject, StaffObject, TaskStatus } from '../types';
import { 
  Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, 
  Layers, Plus, Grid, ListFilter, AlertCircle, Sparkles, Check, Edit, Activity
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
  
  // Year & Month state from top level or internal offset
  const year = useMemo(() => selectedYear === 'all' ? 2026 : parseInt(selectedYear), [selectedYear]);
  const monthIdx = useMemo(() => selectedMonthOnly === 'all' ? 6 : parseInt(selectedMonthOnly) - 1, [selectedMonthOnly]); // 0-indexed

  // Internal week navigation offset for "week" view
  // 0 = first week of selected month, 1 = second week, etc.
  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(0);

  // Helper to resolve client name
  const getClientName = (id: string) => {
    const c = clients.find(item => item.id === id);
    return c ? c.displayName : 'Vãng lai';
  };

  // Helper to resolve editor name
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
    
    // First day of current month
    const firstDayDate = new Date(year, monthIdx, 1);
    // Find weekday index (0 = Sun, 1 = Mon, ..., 6 = Sat)
    // Adjust so Monday is 0 or keep standard Sunday = 0. Let's use Sunday = 0
    const startWeekday = firstDayDate.getDay();
    
    // Number of days in current month
    const totalDays = new Date(year, monthIdx + 1, 0).getDate();
    
    // Previous month info
    const prevMonthTotalDays = new Date(year, monthIdx, 0).getDate();
    
    // 1. Fill previous month tail days
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
    
    // 2. Fill current month days
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, monthIdx, d);
      // Filter tasks falling on this exact day
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
    
    // 3. Fill next month head days to make grid standard 42 cells (6 rows)
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

  // Current selected week for Week View
  const activeWeekDays = useMemo(() => {
    const clampedIndex = Math.min(Math.max(0, activeWeekIndex), weeks.length - 1);
    return weeks[clampedIndex] || weeks[0] || [];
  }, [weeks, activeWeekIndex]);

  // Color mapping for task status indicators
  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case 'Unassigned':
        return 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-600 shadow-[0_0_8px_rgba(24,24,27,0.4)]';
      case 'Rough Cut':
        return 'border-amber-900 bg-amber-950/40 text-amber-300 hover:border-amber-700 shadow-[0_0_8px_rgba(245,158,11,0.1)]';
      case 'Final Polish':
        return 'border-purple-900 bg-purple-950/40 text-purple-300 hover:border-purple-700 shadow-[0_0_8px_rgba(168,85,247,0.1)]';
      case 'Client Review':
        return 'border-cyan-900 bg-cyan-950/40 text-cyan-300 hover:border-cyan-700 shadow-[0_0_8px_rgba(6,182,212,0.1)]';
      case 'Approved':
        return 'border-emerald-900 bg-emerald-950/50 text-emerald-300 hover:border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
    }
  };

  // Status-colored dot
  const getStatusDotColor = (status: TaskStatus) => {
    switch (status) {
      case 'Unassigned': return 'bg-zinc-500';
      case 'Rough Cut': return 'bg-amber-500';
      case 'Final Polish': return 'bg-purple-500';
      case 'Client Review': return 'bg-cyan-500';
      case 'Approved': return 'bg-emerald-500';
    }
  };

  const handlePrevWeek = () => {
    setActiveWeekIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextWeek = () => {
    setActiveWeekIndex(prev => Math.min(weeks.length - 1, prev + 1));
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-none">
        <div>
          <h2 className="text-sm font-black tracking-widest text-zinc-100 uppercase flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#F97316]" />
            TASK CALENDAR COMMAND
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono uppercase mt-1">
            {viewMode === 'month' ? 'Giao diện Lịch Tháng' : 'Giao diện Lịch Tuần'} • {monthName} {year}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
          
          {/* Week view navigation */}
          {viewMode === 'week' && (
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 border border-zinc-800">
              <button
                onClick={handlePrevWeek}
                disabled={activeWeekIndex === 0}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Tuần trước"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="px-2 text-[9px] uppercase font-bold text-zinc-400">
                Tuần {activeWeekIndex + 1} / {weeks.length}
              </span>
              <button
                onClick={handleNextWeek}
                disabled={activeWeekIndex === weeks.length - 1}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Tuần sau"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1.5 bg-zinc-900/60 p-0.5 border border-zinc-850">
            <span className="text-zinc-500 font-bold px-2 uppercase">Chế độ hiển thị:</span>
            <button
              onClick={() => { setViewMode('month'); }}
              className={`px-3 py-1 text-[9px] uppercase font-bold cursor-pointer transition-all ${
                viewMode === 'month' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lịch Tháng (Month)
            </button>
            <button
              onClick={() => { setViewMode('week'); setActiveWeekIndex(0); }}
              className={`px-3 py-1 text-[9px] uppercase font-bold cursor-pointer transition-all ${
                viewMode === 'week' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lịch Tuần (Week)
            </button>
          </div>

          <button
            onClick={onAddTaskClick}
            className="px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6c0a] text-white font-black uppercase text-[9px] flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.3)]"
          >
            <Plus className="w-3 h-3" />
            DEPLOY VIDEO
          </button>
        </div>
      </div>

      {/* 1. MONTH VIEW CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="bg-zinc-950 border border-zinc-900">
          
          {/* Weekday Titles */}
          <div className="grid grid-cols-7 border-b border-zinc-900 bg-zinc-900/20 text-center font-mono text-[9px] text-zinc-500 font-bold uppercase py-2">
            <div>Chủ Nhật (Sun)</div>
            <div>Thứ Hai (Mon)</div>
            <div>Thứ Ba (Tue)</div>
            <div>Thứ Tư (Wed)</div>
            <div>Thứ Năm (Thu)</div>
            <div>Thứ Sáu (Fri)</div>
            <div>Thứ Bảy (Sat)</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr divide-x divide-y divide-zinc-900 bg-zinc-950 min-h-[500px]">
            {calendarCells.map((cell, idx) => {
              const isToday = new Date().getDate() === cell.dayNum && 
                              new Date().getMonth() === monthIdx && 
                              new Date().getFullYear() === year &&
                              cell.isCurrentMonth;
              
              return (
                <div 
                  key={idx} 
                  className={`p-1.5 flex flex-col justify-between min-h-[90px] transition-all relative ${
                    cell.isCurrentMonth ? 'bg-[#09090b]/40' : 'bg-[#040405]/80 opacity-30 select-none'
                  } ${isToday ? 'ring-1 ring-inset ring-[#F97316]/50 bg-[#F97316]/2' : ''}`}
                >
                  
                  {/* Day Number */}
                  <div className="flex justify-between items-center mb-1.5">
                    <span 
                      className={`text-[10px] font-mono font-bold ${
                        isToday 
                          ? 'text-[#F97316] bg-[#F97316]/10 px-1 rounded-sm' 
                          : cell.isCurrentMonth ? 'text-zinc-400' : 'text-zinc-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    
                    {cell.isCurrentMonth && (
                      <button 
                        onClick={onAddTaskClick}
                        className="text-zinc-700 hover:text-[#F97316] opacity-0 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                        title="Thêm task cho ngày này"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Tasks on this Day */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin select-text">
                    {cell.tasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => onEditTaskClick(task)}
                        className={`p-1 text-[9px] border rounded-sm font-sans flex flex-col cursor-pointer transition-all ${getStatusBadgeClass(task.status)}`}
                        title={`Deadline: ${task.internalDeadline}\nNhận: ${getEditorName(task.assignedEditorId)}`}
                      >
                        <div className="font-bold truncate leading-snug text-zinc-100 group-hover:text-white">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-1 text-[7px] text-zinc-400 mt-0.5 font-mono truncate">
                          <span className={`w-1 h-1 rounded-full ${getStatusDotColor(task.status)}`} />
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
            const isToday = new Date().getDate() === cell.dayNum && 
                            new Date().getMonth() === monthIdx && 
                            new Date().getFullYear() === year &&
                            cell.isCurrentMonth;
            
            const dayOfWeekName = cell.date.toLocaleString('vi-VN', { weekday: 'long' });

            return (
              <div 
                key={idx} 
                className={`bg-zinc-950 border p-3 flex flex-col justify-start min-h-[350px] transition-all ${
                  isToday ? 'border-[#F97316]/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-zinc-900'
                } ${!cell.isCurrentMonth ? 'opacity-40' : ''}`}
              >
                {/* Header of the Day */}
                <div className="border-b border-zinc-900 pb-2 mb-3 flex justify-between items-center">
                  <div>
                    <h3 className={`text-[10px] font-black uppercase tracking-wider ${isToday ? 'text-[#F97316]' : 'text-zinc-400'}`}>
                      {dayOfWeekName}
                    </h3>
                    <p className="text-[8px] font-mono text-zinc-500 mt-0.5">
                      {cell.date.toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={`text-xs font-mono font-black ${isToday ? 'text-[#F97316]' : 'text-zinc-600'}`}>
                    {cell.dayNum}
                  </span>
                </div>

                {/* Day Tasks Stack */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
                  {cell.tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-700 py-10 font-mono text-[8px] uppercase">
                      <Activity className="w-4 h-4 text-zinc-800 mb-1" />
                      No Task
                    </div>
                  ) : (
                    cell.tasks.map(task => {
                      const statusBadge = getStatusBadgeClass(task.status);
                      return (
                        <div
                          key={task.id}
                          onClick={() => onEditTaskClick(task)}
                          className={`p-2 bg-zinc-900/30 hover:bg-zinc-900/60 border rounded-sm transition-all cursor-pointer flex flex-col justify-between space-y-2 ${statusBadge}`}
                        >
                          <div>
                            <div className="text-[10px] font-bold text-zinc-100 leading-snug">
                              {task.title}
                            </div>
                            <span className="text-[8px] font-mono text-zinc-400 block mt-1">
                              Khách: {getClientName(task.clientId)}
                            </span>
                          </div>

                          <div className="border-t border-zinc-800/60 pt-1.5 mt-1 flex items-center justify-between text-[8px] font-mono">
                            <span className="text-zinc-400">{getEditorName(task.assignedEditorId)}</span>
                            <span className="font-bold text-zinc-300">
                              {currency === 'USD' ? `$${task.clientPay}` : `${task.clientPay.toLocaleString()}₫`}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Micro Add task button on bottom of week column */}
                <button
                  onClick={onAddTaskClick}
                  className="w-full mt-3 py-1 border border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/30 text-zinc-500 hover:text-zinc-300 transition-all font-mono text-[8px] uppercase text-center cursor-pointer"
                >
                  + Add task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend and stats summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/40 p-3 border border-zinc-900 font-mono text-[9px] text-zinc-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="uppercase font-bold text-zinc-400">CHÚ GIẢI TRẠNG THÁI:</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span>UNASSIGNED</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>ROUGH CUT</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>FINAL POLISH</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span>CLIENT REVIEW</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>APPROVED</span>
          </div>
        </div>
        
        <div className="text-zinc-400">
          TỔNG SỐ TASK THÁNG NÀY: <span className="font-black text-white">{tasks.length} VIDEO SEGMENTS</span>
        </div>
      </div>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { VideoTaskObject, ClientObject, StaffObject, TaskStatus } from '../types';
import { 
  Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, 
  Layers, Plus, Grid, ListFilter, AlertCircle, Sparkles, Check, Play, Edit
} from 'lucide-react';

interface GanttTimelineProps {
  tasks: VideoTaskObject[];
  clients: ClientObject[];
  staff: StaffObject[];
  onEditTaskClick: (task: VideoTaskObject) => void;
  onSaveTask: (task: VideoTaskObject) => void;
  selectedYear: string;
  selectedMonthOnly: string;
  currency: 'USD' | 'VND';
}

type GroupByOption = 'none' | 'staff' | 'client';
type TimeScale = 'day' | 'week';

export default function GanttTimeline({
  tasks,
  clients,
  staff,
  onEditTaskClick,
  onSaveTask,
  selectedYear,
  selectedMonthOnly,
  currency
}: GanttTimelineProps) {
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [scale, setScale] = useState<TimeScale>('day');
  
  // Resolve year and month context
  const year = useMemo(() => selectedYear === 'all' ? 2026 : parseInt(selectedYear), [selectedYear]);
  const monthIdx = useMemo(() => selectedMonthOnly === 'all' ? 6 : parseInt(selectedMonthOnly) - 1, [selectedMonthOnly]); // 0-indexed

  // List of days in the selected month
  const daysInMonth = useMemo(() => {
    const date = new Date(year, monthIdx + 1, 0);
    return date.getDate();
  }, [year, monthIdx]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const monthName = useMemo(() => {
    const date = new Date(year, monthIdx, 1);
    return date.toLocaleString('vi-VN', { month: 'long' });
  }, [year, monthIdx]);

  // Helper to resolve client name
  const getClientName = (id: string) => {
    const c = clients.find(item => item.id === id);
    return c ? c.displayName : 'Vãng lai / Không rõ';
  };

  // Helper to resolve editor name
  const getEditorName = (id: string) => {
    if (id === 'Phuc') return 'Phuc (Lead)';
    const s = staff.find(item => item.id === id);
    return s ? s.name : 'Chưa giao';
  };

  // Safe date parser to day number of current selected month
  const getDayOfDeadline = (deadlineStr: string): number => {
    if (!deadlineStr) return 1;
    const taskDate = new Date(deadlineStr);
    if (isNaN(taskDate.getTime())) return 1;
    
    // Check if same year and month
    if (taskDate.getFullYear() === year && taskDate.getMonth() === monthIdx) {
      return taskDate.getDate();
    }
    // If different month, clamp to edge
    if (taskDate.getFullYear() < year || (taskDate.getFullYear() === year && taskDate.getMonth() < monthIdx)) {
      return 1;
    }
    return daysInMonth;
  };

  // Handle shift deadline day interactively
  const handleShiftDeadline = async (task: VideoTaskObject, daysShift: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const taskDate = new Date(task.internalDeadline);
    if (isNaN(taskDate.getTime())) return;
    
    taskDate.setDate(taskDate.getDate() + daysShift);
    
    // Format back to YYYY-MM-DD HH:MM
    const y = taskDate.getFullYear();
    const m = String(taskDate.getMonth() + 1).padStart(2, '0');
    const d = String(taskDate.getDate()).padStart(2, '0');
    const hr = String(taskDate.getHours()).padStart(2, '0');
    const min = String(taskDate.getMinutes()).padStart(2, '0');
    
    const updatedTask = {
      ...task,
      internalDeadline: `${y}-${m}-${d} ${hr}:${min}`
    };
    
    await onSaveTask(updatedTask);
  };

  // Color mapping for tasks
  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'Unassigned':
        return {
          bg: 'bg-zinc-800/90 hover:bg-zinc-700/90 border-zinc-700 text-zinc-300 shadow-[0_0_10px_rgba(39,39,42,0.5)]',
          color: 'text-zinc-400',
          badge: 'bg-zinc-900 border-zinc-700 text-zinc-400',
          accent: '#71717a'
        };
      case 'Rough Cut':
        return {
          bg: 'bg-amber-950/80 hover:bg-amber-900/80 border-amber-800/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
          color: 'text-amber-400',
          badge: 'bg-amber-950/90 border-amber-800 text-amber-400',
          accent: '#f59e0b'
        };
      case 'Final Polish':
        return {
          bg: 'bg-purple-950/80 hover:bg-purple-900/80 border-purple-800/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
          color: 'text-purple-400',
          badge: 'bg-purple-950/90 border-purple-800 text-purple-400',
          accent: '#a855f7'
        };
      case 'Client Review':
        return {
          bg: 'bg-cyan-950/80 hover:bg-cyan-900/80 border-cyan-800/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
          color: 'text-cyan-400',
          badge: 'bg-cyan-950/90 border-cyan-800 text-cyan-400',
          accent: '#06b6d4'
        };
      case 'Approved':
        return {
          bg: 'bg-emerald-950/85 hover:bg-emerald-900/85 border-emerald-800/50 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          color: 'text-emerald-400',
          badge: 'bg-emerald-950 border-emerald-800 text-emerald-400',
          accent: '#10b981'
        };
    }
  };

  // Organize timeline bars
  const processedTasks = useMemo(() => {
    return tasks.map(t => {
      const deadlineDay = getDayOfDeadline(t.internalDeadline);
      
      // Calculate dynamic duration representation (standard 4 days up to the deadline)
      // If deadline is Day 4, bar starts at Day 1 and ends at Day 4
      const duration = 4;
      const startDay = Math.max(1, deadlineDay - duration + 1);
      const span = deadlineDay - startDay + 1;

      return {
        ...t,
        startDay,
        deadlineDay,
        span
      };
    });
  }, [tasks, year, monthIdx, daysInMonth]);

  // Grouping partitions
  const groups = useMemo(() => {
    const result: { id: string; name: string; tasks: typeof processedTasks }[] = [];

    if (groupBy === 'none') {
      result.push({ id: 'all', name: 'Tất cả Video Tasks', tasks: processedTasks });
    } else if (groupBy === 'staff') {
      // Unassigned
      const unassigned = processedTasks.filter(t => t.assignedEditorId === 'Unassigned');
      if (unassigned.length > 0) {
        result.push({ id: 'unassigned', name: 'Claimable Pool (Chưa Giao)', tasks: unassigned });
      }
      
      // Lead Phuc
      const phucTasks = processedTasks.filter(t => t.assignedEditorId === 'Phuc');
      if (phucTasks.length > 0) {
        result.push({ id: 'Phuc', name: 'Phuc (Lead Operator)', tasks: phucTasks });
      }

      // Rest of editors
      staff.forEach(s => {
        const sTasks = processedTasks.filter(t => t.assignedEditorId === s.id);
        if (sTasks.length > 0) {
          result.push({ id: s.id, name: `${s.name} (${s.role || 'Editor'})`, tasks: sTasks });
        }
      });
    } else if (groupBy === 'client') {
      clients.forEach(c => {
        const cTasks = processedTasks.filter(t => t.clientId === c.id);
        if (cTasks.length > 0) {
          result.push({ id: c.id, name: `${c.displayName} (${c.tier})`, tasks: cTasks });
        }
      });
      const unassignedClient = processedTasks.filter(t => !t.clientId || !clients.some(c => c.id === t.clientId));
      if (unassignedClient.length > 0) {
        result.push({ id: 'unassigned-client', name: 'Khách vãng lai / Không rõ', tasks: unassignedClient });
      }
    }

    return result;
  }, [processedTasks, groupBy, staff, clients]);

  return (
    <div className="space-y-6">
      
      {/* View Header & Toggles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-none">
        <div>
          <h2 className="text-sm font-black tracking-widest text-zinc-100 uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F97316] animate-pulse" />
            TIMELINE WORKSPACE (GANTT)
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono uppercase mt-1">
            Giao diện trực quan hóa tiến độ & điều chỉnh Deadline cho {monthName} {year}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
          {/* Scale selection */}
          <div className="flex items-center gap-1.5 bg-zinc-900/60 p-0.5 border border-zinc-850">
            <span className="text-zinc-500 font-bold px-2 uppercase">Chia tỉ lệ:</span>
            <button
              onClick={() => setScale('day')}
              className={`px-3 py-1 text-[9px] uppercase font-bold cursor-pointer transition-all ${
                scale === 'day' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cận Cảnh (Ngày)
            </button>
            <button
              onClick={() => setScale('week')}
              className={`px-3 py-1 text-[9px] uppercase font-bold cursor-pointer transition-all ${
                scale === 'week' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tổng Quan (Tuần)
            </button>
          </div>

          {/* Group By selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900/60 p-0.5 border border-zinc-850">
            <span className="text-zinc-500 font-bold px-2 uppercase">Gom nhóm:</span>
            <button
              onClick={() => setGroupBy('none')}
              className={`px-2.5 py-1 text-[9px] uppercase font-bold cursor-pointer transition-all ${
                groupBy === 'none' ? 'bg-[#F97316] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Danh sách phẳng
            </button>
            <button
              onClick={() => setGroupBy('staff')}
              className={`px-2.5 py-1 text-[9px] uppercase font-bold cursor-pointer transition-all ${
                groupBy === 'staff' ? 'bg-[#F97316] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Theo Editor
            </button>
            <button
              onClick={() => setGroupBy('client')}
              className={`px-2.5 py-1 text-[9px] uppercase font-bold cursor-pointer transition-all ${
                groupBy === 'client' ? 'bg-[#F97316] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Theo Khách hàng
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout Canvas */}
      <div className="bg-zinc-950 border border-zinc-900 overflow-x-auto">
        <div className="min-w-[1000px] select-none">
          
          {/* Scale 1: DAY RESOLUTION */}
          {scale === 'day' && (
            <>
              {/* Timeline Ruler Header */}
              <div className="flex border-b border-zinc-900 bg-zinc-900/10 font-mono text-[9px] text-zinc-500 font-bold">
                <div className="w-56 px-4 py-3 shrink-0 border-r border-zinc-900 flex items-center bg-zinc-950 text-zinc-300">
                  THÔNG TIN VIDEO TASK
                </div>
                
                <div className="flex-1 grid text-center divide-x divide-zinc-900/60" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
                  {daysArray.map(day => {
                    // Check if weekend
                    const dayDate = new Date(year, monthIdx, day);
                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                    const isToday = new Date().getDate() === day && new Date().getMonth() === monthIdx && new Date().getFullYear() === year;

                    return (
                      <div 
                        key={day} 
                        className={`py-3 flex flex-col justify-center items-center ${
                          isToday ? 'bg-[#F97316]/10 text-[#F97316]' : isWeekend ? 'bg-zinc-900/30 text-zinc-600' : ''
                        }`}
                        style={{ gridColumn: `span 1 / span 1` }}
                      >
                        <span>{String(day).padStart(2, '0')}</span>
                        <span className="text-[7px] text-zinc-600 mt-0.5 uppercase">
                          {dayDate.toLocaleString('vi-VN', { weekday: 'narrow' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracks (Groups and Bars) */}
              <div className="divide-y divide-zinc-900">
                {groups.map(group => (
                  <div key={group.id} className="bg-zinc-950">
                    
                    {/* Partition Header */}
                    {groupBy !== 'none' && (
                      <div className="px-4 py-2 bg-zinc-900/30 border-b border-zinc-900/80 text-[10px] font-bold text-[#F97316] font-mono uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] shadow-[0_0_8px_#F97316]"></div>
                        {group.name} ({group.tasks.length} videos)
                      </div>
                    )}

                    {group.tasks.length === 0 ? (
                      <div className="flex items-center text-zinc-600 py-6 px-4 text-xs font-mono">
                        Không có task nào trong bộ lọc này.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-900/40">
                        {group.tasks.map(task => {
                          const statusStyle = getStatusStyle(task.status);
                          
                          return (
                            <div 
                              key={task.id} 
                              className="flex group hover:bg-zinc-900/10 items-stretch min-h-[50px] transition-all cursor-pointer"
                              onClick={() => onEditTaskClick(task)}
                            >
                              {/* Sidebar Details Block */}
                              <div className="w-56 p-3 shrink-0 border-r border-zinc-900 flex flex-col justify-between bg-zinc-950/40 font-sans z-10">
                                <div className="truncate">
                                  <h4 className="text-[11px] font-bold text-zinc-200 group-hover:text-white truncate" title={task.title}>
                                    {task.title}
                                  </h4>
                                  <p className="text-[9px] font-mono text-zinc-500 truncate mt-0.5">
                                    {getClientName(task.clientId)} • {getEditorName(task.assignedEditorId)}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between text-[8px] font-mono mt-1.5">
                                  <span className={`px-1 rounded-sm border ${statusStyle.badge} uppercase text-[7px] font-black tracking-wider`}>
                                    {task.status}
                                  </span>
                                  <span className="text-zinc-500 font-bold">
                                    {currency === 'USD' ? `$${task.clientPay}` : `${task.clientPay.toLocaleString()}₫`}
                                  </span>
                                </div>
                              </div>

                              {/* Gantt Bar Grid Row */}
                              <div className="flex-1 grid relative divide-x divide-zinc-900/30 bg-[#070605]" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
                                
                                {/* Background Weekend Shading */}
                                {daysArray.map(day => {
                                  const dayDate = new Date(year, monthIdx, day);
                                  const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                                  return (
                                    <div 
                                      key={day} 
                                      className={`h-full pointer-events-none ${isWeekend ? 'bg-zinc-900/10' : ''}`} 
                                    />
                                  );
                                })}

                                {/* Absolute Floating Gantt Bar */}
                                <div 
                                  className={`absolute top-2.5 bottom-2.5 rounded-sm border flex flex-col justify-center px-3 select-none transition-all group/bar z-10 ${statusStyle.bg}`}
                                  style={{
                                    left: `${((task.startDay - 1) / daysInMonth) * 100}%`,
                                    width: `${(task.span / daysInMonth) * 100}%`,
                                    minWidth: '24px'
                                  }}
                                  title={`Deadline: ${task.internalDeadline}`}
                                >
                                  <div className="flex items-center justify-between overflow-hidden gap-1 text-[10px] font-sans">
                                    <span className="font-bold truncate pointer-events-none drop-shadow-sm select-none">
                                      {task.title}
                                    </span>
                                    
                                    {/* Action shift day controls */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-zinc-950/80 p-0.5 rounded-sm shrink-0">
                                      <button
                                        onClick={(e) => handleShiftDeadline(task, -1, e)}
                                        className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-none cursor-pointer"
                                        title="-1 ngày"
                                      >
                                        <ChevronLeft className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        onClick={(e) => handleShiftDeadline(task, 1, e)}
                                        className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-none cursor-pointer"
                                        title="+1 ngày"
                                      >
                                        <ChevronRight className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Progress Visual Tracker */}
                                  <div className="h-0.5 w-full bg-black/40 rounded-full mt-1 overflow-hidden">
                                    <div 
                                      className="h-full bg-white/80" 
                                      style={{
                                        width: 
                                          task.status === 'Unassigned' ? '15%' :
                                          task.status === 'Rough Cut' ? '40%' :
                                          task.status === 'Final Polish' ? '70%' :
                                          task.status === 'Client Review' ? '85%' : '100%'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </>
          )}

          {/* Scale 2: WEEK RESOLUTION */}
          {scale === 'week' && (
            <>
              {/* Timeline Week Ruler Header */}
              <div className="flex border-b border-zinc-900 bg-zinc-900/10 font-mono text-[9px] text-zinc-500 font-bold">
                <div className="w-56 px-4 py-3 shrink-0 border-r border-zinc-900 flex items-center bg-zinc-950 text-zinc-300">
                  THÔNG TIN VIDEO TASK
                </div>
                
                <div className="flex-1 grid grid-cols-5 text-center divide-x divide-zinc-900/60">
                  {['Tuần 1 (Day 1-7)', 'Tuần 2 (Day 8-14)', 'Tuần 3 (Day 15-21)', 'Tuần 4 (Day 22-28)', 'Tuần 5 (Day 29+)'].map((wk, idx) => (
                    <div key={idx} className="py-3 flex flex-col justify-center items-center">
                      <span className="uppercase text-[9px] tracking-wider text-zinc-400 font-bold">{wk}</span>
                      <span className="text-[7px] text-zinc-600 mt-0.5">{monthName} {year}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracks */}
              <div className="divide-y divide-zinc-900">
                {groups.map(group => (
                  <div key={group.id} className="bg-zinc-950">
                    
                    {/* Group Header */}
                    {groupBy !== 'none' && (
                      <div className="px-4 py-2 bg-zinc-900/30 border-b border-zinc-900/80 text-[10px] font-bold text-[#F97316] font-mono uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]"></div>
                        {group.name}
                      </div>
                    )}

                    {group.tasks.length === 0 ? (
                      <div className="flex items-center text-zinc-600 py-6 px-4 text-xs font-mono">
                        Không có video task nào trong bộ lọc này.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-900/40">
                        {group.tasks.map(task => {
                          const statusStyle = getStatusStyle(task.status);
                          
                          // Map task day into 5 week columns (approximate)
                          const getWeekIndex = (dayNum: number) => {
                            if (dayNum <= 7) return 0;
                            if (dayNum <= 14) return 1;
                            if (dayNum <= 21) return 2;
                            if (dayNum <= 28) return 3;
                            return 4;
                          };

                          const deadlineWeek = getWeekIndex(task.deadlineDay);
                          const startWeek = getWeekIndex(task.startDay);
                          const weekSpan = Math.max(1, deadlineWeek - startWeek + 1);

                          return (
                            <div 
                              key={task.id} 
                              className="flex group hover:bg-zinc-900/10 items-stretch min-h-[50px] transition-all cursor-pointer"
                              onClick={() => onEditTaskClick(task)}
                            >
                              {/* Sidebar details */}
                              <div className="w-56 p-3 shrink-0 border-r border-zinc-900 flex flex-col justify-between bg-zinc-950/40 font-sans z-10">
                                <div>
                                  <h4 className="text-[11px] font-bold text-zinc-200 group-hover:text-white truncate">
                                    {task.title}
                                  </h4>
                                  <p className="text-[9px] font-mono text-zinc-500 truncate">
                                    Dl: {task.internalDeadline.split(' ')[0]}
                                  </p>
                                </div>
                                <span className={`px-1 self-start rounded-sm border ${statusStyle.badge} uppercase text-[7px] font-black mt-1`}>
                                  {task.status}
                                </span>
                              </div>

                              {/* Grid representation */}
                              <div className="flex-1 grid grid-cols-5 relative divide-x divide-zinc-900/30 bg-[#070605]">
                                {Array.from({ length: 5 }).map((_, colIdx) => (
                                  <div key={colIdx} className="h-full pointer-events-none" />
                                ))}

                                <div 
                                  className={`absolute top-2.5 bottom-2.5 rounded-sm border flex flex-col justify-center px-3 select-none transition-all z-10 ${statusStyle.bg}`}
                                  style={{
                                    left: `${(startWeek / 5) * 100}%`,
                                    width: `${(weekSpan / 5) * 100}%`
                                  }}
                                >
                                  <span className="font-bold truncate text-[10px] drop-shadow-sm select-none">
                                    {task.title}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>

      {/* Legend Block */}
      <div className="flex flex-wrap items-center gap-4 bg-zinc-950/40 p-3 border border-zinc-900 font-mono text-[9px] text-zinc-500">
        <span className="uppercase font-bold text-zinc-400">CHÚ GIẢI TRẠNG THÁI:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-zinc-800 border border-zinc-600 rounded-sm"></span>
          <span>CHƯA GIAO (UNASSIGNED)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-amber-600 rounded-sm"></span>
          <span>BẢN DỰ THẢO (ROUGH CUT)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-purple-600 rounded-sm"></span>
          <span>TINH CHỈNH (FINAL POLISH)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-cyan-600 rounded-sm"></span>
          <span>KHÁCH DUYỆT (CLIENT REVIEW)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-600 rounded-sm"></span>
          <span>ĐÃ DUYỆT (APPROVED)</span>
        </div>
      </div>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Obsidian & Electric Sapphire Spatial OS - Finexy Inspired Multi-Widget Analytics Dashboard
 */

import React, { useState, useMemo } from 'react';
import { ClientObject, VideoTaskObject, StaffObject, FinancialSummary } from '../types';
import { 
  BarChart3, DollarSign, Crown, Users, Video, 
  TrendingUp, Award, Sparkles, Filter, Search, ArrowUpRight, ArrowDownRight,
  CreditCard, Activity, CheckCircle2, Clock, AlertCircle, Plus, Download, ChevronRight, Layers, Minus
} from 'lucide-react';

interface AnalyticsDashboardProps {
  clients: ClientObject[];
  tasks: VideoTaskObject[];
  staff: StaffObject[];
  summary: FinancialSummary;
  currency: 'USD' | 'VND';
  selectedYear: string;
  selectedMonthOnly: string;
}

export default function AnalyticsDashboard({
  clients = [],
  tasks = [],
  staff = [],
  summary,
  currency = 'USD',
  selectedYear = 'all',
  selectedMonthOnly = 'all'
}: AnalyticsDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'activity' | 'financial' | 'clients'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Safe Financial Summary extractor
  const grossYield = summary?.vaultGrossYield ?? summary?.grossRevenue ?? 0;
  const payoutQueue = summary?.outsourcePayoutQueue ?? summary?.subEditorPayout ?? 0;
  const netYieldVal = summary?.arbitrageNetYield ?? summary?.netProfit ?? 0;
  const marginMargin = summary?.marginEfficiency ?? summary?.arbitrageEfficiency ?? 0;

  // Currency Formatter
  const formatMoney = (val: number | undefined | null) => {
    const safeVal = Number(val) || 0;
    if (currency === 'VND') {
      const vnd = Math.round(safeVal * 25400);
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vnd);
    }
    return `$${safeVal.toLocaleString('en-US')}`;
  };

  // Dynamic Time Greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Compute 12-Month Revenue vs Payout Data (Jan - Dec)
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear().toString();
    const targetYear = selectedYear === 'all' ? currentYear : selectedYear;

    return monthNames.map((mName, idx) => {
      const mStr = String(idx + 1).padStart(2, '0');
      const monthTasks = tasks.filter(t => {
        const tDate = t.internalDeadline || '';
        return tDate.startsWith(`${targetYear}-${mStr}`);
      });

      const revenue = monthTasks.reduce((sum, t) => sum + (Number(t.clientPay) || 0), 0);
      const payout = monthTasks.reduce((sum, t) => sum + (Number(t.subPay) || 0), 0);
      const profit = Math.max(revenue - payout, 0);

      return {
        monthIndex: idx + 1,
        month: mName,
        revenue,
        payout,
        profit,
        taskCount: monthTasks.length
      };
    });
  }, [tasks, selectedYear]);

  // Compute Real Dynamic Monthly Growth Percentages
  const growthMetrics = useMemo(() => {
    const currentMonthIdx = selectedMonthOnly === 'all' ? new Date().getMonth() : Math.max(Number(selectedMonthOnly) - 1, 0);
    const prevMonthIdx = currentMonthIdx > 0 ? currentMonthIdx - 1 : 11;

    const currData = monthlyChartData[currentMonthIdx] || { revenue: 0, payout: 0, profit: 0, taskCount: 0 };
    const prevData = monthlyChartData[prevMonthIdx] || { revenue: 0, payout: 0, profit: 0, taskCount: 0 };

    const calcPercent = (curr: number, prev: number) => {
      if (prev === 0 && curr === 0) return 0;
      if (prev === 0 && curr > 0) return 100;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      revenueGrowth: calcPercent(currData.revenue, prevData.revenue),
      payoutGrowth: calcPercent(currData.payout, prevData.payout),
      profitGrowth: calcPercent(currData.profit, prevData.profit),
      taskGrowth: calcPercent(currData.taskCount, prevData.taskCount)
    };
  }, [monthlyChartData, selectedMonthOnly]);

  const maxMonthlyVal = useMemo(() => {
    const max = Math.max(...monthlyChartData.map(d => d.revenue), 1000);
    return max > 0 ? max : 1000;
  }, [monthlyChartData]);

  // Compute Client Analytics
  const clientAnalytics = useMemo(() => {
    const map: Record<string, { id: string; name: string; tier: string; taskCount: number; totalPay: number; totalSubPay: number; netYield: number }> = {};

    (clients || []).forEach(c => {
      if (c && c.id) {
        map[c.id] = {
          id: c.id,
          name: c.displayName || c.id,
          tier: c.tier || 'Standard',
          taskCount: 0,
          totalPay: 0,
          totalSubPay: 0,
          netYield: 0
        };
      }
    });

    map['unassigned'] = {
      id: 'unassigned',
      name: 'Unassigned Partner',
      tier: 'Standard',
      taskCount: 0,
      totalPay: 0,
      totalSubPay: 0,
      netYield: 0
    };

    (tasks || []).forEach(t => {
      if (!t) return;
      const cId = t.clientId || 'unassigned';
      if (!map[cId]) {
        map[cId] = {
          id: cId,
          name: cId,
          tier: 'Standard',
          taskCount: 0,
          totalPay: 0,
          totalSubPay: 0,
          netYield: 0
        };
      }
      const cPay = Number(t.clientPay) || 0;
      const sPay = Number(t.subPay) || 0;
      map[cId].taskCount += 1;
      map[cId].totalPay += cPay;
      map[cId].totalSubPay += sPay;
      map[cId].netYield += (cPay - sPay);
    });

    return Object.values(map)
      .filter(c => c.taskCount > 0 || c.id !== 'unassigned')
      .sort((a, b) => b.totalPay - a.totalPay);
  }, [clients, tasks]);

  // Compute breakdown by VIP Tier
  const tierDistribution = useMemo(() => {
    const tiers: Record<string, { count: number; totalPay: number; netYield: number }> = {
      'Kim Cương': { count: 0, totalPay: 0, netYield: 0 },
      'Vàng': { count: 0, totalPay: 0, netYield: 0 },
      'Bạc': { count: 0, totalPay: 0, netYield: 0 },
      'Đồng': { count: 0, totalPay: 0, netYield: 0 },
      'Standard': { count: 0, totalPay: 0, netYield: 0 },
    };

    clientAnalytics.forEach(c => {
      const tierKey = tiers[c.tier] ? c.tier : 'Standard';
      tiers[tierKey].count += 1;
      tiers[tierKey].totalPay += c.totalPay;
      tiers[tierKey].netYield += c.netYield;
    });

    return Object.entries(tiers).filter(([_, data]) => data.count > 0 || data.totalPay > 0);
  }, [clientAnalytics]);

  // Compute breakdown by Task Status
  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {
      'APPROVED': 0,
      'IN PROGRESS': 0,
      'ROUGH CUT REVIEW': 0,
      'BACKLOG': 0,
      'UNASSIGNED': 0
    };

    (tasks || []).forEach(t => {
      if (!t) return;
      const statusKey = t.status ? String(t.status).toUpperCase() : 'UNASSIGNED';
      map[statusKey] = (map[statusKey] || 0) + 1;
    });

    return map;
  }, [tasks]);

  const maxClientPay = useMemo(() => {
    const max = Math.max(...clientAnalytics.map(c => c.totalPay), 1);
    return max > 0 ? max : 1;
  }, [clientAnalytics]);

  // Recent Tasks Filtered for Activities Table
  const filteredRecentTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.clientId && t.clientId.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || t.status?.toUpperCase() === statusFilter.toUpperCase();
      return matchSearch && matchStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Production Capacity Computations
  const completedTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === 'Approved').length;
  }, [tasks]);

  const targetCapacity = Math.max(tasks.length, 25);
  const capacityPercent = Math.min(Math.round((completedTasksCount / targetCapacity) * 100), 100);

  // Helper Badge Renderer for Growth Percentages
  const renderGrowthBadge = (percent: number, label: string = 'vs prev month') => {
    if (grossYield === 0 && percent === 0) {
      return (
        <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-0.5 mt-1">
          <Minus className="w-3 h-3 text-slate-500" /> 0% {label}
        </span>
      );
    }
    if (percent > 0) {
      return (
        <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-0.5 mt-1">
          <ArrowUpRight className="w-3 h-3" /> +{percent}% {label}
        </span>
      );
    }
    if (percent < 0) {
      return (
        <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-0.5 mt-1">
          <ArrowDownRight className="w-3 h-3" /> {percent}% {label}
        </span>
      );
    }
    return (
      <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-0.5 mt-1">
        <Minus className="w-3 h-3 text-slate-500" /> 0% {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 select-none font-haas">
      {/* 1. Header Greeting & Sub-Navigation Pill Tabs */}
      <div className="spatial-card p-6 border border-white/10 bg-black/80 backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-[6px] bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)] flex items-center justify-center font-extrabold text-white text-xs">
                T
              </div>
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                EXECUTIVE PRODUCTION DASHBOARD
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight font-haas leading-[1.08]">
              {greetingTime}, <span className="gradient-heading">Thomas Nguyen</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Stay on top of your video tasks, monitor gross yield, and track editor pipeline.
            </p>
          </div>

          {/* Sub-Nav Pill Controls (Clicking switches views dynamically) */}
          <div className="flex items-center gap-1.5 bg-black/90 p-1.5 rounded-[8px] border border-white/10 overflow-x-auto">
            {[
              { id: 'overview', label: 'OVERVIEW' },
              { id: 'activity', label: 'ACTIVITY' },
              { id: 'financial', label: 'FINANCIAL' },
              { id: 'clients', label: 'CLIENTS' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-extrabold rounded-[6px] transition-all uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW SECTION 1: OVERVIEW SUB-TAB (Default View) */}
      {/* ========================================================================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'financial') && (
        <div className="space-y-6">
          {/* Top Metric Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Widget 1: Total Balance / Vault Overview Card (4 cols) */}
            <div className="lg:col-span-4 spatial-card p-6 flex flex-col justify-between relative overflow-hidden bg-white/[0.02]">
              <div className="bg-edit-blur-1 -right-20 -top-20 pointer-events-none opacity-40" />
              
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">
                  <span>TOTAL VAULT BALANCE</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                    {currency}
                  </span>
                </div>
                
                <div className="text-3xl font-black text-white font-mono tracking-tight my-2">
                  {formatMoney(grossYield)}
                </div>

                {renderGrowthBadge(growthMetrics.revenueGrowth, 'than last month')}
              </div>

              {/* Wallets / Currency Breakdown Sub-Cards */}
              <div className="mt-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-2">
                  WALLETS | TOTAL 3 VAULTS
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-black/60 rounded-[6px] border border-white/10">
                    <div className="text-[10px] font-mono text-slate-400 font-bold">USD</div>
                    <div className="text-xs font-black text-white font-mono mt-1">${(grossYield * 0.7).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">Active</span>
                  </div>
                  <div className="p-2.5 bg-black/60 rounded-[6px] border border-white/10">
                    <div className="text-[10px] font-mono text-slate-400 font-bold">EUR</div>
                    <div className="text-xs font-black text-white font-mono mt-1">€{(grossYield * 0.2).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">Active</span>
                  </div>
                  <div className="p-2.5 bg-black/60 rounded-[6px] border border-white/10">
                    <div className="text-[10px] font-mono text-slate-400 font-bold">VND</div>
                    <div className="text-xs font-black text-white font-mono mt-1">₫{Math.round(grossYield * 0.1 * 25400 / 1000000)}M</div>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Reserve</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 2: 4-Grid Metric Mini Cards (4 cols) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {/* Card A */}
              <div className="spatial-card p-5 bg-gradient-to-br from-blue-600/30 to-blue-900/20 border border-blue-500/30 hover:border-blue-500/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-blue-300 font-mono font-bold uppercase tracking-wider">
                  <span>Gross Earnings</span>
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-white font-mono">{formatMoney(grossYield)}</div>
                  {renderGrowthBadge(growthMetrics.revenueGrowth, 'This month')}
                </div>
              </div>

              {/* Card B */}
              <div className="spatial-card p-5 bg-white/[0.02] hover:border-white/20 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">
                  <span>Editor Payout</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-white font-mono">{formatMoney(payoutQueue)}</div>
                  {renderGrowthBadge(growthMetrics.payoutGrowth, 'This month')}
                </div>
              </div>

              {/* Card C */}
              <div className="spatial-card p-5 bg-white/[0.02] hover:border-white/20 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">
                  <span>Net Profit</span>
                  <Crown className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-emerald-400 font-mono">{formatMoney(netYieldVal)}</div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1 font-mono">
                    Margin: {marginMargin.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Card D */}
              <div className="spatial-card p-5 bg-white/[0.02] hover:border-white/20 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">
                  <span>Active Tasks</span>
                  <Video className="w-4 h-4 text-sky-400" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-white font-mono">{tasks.length} Reels</div>
                  {renderGrowthBadge(growthMetrics.taskGrowth, 'Production')}
                </div>
              </div>
            </div>

            {/* Widget 3: Total Income Stacked Bar Chart (4 cols) */}
            <div className="lg:col-span-4 spatial-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-haas">
                    TOTAL INCOME & PAYOUT
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">View profit vs editor payout over months</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono font-bold">
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Profit
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-600" /> Payout
                  </span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-44 flex items-end justify-between gap-1.5 pt-4 border-b border-white/10 pb-2">
                {monthlyChartData.slice(0, 8).map((d, idx) => {
                  const revH = Math.min(Math.round((d.revenue / maxMonthlyVal) * 100), 100);
                  const payH = Math.min(Math.round((d.payout / maxMonthlyVal) * 100), 100);
                  const isHovered = hoveredMonth === idx;

                  return (
                    <div 
                      key={d.month}
                      onMouseEnter={() => setHoveredMonth(idx)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-12 bg-black border border-blue-500/50 p-1.5 rounded text-[10px] font-mono text-white whitespace-nowrap z-20 shadow-xl">
                          <div className="text-blue-400 font-bold">{d.month}: ${d.revenue.toLocaleString()}</div>
                          <div className="text-slate-400">Payout: ${d.payout.toLocaleString()}</div>
                        </div>
                      )}

                      <div className="w-full flex justify-center items-end gap-1 h-32">
                        {/* Revenue Bar */}
                        <div 
                          className="w-2.5 bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-[2px] transition-all duration-300 group-hover:bg-blue-400"
                          style={{ height: `${Math.max(revH, 8)}%` }}
                        />
                        {/* Payout Bar */}
                        <div 
                          className="w-2.5 bg-slate-700 rounded-t-[2px] transition-all duration-300 group-hover:bg-slate-500"
                          style={{ height: `${Math.max(payH, 5)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 group-hover:text-white">
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW SECTION 2: ACTIVITY SUB-TAB (Activity View) */}
      {/* ========================================================================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'activity') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side (4 cols): Capacity Limit & Status Breakdown */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 4: Monthly Capacity Limit Bar */}
            <div className="spatial-card p-6">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <span className="text-white">MONTHLY PRODUCTION CAPACITY</span>
                <span className="text-blue-400">{completedTasksCount} / {targetCapacity} Tasks</span>
              </div>
              
              <div className="h-3 w-full bg-black/80 rounded-full overflow-hidden p-0.5 border border-white/10 my-3">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{capacityPercent}% completed out of capacity</span>
                <span className="text-white font-bold">{formatMoney(grossYield)}</span>
              </div>
            </div>

            {/* Status Breakdown Grid */}
            <div className="spatial-card p-6">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2 mb-4 font-mono">
                <Video className="w-4 h-4 text-sky-400" />
                WORKFLOW STATUS DISTRIBUTION
              </h3>

              <div className="grid grid-cols-2 gap-2 font-mono">
                {Object.entries(statusDistribution).map(([status, count]) => (
                  <div key={status} className="p-3 bg-white/[0.02] rounded-[6px] border border-white/10 text-left">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-widest uppercase">{status}</span>
                    <span className="text-xl font-black text-white mt-1 block">{count}</span>
                    <span className="text-[10px] text-slate-500 block">video tasks</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Side (8 cols): Recent Activities & Tasks Table */}
          <div className="lg:col-span-8 spatial-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-haas flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    RECENT ACTIVITIES & VIDEO PROJECTS
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time status tracking across editor pipeline ({filteredRecentTasks.length} tasks)</p>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search projects..."
                      className="pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 text-xs text-white rounded-[6px] focus:outline-none focus:border-blue-500 w-36 sm:w-44"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-black/60 border border-white/10 text-xs text-slate-300 rounded-[6px] focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="all">All Status</option>
                    <option value="APPROVED">Completed</option>
                    <option value="IN PROGRESS">In Progress</option>
                    <option value="ROUGH CUT REVIEW">Rough Cut</option>
                    <option value="BACKLOG">Backlog</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-widest">
                      <th className="py-3 px-3">Task ID</th>
                      <th className="py-3 px-3">Project Title</th>
                      <th className="py-3 px-3">Client Pay</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRecentTasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-mono">
                          No recent video tasks match filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRecentTasks.slice(0, 8).map(t => {
                        const isCompleted = t.status === 'Approved';
                        const isInProgress = t.status === 'In Progress';
                        const isRoughCut = t.status === 'Rough Cut Review';

                        return (
                          <tr key={t.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-3 font-bold text-blue-400 font-mono">{t.id}</td>
                            <td className="py-3 px-3 font-sans font-bold text-white max-w-[200px] truncate">
                              {t.title}
                            </td>
                            <td className="py-3 px-3 font-bold text-white font-mono">
                              {formatMoney(t.clientPay)}
                            </td>
                            <td className="py-3 px-3">
                              {isCompleted && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1 w-max">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed
                                </span>
                              )}
                              {isInProgress && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 flex items-center gap-1 w-max">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> In Progress
                                </span>
                              )}
                              {isRoughCut && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 flex items-center gap-1 w-max">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Rough Cut
                                </span>
                              )}
                              {!isCompleted && !isInProgress && !isRoughCut && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-400 font-bold border border-slate-500/20 flex items-center gap-1 w-max">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> {t.status || 'Pending'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-400 font-mono">
                              {t.internalDeadline || 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW SECTION 3: CLIENTS SUB-TAB (Clients View) */}
      {/* ========================================================================= */}
      {(activeSubTab === 'overview' || activeSubTab === 'clients') && (
        <div className="space-y-6">
          {/* Digital VIP Cards & VIP Tier Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Widget 5: Digital VIP Cards Showcase (6 cols) */}
            <div className="lg:col-span-6 spatial-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  MY VIP CLIENT CARDS
                </h3>
                <span className="text-[10px] font-mono text-blue-400 font-bold">
                  {clients.length} Active Partners
                </span>
              </div>

              {/* Digital Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card 1: Diamond VIP */}
                <div className="p-4 bg-gradient-to-br from-zinc-900 to-black rounded-[8px] border border-white/15 relative overflow-hidden flex flex-col justify-between h-32 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 text-[9px] font-mono font-bold uppercase border border-blue-500/30">
                      DIAMOND VIP
                    </span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Total Lifetime Spend</div>
                    <div className="text-base font-black text-white font-mono">{formatMoney(grossYield * 0.6)}</div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 tracking-widest">
                    **** **** 6782
                  </div>
                </div>

                {/* Card 2: Gold Partner */}
                <div className="p-4 bg-gradient-to-br from-blue-900/60 via-blue-950/80 to-black rounded-[8px] border border-blue-500/30 relative overflow-hidden flex flex-col justify-between h-32 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 text-[9px] font-mono font-bold uppercase border border-amber-500/30">
                      GOLD PARTNER
                    </span>
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Total Lifetime Spend</div>
                    <div className="text-base font-black text-white font-mono">{formatMoney(grossYield * 0.4)}</div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 tracking-widest">
                    **** **** 4356
                  </div>
                </div>
              </div>
            </div>

            {/* VIP Tier Share Breakdown (6 cols) */}
            <div className="lg:col-span-6 spatial-card p-6">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2 mb-4 font-haas">
                <Crown className="w-4 h-4 text-amber-400" />
                CƠ CẤU PHÂN HẠNG VIP CLIENTS
              </h3>

              <div className="space-y-3">
                {tierDistribution.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-mono">Chưa có dữ liệu phân hạng.</div>
                ) : (
                  tierDistribution.map(([tierName, data]) => {
                    const totalRev = grossYield || 1;
                    const percentage = Math.round((data.totalPay / totalRev) * 100);

                    return (
                      <div key={tierName} className="p-3 bg-white/[0.02] rounded-[6px] border border-white/10">
                        <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                          <span className="font-bold text-white uppercase text-[11px]">{tierName}</span>
                          <span className="text-blue-400 font-bold">{formatMoney(data.totalPay)} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-black/80 rounded-[2px] overflow-hidden mb-1">
                          <div 
                            className="h-full bg-blue-600 rounded-[2px]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{data.count} đối tác thuộc nhóm</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Bottom Leaderboard Table */}
          <div className="spatial-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 font-haas">
                <Award className="w-4 h-4 text-blue-500" />
                TOP REVENUE PARTNERS & CLIENT LEADERBOARD
              </h3>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Real-time Data</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-widest">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Client Partner Name</th>
                    <th className="py-3 px-4">VIP Tier</th>
                    <th className="py-3 px-4">Task Count</th>
                    <th className="py-3 px-4">Total Revenue</th>
                    <th className="py-3 px-4 text-right">Net Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {clientAnalytics.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4 font-bold text-blue-400">#{idx + 1}</td>
                      <td className="py-3 px-4 font-sans font-extrabold text-white">{c.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 font-semibold uppercase">
                          {c.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{c.taskCount} tasks</td>
                      <td className="py-3 px-4 text-white font-bold">{formatMoney(c.totalPay)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">+{formatMoney(c.netYield)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

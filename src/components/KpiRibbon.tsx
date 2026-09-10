/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinancialSummary } from '../types';
import { TrendingUp, Wallet, ArrowUpRight, Percent, CircleDollarSign } from 'lucide-react';

interface KpiRibbonProps {
  summary: FinancialSummary;
  currency: 'USD' | 'VND';
}

export default function KpiRibbon({ summary, currency }: KpiRibbonProps) {
  const formatValue = (val: number) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val * 25000); // 1 USD = 25,000 VND
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="kpi-ribbon-container" className="grid grid-cols-1 md:grid-cols-3 gap-6 font-haas">
      {/* Gross Revenue Card */}
      <div 
        id="kpi-vault-revenue" 
        className="relative bg-[#12141a] border border-white/[0.08] p-6 rounded-[6px] transition-all duration-200 hover:border-[#1591DC]/40 hover:bg-[#161922]"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9496a1] block">
              VAULT GROSS REVENUE
            </span>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              {formatValue(summary.grossRevenue)}
            </h3>
            <div className="flex items-center text-[10px] font-mono text-[#9496a1] mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1591DC] mr-2 shadow-[0_0_8px_#1591DC]"></span>
              <span>Inbound Agreements (Secured)</span>
            </div>
          </div>
          <div className="text-[#1591DC] p-2 bg-[#1591DC]/10 rounded-[6px] border border-[#1591DC]/20">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payout Queue Card */}
      <div 
        id="kpi-payout-queue" 
        className="relative bg-[#12141a] border border-white/[0.08] p-6 rounded-[6px] transition-all duration-200 hover:border-[#1591DC]/40 hover:bg-[#161922]"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9496a1] block">
              OUTSOURCE PAYOUT QUEUE
            </span>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              {formatValue(summary.subEditorPayout)}
            </h3>
            <div className="flex items-center text-[10px] font-mono text-[#9496a1] mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 shadow-[0_0_8px_#f59e0b]"></span>
              <span>Editor Payouts (Allocated)</span>
            </div>
          </div>
          <div className="text-amber-400 p-2 bg-amber-500/10 rounded-[6px] border border-amber-500/20">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Net Profit Margin Card */}
      <div 
        id="kpi-net-margin" 
        className="relative bg-[#12141a] border border-white/[0.08] p-6 rounded-[6px] transition-all duration-200 hover:border-emerald-500/40 hover:bg-[#161922]"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-full">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9496a1] block">
              NET PRODUCTION PROFIT
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-3xl font-bold text-emerald-400 tracking-tight">
                {formatValue(summary.netProfit)}
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-[4px] border border-emerald-500/20">
                {summary.arbitrageEfficiency.toFixed(1)}% EFF
              </span>
            </div>
            <div className="flex items-center text-[10px] font-mono text-[#9496a1] mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_#10b981]"></span>
              <span>Margin Retention (Optimal)</span>
            </div>
          </div>
          <div className="text-emerald-400 p-2 bg-emerald-500/10 rounded-[6px] border border-emerald-500/20 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

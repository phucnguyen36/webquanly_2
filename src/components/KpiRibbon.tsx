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
    <div id="kpi-ribbon-container" className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Gross Revenue Card */}
      <div 
        id="kpi-vault-revenue" 
        className="relative bg-zinc-950/20 backdrop-blur-xl p-8 rounded-none transition-all duration-300 hover:bg-zinc-950/40"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] block">
              Vault Gross Yield
            </span>
            <h3 className="text-3xl font-mono font-light text-zinc-100 tracking-tight">
              {formatValue(summary.grossRevenue)}
            </h3>
            <div className="flex items-center text-[10px] font-mono text-zinc-400 mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_#10b981]"></span>
              <span>Inbound agreements [SECURED]</span>
            </div>
          </div>
          <div className="text-zinc-700">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payout Queue Card */}
      <div 
        id="kpi-payout-queue" 
        className="relative bg-zinc-950/20 backdrop-blur-xl p-8 rounded-none transition-all duration-300 hover:bg-zinc-950/40"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] block">
              Outsource Payout Queue
            </span>
            <h3 className="text-3xl font-mono font-light text-zinc-100 tracking-tight">
              {formatValue(summary.subEditorPayout)}
            </h3>
            <div className="flex items-center text-[10px] font-mono text-zinc-400 mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_#f59e0b]"></span>
              <span>Sub-editor fees [PENDING]</span>
            </div>
          </div>
          <div className="text-zinc-700">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Net Profit Margin Card */}
      <div 
        id="kpi-net-margin" 
        className="relative bg-zinc-950/20 backdrop-blur-xl p-8 rounded-none transition-all duration-300 hover:bg-zinc-950/40"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-full">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] block">
              Arbitrage Net Yield
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-3xl font-mono font-light text-emerald-400 tracking-tight">
                {formatValue(summary.netProfit)}
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/10 px-2 py-0.5">
                {summary.arbitrageEfficiency.toFixed(1)}% EFF
              </span>
            </div>
            <div className="flex items-center text-[10px] font-mono text-zinc-400 mt-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_#10b981]"></span>
              <span>Margin efficiency [OPTIMAL]</span>
            </div>
          </div>
          <div className="text-zinc-700 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

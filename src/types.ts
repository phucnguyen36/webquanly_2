/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClientTier = 'High-Ticket' | 'Volume-Arbitrage';

export interface ClientObject {
  id: string;
  displayName: string;
  tier: ClientTier;
  contractValue?: number; // default inbound payment for standard tasks
}

export type TaskStatus = 'Unassigned' | 'Rough Cut' | 'Final Polish' | 'Client Review' | 'Approved';

export type PaymentStatus = 'Unpaid' | 'Invoiced' | 'Paid';

export interface VideoTaskObject {
  id: string;
  clientId: string;
  title: string;
  rawFootageLink: string;
  status: TaskStatus;
  internalDeadline: string; // YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM
  assignedEditorId: string; // FK to Staff or 'Phuc'
  notes: string;
  clientPay: number; // Inbound revenue
  subPay: number; // Outbound cost to sub-editor
  clientPaidStatus: PaymentStatus;
  subPaidStatus: 'Unpaid' | 'Paid';
  roughCutUrl?: string; // Stage 1 URL uploaded by sub-editor
  finalUrl?: string; // Stage 2 final deploy link
}

export interface StaffObject {
  id: string;
  name: string;
  avatarUrl: string;
  activeTaskCount: number;
  qualityScore: number; // 1-5 rating
  totalEarnings: number; // total payouts
  phone?: string;
  role?: string;
}

export interface FinancialSummary {
  grossRevenue: number;
  subEditorPayout: number;
  netProfit: number;
  arbitrageEfficiency: number;
}

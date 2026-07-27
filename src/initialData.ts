/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientObject, VideoTaskObject, StaffObject } from './types';

export const INITIAL_CLIENTS: ClientObject[] = [
  { id: 'create_more', displayName: 'Create More Production', tier: 'High-Ticket' },
  { id: 'raul', displayName: 'Raul', tier: 'High-Ticket' },
  { id: 'karim', displayName: 'Karim', tier: 'Volume-Arbitrage' },
  { id: 'the_flash_cut', displayName: 'The Flash Cut', tier: 'Volume-Arbitrage' },
];

export const INITIAL_STAFF: StaffObject[] = [
  {
    id: 'Phuc',
    name: 'Phuc (Master Editor)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    activeTaskCount: 1,
    qualityScore: 5.0,
    totalEarnings: 2400,
    role: 'Lead Editor / Director'
  },
  {
    id: 'sub_01',
    name: 'Hoang Long',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    activeTaskCount: 2,
    qualityScore: 4.8,
    totalEarnings: 850,
    phone: '+84 912 345 678',
    role: 'Sub-Editor (VFX / Motion)'
  },
  {
    id: 'sub_02',
    name: 'Minh Quan',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    activeTaskCount: 1,
    qualityScore: 4.5,
    totalEarnings: 420,
    phone: '+84 988 765 432',
    role: 'Sub-Editor (Rough Cut specialist)'
  },
  {
    id: 'sub_03',
    name: 'Thu Thuy',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    activeTaskCount: 0,
    qualityScore: 4.9,
    totalEarnings: 1250,
    phone: '+84 905 111 222',
    role: 'Sub-Editor (Colorist / Narrative)'
  }
];

export const INITIAL_TASKS: VideoTaskObject[] = [
  {
    id: 'task_001',
    clientId: 'create_more',
    title: 'High-Ticket Closing Secrets Explained - Vlog #42',
    rawFootageLink: 'https://drive.google.com/drive/folders/share_sample_1',
    status: 'Final Polish',
    internalDeadline: '2026-07-06 14:00',
    assignedEditorId: 'Phuc',
    notes: 'Needs heavy cinematic zooms, high-end title design in Space Grotesk, sound design accents.',
    clientPay: 1200,
    subPay: 0, // Assigned directly to Phuc
    clientPaidStatus: 'Invoiced',
    subPaidStatus: 'Paid',
    roughCutUrl: 'https://vimeo.com/sample_rough_1',
    finalUrl: ''
  },
  {
    id: 'task_002',
    clientId: 'raul',
    title: 'How I Built a $10M SaaS in 12 Months (Aesthetic Documentary)',
    rawFootageLink: 'https://drive.google.com/drive/folders/share_sample_2',
    status: 'Rough Cut',
    internalDeadline: '2026-07-05 18:00',
    assignedEditorId: 'sub_01',
    notes: 'Please cut out all filler words, keep tight narrative pacing. Apply modern grid overlays.',
    clientPay: 1500,
    subPay: 400,
    clientPaidStatus: 'Unpaid',
    subPaidStatus: 'Unpaid',
    roughCutUrl: 'https://vimeo.com/sample_rough_2',
    finalUrl: ''
  },
  {
    id: 'task_003',
    clientId: 'karim',
    title: '10 AI Productivity Hacks for Solopreneurs (Short Form Bundle)',
    rawFootageLink: 'https://drive.google.com/drive/folders/share_sample_3',
    status: 'Unassigned',
    internalDeadline: '2026-07-07 10:00',
    assignedEditorId: 'Unassigned',
    notes: 'Standard 60s shorts format. Subtitles centered, bright green style highlights.',
    clientPay: 350,
    subPay: 80,
    clientPaidStatus: 'Unpaid',
    subPaidStatus: 'Unpaid',
    roughCutUrl: '',
    finalUrl: ''
  },
  {
    id: 'task_004',
    clientId: 'the_flash_cut',
    title: 'Corporate Identity Brand Hype Video 2026',
    rawFootageLink: 'https://drive.google.com/drive/folders/share_sample_4',
    status: 'Client Review',
    internalDeadline: '2026-07-04 12:00',
    assignedEditorId: 'sub_02',
    notes: 'Phuc reviewed and deployed this to client for approval. Waiting on feedback.',
    clientPay: 850,
    subPay: 200,
    clientPaidStatus: 'Invoiced',
    subPaidStatus: 'Unpaid',
    roughCutUrl: 'https://vimeo.com/sample_rough_4',
    finalUrl: 'https://vimeo.com/sample_final_4'
  },
  {
    id: 'task_005',
    clientId: 'the_flash_cut',
    title: 'Vlog Style Behind The Scenes at APEX Studio',
    rawFootageLink: 'https://drive.google.com/drive/folders/share_sample_5',
    status: 'Approved',
    internalDeadline: '2026-07-02 16:00',
    assignedEditorId: 'sub_03',
    notes: 'Client was super happy. Excellent color grading on this one.',
    clientPay: 700,
    subPay: 180,
    clientPaidStatus: 'Paid',
    subPaidStatus: 'Paid',
    roughCutUrl: 'https://vimeo.com/sample_rough_5',
    finalUrl: 'https://vimeo.com/sample_final_5'
  }
];

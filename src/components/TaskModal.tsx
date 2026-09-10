/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VideoTaskObject, ClientObject, StaffObject, TaskStatus, PaymentStatus, CurrencyCode } from '../types';
import { X, Calendar, DollarSign, FileText, Link, User, Globe } from 'lucide-react';
import { CURRENCY_SYMBOLS, formatTaskCurrency } from '../utils/currency';

interface TaskModalProps {
  task?: VideoTaskObject; // if provided, we are editing
  clients: ClientObject[];
  staff: StaffObject[];
  onSave: (task: VideoTaskObject) => void;
  onClose: () => void;
  selectedMonth?: string;
}

export default function TaskModal({ task, clients, staff, onSave, onClose, selectedMonth }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [rawFootageLink, setRawFootageLink] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Unassigned');
  const [internalDeadline, setInternalDeadline] = useState('');
  const [assignedEditorId, setAssignedEditorId] = useState('Unassigned');
  const [notes, setNotes] = useState('');
  const [clientPay, setClientPay] = useState(0);
  const [subPay, setSubPay] = useState(0);
  const [taskCurrency, setTaskCurrency] = useState<CurrencyCode>('USD');
  const [clientPaidStatus, setClientPaidStatus] = useState<PaymentStatus>('Unpaid');
  const [subPaidStatus, setSubPaidStatus] = useState<'Unpaid' | 'Paid'>('Unpaid');
  const [roughCutUrl, setRoughCutUrl] = useState('');
  const [finalUrl, setFinalUrl] = useState('');

  const isNoClients = clients.length === 0;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setClientId(task.clientId);
      setRawFootageLink(task.rawFootageLink);
      setStatus(task.status);
      setInternalDeadline(task.internalDeadline.replace(' ', 'T')); // Convert space to T for datetime-local input
      setAssignedEditorId(task.assignedEditorId);
      setNotes(task.notes);
      setClientPay(task.clientPay);
      setSubPay(task.subPay);
      setTaskCurrency(task.currency || 'USD');
      setClientPaidStatus(task.clientPaidStatus);
      setSubPaidStatus(task.subPaidStatus);
      setRoughCutUrl(task.roughCutUrl || '');
      setFinalUrl(task.finalUrl || '');
    } else {
      // Defaults
      setTitle('');
      setClientId(clients[0]?.id || '');
      setRawFootageLink('');
      setStatus('Unassigned');
      
      const defaultMonth = selectedMonth && selectedMonth !== 'all' ? selectedMonth : '2026-07';
      setInternalDeadline(`${defaultMonth}-05T18:00`);
      
      setAssignedEditorId('Unassigned');
      setNotes('');
      setClientPay(500);
      setSubPay(150);
      setTaskCurrency('USD');
      setClientPaidStatus('Unpaid');
      setSubPaidStatus('Unpaid');
      setRoughCutUrl('');
      setFinalUrl('');
    }
  }, [task, clients, selectedMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isNoClients) return;

    // Convert datetime-local T back to normal space for ISO-ish readable string
    const formattedDeadline = internalDeadline.replace('T', ' ');

    onSave({
      id: task?.id || `task_${Date.now()}`,
      clientId,
      title: title.trim(),
      rawFootageLink: rawFootageLink.trim(),
      status,
      internalDeadline: formattedDeadline,
      assignedEditorId,
      notes: notes.trim(),
      clientPay: Number(clientPay),
      subPay: Number(subPay),
      currency: taskCurrency,
      clientPaidStatus,
      subPaidStatus,
      roughCutUrl: roughCutUrl.trim(),
      finalUrl: finalUrl.trim()
    });
  };

  return (
    <div id="task-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto font-haas">
      <div 
        id="task-modal-card"
        className="relative w-full max-w-2xl bg-[#12141a] border border-white/[0.08] rounded-[6px] overflow-hidden shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/[0.08] bg-[#12141a]">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight font-haas">
              {task ? 'Edit Task Blueprint' : 'Create Task Matrix Block'}
            </h2>
            <p className="text-[10px] font-mono text-[#9496a1] uppercase tracking-wider mt-0.5">
              Specify active production metrics
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.06] text-[#9496a1] hover:text-white rounded-[4px] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Title */}
          <div>
            <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-2 tracking-widest">
              Video Title / Concept
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#9496a1]">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to Win High-Ticket Retainers in 2026"
                className="w-full pl-10 pr-4 py-2 bg-[#0b0c10] text-white font-haas text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC] transition-colors"
                required
              />
            </div>
          </div>

          {isNoClients && (
            <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-[4px] text-[10px] text-rose-400 font-mono space-y-1.5">
              <p className="font-bold uppercase tracking-wider">[Constraint Warning]</p>
              <p>Hệ thống hiện tại không có Client Segment nào. Bạn cần đóng modal này và click nút [Client Matrices Config] trong bảng điều khiển để tạo ít nhất một Client Segment trước khi tạo Task mới.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client Select */}
            <div>
              <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-2 tracking-widest">
                Client Matrix
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0c10] text-[#EDEDF3] font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
                disabled={isNoClients}
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id} className="bg-[#0b0c10]">
                    {client.displayName} ({client.tier})
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Editor */}
            <div>
              <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-2 tracking-widest">
                Assigned Editor
              </label>
              <select
                value={assignedEditorId}
                onChange={(e) => setAssignedEditorId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0c10] text-[#EDEDF3] font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
              >
                <option value="Unassigned" className="bg-[#0b0c10] text-[#9496a1]">Unassigned (Claimable Pool)</option>
                <option value="Phuc" className="bg-[#0b0c10]">Phuc (Master Editor)</option>
                {staff.filter(s => s.id !== 'Phuc').map(editor => (
                  <option key={editor.id} value={editor.id} className="bg-[#0b0c10]">
                    {editor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Folder Asset URL */}
            <div>
              <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-2 tracking-widest">
                Raw Footage Folder Link
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#9496a1]">
                  <Link className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={rawFootageLink}
                  onChange={(e) => setRawFootageLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full pl-10 pr-4 py-2 bg-[#0b0c10] text-[#EDEDF3] font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
                  required
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-2 tracking-widest">
                Internal Deadline
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#9496a1]">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="datetime-local"
                  value={internalDeadline}
                  onChange={(e) => setInternalDeadline(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0b0c10] text-[#EDEDF3] font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Dropdown */}
            <div>
              <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-2 tracking-widest">
                Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-[#0b0c10] text-[#EDEDF3] font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
              >
                <option value="Unassigned" className="bg-[#0b0c10]">Unassigned</option>
                <option value="Rough Cut" className="bg-[#0b0c10]">Rough Cut (Stage 1)</option>
                <option value="Final Polish" className="bg-[#0b0c10]">Final Polish (Stage 2 - Phuc)</option>
                <option value="Client Review" className="bg-[#0b0c10]">Client Review (Pending Feedback)</option>
                <option value="Approved" className="bg-[#0b0c10]">Approved (Finished)</option>
              </select>
            </div>

            {/* Delivery url */}
            <div>
              <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-2 tracking-widest">
                Rough Cut Delivery URL (Stage 1 Output)
              </label>
              <input
                type="url"
                value={roughCutUrl}
                onChange={(e) => setRoughCutUrl(e.target.value)}
                placeholder="https://vimeo.com/..."
                className="w-full px-3 py-2 bg-[#0b0c10] text-[#EDEDF3] font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
              />
            </div>
          </div>

          <div className="bg-[#0b0c10] p-5 rounded-[4px] border border-white/[0.08] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#9496a1] block">
                Financial Arbitrage & Multi-Currency Settings
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <Globe size={13} className="text-[#1591DC]" />
                <select
                  value={taskCurrency}
                  onChange={(e) => setTaskCurrency(e.target.value as CurrencyCode)}
                  className="bg-[#12141a] border border-white/[0.08] text-[#1591DC] font-mono text-xs p-1 rounded-[4px] focus:outline-none focus:border-[#1591DC]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="VND">VND (₫)</option>
                  <option value="THB">THB (฿)</option>
                  <option value="CHF">CHF (CHF)</option>
                  <option value="HKD">HKD (HK$)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="KRW">KRW (₩)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Pay */}
              <div>
                <label className="block text-[9px] font-mono text-[#9496a1] uppercase mb-1">
                  Inbound Contract Revenue (Client Pay)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#1591DC] font-mono text-xs">
                    {CURRENCY_SYMBOLS[taskCurrency]?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    value={clientPay}
                    onChange={(e) => setClientPay(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-4 py-2 bg-[#12141a] text-white font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
                    min="0"
                  />
                </div>
              </div>

              {/* Sub-Editor Pay */}
              <div>
                <label className="block text-[9px] font-mono text-[#9496a1] uppercase mb-1">
                  Outbound Sub-Editor Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#1591DC] font-mono text-xs">
                    {CURRENCY_SYMBOLS[taskCurrency]?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    value={subPay}
                    onChange={(e) => setSubPay(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-4 py-2 bg-[#12141a] text-white font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Client Pay Status */}
              <div>
                <label className="block text-[9px] font-mono text-[#9496a1] uppercase mb-1">
                  Client Inbound Status
                </label>
                <select
                  value={clientPaidStatus}
                  onChange={(e) => setClientPaidStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 bg-[#12141a] text-[#EDEDF3] font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
                >
                  <option value="Unpaid" className="bg-[#12141a]">Unpaid</option>
                  <option value="Invoiced" className="bg-[#12141a]">Invoiced / Sent</option>
                  <option value="Paid" className="bg-[#12141a]">Paid / Settled</option>
                </select>
              </div>

              {/* Sub Pay Status */}
              <div>
                <label className="block text-[9px] font-mono text-[#9496a1] uppercase mb-1">
                  Sub-Editor Settlement
                </label>
                <select
                  value={subPaidStatus}
                  onChange={(e) => setSubPaidStatus(e.target.value as 'Unpaid' | 'Paid')}
                  className="w-full px-3 py-2 bg-[#12141a] text-[#EDEDF3] font-mono text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC]"
                >
                  <option value="Unpaid" className="bg-[#12141a]">Unpaid</option>
                  <option value="Paid" className="bg-[#12141a]">Paid / Settled</option>
                </select>
              </div>
            </div>

            {/* Quick Profit Margin Calc */}
            <div className="pt-3 border-t border-white/[0.08] flex justify-between items-center text-xs font-mono text-emerald-400">
              <span>Simulated Net Margin:</span>
              <span>
                {formatTaskCurrency(clientPay - subPay, taskCurrency)} (
                {clientPay > 0 ? (((clientPay - subPay) / clientPay) * 100).toFixed(0) : 0}% efficiency)
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono text-[#9496a1] uppercase mb-2 tracking-widest">
              Production Guidelines & Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Visual instructions, reference tracks, specific After Effects motion files to use..."
              className="w-full px-3 py-2 bg-[#0b0c10] text-white font-haas text-xs border border-white/[0.08] rounded-[4px] focus:outline-none focus:border-[#1591DC] h-24"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/[0.08] justify-end bg-[#12141a] -mx-6 -mb-6 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-[#9496a1] hover:text-white border border-white/[0.08] rounded-[4px] hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isNoClients}
              className="px-6 py-2 text-xs font-mono font-bold uppercase text-white bg-[#1591DC] hover:bg-[#1591DC]/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-[4px] transition-colors cursor-pointer shadow-[0_0_15px_rgba(21,145,220,0.3)]"
            >
              Commit Task Parameters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VideoTaskObject, ClientObject, StaffObject, TaskStatus, PaymentStatus } from '../types';
import { X, Calendar, DollarSign, FileText, Link, User } from 'lucide-react';

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
      clientPaidStatus,
      subPaidStatus,
      roughCutUrl: roughCutUrl.trim(),
      finalUrl: finalUrl.trim()
    });
  };

  return (
    <div id="task-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div 
        id="task-modal-card"
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-none overflow-hidden shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-900 bg-black">
          <div>
            <h2 className="text-xl font-serif font-light text-zinc-100 uppercase tracking-tight">
              {task ? 'Edit Task Blueprint' : 'Create Task Matrix Block'}
            </h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-1">
              Specify active production metrics
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Title */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-widest">
              Video Title / Concept
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-zinc-500">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to Win High-Ticket Retainers in 2026"
                className="w-full pl-10 pr-4 py-2 bg-zinc-950/40 text-zinc-200 font-sans text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                required
              />
            </div>
          </div>

          {isNoClients && (
            <div className="p-4 bg-red-950/10 border border-red-900/30 text-[10px] text-red-400 font-mono space-y-1.5">
              <p className="font-bold uppercase tracking-wider">[Constraint Warning]</p>
              <p>Hệ thống hiện tại không có Client Segment nào. Bạn cần đóng modal này và click nút [Client Matrices Config] trong bảng điều khiển để tạo ít nhất một Client Segment trước khi tạo Task mới.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client Select */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-widest">
                Client Matrix
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 text-zinc-300 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                disabled={isNoClients}
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id} className="bg-black">
                    {client.displayName} ({client.tier})
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Editor */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-widest">
                Assigned Editor
              </label>
              <select
                value={assignedEditorId}
                onChange={(e) => setAssignedEditorId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 text-zinc-300 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
              >
                <option value="Unassigned" className="bg-black text-zinc-400">Unassigned (Claimable Pool)</option>
                <option value="Phuc" className="bg-black">Phuc (Master Editor)</option>
                {staff.filter(s => s.id !== 'Phuc').map(editor => (
                  <option key={editor.id} value={editor.id} className="bg-black">
                    {editor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Folder Asset URL */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-widest">
                Raw Footage Folder Link
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-zinc-500">
                  <Link className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={rawFootageLink}
                  onChange={(e) => setRawFootageLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950/40 text-zinc-300 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                  required
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-widest">
                Internal Deadline
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-zinc-500">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="datetime-local"
                  value={internalDeadline}
                  onChange={(e) => setInternalDeadline(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950/40 text-zinc-300 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Dropdown */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-widest">
                Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-zinc-950 text-zinc-300 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
              >
                <option value="Unassigned" className="bg-black">Unassigned</option>
                <option value="Rough Cut" className="bg-black">Rough Cut (Stage 1)</option>
                <option value="Final Polish" className="bg-black">Final Polish (Stage 2 - Phuc)</option>
                <option value="Client Review" className="bg-black">Client Review (Pending Feedback)</option>
                <option value="Approved" className="bg-black">Approved (Finished)</option>
              </select>
            </div>

            {/* Dummy link inputs for fast stage routing */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-widest">
                Rough Cut Delivery URL (Stage 1 Output)
              </label>
              <input
                type="url"
                value={roughCutUrl}
                onChange={(e) => setRoughCutUrl(e.target.value)}
                placeholder="https://vimeo.com/..."
                className="w-full px-3 py-2 bg-zinc-950/40 text-zinc-300 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div className="bg-zinc-950/40 p-5 rounded-none border border-zinc-900 space-y-4">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 block">
              Financial Arbitrage Parameters (USD)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Pay */}
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
                  Inbound Contract Revenue (Client Pay)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-600 text-xs">$</span>
                  <input
                    type="number"
                    value={clientPay}
                    onChange={(e) => setClientPay(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2 bg-zinc-950 text-zinc-200 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                    min="0"
                  />
                </div>
              </div>

              {/* Sub-Editor Pay */}
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
                  Outbound Sub-Editor Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-600 text-xs">$</span>
                  <input
                    type="number"
                    value={subPay}
                    onChange={(e) => setSubPay(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2 bg-zinc-950 text-zinc-200 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Client Pay Status */}
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
                  Client Inbound Status
                </label>
                <select
                  value={clientPaidStatus}
                  onChange={(e) => setClientPaidStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 bg-zinc-950 text-zinc-300 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                >
                  <option value="Unpaid" className="bg-black">Unpaid</option>
                  <option value="Invoiced" className="bg-black">Invoiced / Sent</option>
                  <option value="Paid" className="bg-black">Paid / Settled</option>
                </select>
              </div>

              {/* Sub Pay Status */}
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
                  Sub-Editor Settlement
                </label>
                <select
                  value={subPaidStatus}
                  onChange={(e) => setSubPaidStatus(e.target.value as 'Unpaid' | 'Paid')}
                  className="w-full px-3 py-2 bg-zinc-950 text-zinc-300 font-mono text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
                >
                  <option value="Unpaid" className="bg-black">Unpaid</option>
                  <option value="Paid" className="bg-black">Paid / Settled</option>
                </select>
              </div>
            </div>

            {/* Quick Profit Margin Calc */}
            <div className="pt-3 border-t border-zinc-900/50 flex justify-between items-center text-xs font-mono text-emerald-500">
              <span>Simulated Net Margin:</span>
              <span>
                ${clientPay - subPay} (
                {clientPay > 0 ? (((clientPay - subPay) / clientPay) * 100).toFixed(0) : 0}% efficiency)
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-widest">
              Production Guidelines & Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Visual instructions, reference tracks, specific After Effects motion files to use..."
              className="w-full px-3 py-2 bg-zinc-950/40 text-zinc-300 font-sans text-xs border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700 h-24"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-zinc-900 justify-end bg-black -mx-6 -mb-6 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 rounded-none hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isNoClients}
              className="px-6 py-2 text-xs font-mono font-bold uppercase text-black bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 rounded-none transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            >
              Commit Task Parameters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StaffObject, VideoTaskObject } from '../types';
import { 
  Users, Star, Shield, AlertTriangle, RefreshCw, 
  Phone, UserPlus, Trash2, Edit2, Check, X, ShieldAlert 
} from 'lucide-react';

interface TeamPipelineProps {
  staff: StaffObject[];
  tasks: VideoTaskObject[];
  onReassignTask: (taskId: string, newEditorId: string) => void;
  currency: 'USD' | 'VND';
  onAddStaff?: (newMember: StaffObject) => void;
  onUpdateStaff?: (updatedMember: StaffObject) => void;
  onDeleteStaff?: (staffId: string) => void;
}

export default function TeamPipeline({ 
  staff, 
  tasks, 
  onReassignTask, 
  currency,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff
}: TeamPipelineProps) {
  const [selectedTaskToReassign, setSelectedTaskToReassign] = useState<string>('');
  const [targetEditorId, setTargetEditorId] = useState<string>('');
  const [shuntError, setShuntError] = useState<string>('');

  // Add Editor state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newScore, setNewScore] = useState(5.0);
  const [newAvatar, setNewAvatar] = useState('');

  // Edit Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editScore, setEditScore] = useState(5.0);
  const [editAvatar, setEditAvatar] = useState('');

  const formatPrice = (val: number) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val * 25000);
    }
    return `$${val}`;
  };

  // Get active tasks of specific editor
  const getActiveTasksForEditor = (editorId: string) => {
    return tasks.filter(t => t.assignedEditorId === editorId && t.status !== 'Approved');
  };

  const getBottleneckTasks = () => {
    return tasks.filter(t => t.status !== 'Approved' && t.assignedEditorId !== 'Unassigned');
  };

  // Handle Add Editor
  const handleCreateEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onAddStaff) return;

    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    
    const newMember: StaffObject = {
      id: `editor_${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim() || 'Sub-Editor (Video Production)',
      phone: newPhone.trim(),
      qualityScore: parseFloat(newScore.toString()) || 5.0,
      avatarUrl: newAvatar.trim() || defaultAvatar,
      activeTaskCount: 0,
      totalEarnings: 0
    };

    onAddStaff(newMember);

    // Reset Form
    setNewName('');
    setNewRole('');
    setNewPhone('');
    setNewScore(5.0);
    setNewAvatar('');
    setShowAddForm(false);
  };

  // Start Editing Editor
  const startEditing = (member: StaffObject) => {
    setEditingId(member.id);
    setEditName(member.name);
    setEditRole(member.role || '');
    setEditPhone(member.phone || '');
    setEditScore(member.qualityScore);
    setEditAvatar(member.avatarUrl);
  };

  // Handle Save Editor edits
  const handleSaveEdit = (member: StaffObject) => {
    if (!editName.trim() || !onUpdateStaff) return;

    const updatedMember: StaffObject = {
      ...member,
      name: editName.trim(),
      role: editRole.trim() || 'Sub-Editor (Video Production)',
      phone: editPhone.trim(),
      qualityScore: parseFloat(editScore.toString()) || 5.0,
      avatarUrl: editAvatar.trim() || member.avatarUrl
    };

    onUpdateStaff(updatedMember);
    setEditingId(null);
  };

  return (
    <div id="team-pipeline-panel" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-2xl font-serif font-light tracking-tight text-zinc-100 uppercase">
            Arbitrage Workforce Directory
          </h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">
            Review sub-editor performance and output pipelines
          </p>
        </div>

        {onAddStaff && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-mono text-[10px] uppercase font-bold rounded-none transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {showAddForm ? 'Close console' : 'Register New Editor'}
          </button>
        )}
      </div>

      {/* Add Editor form panel */}
      {showAddForm && (
        <form onSubmit={handleCreateEditor} className="bg-zinc-950/20 backdrop-blur-xl border-none p-6 rounded-none space-y-4">
          <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
            NEW REGISTER BLUEPRINT
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">Editor Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">Vị trí / Role</label>
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Senior Editor (Reels)"
                className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">Số điện thoại</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">Quality Score (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={newScore}
                onChange={(e) => setNewScore(parseFloat(e.target.value) || 5.0)}
                className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={newAvatar}
                onChange={(e) => setNewAvatar(e.target.value)}
                placeholder="Leave blank for automatic default asset"
                className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-transparent border border-zinc-800 text-zinc-400 hover:text-white font-mono text-[10px] uppercase rounded-none transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-[10px] uppercase rounded-none transition-colors cursor-pointer"
            >
              Tạo Editor
            </button>
          </div>
        </form>
      )}

      {/* Staff Grid Cards */}
      <div id="staff-directory-grid" className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {staff.map(member => {
          const activeTasks = getActiveTasksForEditor(member.id);
          const isBottleneck = activeTasks.length >= 2;
          const isEditing = editingId === member.id;

          return (
            <div 
              key={member.id}
              className="relative bg-zinc-950/20 backdrop-blur-xl border-none p-6 rounded-none transition-all duration-300"
            >
              {/* Card Actions (Edit, Delete) */}
              {!isEditing && (
                <div className="absolute top-6 right-6 flex items-center gap-1.5 z-10">
                  {onUpdateStaff && (
                    <button
                      onClick={() => startEditing(member)}
                      className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-none transition-colors cursor-pointer"
                      title="Chỉnh sửa Editor"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {onDeleteStaff && (
                    <button
                      onClick={() => onDeleteStaff(member.id)}
                      className="p-1 text-zinc-500 hover:text-red-500 hover:bg-zinc-900 rounded-none transition-colors cursor-pointer"
                      title="Xóa Editor"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {isEditing ? (
                /* Inline Editor Form */
                <div className="space-y-4 font-mono">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">CHỈNH SỬA EDITOR</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(member)}
                        className="p-1.5 bg-white text-black hover:bg-zinc-200 rounded-none cursor-pointer transition-colors"
                        title="Lưu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-none cursor-pointer transition-colors"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Tên hiển thị</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Vị trí / Role</label>
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Số điện thoại</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Điểm chất lượng</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        value={editScore}
                        onChange={(e) => setEditScore(parseFloat(e.target.value) || 5.0)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950/40 border border-zinc-900 rounded-none text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Avatar URL</label>
                      <input
                        type="text"
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-950/40 border border-zinc-900 rounded-none text-[10px] text-zinc-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Card Display Mode */
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img 
                      src={member.avatarUrl} 
                      alt={member.name} 
                      className="w-12 h-12 rounded-none object-cover border border-zinc-900 bg-zinc-950/40"
                    />
                    {member.id === 'Phuc' && (
                      <span className="absolute -top-1.5 -right-1.5 p-0.5 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-none" title="Master Editor">
                        <Shield className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 pr-14">
                      <h3 className="text-sm font-serif font-light text-zinc-200 truncate">
                        {member.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-mono">
                          {member.qualityScore.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                      {member.role || 'Sub-Editor (Video Production)'}
                    </p>

                    {member.phone && (
                      <p className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 mt-1">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{member.phone}</span>
                      </p>
                    )}

                    {/* Workload Indicator */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-zinc-500">ACTIVE WORKLOAD:</span>
                        <span className={`font-bold ${isBottleneck ? 'text-amber-500' : 'text-zinc-300'}`}>
                          {activeTasks.length} {activeTasks.length === 1 ? 'project' : 'projects'}
                        </span>
                      </div>

                      {/* Simple progress bar */}
                      <div className="w-full bg-zinc-950 h-1 rounded-none overflow-hidden border border-zinc-900/40">
                        <div 
                          className={`h-full rounded-none transition-all duration-300 ${
                            isBottleneck ? 'bg-amber-500' : 'bg-white'
                          }`}
                          style={{ width: `${Math.min(100, (activeTasks.length / 3) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Bottleneck alert banner */}
                    {isBottleneck && (
                      <div className="mt-3 flex items-start gap-1.5 bg-amber-950/20 border border-amber-900/30 p-2 text-[9px] font-mono text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="tracking-wider uppercase">BOTTLENECK: Review active deadlines below.</span>
                      </div>
                    )}

                    {/* Active Cuts list */}
                    {activeTasks.length > 0 && (
                      <div className="mt-4 space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-widest">Active Deliverables:</span>
                        {activeTasks.map(t => (
                          <div key={t.id} className="text-[9px] font-mono text-zinc-400 bg-zinc-950/40 p-2 border border-zinc-900 rounded-none flex justify-between items-center">
                            <span className="truncate max-w-[150px]">{t.title}</span>
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              <span className="text-zinc-300 uppercase text-[8px] tracking-widest">{t.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ledger stats */}
                    <div className="mt-4 pt-3 border-t border-zinc-900/50 flex justify-between items-center text-[9px] font-mono">
                      <span className="text-zinc-500">TOTAL EARNINGS CAPTURED:</span>
                      <strong className="text-emerald-400 font-bold">
                        {formatPrice(member.totalEarnings)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dynamic Bottleneck Re-assignment Mechanism */}
      <div id="bottleneck-reassignment-console" className="bg-zinc-950/20 backdrop-blur-xl border-none p-6 rounded-none mt-8">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
            WORKFLOW PIPELINE SHUNT CONTROL
          </h3>
        </div>

        <p className="text-xs text-zinc-500 font-sans mb-4 leading-relaxed">
          Nếu một editor bị quá tải hoặc chậm trễ tiến độ so với Deadline, hãy sử dụng Shunt để lập tức chuyển giao công việc đó cho tài nguyên rảnh rỗi khác.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950/40 p-4 border border-zinc-900 rounded-none">
          <div>
            <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
              Chọn Task nghẽn
            </label>
            <select
              value={selectedTaskToReassign}
              onChange={(e) => { setSelectedTaskToReassign(e.target.value); setShuntError(''); }}
              className="w-full px-2.5 py-1.5 bg-zinc-950 text-zinc-300 font-mono text-[10px] uppercase tracking-wider border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
            >
              <option value="" className="text-zinc-600">-- Chọn video task --</option>
              {getBottleneckTasks().map(t => (
                <option key={t.id} value={t.id} className="text-zinc-300">
                  {t.title.substring(0, 30)}... ({t.id.replace('task_', 'TX_')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
              Chuyển sang Editor mới
            </label>
            <select
              value={targetEditorId}
              onChange={(e) => { setTargetEditorId(e.target.value); setShuntError(''); }}
              className="w-full px-2.5 py-1.5 bg-zinc-950 text-zinc-300 font-mono text-[10px] uppercase tracking-wider border border-zinc-900 rounded-none focus:outline-none focus:border-zinc-700"
            >
              <option value="" className="text-zinc-600">-- Chọn Editor nhận việc --</option>
              <option value="Unassigned" className="text-zinc-300">Khu vực rảnh (Unassigned)</option>
              <option value="Phuc" className="text-zinc-300">Phuc (Master Editor)</option>
              {staff.filter(s => s.id !== 'Phuc').map(s => (
                <option key={s.id} value={s.id} className="text-zinc-300">
                  {s.name} ({s.qualityScore.toFixed(1)} ★)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                if (!selectedTaskToReassign || !targetEditorId) {
                  setShuntError('Vui lòng chọn đầy đủ video task và editor để shunt.');
                  return;
                }
                onReassignTask(selectedTaskToReassign, targetEditorId);
                setSelectedTaskToReassign('');
                setTargetEditorId('');
                setShuntError('');
              }}
              className="w-full py-1.5 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-[10px] uppercase rounded-none transition-colors flex justify-center items-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            >
              Áp dụng Shunt Pipeline
            </button>
          </div>
        </div>

        {shuntError && (
          <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-red-400">
            [Error] {shuntError}
          </p>
        )}
      </div>
    </div>
  );
}

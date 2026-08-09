import React, { useState } from 'react';
import { VideoTaskObject } from '../types';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Plus, 
  Clock, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  X,
  TrendingUp,
  Sparkles,
  DollarSign
} from 'lucide-react';

interface VideoProofingModalProps {
  task: VideoTaskObject;
  onClose: () => void;
  onApprove: (taskId: string) => void;
  currency: 'USD' | 'VND';
}

interface ProofComment {
  id: string;
  timestamp: string; // e.g. "00:14"
  author: string;
  text: string;
  resolved: boolean;
}

export default function VideoProofingModal({
  task,
  onClose,
  onApprove,
  currency
}: VideoProofingModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:15');
  const [newCommentText, setNewCommentText] = useState('');
  const [comments, setComments] = useState<ProofComment[]>([
    { id: '1', timestamp: '00:12', author: 'Client Director', text: 'Tối màu B-Roll cảnh này, tăng thêm +10% brightness.', resolved: false },
    { id: '2', timestamp: '00:45', author: 'Lead Editor', text: 'Thêm hiệu ứng sound Whoosh 3D cho Kinetic Text.', resolved: true }
  ]);

  const netProfit = (task.clientPay || 0) - (task.subPay || 0);
  const profitMarginPercent = task.clientPay ? Math.round((netProfit / task.clientPay) * 100) : 100;
  const isLowMargin = profitMarginPercent < 40;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: ProofComment = {
      id: String(Date.now()),
      timestamp: currentTime,
      author: 'Reviewer',
      text: newCommentText.trim(),
      resolved: false
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  const toggleResolveComment = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#090d16] border border-white/15 rounded-lg max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
              {task.id}
            </span>
            <div>
              <h3 className="font-black text-base uppercase text-white tracking-tight">{task.title}</h3>
              <span className="font-mono text-xs text-slate-400">CLIENT PROOF REVIEW & FRAME APPROVAL ENGINE</span>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1 overflow-hidden">
          {/* Video Player & Metrics Side */}
          <div className="md:col-span-2 p-6 border-r border-white/10 flex flex-col gap-4 overflow-y-auto">
            {/* Mock 4K Video Player Box */}
            <div className="relative aspect-video bg-black border border-white/10 rounded-md overflow-hidden flex items-center justify-center group shadow-inner">
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck size={12} />
                <span>4K HDR MASTER RENDER</span>
              </div>

              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-sky-400 border border-sky-500/30">
                FRAME: 00:15:24
              </div>

              <div className="text-center p-6">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-blue-600/90 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105"
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </button>
                <p className="font-mono text-xs text-slate-400 mt-3">PREVIEWING VIDEO RETAINMENT TIMELINE</p>
              </div>

              {/* Player Timeline Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-3">
                <span className="font-mono text-xs text-white">{currentTime}</span>
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                  <div className="w-1/3 h-full bg-blue-500 rounded-full"></div>
                </div>
                <span className="font-mono text-xs text-slate-400">03:45</span>
              </div>
            </div>

            {/* Financial Margin & Retention Score Metrics */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-black/40 border border-white/10 rounded flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Net Profit (Margin Yield)</span>
                  <strong className={`text-sm ${isLowMargin ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ${netProfit} ({profitMarginPercent}%)
                  </strong>
                </div>
                <DollarSign size={20} className={isLowMargin ? 'text-amber-400' : 'text-emerald-400'} />
              </div>

              <div className="p-3 bg-black/40 border border-white/10 rounded flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Retention Forecast AVD</span>
                  <strong className="text-sm text-sky-400">86.5% AUDIENCE</strong>
                </div>
                <TrendingUp size={20} className="text-sky-400" />
              </div>
            </div>

            {/* Direct Links */}
            <div className="flex gap-2 text-xs font-mono">
              {task.rawFootageLink && (
                <a 
                  href={task.rawFootageLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-300 flex items-center gap-1.5 flex-1 justify-center"
                >
                  <ExternalLink size={13} /> Raw Footage
                </a>
              )}
              {task.roughCutUrl && (
                <a 
                  href={task.roughCutUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-300 flex items-center gap-1.5 flex-1 justify-center"
                >
                  <ExternalLink size={13} /> Rough Cut
                </a>
              )}
            </div>
          </div>

          {/* Timestamp Comments & Feedback Panel */}
          <div className="p-6 bg-black/30 border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                  <MessageSquare size={14} className="text-sky-400" />
                  <span>Timeline Review Notes ({comments.length})</span>
                </h4>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <span className="font-mono text-xs text-sky-400 py-1.5 px-2 bg-sky-500/10 border border-sky-500/30 rounded shrink-0">
                    {currentTime}
                  </span>
                  <input 
                    type="text" 
                    placeholder="Type feedback for this timestamp frame..." 
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full p-1.5 bg-black/60 border border-white/15 rounded text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 font-mono text-xs font-bold uppercase rounded flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> Add Review Note
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div 
                    key={c.id} 
                    className={`p-3 border rounded text-xs font-mono ${c.resolved ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60' : 'bg-black/50 border-white/10'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sky-400 font-bold">[{c.timestamp}] {c.author}</span>
                      <button 
                        onClick={() => toggleResolveComment(c.id)} 
                        className={`text-[10px] px-1.5 py-0.5 rounded ${c.resolved ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                      >
                        {c.resolved ? '✓ Resolved' : 'Mark as Resolved'}
                      </button>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-white/10 space-y-2 mt-4">
              <button 
                onClick={() => {
                  onApprove(task.id);
                  onClose();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase rounded shadow flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> APPROVE 4K MASTER RENDER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

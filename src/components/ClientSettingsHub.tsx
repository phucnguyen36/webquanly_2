/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClientObject, ClientTier } from '../types';
import { Plus, Trash2, X, AlertTriangle } from 'lucide-react';

interface ClientSettingsHubProps {
  clients: ClientObject[];
  onAddClient: (client: ClientObject) => void;
  onDeleteClient: (clientId: string) => void;
  onClose: () => void;
}

export default function ClientSettingsHub({ clients, onAddClient, onDeleteClient, onClose }: ClientSettingsHubProps) {
  const [newClientName, setNewClientName] = useState('');
  const [newClientTier, setNewClientTier] = useState<ClientTier>('Volume-Arbitrage');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newClientName.trim()) {
      setError('Client name cannot be empty.');
      return;
    }

    const exists = clients.some(c => c.displayName.toLowerCase() === newClientName.trim().toLowerCase());
    if (exists) {
      setError('A client with this name already exists.');
      return;
    }

    const newId = newClientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    onAddClient({
      id: newId,
      displayName: newClientName.trim(),
      tier: newClientTier
    });

    setNewClientName('');
    setNewClientTier('Volume-Arbitrage');
  };

  return (
    <div id="client-settings-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div 
        id="client-settings-card"
        className="relative w-full max-w-lg bg-[#09090b] border border-[#ef4444]/20 rounded-xl overflow-hidden shadow-2xl shadow-[0_0_30px_rgba(239,68,68,0.1)]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#1e293b] bg-black">
          <div>
            <h2 className="text-lg font-black tracking-tight text-[#f4f4f5] font-sans">
              CLIENT MATRICES CONFIG
            </h2>
            <p className="text-xs font-mono text-[#71717a] uppercase tracking-wider mt-0.5">
              Add or remove accounts in real-time
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-[#71717a] hover:text-[#f4f4f5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 bg-black p-4 rounded-lg border border-[#1e293b]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ef4444] block">
              Propose New Matrix Segment
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-[#71717a] uppercase mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Creator League"
                  className="w-full px-3 py-2 bg-[#09090b] text-[#f4f4f5] font-mono text-xs border border-[#1e293b] rounded-md focus:outline-none focus:border-[#ef4444]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#71717a] uppercase mb-1">
                  Tier Strategy
                </label>
                <select
                  value={newClientTier}
                  onChange={(e) => setNewClientTier(e.target.value as ClientTier)}
                  className="w-full px-3 py-2 bg-[#09090b] text-[#f4f4f5] font-mono text-xs border border-[#1e293b] rounded-md focus:outline-none focus:border-[#ef4444]"
                >
                  <option value="High-Ticket">High-Ticket (Premium Cuts)</option>
                  <option value="Volume-Arbitrage">Volume-Arbitrage (Automated)</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-[10px] font-mono text-red-400">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-[#ef4444] hover:bg-red-600 text-white font-mono font-bold text-xs uppercase rounded transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.3)]"
            >
              <Plus className="w-4 h-4" /> Add Segment Tab
            </button>
          </form>

          {/* List of Clients */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] block">
              Active Segment Directories
            </span>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {clients.map(client => (
                <div 
                  key={client.id}
                  className="flex items-center justify-between p-3 bg-black border border-[#1e293b] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                    <div>
                      <p className="text-xs font-bold text-[#f4f4f5]">{client.displayName}</p>
                      <span className={`inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded mt-1 ${
                        client.tier === 'High-Ticket' 
                          ? 'bg-red-950/20 text-[#ef4444] border border-[#ef4444]/30' 
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                      }`}>
                        {client.tier}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteClient(client.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors cursor-pointer"
                    title="Delete client segment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info warning */}
        <div className="bg-black/50 p-4 border-t border-[#1e293b] flex items-start gap-2 text-[10px] font-mono text-[#71717a]">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>WARNING: Deleting client segments will detach them from any active linked task cards, turning their client filter into unassigned states.</p>
        </div>
      </div>
    </div>
  );
}

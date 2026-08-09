import React, { useState } from 'react';
import { ClientObject, VideoTaskObject, CurrencyCode } from '../types';
import { 
  Printer, 
  X, 
  FileText, 
  Globe, 
  DollarSign 
} from 'lucide-react';

interface InvoiceGeneratorModalProps {
  clients: ClientObject[];
  tasks: VideoTaskObject[];
  onClose: () => void;
  currency: 'USD' | 'VND';
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, { symbol: string; prefix: boolean }> = {
  USD: { symbol: '$', prefix: true },
  EUR: { symbol: '€', prefix: true },
  GBP: { symbol: '£', prefix: true },
  AUD: { symbol: 'A$', prefix: true },
  CAD: { symbol: 'C$', prefix: true },
  SGD: { symbol: 'S$', prefix: true },
  JPY: { symbol: '¥', prefix: true },
  VND: { symbol: ' ₫', prefix: false }
};

export default function InvoiceGeneratorModal({
  clients,
  tasks,
  onClose,
  currency: globalCurrency
}: InvoiceGeneratorModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || 'all');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState('Thank you for partnering with Thomas Nguyen Visual Studio. Please remit payment via bank wire transfer before the due date.');

  // Filter tasks for selected client
  const clientTasks = selectedClientId === 'all' 
    ? tasks 
    : tasks.filter(t => t.clientId === selectedClientId);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const subtotal = clientTasks.reduce((acc, t) => acc + (t.clientPay || 0), 0);
  const taxAmount = Math.round((subtotal * taxPercent) / 100);
  const grandTotal = subtotal + taxAmount;

  const formatPrice = (val: number, curCode: CurrencyCode = selectedCurrency) => {
    const cfg = CURRENCY_SYMBOLS[curCode] || CURRENCY_SYMBOLS.USD;
    const formattedNum = val.toLocaleString('en-US');
    return cfg.prefix ? `${cfg.symbol}${formattedNum}` : `${formattedNum}${cfg.symbol}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-[#090d16] border border-white/15 rounded-lg max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-black/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-white tracking-wider">COMMERCIAL STATEMENT & INVOICE GENERATOR</h3>
              <span className="font-mono text-[10px] text-slate-400">THOMAS NGUYEN VISUAL STUDIO // GLOBAL BILLING</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase rounded shadow flex items-center gap-2 transition"
            >
              <Printer size={15} />
              <span>PRINT / EXPORT PDF INVOICE</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Controls (Hidden during print) */}
        <div className="p-4 px-6 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">SELECT CLIENT:</label>
              <select 
                value={selectedClientId} 
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-black border border-white/15 text-white font-mono text-xs p-1.5 rounded outline-none focus:border-blue-500"
              >
                <option value="all">-- All Client Projects --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName} ({c.tier})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CURRENCY:</label>
              <select 
                value={selectedCurrency} 
                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                className="bg-black border border-white/15 text-white font-mono text-xs p-1.5 rounded outline-none focus:border-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="VND">VND (₫)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">INVOICE NO:</label>
              <input 
                type="text" 
                value={invoiceNumber} 
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="bg-black border border-white/15 text-white font-mono text-xs p-1.5 rounded outline-none focus:border-blue-500 w-32"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">TAX / VAT (%):</label>
              <input 
                type="number" 
                value={taxPercent} 
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="bg-black border border-white/15 text-white font-mono text-xs p-1.5 rounded outline-none focus:border-blue-500 w-16"
              />
            </div>
          </div>

          <div className="font-mono text-xs text-emerald-400 font-bold">
            TOTAL DUE: {formatPrice(grandTotal, selectedCurrency)}
          </div>
        </div>

        {/* PRINTABLE INVOICE SHEET AREA */}
        <div id="printable-invoice-area" className="p-8 bg-white text-slate-900 flex-1 overflow-y-auto font-sans print:p-0 print:overflow-visible">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 bg-slate-900 text-white font-black flex items-center justify-center text-xs rounded">TN</span>
                <h1 className="font-black text-xl tracking-tight uppercase">THOMAS NGUYEN VISUAL STUDIO</h1>
              </div>
              <p className="text-xs text-slate-600 font-medium">High-Retention Short-Form Video & Post-Production Command Center</p>
              <p className="text-xs text-slate-500 font-mono">Website: thomasvisual.vercel.app | Email: billing@thomasvisual.com</p>
            </div>

            <div className="text-right font-mono">
              <span className="text-2xl font-black text-slate-900 uppercase tracking-wider block mb-1 font-sans">COMMERCIAL INVOICE</span>
              <span className="text-xs text-slate-600 block">INVOICE NO: <strong>{invoiceNumber}</strong></span>
              <span className="text-xs text-slate-600 block">DATE: {invoiceDate}</span>
              <span className="text-xs text-slate-600 block">DUE DATE: {dueDate}</span>
            </div>
          </div>

          {/* Client & Billing Remittance Info */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
            <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1 font-mono">BILL TO (CLIENT):</span>
              <strong className="text-sm font-bold text-slate-900 block">{selectedClient ? selectedClient.displayName : 'Consolidated Client Account'}</strong>
              <p className="text-slate-600 mt-1">Tier Rating: {selectedClient?.tier || 'Standard Corporate Client'}</p>
              <p className="text-slate-600">Payment Status: <span className="text-emerald-700 font-bold uppercase">Pending Month-End Settlement</span></p>
            </div>

            <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1 font-mono">REMIT PAYMENT TO:</span>
              <strong className="text-sm font-bold text-slate-900 block">THOMAS NGUYEN MEDIA APEX CO., LTD</strong>
              <p className="text-slate-600 mt-1">Bank Name: <strong>Joint Stock Commercial Bank for Foreign Trade of Vietnam (Vietcombank)</strong></p>
              <p className="text-slate-600">Account Number: <strong className="font-mono text-slate-900">9842485854</strong></p>
              <p className="text-slate-600">Account Holder Name: <strong>NGUYEN XUAN PHUC</strong></p>
              <p className="text-slate-600">SWIFT / BIC Code: <strong className="font-mono text-slate-900">BFTVVNVX</strong></p>
            </div>
          </div>

          {/* Table of Tasks / Line Items */}
          <table className="w-full border-collapse mb-8 text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-mono">
                <th className="p-3 text-left">ITEM ID</th>
                <th className="p-3 text-left font-sans">VIDEO TASK / SCOPE OF WORK</th>
                <th className="p-3 text-center">STAGE STATUS</th>
                <th className="p-3 text-right">AMOUNT ({selectedCurrency})</th>
              </tr>
            </thead>
            <tbody>
              {clientTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 font-mono">No tasks selected for this billing cycle.</td>
                </tr>
              ) : (
                clientTasks.map((t, idx) => (
                  <tr key={t.id} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="p-3 font-mono font-bold text-slate-700 border-b border-slate-200">{t.id}</td>
                    <td className="p-3 font-bold text-slate-900 border-b border-slate-200">
                      {t.title}
                      {t.notes && <span className="block text-[10px] text-slate-500 font-normal">{t.notes}</span>}
                    </td>
                    <td className="p-3 text-center border-b border-slate-200">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 border-b border-slate-200">
                      {formatPrice(t.clientPay || 0, t.currency || selectedCurrency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Invoice Summary Totals */}
          <div className="flex flex-wrap justify-between items-start mb-8 text-xs gap-6">
            <div className="flex-1 min-w-[280px]">
              <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1 font-mono">REMITTANCE NOTES & TERMS:</span>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 outline-none print:bg-transparent print:border-none print:p-0"
                rows={3}
              />
            </div>

            <div className="w-72 space-y-2 text-right">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-mono text-[11px]">SUBTOTAL:</span>
                <span className="font-mono font-bold text-slate-900">{formatPrice(subtotal, selectedCurrency)}</span>
              </div>
              {taxPercent > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-mono text-[11px]">TAX / VAT ({taxPercent}%):</span>
                  <span className="font-mono text-slate-900">{formatPrice(taxAmount, selectedCurrency)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-black border-t-2 border-slate-900 pt-2 text-slate-900">
                <span className="font-sans">TOTAL DUE:</span>
                <span className="font-mono text-blue-700 text-base">{formatPrice(grandTotal, selectedCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 text-center pt-8 border-t border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-900 uppercase">AUTHORIZED CLIENT SIGNATURE</p>
              <p className="text-[10px] text-slate-400 font-mono">(Sign & Date)</p>
              <div className="h-16"></div>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">THOMAS NGUYEN VISUAL STUDIO</p>
              <p className="text-[10px] text-slate-400 font-mono">(Approved for Release)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="font-mono text-xs text-blue-700 font-bold border-2 border-blue-700 px-3 py-1 rounded tracking-widest uppercase rotate-[-5deg]">
                  ✓ VERIFIED & APPROVED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

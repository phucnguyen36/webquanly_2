import React, { useState } from 'react';
import { ClientObject, VideoTaskObject } from '../types';
import { 
  Printer, 
  Download, 
  X, 
  FileText, 
  CheckCircle2, 
  Building, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface InvoiceGeneratorModalProps {
  clients: ClientObject[];
  tasks: VideoTaskObject[];
  onClose: () => void;
  currency: 'USD' | 'VND';
}

export default function InvoiceGeneratorModal({
  clients,
  tasks,
  onClose,
  currency
}: InvoiceGeneratorModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || 'all');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState('Cảm ơn bạn đã hợp tác sản xuất cùng Thomas Nguyen Visual Studio. Vui lòng thanh toán hợp đồng trước ngày hạn.');

  // Filter tasks for selected client
  const clientTasks = selectedClientId === 'all' 
    ? tasks 
    : tasks.filter(t => t.clientId === selectedClientId);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const subtotal = clientTasks.reduce((acc, t) => acc + (t.clientPay || 0), 0);
  const taxAmount = Math.round((subtotal * taxPercent) / 100);
  const grandTotal = subtotal + taxAmount;

  const formatPrice = (val: number) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val * 25000);
    }
    return `$${val.toLocaleString('en-US')}`;
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
              <h3 className="font-black text-sm uppercase text-white tracking-wider">XUẤT HÓA ĐƠN HỢP ĐỒNG CUỐI THÁNG</h3>
              <span className="font-mono text-[10px] text-slate-400">AUTOMATED CLIENT BILLING & INVOICE GENERATOR</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase rounded shadow flex items-center gap-2"
            >
              <Printer size={15} />
              <span>IN / XUẤT FILE PDF HÓA ĐƠN</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Controls (Hidden during print) */}
        <div className="p-4 px-6 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CHỌN KHÁCH HÀNG:</label>
              <select 
                value={selectedClientId} 
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-black border border-white/15 text-white font-mono text-xs p-1.5 rounded outline-none focus:border-blue-500"
              >
                <option value="all">-- Tất cả dự án --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName} ({c.tier})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">MÃ HÓA ĐƠN:</label>
              <input 
                type="text" 
                value={invoiceNumber} 
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="bg-black border border-white/15 text-white font-mono text-xs p-1.5 rounded outline-none focus:border-blue-500 w-36"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">THUẾ GTGT / TAX (%):</label>
              <input 
                type="number" 
                value={taxPercent} 
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="bg-black border border-white/15 text-white font-mono text-xs p-1.5 rounded outline-none focus:border-blue-500 w-20"
              />
            </div>
          </div>

          <span className="font-mono text-xs text-emerald-400 font-bold">
            TỔNG CỘNG: {formatPrice(grandTotal)}
          </span>
        </div>

        {/* PRINTABLE INVOICE SHEET AREA */}
        <div id="printable-invoice-area" className="p-8 bg-white text-slate-900 flex-1 overflow-y-auto font-sans print:p-0 print:overflow-visible">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-slate-900 text-white font-black flex items-center justify-center text-xs rounded">TN</span>
                <h1 className="font-black text-xl tracking-tight uppercase">THOMAS NGUYEN VISUAL STUDIO</h1>
              </div>
              <p className="text-xs text-slate-600">High-Retention Video Production & Post-House Command Center</p>
              <p className="text-xs text-slate-600">Hotline: 1900 6868 | Email: billing@thomasvisual.com</p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 uppercase tracking-widest block mb-1">HÓA ĐƠN TÍNH PHÍ</span>
              <span className="font-mono text-xs text-slate-600 block">SỐ: <strong>{invoiceNumber}</strong></span>
              <span className="font-mono text-xs text-slate-600 block">NGÀY XUẤT: {invoiceDate}</span>
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
            <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">THÔNG TIN ĐƠN VỊ THU HẠN:</span>
              <strong className="text-sm font-bold text-slate-900 block">{selectedClient ? selectedClient.displayName : 'Khách hàng Tổng hợp'}</strong>
              <p className="text-slate-600">Phân hạng khách hàng: {selectedClient?.tier || 'Standard Partner'}</p>
              <p className="text-slate-600">Trạng thái thanh toán: <span className="text-emerald-700 font-bold">Chờ Quyết Toán Cuối Tháng</span></p>
            </div>

            <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">ĐƠN VỊ PHÁT HÀNH:</span>
              <strong className="text-sm font-bold text-slate-900 block">THOMAS NGUYEN MEDIA APEX CO., LTD</strong>
              <p className="text-slate-600">Ngân hàng: Techcombank - STK: 1903 8888 6868</p>
              <p className="text-slate-600">Chủ tài khoản: NGUYEN XUAN PHUC</p>
            </div>
          </div>

          {/* Table of Tasks / Line Items */}
          <table className="w-full border-collapse mb-8 text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 text-left font-mono">MÃ TASK</th>
                <th className="p-3 text-left">TÊN DỰ ÁN VIDEO / HẠNG MỤC</th>
                <th className="p-3 text-center">TRẠNG THÁI</th>
                <th className="p-3 text-right font-mono">ĐƠN GIÁ ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {clientTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 font-mono">Chưa có dự án nào được chọn để xuất hóa đơn.</td>
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
                      {formatPrice(t.clientPay || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Invoice Summary Totals */}
          <div className="flex justify-between items-start mb-8 text-xs">
            <div className="max-w-md">
              <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">GHI CHÚ THANH TOÁN:</span>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 outline-none print:bg-transparent print:border-none print:p-0"
                rows={3}
              />
            </div>

            <div className="w-64 space-y-2 text-right">
              <div className="flex justify-between text-slate-600">
                <span>TỔNG TIỀN DỊCH VỤ:</span>
                <span className="font-mono font-bold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              {taxPercent > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>THUẾ GTGT ({taxPercent}%):</span>
                  <span className="font-mono text-slate-900">{formatPrice(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t-2 border-slate-900 pt-2 text-slate-900">
                <span>TỔNG CỘNG THANH TOÁN:</span>
                <span className="font-mono text-blue-700">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 text-center pt-8 border-t border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-900 uppercase">ĐẠI DIỆN KHÁCH HÀNG</p>
              <p className="text-[10px] text-slate-400">(Ký & ghi rõ họ tên)</p>
              <div className="h-16"></div>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">ĐẠI DIỆN THOMAS NGUYEN STUDIO</p>
              <p className="text-[10px] text-slate-400">(Đã duyệt xuất bản)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="font-mono text-xs text-blue-700 font-bold border-2 border-blue-700 px-3 py-1 rounded tracking-widest uppercase rotate-[-5deg]">
                  ✓ PAID & VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CheckCircle2, AlertCircle, User, Wrench, FileText } from 'lucide-react';
import { Sale } from '../../db/types';

interface CollectCustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  currency: string;
  onConfirmPayment: (saleId: number, amount: number, paymentDate: string, notes?: string) => void;
}

export const CollectCustomerPaymentModal: React.FC<CollectCustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  sale,
  currency,
  onConfirmPayment,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (sale) {
      const remaining = Math.max(0, sale.totalAmount - (sale.paidAmount || 0));
      setAmount(remaining);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  const totalAmount = sale.totalAmount;
  const currentPaid = sale.paidAmount || 0;
  const remainingDebt = Math.max(0, totalAmount - currentPaid);
  const balanceAfter = Math.max(0, remainingDebt - (amount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('يرجى إدخال مبلغ تحصيل أكبر من صفر');
      return;
    }
    if (amount > remainingDebt) {
      if (!confirm(`المبلغ المدخل (${amount} ${currency}) أكبر من المتبقي بذمة العميل (${remainingDebt} ${currency}). هل تريد المتابعة؟`)) {
        return;
      }
    }

    onConfirmPayment(sale.id, amount, paymentDate, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">سند تحصيل وقبض دفعة من العميل</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {sale.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تسجيل استلام مبالغ مالية أو دفعات متبقية على فواتير المبيعات والصيانة
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Customer & Invoice Summary Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <User className="w-4 h-4 text-cyan-400" />
                <span>{sale.customerName}</span>
                {sale.customerPhone && sale.customerPhone !== '—' && (
                  <span className="text-xs text-slate-400 font-mono">({sale.customerPhone})</span>
                )}
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                {sale.date}
              </span>
            </div>

            {sale.maintenance && (
              <div className="text-xs text-slate-300 flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>صيانة: {sale.maintenance.brand} {sale.maintenance.deviceType}</span>
                {sale.maintenance.modelOrBoard && <span className="text-slate-400 font-mono">({sale.maintenance.modelOrBoard})</span>}
              </div>
            )}

            {/* Financial Overview Tiles */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">إجمالي الفاتورة</span>
                <span className="text-xs font-black text-white font-mono">{totalAmount.toLocaleString()} {currency}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">المسدد سابقاً</span>
                <span className="text-xs font-black text-emerald-400 font-mono">{currentPaid.toLocaleString()} {currency}</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block font-bold">المتبقي حالياً</span>
                <span className="text-xs font-black text-amber-300 font-mono">{remainingDebt.toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>

          {/* Amount to Collect Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                المبلغ المراد تحصيله الآن
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(remainingDebt)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition cursor-pointer"
                >
                  كامل المتبقي ({remainingDebt.toLocaleString()})
                </button>
                {remainingDebt > 1 && (
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(remainingDebt / 2))}
                    className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
                  >
                    النصف
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0.5"
                max={remainingDebt * 2}
                step="0.5"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 text-base font-black text-emerald-400 rounded-xl bg-slate-950 border border-emerald-500/50 focus:border-emerald-400 outline-none"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currency}
              </span>
            </div>
          </div>

          {/* Payment Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                تاريخ التحصيل
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                رقم السند أو ملاحظة
              </label>
              <input
                type="text"
                placeholder="سند قبض #... أو تحويل كاش"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Balance After Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">رصيد العميل المتبقي بعد هذا التحصيل:</span>
            <span className={`text-sm font-black font-mono ${balanceAfter === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {balanceAfter === 0 ? '0 (تم سداد الفاتورة بالكامل ✓)' : `${balanceAfter.toLocaleString()} ${currency}`}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              تأكيد واستلام سند القبض
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CheckCircle2, Building2, Truck, FileText } from 'lucide-react';
import { Purchase } from '../../db/types';

interface PaySupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
  currency: string;
  onConfirmPayment: (purchaseId: number, amount: number, paymentDate: string, notes?: string) => void;
}

export const PaySupplierModal: React.FC<PaySupplierModalProps> = ({
  isOpen,
  onClose,
  purchase,
  currency,
  onConfirmPayment,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (purchase) {
      const remaining = Math.max(0, purchase.totalAmount - (purchase.paidAmount || 0));
      setAmount(remaining);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [purchase]);

  if (!isOpen || !purchase) return null;

  const totalAmount = purchase.totalAmount;
  const currentPaid = purchase.paidAmount || 0;
  const remainingDebt = Math.max(0, totalAmount - currentPaid);
  const balanceAfter = Math.max(0, remainingDebt - (amount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('يرجى إدخال مبلغ سداد أكبر من صفر');
      return;
    }
    if (amount > remainingDebt) {
      if (!confirm(`المبلغ المدخل (${amount} ${currency}) أكبر من المتبقي بذمتنا للمورد (${remainingDebt} ${currency}). هل تريد المتابعة؟`)) {
        return;
      }
    }

    onConfirmPayment(purchase.id, amount, paymentDate, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-950 via-slate-900 to-emerald-950 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">سند صرف وسداد دفعة للمورد</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {purchase.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تسجيل سداد مستحقات وذمم فواتير شراء وتوريد قطع الغيار
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
          {/* Supplier & Purchase Summary Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>{purchase.supplierName}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                {purchase.date}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>عدد الأصناف الموردة: {purchase.items.length} أصناف</span>
              {purchase.notes && <span className="text-slate-500 truncate">({purchase.notes})</span>}
            </div>

            {/* Financial Overview Tiles */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">إجمالي الفاتورة</span>
                <span className="text-xs font-black text-white font-mono">{totalAmount.toLocaleString()} {currency}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">المسدد للمورد</span>
                <span className="text-xs font-black text-emerald-400 font-mono">{currentPaid.toLocaleString()} {currency}</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30">
                <span className="text-[10px] text-rose-400 block font-bold">المتبقي بذمتنا</span>
                <span className="text-xs font-black text-rose-300 font-mono">{remainingDebt.toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>

          {/* Amount to Pay Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                المبلغ المراد سداده وصرفه للمورد
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(remainingDebt)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition cursor-pointer"
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
                className="w-full px-4 py-2.5 text-base font-black text-cyan-300 rounded-xl bg-slate-950 border border-cyan-500/50 focus:border-cyan-400 outline-none"
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
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                تاريخ الصرف والسداد
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
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                رقم السند أو ملاحظة الصرف
              </label>
              <input
                type="text"
                placeholder="سند صرف #... أو إيصال تحويل"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Balance After Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">المتبقي بذمتنا للمورد بعد هذا السداد:</span>
            <span className={`text-sm font-black font-mono ${balanceAfter === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {balanceAfter === 0 ? '0 (تم سداد الفاتورة بالكامل للمورد ✓)' : `${balanceAfter.toLocaleString()} ${currency}`}
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              تأكيد صرف وسداد المبلغ للمورد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, Smartphone, User, CheckCircle } from 'lucide-react';
import { dbInstance } from '../../db/sqliteEngine';
import { MaintenanceOrder } from '../../db/types';

interface Props {
  order: MaintenanceOrder;
  onClose: () => void;
  onDelivered: () => void;
}

export const DeliveryModal: React.FC<Props> = ({ order, onClose, onDelivered }) => {
  const remaining = order.totalAmount - order.paidAmount;
  const [paidNow, setPaidNow] = useState(remaining > 0 ? remaining.toFixed(2) : '0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const totalPaid = order.paidAmount + Number(paidNow || 0);
  const stillOwed = Math.max(0, order.totalAmount - totalPaid);

  const inputCls = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm transition-all";

  const handleConfirm = async () => {
    setSaving(true);
    try {
      dbInstance.confirmDelivery(order.id, {
        paidAmount: totalPaid,
        paymentMethod,
        deliveredBy: deliveredBy || 'الموظف',
        notes: notes || undefined,
      });
      onDelivered();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-l from-emerald-900/30 to-transparent">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" /> تسليم الجهاز
            </h3>
            <p className="text-xs text-slate-400">{order.orderNumber} — {order.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="bg-slate-800/60 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">الإجمالي الكلي:</span>
              <span className="font-bold text-white">{order.totalAmount.toFixed(2)} د.ل</span>
            </div>
            {order.paidAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">مدفوع مسبقاً:</span>
                <span className="text-emerald-400 font-bold">{order.paidAmount.toFixed(2)} د.ل</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <span className="text-slate-300 font-semibold">المتبقي:</span>
              <span className={`font-bold text-lg ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {remaining.toFixed(2)} د.ل
              </span>
            </div>
          </div>

          {/* Amount to collect */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              <DollarSign className="inline w-3 h-3 mr-1"/>المبلغ المدفوع الآن (د.ل)
            </label>
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.5"
              value={paidNow}
              onChange={e => setPaidNow(e.target.value)}
            />
          </div>

          {/* After-payment balance */}
          {stillOwed > 0 && (
            <div className="p-3 bg-amber-900/20 border border-amber-700/40 rounded-xl text-xs text-amber-300 text-center">
              ⚠️ سيبقى مبلغ {stillOwed.toFixed(2)} د.ل غير مسدّد
            </div>
          )}

          {/* Payment method */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'cash',     label: 'نقداً',    icon: Banknote    },
                { id: 'transfer', label: 'تحويل',    icon: Smartphone  },
                { id: 'card',     label: 'بطاقة',    icon: CreditCard  },
              ] as { id: 'cash'|'transfer'|'card'; label: string; icon: React.FC<{className?:string}> }[]).map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === opt.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivered by */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              <User className="inline w-3 h-3 mr-1"/>اسم الموظف المسلّم
            </label>
            <input className={inputCls} placeholder="اسم الموظف" value={deliveredBy} onChange={e => setDeliveredBy(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">ملاحظات</label>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="ملاحظات اختيارية..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors">
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-bold bg-gradient-to-l from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? '⏳...' : '✅ تأكيد التسليم'}
          </button>
        </div>
      </div>
    </div>
  );
};

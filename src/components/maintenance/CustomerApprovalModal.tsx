import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Phone, MessageSquare, DollarSign, User, AlertCircle } from 'lucide-react';
import { dbInstance } from '../../db/sqliteEngine';
import { MaintenanceOrder } from '../../db/types';

interface Props {
  order: MaintenanceOrder;
  onClose: () => void;
  onUpdated: () => void;
}

export const CustomerApprovalModal: React.FC<Props> = ({ order, onClose, onUpdated }) => {
  const [estimatedCost, setEstimatedCost] = useState(
    order.estimatedCost ? String(order.estimatedCost) : (order.totalAmount > 0 ? String(order.totalAmount) : '')
  );
  const [notes, setNotes] = useState(order.approvalNotes || '');
  const [performedBy, setPerformedBy] = useState('');
  const [saving, setSaving] = useState(false);

  const cleanPhone = order.customerPhone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('218') ? cleanPhone : '218' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(
    `السلام عليكم سيد/ة ${order.customerName}، بخصوص جهازكم (${order.deviceType} ${order.brand}) للصيانة برقم ${order.orderNumber}: التكلفة التقديرية للإصلاح هي ${estimatedCost || '...'} د.ل. نرجو إفادتنا بالموافقة للبدء بالصيانة.`
  )}`;

  const handleDecision = async (approved: boolean) => {
    setSaving(true);
    try {
      const numCost = Number(estimatedCost) || undefined;
      const newStatus = approved ? 'under_repair' : 'rejected_by_customer';
      const actionText = approved ? 'موافقة الزبون على الصيانة' : 'رفض الزبون الصيانة';

      dbInstance.updateMaintenanceOrder(order.id, {
        customerApproved: approved,
        estimatedCost: numCost,
        approvalNotes: notes.trim() || undefined,
      });

      dbInstance.changeMaintenanceStatus(
        order.id,
        newStatus,
        performedBy.trim() || 'الموظف',
        `${actionText}${numCost ? ` (التكلفة المقدرة: ${numCost} د.ل)` : ''}${notes ? ` - ملاحظات: ${notes}` : ''}`
      );

      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm transition-all";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-l from-pink-900/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/20 text-pink-400 rounded-xl border border-pink-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تسجيل رد وموافقة الزبون</h3>
              <p className="text-xs text-slate-400">{order.orderNumber} — {order.customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer & Device quick card */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">الزبون:</span>
              <span className="font-bold text-white">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">الهاتف:</span>
              <span className="font-mono text-cyan-400">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">الجهاز:</span>
              <span className="font-semibold text-slate-200">{[order.deviceType, order.brand, order.model].filter(Boolean).join(' • ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">العطل المبلغ عنه:</span>
              <span className="text-amber-300 font-medium">{order.reportedFault}</span>
            </div>

            {/* Quick Contact Buttons */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> مراسلة واتساب
              </a>
              <a
                href={`tel:${order.customerPhone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg font-bold text-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> اتصال هاتفي
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                <DollarSign className="inline w-3.5 h-3.5 text-pink-400 ml-1" />
                التكلفة التقديرية المتفق عليها (د.ل):
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="مثال: 85"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                <User className="inline w-3.5 h-3.5 text-cyan-400 ml-1" />
                الموظف / الفني الذي تواصل معه:
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="اسم الموظف أو الفني"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ملاحظات الاتفاق أو أسباب الرفض:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="مثلاً: تم إبلاغ الزبون بتغيير آي سي الباور ومكثفات الفلترة ووافق مع ضمان شهر..."
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center gap-3">
          <button
            onClick={() => handleDecision(true)}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" /> ✅ وافق الزبون — بدء الصيانة
          </button>
          <button
            onClick={() => handleDecision(false)}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> ❌ رفض الزبون
          </button>
        </div>
      </div>
    </div>
  );
};

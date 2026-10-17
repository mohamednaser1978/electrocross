import React, { useState } from 'react';
import { X, Package, AlertTriangle, RotateCcw, Trash2, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { dbInstance } from '../../db/sqliteEngine';
import { MaintenanceOrder, MaintenanceWorkflowStatus, MaintenanceOrderPart, PartDisposition } from '../../db/types';
import { STATUS_CONFIG } from './MaintenanceOrderCard';

interface Props {
  order: MaintenanceOrder;
  onClose: () => void;
  onUpdated: () => void;
}

type AllowedTransition = {
  status: MaintenanceWorkflowStatus;
  label: string;
  color: string;
};

interface PartWithDisposition {
  part: MaintenanceOrderPart;
  disposition: PartDisposition;
}

const TRANSITIONS: Partial<Record<MaintenanceWorkflowStatus, AllowedTransition[]>> = {
  received:           [
    { status: 'in_safes',           label: '📦 إيداع في الأمانات',       color: 'blue'    },
    { status: 'under_inspection',   label: '🔬 بدء الفحص المباشر',      color: 'yellow'  },
  ],
  in_safes:           [
    { status: 'under_inspection',   label: '🔬 بدء الفحص والتشخيص',     color: 'yellow'  },
    { status: 'under_repair',       label: '🔧 بدء الصيانة مباشرة',     color: 'orange'  },
    { status: 'returned_no_repair', label: '🚪 إرجاع للزبون دون فحص',   color: 'emerald' },
  ],
  under_inspection:   [
    { status: 'under_repair',       label: '🔧 بدء الصيانة والإصلاح',   color: 'orange' },
    { status: 'awaiting_approval',  label: '📋 طلب موافقة الزبون',      color: 'pink'   },
    { status: 'awaiting_part',      label: '⏳ تعليق الفاتورة (بانتظار قطعة غيار)', color: 'purple' },
    { status: 'in_safes',           label: '📦 إعادة للأمانات (تأجيل)',  color: 'blue'   },
    { status: 'unrepairable',       label: '❌ تعذر الإصلاح',          color: 'red'    },
  ],
  under_repair:       [
    { status: 'ready',              label: '✅ اكتمل الإصلاح (جاهز للتسليم)', color: 'emerald' },
    { status: 'awaiting_part',      label: '⏳ تعليق الفاتورة (بانتظار قطعة غيار)', color: 'purple'  },
    { status: 'awaiting_approval',  label: '📋 طلب موافقة الزبون',            color: 'pink'    },
    { status: 'under_inspection',   label: '🔬 إعادة للفحص والتشخيص',         color: 'yellow'  },
    { status: 'in_safes',           label: '📦 إرجاع للأمانات مؤقتاً',        color: 'blue'    },
    { status: 'unrepairable',       label: '❌ تعذر الإصلاح وفشل المحاولة',   color: 'red'     },
  ],
  awaiting_approval:  [
    { status: 'under_repair',       label: '✅ وافق الزبون — استئناف الصيانة', color: 'orange'  },
    { status: 'rejected_by_customer', label: '❌ رفض الزبون الإصلاح',      color: 'red'     },
    { status: 'in_safes',           label: '📦 حفظ في الأمانات مؤقتاً',   color: 'blue'    },
  ],
  awaiting_part:      [
    { status: 'under_repair',       label: '🔧 وصلت القطعة — استئناف ومتابعة الصيانة', color: 'orange' },
    { status: 'in_safes',           label: '📦 حفظ في الأمانات بالرف',      color: 'blue'   },
    { status: 'unrepairable',       label: '❌ تعذر توفير القطعة / إلغاء الإصلاح', color: 'red' },
  ],
  ready:              [
    { status: 'delivered',          label: '🤝 تسليم الجهاز للزبون',         color: 'emerald' },
    { status: 'under_repair',       label: '🔧 إعادة للصيانة للتعديل',     color: 'orange'  },
    { status: 'in_safes',           label: '📦 حفظ في الأمانات بالرف',      color: 'blue'    },
  ],
  delivered:          [
    { status: 'ready',              label: '↩️ تراجع: إعادة إلى جاهز للتسليم', color: 'yellow' },
    { status: 'under_repair',       label: '🔧 ضمان أو إعادة للصيانة',      color: 'orange' },
  ],
  unrepairable:       [
    { status: 'in_safes',           label: '📦 في الأمانات بانتظار استلامه', color: 'blue' },
    { status: 'returned_no_repair', label: '🚪 إرجاع للزبون بدون إصلاح',     color: 'emerald'},
  ],
  rejected_by_customer: [
    { status: 'in_safes',           label: '📦 في الأمانات بانتظار استلامه', color: 'blue' },
    { status: 'returned_no_repair', label: '🚪 إرجاع للزبون مرفوض',          color: 'emerald'},
  ],
};

const colorMap: Record<string, string> = {
  blue:    'bg-blue-900/30 border-blue-700/50 text-blue-300 hover:bg-blue-800/40',
  yellow:  'bg-yellow-900/30 border-yellow-700/50 text-yellow-300 hover:bg-yellow-800/40',
  orange:  'bg-orange-900/30 border-orange-700/50 text-orange-300 hover:bg-orange-800/40',
  emerald: 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300 hover:bg-emerald-800/40',
  purple:  'bg-purple-900/30 border-purple-700/50 text-purple-300 hover:bg-purple-800/40',
  pink:    'bg-pink-900/30 border-pink-700/50 text-pink-300 hover:bg-pink-800/40',
  red:     'bg-red-900/30 border-red-700/50 text-red-300 hover:bg-red-800/40',
};

const DISPOSITION_OPTIONS: { id: PartDisposition; label: string; desc: string; icon: React.FC<{className?: string}>; color: string }[] = [
  {
    id: 'return_to_stock',
    label: 'إرجاع إلى المستودع',
    desc: 'سليمة وتُعاد للمخزن ولا تُحتسب على الزبون',
    icon: RotateCcw,
    color: 'border-blue-600/60 bg-blue-900/30 text-blue-300',
  },
  {
    id: 'damaged',
    label: 'تلفت أثناء الاختبار',
    desc: 'تلفت أثناء الفحص ولا يُحمّل العميل قيمتها',
    icon: Trash2,
    color: 'border-red-600/60 bg-red-900/30 text-red-300',
  },
  {
    id: 'bill_customer',
    label: 'تُحتسب على الزبون',
    desc: 'تبقى مركبة أو تُضاف لفاتورته حسب الاتفاق',
    icon: DollarSign,
    color: 'border-amber-600/60 bg-amber-900/30 text-amber-300',
  },
];

export const ChangeStatusModal: React.FC<Props> = ({ order, onClose, onUpdated }) => {
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceWorkflowStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [requestedParts, setRequestedParts] = useState(order.requestedParts || '');
  const [suspensionReason, setSuspensionReason] = useState(order.suspensionReason || 'انتظار وصول قطعة الغيار غير المتوفرة');
  const [saving, setSaving] = useState(false);

  // Parts disposition step (for unrepairable / returned_no_repair / failed repairs)
  const [step, setStep] = useState<'status' | 'parts_disposition'>('status');
  const [partsDisposition, setPartsDisposition] = useState<PartWithDisposition[]>([]);

  const available = TRANSITIONS[order.status] || [];
  const spareParts = order.parts.filter(p => p.type === 'spare');
  const isFailureStatus = selectedStatus === 'unrepairable' || selectedStatus === 'returned_no_repair';
  const showPartsStep = isFailureStatus && spareParts.length > 0;

  const handleSelectStatus = (status: MaintenanceWorkflowStatus) => {
    setSelectedStatus(status);
    if ((status === 'unrepairable' || status === 'returned_no_repair') && spareParts.length > 0) {
      // Init parts disposition from current state or default to return_to_stock
      setPartsDisposition(spareParts.map(p => ({
        part: p,
        disposition: p.disposition || 'return_to_stock'
      })));
    }
  };

  const handleNext = () => {
    if (showPartsStep && step === 'status') {
      setStep('parts_disposition');
    } else {
      handleConfirm();
    }
  };

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    setSaving(true);
    try {
      // 1. Process parts disposition if applicable
      if (isFailureStatus && partsDisposition.length > 0) {
        for (const pd of partsDisposition) {
          const isBilled = pd.disposition === 'bill_customer';
          dbInstance.updatePartDisposition(
            order.id,
            pd.part.id,
            pd.disposition,
            isBilled,
            pd.disposition === 'return_to_stock' ? 'إرجاع إلى المستودع لعدم حل المشكلة' :
            pd.disposition === 'damaged' ? 'تلف أثناء الاختبار (معفاة للعميل)' : 'محتسبة على العميل'
          );
        }
      }

      // 2. Handle Suspended Invoice ("قيد الانتظار")
      if (selectedStatus === 'awaiting_part') {
        dbInstance.suspendMaintenanceOrder(
          order.id,
          suspensionReason.trim() || 'انتظار وصول قطعة الغيار',
          requestedParts.trim() || undefined,
          performedBy || 'الفني'
        );
      } else if (order.isSuspended && (selectedStatus === 'under_repair' || selectedStatus === 'ready' || selectedStatus === 'delivered')) {
        // Resume if moving to repair or completion
        dbInstance.resumeMaintenanceOrder(
          order.id,
          performedBy || 'الفني',
          notes ? `استئناف العمل: ${notes}` : undefined
        );
      }

      // 3. Update Status
      const notePrefix = isFailureStatus && partsDisposition.length > 0
        ? `مصير القطع: ${partsDisposition.map(pd => {
            const d = DISPOSITION_OPTIONS.find(o => o.id === pd.disposition);
            return `${pd.part.description || pd.part.partNumber} → ${d?.label}`;
          }).join(', ')}${notes ? '. ' + notes : ''}`
        : notes || undefined;

      dbInstance.changeMaintenanceStatus(order.id, selectedStatus, performedBy || 'الموظف', notePrefix || undefined);
      
      onUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm transition-all";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {step === 'parts_disposition' ? (
                <>
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <span>فصل المخزون: مصير قطع الغيار المستعملة</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>تغيير حالة الصيانة ومسار العمل</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{order.orderNumber} — {order.customerName} ({order.deviceType} {order.brand})</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {step === 'status' && (
            <>
              {/* Current status */}
              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-700/50">
                <span className="text-xs text-slate-400">الحالة الحالية:</span>
                <span className={`text-xs font-bold ${STATUS_CONFIG[order.status]?.color || 'text-white'}`}>
                  {STATUS_CONFIG[order.status]?.label || order.status}
                </span>
              </div>

              {order.isSuspended && (
                <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-300">
                    <Clock className="w-4 h-4" />
                    <span>هذه الفاتورة معلقة حالياً (قيد الانتظار)</span>
                  </div>
                  {order.suspensionReason && <p className="text-slate-300">السبب: {order.suspensionReason}</p>}
                  {order.requestedParts && <p className="text-cyan-300 font-mono">القطع المطلوبة: {order.requestedParts}</p>}
                </div>
              )}

              {/* Transitions */}
              {available.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  لا توجد تحولات مباشرة متاحة لهذه الحالة
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">اختر الحالة التالية للجهاز:</label>
                  {available.map(t => (
                    <button
                      key={t.status}
                      type="button"
                      onClick={() => handleSelectStatus(t.status)}
                      className={`w-full text-right p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        selectedStatus === t.status
                          ? colorMap[t.color] + ' ring-2 ring-offset-1 ring-offset-slate-900 ring-current'
                          : colorMap[t.color] + ' opacity-70'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Special options for Awaiting Part (Suspension) */}
              {selectedStatus === 'awaiting_part' && (
                <div className="p-4 bg-purple-950/40 border border-purple-800/50 rounded-xl space-y-3 animate-fade-in text-xs">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>بيانات تعليق الفاتورة (قيد الانتظار):</span>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">القطع المطلوبة وغير المتوفرة (التي يُنتظر وصولها):</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={requestedParts}
                      onChange={e => setRequestedParts(e.target.value)}
                      placeholder="مثال: IC Power TPS51125 أو شاشة 32 بوصة أصلية..."
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">سبب التعليق:</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={suspensionReason}
                      onChange={e => setSuspensionReason(e.target.value)}
                      placeholder="مثال: انتظار شحن وتوريد القطعة من المورد..."
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ستظهر هذه الفاتورة في قائمة الفواتير المعلقة، مع بقاء كافة البيانات محفوظة وقابلة للتعديل والاستكمال لاحقاً.
                  </p>
                </div>
              )}

              {selectedStatus && (
                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">اسم المنفذ</label>
                    <input className={inputCls} placeholder="اسم الموظف أو الفني المسؤول" value={performedBy} onChange={e => setPerformedBy(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">ملاحظات التحويل (اختياري)</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} placeholder="ملاحظات توثيقية إضافية..." value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  {showPartsStep && (
                    <div className="p-3 bg-amber-900/20 border border-amber-700/40 rounded-xl flex items-start gap-2 text-xs text-amber-300 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        تم صرف <strong>{spareParts.length}</strong> قطعة غيار لهذا الجهاز. في الخطوة التالية ستحدد مصير كل قطعة: (إرجاع للمستودع / تالفة أثناء الفحص / احتسابها على الزبون).
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 'parts_disposition' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl text-xs space-y-1">
                <p className="font-bold text-white">⚙️ فصل حركة المخزون عن قيمة الفاتورة:</p>
                <p className="text-slate-400">
                  حدد مصير كل قطعة مصروفة. القطع المرجعة ستعود للمخزون فوراً ولن تُحمّل على العميل:
                </p>
              </div>

              {partsDisposition.map((pd, idx) => (
                <div key={pd.part.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white font-mono">{pd.part.partNumber || pd.part.description}</span>
                        {pd.part.partNumber && pd.part.description && (
                          <span className="block text-[10px] text-slate-400">{pd.part.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-left font-mono">
                      <div className="text-white font-bold">{pd.part.totalSalePrice.toFixed(2)} د.ل</div>
                      <div className="text-[10px] text-slate-500">الكمية: {pd.part.quantity}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {DISPOSITION_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      const isSelected = pd.disposition === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const updated = [...partsDisposition];
                            updated[idx] = { ...pd, disposition: opt.id };
                            setPartsDisposition(updated);
                          }}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? opt.color + ' ring-2 ring-offset-1 ring-offset-slate-900 ring-current'
                              : 'border-slate-700 text-slate-400 hover:border-slate-600 bg-slate-900/60'
                          }`}
                          title={opt.desc}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="leading-tight">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-[11px] text-slate-400 space-y-1">
                <p>• <strong className="text-blue-300">إرجاع للمستودع:</strong> تُعاد للمخزون فوراً وتُحذف من مستحقات الفاتورة.</p>
                <p>• <strong className="text-red-300">تلفت أثناء الاختبار:</strong> تُسجل كتالف، وتتحملها الورشة ولا يدفعها العميل.</p>
                <p>• <strong className="text-amber-300">تُحتسب على الزبون:</strong> تُضاف لفاتورته حسب الاتفاق.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-800 shrink-0">
          {step === 'parts_disposition' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('status')}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                ← رجوع لتعديل الحالة
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-bold bg-gradient-to-l from-red-600 to-amber-600 text-white rounded-xl hover:from-red-500 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg"
              >
                {saving ? '⏳ جاري الحفظ...' : 'تأكيد وحفظ مصير القطع ✅'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedStatus || saving}
                className="flex-1 py-2.5 text-sm font-bold bg-gradient-to-l from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg"
              >
                {saving ? '⏳ جاري الحفظ...' : showPartsStep ? 'التالي: مصير القطع المصروفة →' : '✅ تأكيد تغيير الحالة'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

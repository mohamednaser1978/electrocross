import React, { useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Wrench, User, Phone, MapPin, MessageSquare,
  Smartphone, Tag, Hash, Palette, FileText, CheckSquare, Square, Package,
  AlertTriangle
} from 'lucide-react';
import { dbInstance } from '../../db/sqliteEngine';
import {
  MaintenanceOrder, ContactPreference, DeviceConditionFlag
} from '../../db/types';

interface Props {
  onClose: () => void;
  onSaved: (order: MaintenanceOrder) => void;
}

const DEVICE_TYPES = [
  'شاشة', 'تلفزيون', 'ثلاجة', 'غسالة', 'مكيف', 'ميكروويف', 'خلاط',
  'بلايستيشن', 'لاب توب', 'كمبيوتر', 'UPS', 'إنفرتر', 'شاحن', 'محرك', 'أخرى'
];

const CONDITION_FLAGS: { key: DeviceConditionFlag; label: string; icon: string }[] = [
  { key: 'scratches',      label: 'خدوش ظاهرة',          icon: '🔅' },
  { key: 'missing_parts',  label: 'قطع ناقصة / مفقودة',  icon: '🔩' },
  { key: 'damaged_cover',  label: 'غلاف تالف / مكسور',   icon: '📦' },
  { key: 'broken_screen',  label: 'شاشة مكسورة',          icon: '💔' },
  { key: 'partial_power',  label: 'يشتغل جزئياً',         icon: '⚡' },
  { key: 'no_power',       label: 'لا يشتغل إطلاقاً',     icon: '🔴' },
];

export const NewMaintenanceOrderModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPhone2, setCustomerPhone2] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [contactPref, setContactPref] = useState<ContactPreference>('whatsapp');

  // Step 2: Device
  const [deviceType, setDeviceType] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [color, setColor] = useState('');
  const [deviceDesc, setDeviceDesc] = useState('');
  const [reportedFault, setReportedFault] = useState('');
  const [conditionFlags, setConditionFlags] = useState<DeviceConditionFlag[]>([]);
  const [conditionNotes, setConditionNotes] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [initialWorkflowStatus, setInitialWorkflowStatus] = useState<'in_safes' | 'under_inspection'>('in_safes');

  const toggleFlag = (flag: DeviceConditionFlag) => {
    setConditionFlags(prev =>
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    );
  };

  const canGoNext = customerName.trim() && customerPhone.trim();
  const canSave = deviceType.trim() && reportedFault.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const newOrder = dbInstance.addMaintenanceOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerPhone2: customerPhone2.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        contactPreference: contactPref,
        deviceType: deviceType.trim(),
        brand: brand.trim(),
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        color: color.trim() || undefined,
        deviceDescription: deviceDesc.trim() || undefined,
        reportedFault: reportedFault.trim(),
        conditionFlags,
        conditionNotes: conditionNotes.trim() || undefined,
        shelfLocation: shelfLocation.trim() || undefined,
        parts: [],
        laborFee: 0,
        partsTotal: 0,
        consumablesTotal: 0,
        discount: 0,
        totalAmount: 0,
        totalCost: 0,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        status: initialWorkflowStatus,
      });
      onSaved(newOrder);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 text-sm transition-all";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 pt-3 sm:pt-6 md:pt-8 overflow-y-auto" dir="rtl">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col animate-fade-in my-auto sm:my-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-gradient-to-l from-cyan-900/30 via-slate-900 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-xl">
              <Wrench className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">استلام جهاز للصيانة</h2>
              <p className="text-xs text-slate-400">الخطوة {step} من 2</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-3 pb-1 shrink-0">
          <div className="flex gap-2 mb-1">
            {[1,2].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span className={step >= 1 ? 'text-cyan-400 font-semibold' : ''}>بيانات الزبون</span>
            <span className={step >= 2 ? 'text-cyan-400 font-semibold' : ''}>بيانات الجهاز</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelCls}><User className="inline w-3 h-3 mr-1"/>اسم الزبون *</label>
                  <input className={inputCls} placeholder="محمد علي المنتصر" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelCls}><Phone className="inline w-3 h-3 mr-1"/>رقم الهاتف *</label>
                  <input className={inputCls} placeholder="09xxxxxxxx" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} type="tel" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelCls}><Phone className="inline w-3 h-3 mr-1"/>رقم بديل</label>
                  <input className={inputCls} placeholder="09xxxxxxxx (اختياري)" value={customerPhone2} onChange={e => setCustomerPhone2(e.target.value)} type="tel" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelCls}><MapPin className="inline w-3 h-3 mr-1"/>العنوان</label>
                  <input className={inputCls} placeholder="المنطقة / الحي (اختياري)" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelCls}><MessageSquare className="inline w-3 h-3 mr-1"/>طريقة التواصل المفضلة</label>
                <div className="flex gap-2">
                  {([
                    { id: 'whatsapp', label: '💬 واتساب', color: 'green' },
                    { id: 'call',     label: '📞 اتصال',  color: 'blue' },
                    { id: 'sms',      label: '✉️ SMS',     color: 'purple' },
                  ] as { id: ContactPreference; label: string; color: string }[]).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setContactPref(opt.id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        contactPref === opt.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelCls}><Smartphone className="inline w-3 h-3 mr-1"/>نوع الجهاز *</label>
                  <select className={inputCls} value={deviceType} onChange={e => setDeviceType(e.target.value)}>
                    <option value="">اختر نوع الجهاز...</option>
                    {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelCls}><Tag className="inline w-3 h-3 mr-1"/>الشركة المصنعة</label>
                  <input className={inputCls} placeholder="Samsung, LG, Bosch..." value={brand} onChange={e => setBrand(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}><Hash className="inline w-3 h-3 mr-1"/>الموديل</label>
                  <input className={inputCls} placeholder="رقم الموديل" value={model} onChange={e => setModel(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}><Hash className="inline w-3 h-3 mr-1"/>الرقم التسلسلي</label>
                  <input className={inputCls} placeholder="Serial No. (اختياري)" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}><Palette className="inline w-3 h-3 mr-1"/>اللون</label>
                  <input className={inputCls} placeholder="أبيض، أسود، رمادي..." value={color} onChange={e => setColor(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}><Package className="inline w-3 h-3 mr-1"/>مكان التخزين (الرف)</label>
                  <input className={inputCls} placeholder="A-07, B-12..." value={shelfLocation} onChange={e => setShelfLocation(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}><FileText className="inline w-3 h-3 mr-1"/>وصف الجهاز</label>
                  <input className={inputCls} placeholder="وصف مختصر للجهاز (اختياري)" value={deviceDesc} onChange={e => setDeviceDesc(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}><AlertTriangle className="inline w-3 h-3 mr-1"/>العطل الذي ذكره الزبون *</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={2}
                    placeholder="وصف العطل كما أفاد به الزبون..."
                    value={reportedFault}
                    onChange={e => setReportedFault(e.target.value)}
                  />
                </div>
              </div>

              {/* Condition Flags */}
              <div>
                <label className={labelCls}>حالة الجهاز عند الاستلام:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CONDITION_FLAGS.map(flag => {
                    const isChecked = conditionFlags.includes(flag.key);
                    return (
                      <button
                        key={flag.key}
                        onClick={() => toggleFlag(flag.key)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-right text-xs font-medium transition-all ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="w-4 h-4 shrink-0 text-amber-400" /> : <Square className="w-4 h-4 shrink-0 text-slate-600" />}
                        <span>{flag.icon} {flag.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls}>ملاحظات إضافية على الحالة</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="أي ملاحظات إضافية على حالة الجهاز..."
                  value={conditionNotes}
                  onChange={e => setConditionNotes(e.target.value)}
                />
              </div>

              {/* Initial Stage Selector */}
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
                <label className="block text-xs font-bold text-white mb-1">
                  المرحلة الأولى للجهاز بعد الاستلام مباشرة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInitialWorkflowStatus('in_safes')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                      initialWorkflowStatus === 'in_safes'
                        ? 'bg-blue-600/25 border-blue-500 text-white shadow-md ring-1 ring-blue-500/50'
                        : 'bg-slate-900/60 border-slate-700/70 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${initialWorkflowStatus === 'in_safes' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">إيداع في الأمانات (افتراضي)</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">تخزين بالرف بانتظار الفحص</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInitialWorkflowStatus('under_inspection')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                      initialWorkflowStatus === 'under_inspection'
                        ? 'bg-yellow-600/25 border-yellow-500 text-white shadow-md ring-1 ring-yellow-500/50'
                        : 'bg-slate-900/60 border-slate-700/70 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${initialWorkflowStatus === 'under_inspection' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">بدء الفحص المباشر</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">إرسال لطاولة الفني فوراً</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:py-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
          {step === 1 ? (
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">إلغاء</button>
          ) : (
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" /> رجوع
            </button>
          )}

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!canGoNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-l from-cyan-600 to-blue-600 text-white text-sm font-bold rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-950 cursor-pointer"
            >
              التالي: بيانات الجهاز <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-950 cursor-pointer"
            >
              {saving ? '⏳ جاري الحفظ...' : '✅ حفظ واستلام الجهاز'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

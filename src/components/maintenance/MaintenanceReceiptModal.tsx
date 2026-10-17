import React from 'react';
import { 
  X, Printer, Zap, Phone, MapPin, 
  Wrench, CheckCircle2, ShieldCheck, User, Calendar, QrCode, Tag, AlertTriangle
} from 'lucide-react';
import { MaintenanceOrder, WorkshopSettings } from '../../db/types';

interface Props {
  order: MaintenanceOrder;
  settings: WorkshopSettings;
  isOpen: boolean;
  onClose: () => void;
}

const CONDITION_LABELS: Record<string, string> = {
  scratches: 'خدوش ظاهرة',
  missing_parts: 'قطع ناقصة / مفقودة',
  damaged_cover: 'غلاف تالف / مكسور',
  broken_screen: 'شاشة مكسورة',
  partial_power: 'يشتغل جزئياً',
  no_power: 'لا يشتغل إطلاقاً',
};

export const MaintenanceReceiptModal: React.FC<Props> = ({
  order,
  settings,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  React.useEffect(() => {
    const handleBeforePrint = () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#ffffff';
    };

    const handleAfterPrint = () => {
      const savedTheme = localStorage.getItem('electrocross_theme') || 'dark';
      if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
      document.documentElement.style.colorScheme = '';
      document.body.style.backgroundColor = '';
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      const savedTheme = localStorage.getItem('electrocross_theme') || 'dark';
      if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
      document.documentElement.style.colorScheme = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const handlePrint = () => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
    document.body.style.backgroundColor = '#ffffff';

    setTimeout(() => {
      window.print();
    }, 50);
  };

  const intakeDate = new Date(order.createdAt).toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-sm animate-fade-in print:bg-white print:p-0 print:m-0 print:static print:block" dir="rtl">
      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:bg-white print:border-none print:shadow-none print:max-w-none print:w-full print:m-0 print:p-0 print:max-h-none print:overflow-visible">
        {/* Action Header (hidden on print) */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">معاينة وصل استلام الجهاز</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
              {order.orderNumber}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              جاهز للطباعة A4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة الوصل (A4)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT SHEET */}
        <div className="p-4 sm:p-7 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0 print:m-0">
          <div className="mx-auto max-w-2xl bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm text-slate-900 print:max-w-none print:w-full print:m-0 print:shadow-none">
            
            {/* Header with Workshop Details */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-slate-900 text-cyan-400 flex items-center justify-center shadow-sm shrink-0">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 font-sans">
                    {settings.shopName || 'ElectroCross'}
                  </h1>
                  <p className="text-xs font-bold text-cyan-800 mt-0.5">
                    {settings.slogan || 'صيانة المكونات الإلكترونية والأنظمة الذكية'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-medium mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-800" />
                      {settings.phone || '+218 91 123 4567'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-800" />
                      {settings.address || 'طرابلس — ليبيا'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="text-left shrink-0">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg uppercase tracking-wider">
                  وصل استلام أمانة / صيانة
                </span>
                <p className="text-lg font-mono font-black text-slate-900 mt-1">
                  {order.orderNumber}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {intakeDate}
                </p>
              </div>
            </div>

            {/* Shelf & Quick Status Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">موقع الرف / الأمانات:</span>
                <span className="font-black text-sm text-cyan-800 font-mono">
                  {order.shelfLocation || 'غير محدد'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">طريقة التواصل المفضلة:</span>
                <span className="font-bold text-slate-900">
                  {order.contactPreference === 'whatsapp' ? '📱 واتساب' : order.contactPreference === 'call' ? '📞 اتصال هاتفي' : '💬 رسالة نصية'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block">حالة الطلب:</span>
                <span className="font-bold text-slate-900">تم الاستلام (في الانتظار)</span>
              </div>
            </div>

            {/* Customer & Device Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Customer Box */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1 mb-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-800" />
                  بيانات صاحب الجهاز
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الاسم:</span>
                  <span className="font-bold text-slate-900">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-slate-900" dir="ltr">{order.customerPhone}</span>
                </div>
                {order.customerPhone2 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">هاتف بديل:</span>
                    <span className="font-mono font-bold text-slate-900" dir="ltr">{order.customerPhone2}</span>
                  </div>
                )}
                {order.customerAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">العنوان:</span>
                    <span className="font-medium text-slate-800">{order.customerAddress}</span>
                  </div>
                )}
              </div>

              {/* Device Box */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1 mb-1.5">
                  <Wrench className="w-3.5 h-3.5 text-cyan-800" />
                  مواصفات الجهاز
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">النوع والمصنع:</span>
                  <span className="font-bold text-slate-900">{order.deviceType} — {order.brand}</span>
                </div>
                {order.model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الموديل:</span>
                    <span className="font-mono font-bold text-slate-900">{order.model}</span>
                  </div>
                )}
                {order.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الرقم التسلسلي (S/N):</span>
                    <span className="font-mono font-medium text-slate-800">{order.serialNumber}</span>
                  </div>
                )}
                {order.color && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">اللون:</span>
                    <span className="font-medium text-slate-800">{order.color}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fault & Condition Box */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-300 rounded-xl text-xs space-y-2 mb-4">
              <div>
                <span className="font-black text-amber-950 block mb-0.5">⚠️ العطل المذكور من الزبون:</span>
                <p className="text-slate-900 font-medium bg-white p-2 rounded-lg border border-amber-200">
                  {order.reportedFault}
                </p>
              </div>

              {order.conditionFlags && order.conditionFlags.length > 0 && (
                <div>
                  <span className="text-slate-600 block mb-1 font-bold">حالة الجهاز عند الاستلام:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {order.conditionFlags.map(flag => (
                      <span key={flag} className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-800">
                        • {CONDITION_LABELS[flag] || flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {order.conditionNotes && (
                <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-amber-100">
                  <span className="font-bold">ملاحظات الفحص الظاهري:</span> {order.conditionNotes}
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 space-y-1 mb-6 leading-relaxed">
              <span className="font-black text-slate-900 block mb-0.5">📜 شروط وأحكام الاستلام:</span>
              <p>1. يعتبر هذا الوصل وثيقة استلام أمانة للجهاز لغرض الفحص والمعاينة الأولية، ولا يعتبر موافقة نهائية على الإصلاح.</p>
              <p>2. يتم إبلاغ الزبون بالتكلفة التقديرية وسبب العطل قبل البدء الفعلي بأعمال الصيانة للحصول على موافقته.</p>
              <p>3. المركز غير مسؤول عن الأجهزة التي لا يراجع أصحابها لاستلامها بعد مرور 45 يوماً من تاريخ الإشعار بالجاهزية.</p>
              <p>4. يلزم إبراز أصل هذا الوصل أو صورة واضحة عنه عند الحضور لاستلام الجهاز وسداد المستحقات.</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900 text-xs text-center font-bold text-slate-900">
              <div>
                <p className="mb-8">توقيع الموظف المستلم</p>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <p className="text-[10px] text-slate-500 font-normal mt-1">
                  {order.technicianName || 'الاستقبال'}
                </p>
              </div>
              <div>
                <p className="mb-8">توقيع العميل / صاحب الجهاز</p>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <p className="text-[10px] text-slate-500 font-normal mt-1">
                  {order.customerName}
                </p>
              </div>
            </div>

            {/* Footer Barcode simulator */}
            <div className="text-center pt-6 mt-4 border-t border-slate-200">
              <span className="font-mono text-xs tracking-widest text-slate-700 font-bold block">
                * {order.orderNumber} *
              </span>
              <p className="text-[9px] text-slate-400 mt-0.5">
                نظام ElectroCross المتكامل لإدارة الورش والصيانة الإلكترونية
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

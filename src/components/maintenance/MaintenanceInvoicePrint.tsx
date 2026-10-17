import React from 'react';
import { 
  X, Printer, Zap, Phone, MapPin, 
  Wrench, CheckCircle2, ShieldCheck, User, Calendar, CreditCard, Banknote
} from 'lucide-react';
import { MaintenanceOrder, WorkshopSettings } from '../../db/types';

interface Props {
  order: MaintenanceOrder;
  settings: WorkshopSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const MaintenanceInvoicePrint: React.FC<Props> = ({
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

  const deliveryDate = order.deliveryTimestamp 
    ? new Date(order.deliveryTimestamp).toLocaleDateString('ar-LY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('ar-LY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const remaining = Math.max(0, order.totalAmount - order.paidAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-sm animate-fade-in print:bg-white print:p-0 print:m-0 print:static print:block" dir="rtl">
      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:bg-white print:border-none print:shadow-none print:max-w-none print:w-full print:m-0 print:p-0 print:max-h-none print:overflow-visible">
        {/* Action Header (hidden on print) */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">معاينة فاتورة صيانة وتسليم</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
              {order.orderNumber}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ورقة A4 قياسية
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              طباعة الفاتورة (A4)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE SHEET */}
        <div className="p-4 sm:p-7 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0 print:m-0">
          <div className="mx-auto max-w-2xl bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm text-slate-900 print:max-w-none print:w-full print:m-0 print:shadow-none">
            
            {/* Header */}
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
                    {settings.subTitle || settings.slogan || 'صيانة المكونات الإلكترونية والأنظمة الذكية'}
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
                <span className="inline-block px-3 py-1 bg-emerald-800 text-white text-xs font-black rounded-lg uppercase tracking-wider">
                  فاتورة صيانة وتسليم
                </span>
                <p className="text-lg font-mono font-black text-slate-900 mt-1">
                  {order.orderNumber}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {deliveryDate}
                </p>
              </div>
            </div>

            {/* Customer & Device Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Customer Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1 mb-1">
                  <User className="w-3.5 h-3.5 text-cyan-800" />
                  بيانات العميل
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الاسم:</span>
                  <span className="font-bold text-slate-900">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-slate-900" dir="ltr">{order.customerPhone}</span>
                </div>
                {order.customerAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">العنوان:</span>
                    <span className="text-slate-800">{order.customerAddress}</span>
                  </div>
                )}
              </div>

              {/* Device Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-black text-slate-900 border-b border-slate-200 pb-1 mb-1">
                  <Wrench className="w-3.5 h-3.5 text-cyan-800" />
                  بيانات الجهاز والفني
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الجهاز:</span>
                  <span className="font-bold text-slate-900">{order.deviceType} — {order.brand} {order.model || ''}</span>
                </div>
                {order.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الرقم التسلسلي:</span>
                    <span className="font-mono text-slate-800">{order.serialNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">الفني المنفذ:</span>
                  <span className="font-semibold text-slate-900">{order.technicianName || 'الورشة المركزية'}</span>
                </div>
              </div>
            </div>

            {/* Diagnosed Fault & Work Done */}
            {(order.diagnosedFault || order.repairCause) && (
              <div className="p-3 bg-cyan-50/50 border border-cyan-200 rounded-xl text-xs space-y-1 mb-4">
                <span className="font-bold text-cyan-950 block">🛠️ التشخيص الفعلي وأعمال الإصلاح:</span>
                <p className="text-slate-800">
                  {[order.diagnosedFault, order.repairCause].filter(Boolean).join(' — ')}
                </p>
              </div>
            )}

            {/* Parts & Materials Table */}
            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
                <span>🔩</span> قطع الغيار والمواد المستبدلة:
              </h4>
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">البيان / القطعة</th>
                      <th className="p-2.5 text-center">النوع</th>
                      <th className="p-2.5 text-center">الكمية</th>
                      <th className="p-2.5 text-left">سعر الوحدة</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {order.parts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-slate-400">
                          صيانة ومعايرة بدون استبدال قطع غيار
                        </td>
                      </tr>
                    ) : (
                      order.parts.map((p, idx) => {
                        const isExempt = p.isBilledToCustomer === false || p.disposition === 'return_to_stock' || p.disposition === 'damaged' || p.disposition === 'not_billed';
                        return (
                          <tr key={p.id} className={isExempt ? 'bg-slate-50/70 text-slate-500' : ''}>
                            <td className="p-2.5 text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-bold font-mono">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span>{p.partNumber || p.description}</span>
                                {p.disposition === 'return_to_stock' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-sans">
                                    مرتجع للمستودع (معفى)
                                  </span>
                                )}
                                {p.disposition === 'damaged' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold font-sans">
                                    تالف أثناء الفحص (معفى)
                                  </span>
                                )}
                                {isExempt && p.disposition !== 'return_to_stock' && p.disposition !== 'damaged' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold font-sans">
                                    معفى من الفاتورة
                                  </span>
                                )}
                              </div>
                              {p.partNumber && p.description && (
                                <span className="block text-[10px] font-sans font-normal text-slate-500 mt-0.5">{p.description}</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {p.type === 'spare' ? 'قطعة غيار' : 'مادة استهلاكية'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-bold">{p.quantity}</td>
                            <td className="p-2.5 text-left font-mono">
                              {isExempt ? (
                                <span className="line-through text-slate-400">{p.unitSalePrice.toFixed(2)} د.ل</span>
                              ) : (
                                `${p.unitSalePrice.toFixed(2)} د.ل`
                              )}
                            </td>
                            <td className="p-2.5 text-left font-mono font-bold">
                              {isExempt ? (
                                <span className="text-emerald-700 font-bold">0.00 د.ل (معفى)</span>
                              ) : (
                                `${p.totalSalePrice.toFixed(2)} د.ل`
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Calculation */}
            <div className="flex justify-end mb-4">
              <div className="w-full sm:w-72 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي قطع الغيار:</span>
                  <span className="font-mono">{order.partsTotal.toFixed(2)} د.ل</span>
                </div>
                {order.consumablesTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>إجمالي المواد الاستهلاكية:</span>
                    <span className="font-mono">{order.consumablesTotal.toFixed(2)} د.ل</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>أجرة الصيانة والفحص:</span>
                  <span className="font-mono">{order.laborFee.toFixed(2)} د.ل</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono">-{order.discount.toFixed(2)} د.ل</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-950 pt-1.5 border-t-2 border-slate-400">
                  <span>المبلغ الإجمالي الكلي:</span>
                  <span className="font-mono">{order.totalAmount.toFixed(2)} د.ل</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>المبلغ المدفوع:</span>
                  <span className="font-mono">{order.paidAmount.toFixed(2)} د.ل</span>
                </div>
                {remaining > 0 ? (
                  <div className="flex justify-between text-red-700 font-bold">
                    <span>المتبقي ذمة على العميل:</span>
                    <span className="font-mono">{remaining.toFixed(2)} د.ل</span>
                  </div>
                ) : (
                  <div className="text-center py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-[11px]">
                    ✓ مدفوعة بالكامل
                  </div>
                )}
              </div>
            </div>

            {/* Warranty & Delivery Footer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 space-y-1 mb-6">
              <span className="font-black text-slate-900 block mb-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-800" />
                شروط الضمان والتسليم:
              </span>
              <p>• يسري ضمان الصيانة لمدة 30 يوماً من تاريخ التسليم على العطل والقطع التي تم استبدالها فقط.</p>
              <p>• لا يشمل الضمان الأعطال الناتجة عن سوء الاستخدام أو الصدمات الكهربائية الناتجة عن تذبذب التيار.</p>
              <p>• موظف التسليم: {order.deliveredBy || 'المسؤول'}</p>
            </div>

            {/* Dual Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-900 text-xs text-center font-bold text-slate-900">
              <div>
                <p className="mb-8">توقيع مسؤول الصيانة</p>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <p className="text-[10px] text-slate-500 font-normal mt-1">
                  {order.deliveredBy || settings.shopName}
                </p>
              </div>
              <div>
                <p className="mb-8">استلمت الجهاز بحالة جيدة</p>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <p className="text-[10px] text-slate-500 font-normal mt-1">
                  {order.customerName}
                </p>
              </div>
            </div>

            {/* Bottom Note */}
            <div className="text-center pt-6 mt-4 border-t border-slate-200">
              <p className="text-[10px] text-slate-500">
                شكراً لثقتكم بخدماتنا — نسعد دائماً بخدمتكم
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

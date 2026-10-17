import React from 'react';
import { 
  X, Printer, Zap, CheckCircle2, Phone, MapPin, 
  Wrench, ShoppingBag, ShieldCheck, User, Calendar
} from 'lucide-react';
import { Sale, WorkshopSettings } from '../../db/types';

interface InvoicePrintModalProps {
  sale: Sale | null;
  settings: WorkshopSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  sale,
  settings,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !sale) return null;

  const isMaintenance = sale.saleType === 'maintenance';
  const remainingAmount = Math.max(0, sale.totalAmount - sale.paidAmount);

  // Force light background and light color-scheme on beforeprint to prevent dark margins
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
    // Proactively switch to light mode before triggering print dialog
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
    document.body.style.backgroundColor = '#ffffff';

    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div className="invoice-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-sm animate-fade-in print:bg-white print:p-0 print:m-0 print:static print:block" dir="rtl">
      {/* Container */}
      <div className="invoice-modal-card relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:bg-white print:border-none print:shadow-none print:max-w-none print:w-full print:m-0 print:p-0 print:max-h-none print:overflow-visible">
        {/* Action Header (hidden on print) */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">معاينة الفاتورة قبل الطباعة</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
              {sale.invoiceNumber}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ورقة A4 قياسية مؤطرة (صفحة واحدة متناسقة)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
              title="طباعة الفاتورة أو حفظها كملف PDF"
            >
              <Printer className="w-4 h-4" />
              طباعة الفاتورة (A4)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE SHEET (Engineered for Exact A4 1-Page Fit with Official Framed Margins) */}
        <div className="p-4 sm:p-7 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0 print:m-0" id="printable-invoice">
          {/* Official Framed Border Box */}
          <div className="invoice-paper-sheet mx-auto max-w-3xl bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-7 shadow-sm text-slate-900 print:max-w-none print:w-full print:m-0 print:shadow-none">
            {/* Header with Shop Details */}
            <div className="avoid-break border-b-2 border-slate-900 pb-4 mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-slate-900 text-cyan-400 flex items-center justify-center shadow-sm shrink-0">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {settings.shopName || 'المتحكمات الكهربائية'}
                  </h1>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    {settings.subTitle || 'لصيانة الأجهزة والمتحكمات الإلكترونية وبدائل القطع'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 mt-1.5 font-medium">
                    {settings.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-700" />
                        {settings.phone}
                      </span>
                    )}
                    {settings.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-700" />
                        {settings.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-left shrink-0 border-r-2 sm:border-r-0 sm:border-l-2 border-slate-300 pr-3 sm:pr-0 sm:pl-4">
                <div className="inline-block px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-black text-xs tracking-wide">
                  {isMaintenance ? 'سند استلام وفاتورة صيانة' : 'فاتورة مبيعات مباشرة'}
                </div>
                <div className="text-sm font-black text-slate-900 font-mono mt-1.5">
                  {sale.invoiceNumber}
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5 flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  التاريخ: {sale.date}
                </div>
              </div>
            </div>

            {/* Customer & Ticket Info Row */}
            <div className="avoid-break grid grid-cols-2 gap-3.5 mb-4 text-xs">
              {/* Customer Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                <div className="text-[10px] font-bold uppercase text-slate-500 pb-1 mb-1.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-600" /> بيانات العميل
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">عميل معتمد / نقدي</span>
                </div>
                <div className="font-black text-slate-900 text-sm">{sale.customerName}</div>
                <div className="text-slate-600 font-mono text-[11px] mt-1">
                  الهاتف: {sale.customerPhone || 'غير مسجل'}
                </div>
              </div>

              {/* Device Box for Maintenance or Direct Sale Summary */}
              {isMaintenance && sale.maintenance ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                  <div className="text-[10px] font-bold uppercase text-slate-500 pb-1 mb-1.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-slate-600" /> بيانات الجهاز والتشخيص
                    </span>
                    <span className="font-bold px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800">
                      {sale.maintenance.status === 'delivered' ? 'تم التسليم' :
                       sale.maintenance.status === 'ready' ? 'جاهز للتسليم' :
                       sale.maintenance.status === 'under_repair' || (sale.maintenance.status as string) === 'in_progress' ? 'قيد الصيانة والإصلاح' :
                       sale.maintenance.status === 'awaiting_part' ? 'بانتظار قطعة' :
                       sale.maintenance.status === 'awaiting_approval' ? 'بانتظار موافقة' :
                       sale.maintenance.status === 'under_inspection' ? 'قيد الفحص والتشخيص' : 'في الأمانات'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {sale.maintenance.brand} - {sale.maintenance.deviceType} ({sale.maintenance.modelOrBoard || 'شاسيه عام'})
                  </div>
                  <div className="text-slate-700 text-[11px] truncate mt-0.5">
                    <span className="font-bold text-slate-800">العطل:</span> {sale.maintenance.faultDescription}
                  </div>
                  <div className="text-[11px] text-slate-600 pt-1.5 mt-1 border-t border-slate-200 flex items-center justify-between">
                    <span>الفني المسؤول: <strong className="text-slate-900">{sale.maintenance.technicianName}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                  <div className="text-[10px] font-bold uppercase text-slate-500 pb-1 mb-1.5 border-b border-slate-200 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-600" /> تفاصيل العملية
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    بيع مباشر لقطع غيار إلكترونية
                  </div>
                  <div className="text-slate-600 text-[11px] mt-1">
                    طريقة الدفع: نقدي / فوري
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1.5 mt-1 border-t border-slate-200">
                    تم فحص القطع وتأكيد التوافقية قبل الاستلام
                  </div>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="avoid-break mb-4 rounded-xl border border-slate-300 overflow-hidden">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3.5 w-10 text-center">#</th>
                    <th className="py-2.5 px-3.5">البيان / الصنف أو الخدمة</th>
                    <th className="py-2.5 px-3.5 text-center w-20">الكمية</th>
                    <th className="py-2.5 px-3.5 text-left w-32">سعر الوحدة</th>
                    <th className="py-2.5 px-3.5 text-left w-32">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {sale.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3.5 font-mono text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3.5 font-medium">
                        <span className="font-mono text-slate-900 font-bold">{item.partNumber}</span>
                        <span className="text-[11px] text-slate-500 mr-2">(قطعة غيار إلكترونية)</span>
                      </td>
                      <td className="py-2 px-3.5 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2 px-3.5 text-left font-mono">{item.unitPrice.toLocaleString()} {settings.currency}</td>
                      <td className="py-2 px-3.5 text-left font-mono font-bold text-slate-900">{item.totalPrice.toLocaleString()} {settings.currency}</td>
                    </tr>
                  ))}

                  {/* Additional Maintenance Fees */}
                  {isMaintenance && sale.maintenance && (
                    <>
                      {sale.maintenance.technicianFee > 0 && (
                        <tr className="bg-amber-50/60 font-medium">
                          <td className="py-2 px-3.5 font-mono text-center text-slate-500">{sale.items.length + 1}</td>
                          <td className="py-2 px-3.5 text-slate-900">
                            أجرة الفني وتركيب القطع وفحص الدائرة
                            <span className="text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded mr-2 font-semibold">أجور صيانة</span>
                          </td>
                          <td className="py-2 px-3.5 text-center font-mono font-bold">1</td>
                          <td className="py-2 px-3.5 text-left font-mono">{sale.maintenance.technicianFee.toLocaleString()} {settings.currency}</td>
                          <td className="py-2 px-3.5 text-left font-mono font-bold text-slate-900">{sale.maintenance.technicianFee.toLocaleString()} {settings.currency}</td>
                        </tr>
                      )}
                      {sale.maintenance.extraServicesFee > 0 && (
                        <tr className="bg-cyan-50/50 font-medium">
                          <td className="py-2 px-3.5 font-mono text-center text-slate-500">{sale.items.length + (sale.maintenance.technicianFee > 0 ? 2 : 1)}</td>
                          <td className="py-2 px-3.5 text-slate-900">
                            {sale.maintenance.extraServicesDescription || 'خدمات ومواد إضافية (تنظيف، معجون حراري، فحص)'}
                            <span className="text-[10px] text-cyan-700 bg-cyan-100/70 px-1.5 py-0.5 rounded mr-2 font-semibold">خدمات فنية</span>
                          </td>
                          <td className="py-2 px-3.5 text-center font-mono font-bold">1</td>
                          <td className="py-2 px-3.5 text-left font-mono">{sale.maintenance.extraServicesFee.toLocaleString()} {settings.currency}</td>
                          <td className="py-2 px-3.5 text-left font-mono font-bold text-slate-900">{sale.maintenance.extraServicesFee.toLocaleString()} {settings.currency}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals & Warranty Summary */}
            <div className="avoid-break grid grid-cols-2 gap-3.5 mb-4 text-xs">
              {/* Warranty Terms & Policy */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    شروط الضمان وسياسة الصيانة
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-slate-600">
                    {settings.warrantyTerms || 'الضمان سارٍ لمدة 15 يوماً على نفس العطل والقطع المستبدلة فقط. يسقط الضمان في حال الفتح الخارجي أو التذبذب الكهربائي الحاد.'}
                  </p>
                </div>
                {sale.notes && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10.5px]">
                    <span className="font-bold text-slate-900">ملاحظات:</span> {sale.notes}
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 space-y-1.5 text-slate-700">
                <div className="flex justify-between py-0.5 text-xs">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-bold">{(sale.partsTotal + (sale.maintenance?.technicianFee ?? 0) + (sale.maintenance?.extraServicesFee ?? 0)).toLocaleString()} {settings.currency}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between py-0.5 text-rose-600 font-semibold text-xs">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono">-{sale.discount.toLocaleString()} {settings.currency}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-900 text-white font-black text-sm my-1.5">
                  <span>المبلغ الإجمالي المستحق:</span>
                  <span className="font-mono text-cyan-300 text-base">{sale.totalAmount.toLocaleString()} {settings.currency}</span>
                </div>
                <div className="flex justify-between py-0.5 text-xs font-semibold">
                  <span>المدفوع:</span>
                  <span className="font-mono font-bold text-emerald-700">{sale.paidAmount.toLocaleString()} {settings.currency}</span>
                </div>
                <div className="flex justify-between py-0.5 text-xs font-bold border-t border-slate-200 pt-1.5">
                  <span>المتبقي في الذمة:</span>
                  <span className={`font-mono ${remainingAmount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                    {remainingAmount.toLocaleString()} {settings.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures & Footer Note */}
            <div className="avoid-break pt-4 border-t border-slate-300 mt-2">
              <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-700 mb-4">
                <div>
                  <div className="font-bold text-slate-900 mb-8">توقيع المستلم / العميل</div>
                  <div className="w-48 mx-auto border-b-2 border-dashed border-slate-400"></div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-8">ختم وتوقيع ورشة الصيانة</div>
                  <div className="w-48 mx-auto border-b-2 border-dashed border-slate-400"></div>
                </div>
              </div>

              <div className="text-center text-[10.5px] text-slate-500 font-medium space-y-1">
                <div>{settings.invoiceFooterNote || 'شكراً لتعاملكم مع ورشتنا • نسعد بخدمتكم دوماً'}</div>
                <div className="text-[9.5px] text-slate-400">
                  القطع الإلكترونية المباعة تخضع للفحص المباشر قبل الاستلام • كفالة الصيانة 15 يوماً على نفس العطل المشخص
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Printer, FileText, Calendar, Building2, Phone, MapPin } from 'lucide-react';
import { WorkshopSettings } from '../../db/types';

interface SummaryCardItem {
  label: string;
  value: string;
  color?: string;
}

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportSubtitle?: string;
  periodLabel?: string;
  settings: WorkshopSettings;
  summaryCards?: SummaryCardItem[];
  headers: string[];
  rows: (string | number)[][] | React.ReactNode[][];
  columnAlignments?: ('right' | 'center' | 'left')[];
  footerNote?: string;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  reportSubtitle,
  periodLabel,
  settings,
  summaryCards = [],
  headers,
  rows,
  columnAlignments = [],
  footerNote,
}) => {
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

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('ar-LY', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="report-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static" dir="rtl">
      <div className="report-modal-card relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none print:rounded-none">
        
        {/* Top Controls Toolbar (Hidden on Print) */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">معاينة طباعة التقرير (A4)</h3>
              <p className="text-xs text-slate-400">
                {reportTitle} {periodLabel ? `• ${periodLabel}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير الآن</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Paper Preview Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-950/50 print:p-0 print:overflow-visible print:bg-white">
          <div 
            id="printable-report" 
            className="w-full bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:rounded-none"
          >
            {/* Header / Brand */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {settings.shopName || 'المتحكمات الكهربائية'}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  {settings.subTitle || 'لصيانة الأجهزة والمتحكمات الإلكترونية وبدائل القطع'}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-mono">
                  {settings.phone && (
                    <span className="flex items-center gap-1">
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

              <div className="text-left sm:text-left border-r-0 sm:border-r sm:pr-4 border-slate-200">
                <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-black border border-slate-300">
                  {reportTitle}
                </div>
                {periodLabel && (
                  <p className="text-xs text-slate-600 font-bold mt-1.5 flex items-center gap-1 sm:justify-end">
                    <Calendar className="w-3 h-3 text-slate-700" />
                    <span>الفترة: {periodLabel}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  تاريخ الطباعة: {currentDate} - {currentTime}
                </p>
              </div>
            </div>

            {/* Summary Cards Grid */}
            {summaryCards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 avoid-break">
                {summaryCards.map((card, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      {card.label}
                    </span>
                    <span className="text-base font-black text-slate-900 font-mono block">
                      {card.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Main Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-2.5 px-3 rounded-tr-md text-center w-10">#</th>
                    {headers.map((h, i) => (
                      <th 
                        key={i} 
                        className={`py-2.5 px-3 text-xs ${
                          columnAlignments[i] === 'center' ? 'text-center' :
                          columnAlignments[i] === 'left' ? 'text-left' : 'text-right'
                        } ${i === headers.length - 1 ? 'rounded-tl-md' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length + 1} className="py-8 text-center text-slate-400 italic">
                        لا توجد بيانات مسجلة في هذا التقرير خلال الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rIdx) => (
                      <tr 
                        key={rIdx} 
                        className={`${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100/60 transition-colors`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td 
                            key={cIdx} 
                            className={`py-2 px-3 text-xs ${
                              columnAlignments[cIdx] === 'center' ? 'text-center' :
                              columnAlignments[cIdx] === 'left' ? 'text-left' : 'text-right'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary & Signatures */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 avoid-break">
              <div>
                <p className="text-[11px] text-slate-600">
                  {footerNote || settings.invoiceFooterNote || 'تقرير إحصائي رسمي صادر من منظومة إدارة المخزون والمبيعات.'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ElectroCross Workshop Management System • الصفحة 1 من 1
                </p>
              </div>

              <div className="flex items-center gap-10 font-bold text-slate-700 text-xs pt-4 sm:pt-0">
                <div className="text-center">
                  <span className="block mb-6">توقيع المسؤول / المدير</span>
                  <span className="border-t border-slate-400 pt-1 px-8 block font-mono text-[11px]">.......................</span>
                </div>
                <div className="text-center">
                  <span className="block mb-6">ختم المنشأة والاعتماد</span>
                  <span className="border-t border-slate-400 pt-1 px-8 block font-mono text-[11px]">.......................</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

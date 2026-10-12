import React, { useState, useMemo } from 'react';
import { 
  Building2, Search, Filter, Printer, Download, DollarSign, 
  Phone, MapPin, AlertCircle, CheckCircle2, ChevronRight, FileText, ArrowUpDown
} from 'lucide-react';
import { Supplier, Purchase, WorkshopSettings } from '../../db/types';
import { isDateInRange, exportTableToCsv } from './reportUtils';
import { ReportPrintModal } from './ReportPrintModal';

interface SuppliersReportViewProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  settings: WorkshopSettings;
  startDate: string;
  endDate: string;
}

export const SuppliersReportView: React.FC<SuppliersReportViewProps> = ({
  suppliers,
  purchases,
  settings,
  startDate,
  endDate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due_only'>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Compute supplier ledger entries for the selected period
  const supplierLedger = useMemo(() => {
    return suppliers.map(sup => {
      // Find purchases for this supplier within the period
      const supPurchases = purchases.filter(p => {
        const matchesSup = (p.supplierId === sup.id) || (p.supplierName === sup.name);
        return matchesSup && isDateInRange(p.date, startDate, endDate);
      });

      let totalPurchases = 0;
      let totalPaid = 0;
      let totalDebt = 0;

      for (const p of supPurchases) {
        const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
        totalPurchases += p.totalAmount;
        totalPaid += paid;
        totalDebt += Math.max(0, p.totalAmount - paid);
      }

      return {
        supplier: sup,
        invoicesCount: supPurchases.length,
        purchases: supPurchases,
        totalPurchases,
        totalPaid,
        balance: totalDebt, // المبلغ المستحق بذمتنا للمورد
      };
    });
  }, [suppliers, purchases, startDate, endDate]);

  // Filtered ledger entries
  const filteredLedger = useMemo(() => {
    return supplierLedger.filter(entry => {
      if (balanceFilter === 'due_only' && entry.balance <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = entry.supplier.name.toLowerCase().includes(q);
        const matchesCompany = (entry.supplier.company || '').toLowerCase().includes(q);
        const matchesPhone = (entry.supplier.phone || '').includes(q);
        if (!matchesName && !matchesCompany && !matchesPhone) return false;
      }
      return true;
    }).sort((a, b) => b.balance - a.balance);
  }, [supplierLedger, balanceFilter, searchQuery]);

  // Overall totals
  const overallTotals = useMemo(() => {
    let totalPurchases = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let suppliersWithDebtCount = 0;

    for (const entry of supplierLedger) {
      totalPurchases += entry.totalPurchases;
      totalPaid += entry.totalPaid;
      totalDebt += entry.balance;
      if (entry.balance > 0) suppliersWithDebtCount++;
    }

    return {
      totalPurchases,
      totalPaid,
      totalDebt,
      suppliersWithDebtCount,
      totalSuppliersCount: suppliers.length,
    };
  }, [supplierLedger, suppliers]);

  // Currently selected supplier detail for account statement
  const selectedSupplierDetail = useMemo(() => {
    if (!selectedSupplierId) return null;
    return supplierLedger.find(e => e.supplier.id === selectedSupplierId) || null;
  }, [selectedSupplierId, supplierLedger]);

  const handleExportCsv = () => {
    const periodSlug = `${startDate}_إلى_${endDate}`;

    if (selectedSupplierDetail) {
      // Export single supplier statement
      const headers = ['رقم الفاتورة', 'التاريخ', 'إجمالي الفاتورة', 'المسدد للمورد', 'المتبقي (الرصيد)', 'حالة السداد', 'ملاحظات'];
      const rows = selectedSupplierDetail.purchases.map(p => {
        const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
        return [
          p.invoiceNumber,
          p.date,
          p.totalAmount,
          paid,
          Math.max(0, p.totalAmount - paid),
          p.paymentStatus === 'paid' ? 'مسدد' : p.paymentStatus === 'partial' ? 'سداد جزئي' : 'غير مسدد',
          p.notes || ''
        ];
      });
      exportTableToCsv(`كشف_حساب_المورد_${selectedSupplierDetail.supplier.name}_${periodSlug}`, headers, rows);
    } else {
      // Export all suppliers ledger
      const headers = ['اسم المورد', 'الشركة', 'الهاتف', 'عدد الفواتير', 'إجمالي المشتريات', 'المسدد للمورد', 'الرصيد المستحق (دين بذمتنا)', 'حالة الحساب'];
      const rows = filteredLedger.map(e => [
        e.supplier.name,
        e.supplier.company || '—',
        e.supplier.phone || '—',
        e.invoicesCount,
        e.totalPurchases,
        e.totalPaid,
        e.balance,
        e.balance === 0 ? 'خالص' : 'مستحق بذمتنا'
      ]);
      exportTableToCsv(`تقرير_أرصدة_الموردين_${periodSlug}`, headers, rows);
    }
  };

  const printConfig = useMemo(() => {
    const periodLabel = `من ${startDate} إلى ${endDate}`;

    if (selectedSupplierDetail) {
      return {
        title: `كشف حساب تفصيلي للمورد: ${selectedSupplierDetail.supplier.name}`,
        summaryCards: [
          { label: 'إجمالي المشتريات منه', value: `${selectedSupplierDetail.totalPurchases.toLocaleString()} ${settings.currency}` },
          { label: 'المسدد للمورد', value: `${selectedSupplierDetail.totalPaid.toLocaleString()} ${settings.currency}` },
          { label: 'رصيد المورد المستحق (دين)', value: `${selectedSupplierDetail.balance.toLocaleString()} ${settings.currency}` },
          { label: 'عدد الفواتير', value: `${selectedSupplierDetail.invoicesCount} فواتير` },
        ],
        headers: ['رقم الفاتورة', 'التاريخ', 'قيمة الفاتورة', 'المسدد', 'المتبقي', 'الحالة'],
        rows: selectedSupplierDetail.purchases.map(p => {
          const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
          const rem = Math.max(0, p.totalAmount - paid);
          return [
            p.invoiceNumber,
            p.date,
            `${p.totalAmount.toLocaleString()} ${settings.currency}`,
            `${paid.toLocaleString()} ${settings.currency}`,
            `${rem.toLocaleString()} ${settings.currency}`,
            rem === 0 ? 'مسدد بالكامل' : paid > 0 ? 'سداد جزئي' : 'غير مسدد',
          ];
        }),
        alignments: ['right', 'center', 'left', 'left', 'left', 'center'] as ('right' | 'center' | 'left')[],
      };
    }

    return {
      title: 'تقرير أرصدة ومستحقات الموردين الشامل',
      summaryCards: [
        { label: 'إجمالي المشتريات من الموردين', value: `${overallTotals.totalPurchases.toLocaleString()} ${settings.currency}` },
        { label: 'المسدد نقداً للموردين', value: `${overallTotals.totalPaid.toLocaleString()} ${settings.currency}` },
        { label: 'إجمالي الديون المستحقة للموردين', value: `${overallTotals.totalDebt.toLocaleString()} ${settings.currency}` },
        { label: 'موردون لهم مستحقات بذمتنا', value: `${overallTotals.suppliersWithDebtCount} موردين` },
      ],
      headers: ['اسم المورد', 'الشركة', 'الهاتف', 'الفواتير', 'إجمالي المشتريات', 'المسدد له', 'رصيد المورد (دين بذمتنا)', 'الحالة'],
      rows: filteredLedger.map(e => [
        e.supplier.name,
        e.supplier.company || '—',
        e.supplier.phone || '—',
        `${e.invoicesCount} فواتير`,
        `${e.totalPurchases.toLocaleString()} ${settings.currency}`,
        `${e.totalPaid.toLocaleString()} ${settings.currency}`,
        `${e.balance.toLocaleString()} ${settings.currency}`,
        e.balance === 0 ? 'خالص ✓' : 'مستحق بذمتنا ⚠️',
      ]),
      alignments: ['right', 'right', 'center', 'center', 'left', 'left', 'left', 'center'] as ('right' | 'center' | 'left')[],
    };
  }, [selectedSupplierDetail, filteredLedger, overallTotals, settings, startDate, endDate]);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي المشتريات للفترة</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {overallTotals.totalPurchases.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            من {overallTotals.totalSuppliersCount} موردين مسجلين
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold text-slate-400">المسدد فعلياً للموردين</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {overallTotals.totalPaid.toLocaleString()} <span className="text-xs font-normal text-emerald-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            حوالات ودفعات نقدية مسددة
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي الديون المستحقة للموردين</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {overallTotals.totalDebt.toLocaleString()} <span className="text-xs font-normal text-amber-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            ذمم آجلة بانتظار الصرف والسداد
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold text-slate-400">موردون لهم مستحقات بذمتنا</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {overallTotals.suppliersWithDebtCount} <span className="text-xs font-normal text-purple-400">موردين</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            من أصل {overallTotals.totalSuppliersCount} مورد
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم المورد، الشركة، أو الهاتف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Filter */}
          <select
            value={balanceFilter}
            onChange={e => setBalanceFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white focus:border-cyan-500 outline-none cursor-pointer"
          >
            <option value="all">جميع الموردين ({suppliers.length})</option>
            <option value="due_only">موردون لهم مستحقات بذمتنا فقط ({overallTotals.suppliersWithDebtCount})</option>
          </select>

          {selectedSupplierId && (
            <button
              onClick={() => setSelectedSupplierId(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition cursor-pointer"
            >
              ← العودة لجميع الموردين
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير (A4)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Individual Supplier Detailed Statement if selected */}
      {selectedSupplierDetail ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">{selectedSupplierDetail.supplier.name}</h3>
                  {selectedSupplierDetail.supplier.company && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                      {selectedSupplierDetail.supplier.company}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span>هاتف: {selectedSupplierDetail.supplier.phone || '—'}</span>
                  {selectedSupplierDetail.supplier.address && <span>• {selectedSupplierDetail.supplier.address}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-center sm:text-right">
                <span className="text-[10px] text-slate-400 block">إجمالي مشترياتنا منه</span>
                <span className="text-sm font-black text-white font-mono">
                  {selectedSupplierDetail.totalPurchases.toLocaleString()} {settings.currency}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-[10px] text-slate-400 block">المسدد له</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {selectedSupplierDetail.totalPaid.toLocaleString()} {settings.currency}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-[10px] text-amber-400 block font-bold">الرصيد المستحق (دين)</span>
                <span className="text-sm font-black text-amber-300 font-mono">
                  {selectedSupplierDetail.balance.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier's Purchases Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-300">
              فواتير الشروع والتوريد الصادرة من هذا المورد خلال الفترة
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">رقم الفاتورة</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3 text-center">عدد الأصناف</th>
                    <th className="py-2.5 px-3 text-left">قيمة الفاتورة</th>
                    <th className="py-2.5 px-3 text-left">المسدد</th>
                    <th className="py-2.5 px-3 text-left">المتبقي (الرصيد)</th>
                    <th className="py-2.5 px-3 text-center">حالة السداد</th>
                    <th className="py-2.5 px-3">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {selectedSupplierDetail.purchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        لا توجد فواتير مسجلة لهذا المورد في الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    selectedSupplierDetail.purchases.map(p => {
                      const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
                      const rem = Math.max(0, p.totalAmount - paid);
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{p.invoiceNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{p.date}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-400">{p.items.length}</td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-white">{p.totalAmount.toLocaleString()} {settings.currency}</td>
                          <td className="py-2.5 px-3 text-left font-mono text-emerald-400">{paid.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-left font-mono font-bold">
                            {rem > 0 ? <span className="text-amber-400">{rem.toLocaleString()}</span> : <span className="text-slate-500">0</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {rem === 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">مسدد</span>
                            ) : paid > 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">جزئي</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">غير مسدد</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{p.notes || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: All Suppliers Ledger Table */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3">اسم المورد</th>
                  <th className="py-3 px-3">اسم الشركة</th>
                  <th className="py-3 px-3">رقم الهاتف</th>
                  <th className="py-3 px-3 text-center">عدد الفواتير</th>
                  <th className="py-3 px-3 text-left">إجمالي المشتريات منه</th>
                  <th className="py-3 px-3 text-left">المسدد له</th>
                  <th className="py-3 px-3 text-left">رصيد المورد (دين بذمتنا)</th>
                  <th className="py-3 px-3 text-center">حالة الرصيد</th>
                  <th className="py-3 px-3 text-center w-24">كشف الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      لا يوجد موردون مطابقون للتصفية والبحث
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((entry, idx) => (
                    <tr key={entry.supplier.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-white">
                        <button
                          onClick={() => setSelectedSupplierId(entry.supplier.id)}
                          className="hover:text-cyan-300 text-right cursor-pointer"
                        >
                          {entry.supplier.name}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{entry.supplier.company || '—'}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{entry.supplier.phone || '—'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">
                        {entry.invoicesCount} فواتير
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-black text-white">
                        {entry.totalPurchases.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3 px-3 text-left font-mono text-emerald-400 font-semibold">
                        {entry.totalPaid.toLocaleString()} {settings.currency}
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-black">
                        {entry.balance > 0 ? (
                          <span className="text-amber-400">{entry.balance.toLocaleString()} {settings.currency}</span>
                        ) : (
                          <span className="text-slate-500">0 {settings.currency}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {entry.balance === 0 ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            خالص ✓
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            مستحق بذمتنا ⚠️
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedSupplierId(entry.supplier.id)}
                          className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold transition cursor-pointer"
                        >
                          <span>عرض</span>
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Modal */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportTitle={printConfig.title}
        periodLabel={`من ${startDate} إلى ${endDate}`}
        settings={settings}
        summaryCards={printConfig.summaryCards}
        headers={printConfig.headers}
        rows={printConfig.rows}
        columnAlignments={printConfig.alignments}
        footerNote="كشف حساب وأرصدة الموردين المعتمد لمتابعة المستحقات والذمم المالية للورشة."
      />
    </div>
  );
};

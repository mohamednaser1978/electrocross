import React, { useState, useMemo } from 'react';
import { 
  Truck, Calendar, Search, Filter, Printer, Download, 
  DollarSign, Package, CheckCircle2, AlertCircle, Building2, PackagePlus
} from 'lucide-react';
import { Purchase, Supplier, WorkshopSettings } from '../../db/types';
import { isDateInRange, exportTableToCsv } from './reportUtils';
import { ReportPrintModal } from './ReportPrintModal';

interface PurchasesReportViewProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  settings: WorkshopSettings;
  startDate: string;
  endDate: string;
}

export const PurchasesReportView: React.FC<PurchasesReportViewProps> = ({
  purchases,
  suppliers,
  settings,
  startDate,
  endDate,
}) => {
  const [subTab, setSubTab] = useState<'invoices' | 'items' | 'suppliers'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter purchases by date range
  const periodPurchases = useMemo(() => {
    return purchases.filter(p => isDateInRange(p.date, startDate, endDate));
  }, [purchases, startDate, endDate]);

  // Overall financial summary for the period
  const summaryStats = useMemo(() => {
    let totalPurchases = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let totalItemsCount = 0;
    let dueCount = 0;

    for (const p of periodPurchases) {
      const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
      const rem = Math.max(0, p.totalAmount - paid);

      totalPurchases += p.totalAmount;
      totalPaid += paid;
      totalDebt += rem;
      totalItemsCount += p.items.reduce((s, i) => s + i.quantity, 0);

      if (rem > 0) dueCount++;
    }

    return {
      totalPurchases,
      totalPaid,
      totalDebt,
      totalItemsCount,
      dueCount,
      totalInvoicesCount: periodPurchases.length,
    };
  }, [periodPurchases]);

  // Filtered purchases list
  const filteredPurchases = useMemo(() => {
    return periodPurchases.filter(p => {
      const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
      const rem = Math.max(0, p.totalAmount - paid);

      if (statusFilter === 'due' && rem <= 0) return false;
      if (statusFilter === 'paid' && rem > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInvoice = p.invoiceNumber.toLowerCase().includes(q);
        const matchesSupplier = p.supplierName.toLowerCase().includes(q);
        const matchesParts = p.items.some(i => i.partNumber.toLowerCase().includes(q));
        if (!matchesInvoice && !matchesSupplier && !matchesParts) return false;
      }
      return true;
    });
  }, [periodPurchases, statusFilter, searchQuery]);

  // Aggregation by supplied items
  const itemsAnalysis = useMemo(() => {
    const itemMap = new Map<string, {
      partNumber: string;
      invoicesCount: number;
      totalQuantity: number;
      totalCost: number;
      latestSalePrice?: number;
    }>();

    for (const p of periodPurchases) {
      for (const item of p.items) {
        const key = item.partNumber.toUpperCase();
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            partNumber: item.partNumber,
            invoicesCount: 0,
            totalQuantity: 0,
            totalCost: 0,
            latestSalePrice: item.salePrice,
          });
        }
        const entry = itemMap.get(key)!;
        entry.invoicesCount += 1;
        entry.totalQuantity += item.quantity;
        entry.totalCost += item.totalCost;
        if (item.salePrice) entry.latestSalePrice = item.salePrice;
      }
    }

    return Array.from(itemMap.values())
      .filter(i => {
        if (!searchQuery.trim()) return true;
        return i.partNumber.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [periodPurchases, searchQuery]);

  // Aggregation by suppliers
  const suppliersAnalysis = useMemo(() => {
    const supMap = new Map<string, {
      name: string;
      company?: string;
      invoicesCount: number;
      totalPurchases: number;
      totalPaid: number;
      totalDebt: number;
    }>();

    for (const p of periodPurchases) {
      const key = p.supplierName;
      if (!supMap.has(key)) {
        const found = suppliers.find(s => s.name === key || s.id === p.supplierId);
        supMap.set(key, {
          name: key,
          company: found?.company,
          invoicesCount: 0,
          totalPurchases: 0,
          totalPaid: 0,
          totalDebt: 0,
        });
      }
      const entry = supMap.get(key)!;
      const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
      const rem = Math.max(0, p.totalAmount - paid);

      entry.invoicesCount += 1;
      entry.totalPurchases += p.totalAmount;
      entry.totalPaid += paid;
      entry.totalDebt += rem;
    }

    return Array.from(supMap.values())
      .filter(s => {
        if (!searchQuery.trim()) return true;
        return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()));
      })
      .sort((a, b) => b.totalPurchases - a.totalPurchases);
  }, [periodPurchases, suppliers, searchQuery]);

  const handleExportCsv = () => {
    const periodSlug = `${startDate}_إلى_${endDate}`;

    if (subTab === 'items') {
      const headers = ['رمز القطعة الإلكترونية', 'عدد فواتير التوريد', 'إجمالي الكمية الموردة', 'متوسط سعر الشراء', 'سعر البيع المسجل', 'إجمالي تكلفة التوريد'];
      const rows = itemsAnalysis.map(i => [
        i.partNumber,
        i.invoicesCount,
        i.totalQuantity,
        i.totalQuantity > 0 ? Math.round(i.totalCost / i.totalQuantity) : 0,
        i.latestSalePrice || '—',
        i.totalCost
      ]);
      exportTableToCsv(`تقرير_المشتريات_حسب_الأصناف_${periodSlug}`, headers, rows);
    } else if (subTab === 'suppliers') {
      const headers = ['المورد', 'الشركة', 'عدد الفواتير', 'إجمالي قيمة المشتريات', 'المسدد للمورد', 'المتبقي بذمتنا (دين)'];
      const rows = suppliersAnalysis.map(s => [
        s.name,
        s.company || '—',
        s.invoicesCount,
        s.totalPurchases,
        s.totalPaid,
        s.totalDebt
      ]);
      exportTableToCsv(`تقرير_المشتريات_حسب_الموردين_${periodSlug}`, headers, rows);
    } else {
      const headers = ['رقم الفاتورة', 'التاريخ', 'المورد', 'عدد الأصناف', 'إجمالي الفاتورة', 'المدفوع', 'المتبقي', 'حالة السداد', 'ملاحظات'];
      const rows = filteredPurchases.map(p => {
        const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
        return [
          p.invoiceNumber,
          p.date,
          p.supplierName,
          p.items.length,
          p.totalAmount,
          paid,
          Math.max(0, p.totalAmount - paid),
          p.paymentStatus === 'paid' ? 'مسدد' : p.paymentStatus === 'partial' ? 'سداد جزئي' : 'غير مسدد',
          p.notes || ''
        ];
      });
      exportTableToCsv(`تقرير_فواتير_المشتريات_والتوريد_${periodSlug}`, headers, rows);
    }
  };

  const printConfig = useMemo(() => {
    const periodLabel = `من ${startDate} إلى ${endDate}`;

    if (subTab === 'items') {
      return {
        title: 'تقرير الأصناف والقطع الإلكترونية الموردة للمستودع',
        summaryCards: [
          { label: 'عدد الأصناف الموردة', value: `${itemsAnalysis.length} صنف` },
          { label: 'إجمالي القطع الموردة', value: `${itemsAnalysis.reduce((s, i) => s + i.totalQuantity, 0)} قطعة` },
          { label: 'إجمالي تكلفة الأصناف', value: `${itemsAnalysis.reduce((s, i) => s + i.totalCost, 0).toLocaleString()} ${settings.currency}` },
        ],
        headers: ['كود الصنف', 'فواتير التوريد', 'الكمية المضافة', 'متوسط سعر التكلفة', 'سعر البيع بالمستودع', 'إجمالي التكلفة'],
        rows: itemsAnalysis.map(i => [
          i.partNumber,
          `${i.invoicesCount} فواتير`,
          `+${i.totalQuantity} ق`,
          `${(i.totalQuantity > 0 ? Math.round(i.totalCost / i.totalQuantity) : 0).toLocaleString()} ${settings.currency}`,
          i.latestSalePrice ? `${i.latestSalePrice.toLocaleString()} ${settings.currency}` : '—',
          `${i.totalCost.toLocaleString()} ${settings.currency}`,
        ]),
        alignments: ['right', 'center', 'center', 'left', 'left', 'left'] as ('right' | 'center' | 'left')[],
      };
    } else if (subTab === 'suppliers') {
      return {
        title: 'تقرير حجم المشتريات والتوريدات موزعاً حسب الموردين',
        summaryCards: [
          { label: 'عدد الموردين', value: `${suppliersAnalysis.length} مورد` },
          { label: 'إجمالي المشتريات منهم', value: `${summaryStats.totalPurchases.toLocaleString()} ${settings.currency}` },
          { label: 'المسدد لهم نقداً', value: `${summaryStats.totalPaid.toLocaleString()} ${settings.currency}` },
          { label: 'المتبقي بذمتنا لهم', value: `${summaryStats.totalDebt.toLocaleString()} ${settings.currency}` },
        ],
        headers: ['اسم المورد', 'الشركة', 'عدد الفواتير', 'إجمالي المشتريات منه', 'المسدد له', 'المتبقي بذمتنا (دين)'],
        rows: suppliersAnalysis.map(s => [
          s.name,
          s.company || '—',
          `${s.invoicesCount} فواتير`,
          `${s.totalPurchases.toLocaleString()} ${settings.currency}`,
          `${s.totalPaid.toLocaleString()} ${settings.currency}`,
          `${s.totalDebt.toLocaleString()} ${settings.currency}`,
        ]),
        alignments: ['right', 'right', 'center', 'left', 'left', 'left'] as ('right' | 'center' | 'left')[],
      };
    }

    return {
      title: 'تقرير تفصيلي لحركة فواتير المشتريات وتوريد المستودع',
      summaryCards: [
        { label: 'إجمالي المشتريات', value: `${summaryStats.totalPurchases.toLocaleString()} ${settings.currency}` },
        { label: 'المسدد نقداً للموردين', value: `${summaryStats.totalPaid.toLocaleString()} ${settings.currency}` },
        { label: 'ديون مستحقة للموردين', value: `${summaryStats.totalDebt.toLocaleString()} ${settings.currency}` },
        { label: 'إجمالي القطع الموردة', value: `${summaryStats.totalItemsCount.toLocaleString()} قطعة` },
      ],
      headers: ['رقم الفاتورة', 'التاريخ', 'المورد', 'الأصناف', 'إجمالي الفاتورة', 'المدفوع', 'المتبقي', 'الحالة'],
      rows: filteredPurchases.map(p => {
        const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
        const rem = Math.max(0, p.totalAmount - paid);
        return [
          p.invoiceNumber,
          p.date,
          p.supplierName,
          `${p.items.length} أصناف`,
          `${p.totalAmount.toLocaleString()} ${settings.currency}`,
          `${paid.toLocaleString()} ${settings.currency}`,
          `${rem.toLocaleString()} ${settings.currency}`,
          rem === 0 ? 'مسدد بالكامل' : paid > 0 ? 'سداد جزئي' : 'غير مسدد',
        ];
      }),
      alignments: ['right', 'center', 'right', 'center', 'left', 'left', 'left', 'center'] as ('right' | 'center' | 'left')[],
    };
  }, [subTab, filteredPurchases, itemsAnalysis, suppliersAnalysis, summaryStats, settings, startDate, endDate]);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي قيمة المشتريات</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {summaryStats.totalPurchases.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summaryStats.totalInvoicesCount} فواتير توريد مسجلة
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold text-slate-400">المسدد نقداً للموردين</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {summaryStats.totalPaid.toLocaleString()} <span className="text-xs font-normal text-emerald-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            تم صرفها وسدادها للموردين
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold text-slate-400">ديون مستحقة للموردين</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {summaryStats.totalDebt.toLocaleString()} <span className="text-xs font-normal text-amber-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            {summaryStats.dueCount} فواتير بانتظار استكمال السداد
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي القطع الموردة</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {summaryStats.totalItemsCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">قطعة</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            تمت إضافتها لأرصدة المستودع
          </div>
        </div>
      </div>

      {/* Sub Tabs Selection & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'invoices' 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. فواتير المشتريات ({periodPurchases.length})
          </button>
          <button
            onClick={() => setSubTab('items')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'items' 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. المشتريات حسب الأصناف ({itemsAnalysis.length})
          </button>
          <button
            onClick={() => setSubTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'suppliers' 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. المشتريات حسب الموردين ({suppliersAnalysis.length})
          </button>
        </div>

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

      {/* SUB-VIEW 1: Invoices */}
      {subTab === 'invoices' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برقم الفاتورة، المورد، أو القطعة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="due">فواتير بانتظار السداد / آجل</option>
              <option value="paid">مسددة بالكامل</option>
            </select>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">رقم الفاتورة</th>
                    <th className="py-3 px-3">التاريخ</th>
                    <th className="py-3 px-3">اسم المورد</th>
                    <th className="py-3 px-3 text-center">عدد الأصناف</th>
                    <th className="py-3 px-3 text-left">إجمالي الفاتورة</th>
                    <th className="py-3 px-3 text-left">المدفوع للمورد</th>
                    <th className="py-3 px-3 text-left">المتبقي (دين آجل)</th>
                    <th className="py-3 px-3 text-center">حالة السداد</th>
                    <th className="py-3 px-3">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        لا توجد فواتير توريد مسجلة في هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((p, idx) => {
                      const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
                      const rem = Math.max(0, p.totalAmount - paid);
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{p.invoiceNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{p.date}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">{p.supplierName}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-400">
                            {p.items.length} أصناف
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-white">
                            {p.totalAmount.toLocaleString()} {settings.currency}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono text-emerald-400 font-semibold">
                            {paid.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-bold">
                            {rem > 0 ? (
                              <span className="text-amber-400">{rem.toLocaleString()}</span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
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
                          <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={p.notes}>
                            {p.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Items Supplied */}
      {subTab === 'items' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برمز القطعة الموردة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">الترتيب</th>
                    <th className="py-3 px-3">رمز القطعة الإلكترونية</th>
                    <th className="py-3 px-3 text-center">عدد شحنات التوريد</th>
                    <th className="py-3 px-3 text-center">إجمالي الكمية المضافة (+)</th>
                    <th className="py-3 px-3 text-left">متوسط سعر التكلفة</th>
                    <th className="py-3 px-3 text-left">سعر البيع المقيد 🏷️</th>
                    <th className="py-3 px-3 text-left">إجمالي تكلفة التوريد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {itemsAnalysis.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        لم يتم توريد قطع غيار في هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    itemsAnalysis.map((item, idx) => {
                      const avgCost = item.totalQuantity > 0 ? Math.round(item.totalCost / item.totalQuantity) : 0;
                      return (
                        <tr key={item.partNumber} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-400">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-black text-cyan-300">
                            {item.partNumber}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {item.invoicesCount} شحنات
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                            +{item.totalQuantity} قطعة
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono">
                            {avgCost.toLocaleString()} {settings.currency}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-bold text-cyan-400">
                            {item.latestSalePrice ? `${item.latestSalePrice.toLocaleString()} ${settings.currency}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-white">
                            {item.totalCost.toLocaleString()} {settings.currency}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Suppliers */}
      {subTab === 'suppliers' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم المورد أو الشركة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">المورد</th>
                    <th className="py-3 px-3">الشركة</th>
                    <th className="py-3 px-3 text-center">عدد فواتير التوريد</th>
                    <th className="py-3 px-3 text-left">إجمالي المشتريات منه</th>
                    <th className="py-3 px-3 text-left">المسدد له</th>
                    <th className="py-3 px-3 text-left">المتبقي بذمتنا (دين)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {suppliersAnalysis.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        لا توجد مشتريات من الموردين خلال هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    suppliersAnalysis.map((s, idx) => (
                      <tr key={s.name} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{s.name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{s.company || '—'}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-400">{s.invoicesCount} فواتير</td>
                        <td className="py-2.5 px-3 text-left font-mono font-black text-white">
                          {s.totalPurchases.toLocaleString()} {settings.currency}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono text-emerald-400 font-semibold">
                          {s.totalPaid.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold">
                          {s.totalDebt > 0 ? (
                            <span className="text-amber-400">{s.totalDebt.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
        footerNote="تقرير المشتريات المعتمد، صادر تلقائياً لمتابعة تكاليف التوريد والمخزون وحسابات الموردين."
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Calendar, Search, Filter, Printer, Download, 
  DollarSign, TrendingUp, Sparkles, Wrench, ShoppingBag, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { Sale, WorkshopSettings } from '../../db/types';
import { isDateInRange, exportTableToCsv } from './reportUtils';
import { ReportPrintModal } from './ReportPrintModal';

interface SalesReportViewProps {
  sales: Sale[];
  settings: WorkshopSettings;
  startDate: string;
  endDate: string;
}

export const SalesReportView: React.FC<SalesReportViewProps> = ({
  sales,
  settings,
  startDate,
  endDate,
}) => {
  const [subTab, setSubTab] = useState<'summary' | 'invoices' | 'items'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'direct' | 'maintenance'>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Sales in the date range
  const periodSales = useMemo(() => {
    return sales.filter(s => isDateInRange(s.date, startDate, endDate));
  }, [sales, startDate, endDate]);

  // Filtered sales by search and type
  const filteredSales = useMemo(() => {
    return periodSales.filter(s => {
      if (typeFilter !== 'all' && s.saleType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInvoice = s.invoiceNumber.toLowerCase().includes(q);
        const matchesCustomer = s.customerName.toLowerCase().includes(q) || (s.customerPhone || '').includes(q);
        const matchesDevice = s.maintenance ? `${s.maintenance.brand} ${s.maintenance.deviceType} ${s.maintenance.modelOrBoard}`.toLowerCase().includes(q) : false;
        const matchesParts = s.items.some(i => i.partNumber.toLowerCase().includes(q));
        if (!matchesInvoice && !matchesCustomer && !matchesDevice && !matchesParts) return false;
      }
      return true;
    });
  }, [periodSales, typeFilter, searchQuery]);

  // Overall financial summary for the period
  const summaryStats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let directRevenue = 0;
    let maintRevenue = 0;
    let directCount = 0;
    let maintCount = 0;
    let totalLabor = 0;
    let totalPaid = 0;
    let totalDebt = 0;

    for (const s of periodSales) {
      totalRevenue += s.totalAmount;
      totalCost += s.totalCost;
      totalProfit += s.profit;
      totalPaid += (s.paidAmount || 0);
      totalDebt += Math.max(0, s.totalAmount - (s.paidAmount || 0));

      if (s.saleType === 'direct') {
        directCount++;
        directRevenue += s.totalAmount;
      } else {
        maintCount++;
        maintRevenue += s.totalAmount;
        if (s.maintenance) {
          totalLabor += (s.maintenance.technicianFee || 0) + (s.maintenance.extraServicesFee || 0);
        }
      }
    }

    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      directRevenue,
      maintRevenue,
      directCount,
      maintCount,
      totalLabor,
      totalPaid,
      totalDebt,
      profitMargin,
      totalSalesCount: periodSales.length,
    };
  }, [periodSales]);

  // Aggregate items sold analysis
  const itemsAnalysis = useMemo(() => {
    const itemMap = new Map<string, {
      partNumber: string;
      invoicesCount: number;
      totalQuantity: number;
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
    }>();

    for (const s of periodSales) {
      for (const item of s.items) {
        const key = item.partNumber.toUpperCase();
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            partNumber: item.partNumber,
            invoicesCount: 0,
            totalQuantity: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
          });
        }
        const entry = itemMap.get(key)!;
        entry.invoicesCount += 1;
        entry.totalQuantity += item.quantity;
        entry.totalRevenue += item.totalPrice;
        entry.totalCost += item.totalCost;
        entry.totalProfit += (item.totalPrice - item.totalCost);
      }
    }

    return Array.from(itemMap.values())
      .filter(i => {
        if (!searchQuery.trim()) return true;
        return i.partNumber.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [periodSales, searchQuery]);

  // Export CSV based on current sub-tab
  const handleExportCsv = () => {
    const periodSlug = `${startDate}_إلى_${endDate}`;

    if (subTab === 'invoices') {
      const headers = [
        'رقم الفاتورة',
        'التاريخ',
        'النوع',
        'العميل',
        'الهاتف',
        'تفاصيل الصيانة / الجهاز',
        'إجمالي الفاتورة',
        'التكلفة',
        'الربح',
        'المدفوع',
        'المتبقي',
        'حالة السداد'
      ];
      const rows = filteredSales.map(s => [
        s.invoiceNumber,
        s.date,
        s.saleType === 'direct' ? 'بيع مباشر' : 'صيانة',
        s.customerName,
        s.customerPhone || '—',
        s.maintenance ? `${s.maintenance.brand} ${s.maintenance.deviceType} (${s.maintenance.faultDescription})` : 'قطع إلكترونية',
        s.totalAmount,
        s.totalCost,
        s.profit,
        s.paidAmount || 0,
        Math.max(0, s.totalAmount - (s.paidAmount || 0)),
        s.paymentStatus === 'paid' ? 'مسدد' : s.paymentStatus === 'partial' ? 'سداد جزئي' : 'غير مسدد'
      ]);
      exportTableToCsv(`تقرير_فواتير_المبيعات_${periodSlug}`, headers, rows);
    } else if (subTab === 'items') {
      const headers = [
        'رمز القطعة الإلكترونية',
        'عدد الفواتير',
        'إجمالي الكمية المباعة',
        'إجمالي المبيعات (الإيراد)',
        'إجمالي التكلفة',
        'صافي الربح',
        'متوسط سعر البيع'
      ];
      const rows = itemsAnalysis.map(i => [
        i.partNumber,
        i.invoicesCount,
        i.totalQuantity,
        i.totalRevenue,
        i.totalCost,
        i.totalProfit,
        i.totalQuantity > 0 ? Math.round(i.totalRevenue / i.totalQuantity) : 0
      ]);
      exportTableToCsv(`تقرير_المبيعات_حسب_الأصناف_${periodSlug}`, headers, rows);
    } else {
      // Summary export
      const headers = ['المؤشر الإحصائي', 'القيمة'];
      const rows = [
        ['الفترة الزمنية', `من ${startDate} إلى ${endDate}`],
        ['إجمالي المبيعات (الإيرادات)', `${summaryStats.totalRevenue} ${settings.currency}`],
        ['إجمالي تكلفة المبيعات والمصاريف', `${summaryStats.totalCost} ${settings.currency}`],
        ['صافي الأرباح المحققة', `${summaryStats.totalProfit} ${settings.currency}`],
        ['نسبة هامش الربح', `${summaryStats.profitMargin}%`],
        ['إجمالي عدد العمليات', summaryStats.totalSalesCount],
        ['المبيعات المباشرة (بيع قطع)', `${summaryStats.directRevenue} ${settings.currency} (${summaryStats.directCount} فاتورة)`],
        ['إيرادات الصيانة والأجهزة', `${summaryStats.maintRevenue} ${settings.currency} (${summaryStats.maintCount} عملية)`],
        ['أجور اليد والفنيين والخدمات', `${summaryStats.totalLabor} ${settings.currency}`],
        ['المبالغ المحصلة نقدياً', `${summaryStats.totalPaid} ${settings.currency}`],
        ['الديون المتبقية بذمة العملاء', `${summaryStats.totalDebt} ${settings.currency}`],
      ];
      exportTableToCsv(`ملخص_المبيعات_الشامل_${periodSlug}`, headers, rows);
    }
  };

  // Prepare Print Modal data
  const printConfig = useMemo(() => {
    const periodLabel = `من ${startDate} إلى ${endDate}`;

    if (subTab === 'items') {
      return {
        title: 'تقرير المبيعات حسب الأصناف والقطع الإلكترونية الأكثر طلباً',
        summaryCards: [
          { label: 'عدد الأصناف المباعة', value: `${itemsAnalysis.length} صنف` },
          { label: 'إجمالي الكميات المباعة', value: `${itemsAnalysis.reduce((s, i) => s + i.totalQuantity, 0)} قطعة` },
          { label: 'إجمالي إيراد الأصناف', value: `${itemsAnalysis.reduce((s, i) => s + i.totalRevenue, 0).toLocaleString()} ${settings.currency}` },
          { label: 'صافي أرباح الأصناف', value: `+${itemsAnalysis.reduce((s, i) => s + i.totalProfit, 0).toLocaleString()} ${settings.currency}` },
        ],
        headers: ['كود الصنف', 'الفواتير', 'الكمية المباعة', 'متوسط سعر البيع', 'إجمالي الإيراد', 'إجمالي التكلفة', 'صافي الربح'],
        rows: itemsAnalysis.map(i => [
          i.partNumber,
          `${i.invoicesCount} فواتير`,
          `${i.totalQuantity} ق`,
          `${(i.totalQuantity > 0 ? Math.round(i.totalRevenue / i.totalQuantity) : 0).toLocaleString()} ${settings.currency}`,
          `${i.totalRevenue.toLocaleString()} ${settings.currency}`,
          `${i.totalCost.toLocaleString()} ${settings.currency}`,
          `+${i.totalProfit.toLocaleString()} ${settings.currency}`,
        ]),
        alignments: ['right', 'center', 'center', 'left', 'left', 'left', 'left'] as ('right' | 'center' | 'left')[],
      };
    }

    // Default to Invoices or Summary
    return {
      title: subTab === 'invoices' ? 'تقرير تفصيلي لحركة فواتير المبيعات والصيانة' : 'تقرير المبيعات والأرباح الإجمالي للفترة',
      summaryCards: [
        { label: 'إجمالي الإيرادات', value: `${summaryStats.totalRevenue.toLocaleString()} ${settings.currency}` },
        { label: 'صافي الأرباح', value: `+${summaryStats.totalProfit.toLocaleString()} ${settings.currency}` },
        { label: 'المحصل نقداً', value: `${summaryStats.totalPaid.toLocaleString()} ${settings.currency}` },
        { label: 'متبقي ديون عملاء', value: `${summaryStats.totalDebt.toLocaleString()} ${settings.currency}` },
      ],
      headers: ['رقم الفاتورة', 'التاريخ', 'النوع', 'العميل', 'إجمالي الفاتورة', 'التكلفة', 'الربح', 'المحصل', 'المتبقي', 'الحالة'],
      rows: filteredSales.map(s => [
        s.invoiceNumber,
        s.date,
        s.saleType === 'direct' ? 'بيع مباشر' : 'صيانة جهاز',
        s.customerName,
        `${s.totalAmount.toLocaleString()} ${settings.currency}`,
        `${s.totalCost.toLocaleString()} ${settings.currency}`,
        `+${s.profit.toLocaleString()} ${settings.currency}`,
        `${(s.paidAmount || 0).toLocaleString()} ${settings.currency}`,
        `${Math.max(0, s.totalAmount - (s.paidAmount || 0)).toLocaleString()} ${settings.currency}`,
        s.paymentStatus === 'paid' ? 'مسدد بالكامل' : s.paymentStatus === 'partial' ? 'سداد جزئي' : 'غير مسدد',
      ]),
      alignments: ['right', 'center', 'center', 'right', 'left', 'left', 'left', 'left', 'left', 'center'] as ('right' | 'center' | 'left')[],
    };
  }, [subTab, filteredSales, itemsAnalysis, summaryStats, settings, startDate, endDate]);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Top Financial KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي الإيرادات للفترة</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {summaryStats.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            من {summaryStats.totalSalesCount} عملية مسجلة
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/40 shadow-xl">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-xs font-bold text-cyan-300">صافي الأرباح المحققة</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-200 font-mono">
            +{summaryStats.totalProfit.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            هامش ربح تقريبي: {summaryStats.profitMargin}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold text-slate-400">المبالغ المحصلة نقدياً</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {summaryStats.totalPaid.toLocaleString()} <span className="text-xs font-normal text-emerald-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            نقدية فعلية بالخزينة
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold text-slate-400">ديون متبقية على العملاء</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {summaryStats.totalDebt.toLocaleString()} <span className="text-xs font-normal text-amber-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            مستحقات بانتظار التحصيل
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold text-slate-400">أجور الفنيين والخدمات</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
            {summaryStats.totalLabor.toLocaleString()} <span className="text-xs font-normal text-purple-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            أجر يد أعمال الصيانة
          </div>
        </div>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'summary' 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. تقرير إجمالي المبيعات
          </button>
          <button
            onClick={() => setSubTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'invoices' 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. تقرير تفصيلي حسب الفواتير ({periodSales.length})
          </button>
          <button
            onClick={() => setSubTab('items')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'items' 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. المبيعات حسب الأصناف ({itemsAnalysis.length})
          </button>
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

      {/* SUB-VIEW 1: Sales Overview & Channel Comparison */}
      {subTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>المبيعات المباشرة (بيع قطع غيار بدون صيانة)</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">إجمالي قيمة المبيعات المباشرة</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {summaryStats.directRevenue.toLocaleString()} {settings.currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">عدد الفواتير المنفذة</span>
                <span className="font-mono font-bold text-white">{summaryStats.directCount} فاتورة</span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">نسبة مساهمتها من إجمالي الإيرادات</span>
                <span className="font-mono font-bold text-cyan-400">
                  {summaryStats.totalRevenue > 0 ? Math.round((summaryStats.directRevenue / summaryStats.totalRevenue) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>عمليات الصيانة وإصلاح الأجهزة واللوحات</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">إجمالي إيراد الصيانة المكتملة</span>
                <span className="font-mono font-black text-cyan-400 text-sm">
                  {summaryStats.maintRevenue.toLocaleString()} {settings.currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">عدد الأجهزة واللوحات التي صينت</span>
                <span className="font-mono font-bold text-white">{summaryStats.maintCount} عملية</span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">إجمالي أجور الفنيين والتركيب</span>
                <span className="font-mono font-bold text-purple-400">
                  {summaryStats.totalLabor.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Sales Invoices Breakdown */}
      {subTab === 'invoices' && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برقم الفاتورة، العميل، أو القطعة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none cursor-pointer"
            >
              <option value="all">جميع الأنواع</option>
              <option value="direct">بيع مباشر فقط</option>
              <option value="maintenance">صيانة أجهزة فقط</option>
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
                    <th className="py-3 px-3">النوع</th>
                    <th className="py-3 px-3">العميل</th>
                    <th className="py-3 px-3">تفاصيل الصيانة / القطع</th>
                    <th className="py-3 px-3 text-left">قيمة الفاتورة</th>
                    <th className="py-3 px-3 text-left">التكلفة</th>
                    <th className="py-3 px-3 text-left">الربح</th>
                    <th className="py-3 px-3 text-left">المدفوع</th>
                    <th className="py-3 px-3 text-left">المتبقي</th>
                    <th className="py-3 px-3 text-center">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500">
                        لا توجد فواتير مبيعات مسجلة في هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((s, idx) => {
                      const remaining = Math.max(0, s.totalAmount - (s.paidAmount || 0));
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{s.invoiceNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{s.date}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              s.saleType === 'direct' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {s.saleType === 'direct' ? 'مباشر' : 'صيانة'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {s.customerName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                            {s.maintenance ? (
                              <span>{s.maintenance.brand} {s.maintenance.deviceType} ({s.maintenance.faultDescription})</span>
                            ) : (
                              <span>{s.items.map(i => i.partNumber).join(', ')}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-white">
                            {s.totalAmount.toLocaleString()} {settings.currency}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono text-slate-400">
                            {s.totalCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-400">
                            +{s.profit.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono text-emerald-400 font-semibold">
                            {(s.paidAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-bold">
                            {remaining > 0 ? (
                              <span className="text-amber-400">{remaining.toLocaleString()}</span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {s.paymentStatus === 'paid' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">مسدد</span>
                            ) : s.paymentStatus === 'partial' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">جزئي</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">غير مسدد</span>
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
        </div>
      )}

      {/* SUB-VIEW 3: Sales by Items Analysis */}
      {subTab === 'items' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برمز القطعة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>
            <span className="text-xs text-slate-400">
              مرتبة حسب الأكثر مبيعاً في الفترة المحددة
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">الترتيب</th>
                    <th className="py-3 px-3">رمز القطعة الإلكترونية</th>
                    <th className="py-3 px-3 text-center">عدد مرات البيع</th>
                    <th className="py-3 px-3 text-center">إجمالي الكمية المباعة</th>
                    <th className="py-3 px-3 text-left">متوسط سعر البيع</th>
                    <th className="py-3 px-3 text-left">إجمالي المبيعات (الإيراد)</th>
                    <th className="py-3 px-3 text-left">إجمالي التكلفة</th>
                    <th className="py-3 px-3 text-left">صافي الربح المحقق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {itemsAnalysis.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        لم يتم بيع أي قطع غيار خلال هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    itemsAnalysis.map((item, idx) => {
                      const avgPrice = item.totalQuantity > 0 ? Math.round(item.totalRevenue / item.totalQuantity) : 0;
                      return (
                        <tr key={item.partNumber} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-black text-cyan-300">
                            {item.partNumber}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {item.invoicesCount} فواتير
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                            {item.totalQuantity} قطعة
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono">
                            {avgPrice.toLocaleString()} {settings.currency}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-white">
                            {item.totalRevenue.toLocaleString()} {settings.currency}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono text-slate-400">
                            {item.totalCost.toLocaleString()} {settings.currency}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-300">
                            +{item.totalProfit.toLocaleString()} {settings.currency}
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
        footerNote="تقرير المبيعات المعتمد، صادر تلقائياً لتدقيق ومتابعة الإيرادات والربحية."
      />
    </div>
  );
};

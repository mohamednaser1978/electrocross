import React, { useState, useMemo } from 'react';
import { 
  Package, Search, Filter, Printer, Download, DollarSign, 
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, ArrowUpDown
} from 'lucide-react';
import { Component, WorkshopSettings } from '../../db/types';
import { exportTableToCsv } from './reportUtils';
import { ReportPrintModal } from './ReportPrintModal';

interface InventoryReportViewProps {
  components: Component[];
  settings: WorkshopSettings;
}

export const InventoryReportView: React.FC<InventoryReportViewProps> = ({
  components,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value_sale' | 'value_cost' | 'quantity' | 'part_number'>('value_sale');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    components.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [components]);

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    return components
      .filter(c => {
        // Status filter
        if (statusFilter === 'in_stock' && c.stock_quantity <= 2) return false;
        if (statusFilter === 'low_stock' && (c.stock_quantity === 0 || c.stock_quantity > 2)) return false;
        if (statusFilter === 'out_of_stock' && c.stock_quantity > 0) return false;

        // Category filter
        if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesCode = c.part_number.toLowerCase().includes(q);
          const matchesDesc = (c.description || '').toLowerCase().includes(q);
          const matchesPkg = (c.package_type || '').toLowerCase().includes(q);
          const matchesBin = (c.bin_location || '').toLowerCase().includes(q);
          if (!matchesCode && !matchesDesc && !matchesPkg && !matchesBin) return false;
        }

        return true;
      })
      .map(c => {
        const costPrice = c.cost_price ?? 0;
        const salePrice = c.sale_price ?? 0;
        const totalCostValue = c.stock_quantity * costPrice;
        const totalSaleValue = c.stock_quantity * salePrice;
        const expectedProfit = totalSaleValue - totalCostValue;
        return {
          ...c,
          costPrice,
          salePrice,
          totalCostValue,
          totalSaleValue,
          expectedProfit,
        };
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'value_sale') {
          valA = a.totalSaleValue;
          valB = b.totalSaleValue;
        } else if (sortBy === 'value_cost') {
          valA = a.totalCostValue;
          valB = b.totalCostValue;
        } else if (sortBy === 'quantity') {
          valA = a.stock_quantity;
          valB = b.stock_quantity;
        } else {
          return sortOrder === 'asc' 
            ? a.part_number.localeCompare(b.part_number) 
            : b.part_number.localeCompare(a.part_number);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [components, statusFilter, selectedCategory, searchQuery, sortBy, sortOrder]);

  // Overall totals across all components
  const totals = useMemo(() => {
    let totalItems = components.length;
    let totalUnits = 0;
    let totalCostVal = 0;
    let totalSaleVal = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const c of components) {
      totalUnits += c.stock_quantity;
      totalCostVal += c.stock_quantity * (c.cost_price ?? 0);
      totalSaleVal += c.stock_quantity * (c.sale_price ?? 0);
      if (c.stock_quantity === 0) outOfStockCount++;
      else if (c.stock_quantity <= 2) lowStockCount++;
    }

    return {
      totalItems,
      totalUnits,
      totalCostVal,
      totalSaleVal,
      expectedProfit: totalSaleVal - totalCostVal,
      lowStockCount,
      outOfStockCount,
    };
  }, [components]);

  // Filtered view totals
  const filteredTotals = useMemo(() => {
    let units = 0;
    let cost = 0;
    let sale = 0;
    for (const item of processedItems) {
      units += item.stock_quantity;
      cost += item.totalCostValue;
      sale += item.totalSaleValue;
    }
    return {
      units,
      cost,
      sale,
      profit: sale - cost,
    };
  }, [processedItems]);

  const handleExportCsv = () => {
    const headers = [
      'كود الصنف (Part Number)',
      'التصنيف',
      'التغليف',
      'الوصف',
      'مكان الدرج (Bin)',
      'الكمية المتوفرة',
      'سعر التكلفة',
      'سعر البيع',
      'إجمالي القيمة بالتكلفة',
      'إجمالي القيمة بسعر البيع',
      'هامش الربح المتوقع',
      'حالة المخزون'
    ];

    const rows = processedItems.map(c => [
      c.part_number,
      c.category,
      c.package_type,
      c.description || '—',
      c.bin_location || '—',
      c.stock_quantity,
      c.costPrice,
      c.salePrice,
      c.totalCostValue,
      c.totalSaleValue,
      c.expectedProfit,
      c.stock_quantity === 0 ? 'نافد' : c.stock_quantity <= 2 ? 'منخفض' : 'متوفر'
    ]);

    exportTableToCsv(`تقرير_المستودع_والمخزون_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const printHeaders = [
    'كود الصنف',
    'التصنيف / التغليف',
    'الدرج',
    'الكمية',
    'سعر التكلفة',
    'سعر البيع',
    'إجمالي التكلفة',
    'إجمالي بسعر البيع',
    'الربح المتوقع',
    'الحالة'
  ];

  const printRows = processedItems.map(c => [
    c.part_number,
    `${c.category} • ${c.package_type}`,
    c.bin_location || '—',
    `${c.stock_quantity} ق`,
    `${c.costPrice.toLocaleString()} ${settings.currency}`,
    `${c.salePrice.toLocaleString()} ${settings.currency}`,
    `${c.totalCostValue.toLocaleString()} ${settings.currency}`,
    `${c.totalSaleValue.toLocaleString()} ${settings.currency}`,
    `+${c.expectedProfit.toLocaleString()} ${settings.currency}`,
    c.stock_quantity === 0 ? 'نافد' : c.stock_quantity <= 2 ? 'منخفض' : 'متوفر'
  ]);

  const summaryCardsForPrint = [
    { label: 'عدد الأصناف', value: `${processedItems.length} صنف` },
    { label: 'إجمالي القطع في المستودع', value: `${filteredTotals.units.toLocaleString()} قطعة` },
    { label: 'قيمة المخزون بسعر التكلفة', value: `${filteredTotals.cost.toLocaleString()} ${settings.currency}` },
    { label: 'قيمة المخزون بسعر البيع', value: `${filteredTotals.sale.toLocaleString()} ${settings.currency}` },
  ];

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Top Inventory Valuation KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي قيمة المخزون (بالتكلفة)</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {totals.totalCostVal.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            رأس المال الفعلي المجمد في القطع
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي قيمة المخزون (بسعر البيع)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {totals.totalSaleVal.toLocaleString()} <span className="text-xs font-normal text-emerald-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            القيمة السوقية الإجمالية للقطع
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/40 shadow-xl">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-xs font-bold text-cyan-300">الأرباح المتوقعة عند البيع</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-200 font-mono">
            +{totals.expectedProfit.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            صافي الفارق بين البيع والتكلفة
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي الوحدات والأصناف</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {totals.totalUnits.toLocaleString()} <span className="text-xs font-normal text-purple-400">قطعة</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ضمن {totals.totalItems} صنفاً مسجلاً
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold text-slate-400">النواقص والقطع النافذة</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {totals.lowStockCount + totals.outOfStockCount} <span className="text-xs font-normal text-amber-400">صنف</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            {totals.outOfStockCount} نافد • {totals.lowStockCount} منخفض
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالكود، الوصف، الدرج..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white focus:border-cyan-500 outline-none cursor-pointer"
          >
            <option value="all">جميع الحالات ({components.length})</option>
            <option value="in_stock">متوفر في المستودع</option>
            <option value="low_stock">منخفض الرصيد (1-2)</option>
            <option value="out_of_stock">نافد من المخزون (0)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white focus:border-cyan-500 outline-none cursor-pointer"
          >
            <option value="all">جميع الفئات</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white focus:border-cyan-500 outline-none cursor-pointer"
          >
            <option value="value_sale">ترتيب حسب: القيمة بسعر البيع</option>
            <option value="value_cost">ترتيب حسب: القيمة بسعر التكلفة</option>
            <option value="quantity">ترتيب حسب: الكمية المتوفرة</option>
            <option value="part_number">ترتيب حسب: رمز القطعة</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Export & Print Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
            title="تصدير كملف إكسل"
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

      {/* Main Inventory Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-3">كود الصنف</th>
                <th className="py-3 px-3">اسم وتوصيف الصنف</th>
                <th className="py-3 px-3">الفئة / التغليف</th>
                <th className="py-3 px-3 text-center">مكان الدرج</th>
                <th className="py-3 px-3 text-center">الكمية</th>
                <th className="py-3 px-3 text-left">سعر التكلفة</th>
                <th className="py-3 px-3 text-left">سعر البيع</th>
                <th className="py-3 px-3 text-left">إجمالي التكلفة</th>
                <th className="py-3 px-3 text-left">إجمالي بسعر البيع</th>
                <th className="py-3 px-3 text-left">الربح المتوقع</th>
                <th className="py-3 px-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {processedItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    لا توجد أصناف مطابقة لبحثك في المستودع
                  </td>
                </tr>
              ) : (
                processedItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-black text-cyan-300">{item.part_number}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={item.description}>
                      {item.description || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {item.category} {item.package_type ? `• ${item.package_type}` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">{item.bin_location || '—'}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${
                        item.stock_quantity === 0 ? 'bg-rose-500/20 text-rose-300' :
                        item.stock_quantity <= 2 ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {item.stock_quantity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono">{item.costPrice.toLocaleString()} {settings.currency}</td>
                    <td className="py-2.5 px-3 text-left font-mono font-semibold text-emerald-400">{item.salePrice.toLocaleString()} {settings.currency}</td>
                    <td className="py-2.5 px-3 text-left font-mono text-slate-300 font-bold">{item.totalCostValue.toLocaleString()} {settings.currency}</td>
                    <td className="py-2.5 px-3 text-left font-mono text-emerald-300 font-black">{item.totalSaleValue.toLocaleString()} {settings.currency}</td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-cyan-400">+{item.expectedProfit.toLocaleString()} {settings.currency}</td>
                    <td className="py-2.5 px-3 text-center">
                      {item.stock_quantity === 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">نافد</span>
                      ) : item.stock_quantity <= 2 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">منخفض</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">متوفر</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer with Summary */}
            {processedItems.length > 0 && (
              <tfoot className="bg-slate-950 font-bold text-xs text-slate-200 border-t-2 border-slate-700">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-right">
                    إجمالي نتائج العرض ({processedItems.length} صنف)
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-400 font-black">
                    {filteredTotals.units.toLocaleString()} ق
                  </td>
                  <td colSpan={2} className="py-3 px-3"></td>
                  <td className="py-3 px-3 text-left font-mono text-slate-300 font-black">
                    {filteredTotals.cost.toLocaleString()} {settings.currency}
                  </td>
                  <td className="py-3 px-3 text-left font-mono text-emerald-400 font-black">
                    {filteredTotals.sale.toLocaleString()} {settings.currency}
                  </td>
                  <td className="py-3 px-3 text-left font-mono text-cyan-400 font-black">
                    +{filteredTotals.profit.toLocaleString()} {settings.currency}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Print Modal */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportTitle="تقرير المخزون والمستودع الشامل وقيمة المواد"
        periodLabel={`بتاريخ اليوم ${new Date().toISOString().split('T')[0]}`}
        settings={settings}
        summaryCards={summaryCardsForPrint}
        headers={printHeaders}
        rows={printRows}
        columnAlignments={['right', 'right', 'center', 'center', 'left', 'left', 'left', 'left', 'left', 'center']}
        footerNote="تقرير الجرد الفعلي للمستودع، محسوباً بسعر التكلفة وسعر البيع المعتمد."
      />
    </div>
  );
};

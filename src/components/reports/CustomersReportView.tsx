import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, Printer, Download, DollarSign, 
  Phone, MapPin, AlertCircle, CheckCircle2, ChevronRight, FileText, ShoppingBag, Wrench
} from 'lucide-react';
import { Customer, Sale, WorkshopSettings } from '../../db/types';
import { isDateInRange, exportTableToCsv } from './reportUtils';
import { ReportPrintModal } from './ReportPrintModal';

interface CustomersReportViewProps {
  customers: Customer[];
  sales: Sale[];
  settings: WorkshopSettings;
  startDate: string;
  endDate: string;
}

export const CustomersReportView: React.FC<CustomersReportViewProps> = ({
  customers,
  sales,
  settings,
  startDate,
  endDate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'debt_only'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Compute customer ledger entries for the selected period
  const customerLedger = useMemo(() => {
    return customers.map(cust => {
      // Find sales for this customer within the period
      const custSales = sales.filter(s => {
        const matchesCust = (s.customerId === cust.id) || (s.customerName === cust.name);
        return matchesCust && isDateInRange(s.date, startDate, endDate);
      });

      let totalSpent = 0;
      let totalPaid = 0;
      let totalDebt = 0;
      let directCount = 0;
      let maintCount = 0;

      for (const s of custSales) {
        const paid = s.paidAmount || 0;
        totalSpent += s.totalAmount;
        totalPaid += paid;
        totalDebt += Math.max(0, s.totalAmount - paid);

        if (s.saleType === 'direct') directCount++;
        else maintCount++;
      }

      return {
        customer: cust,
        totalOperations: custSales.length,
        directCount,
        maintCount,
        sales: custSales,
        totalSpent,
        totalPaid,
        balance: totalDebt, // المبلغ المستحق بذمة العميل
      };
    });
  }, [customers, sales, startDate, endDate]);

  // Filtered ledger entries
  const filteredLedger = useMemo(() => {
    return customerLedger.filter(entry => {
      if (balanceFilter === 'debt_only' && entry.balance <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = entry.customer.name.toLowerCase().includes(q);
        const matchesPhone = (entry.customer.phone || '').includes(q);
        const matchesAddr = (entry.customer.address || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesAddr) return false;
      }
      return true;
    }).sort((a, b) => b.balance - a.balance);
  }, [customerLedger, balanceFilter, searchQuery]);

  // Overall totals across customers
  const overallTotals = useMemo(() => {
    let totalSpent = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let indebtedCustomersCount = 0;

    for (const entry of customerLedger) {
      totalSpent += entry.totalSpent;
      totalPaid += entry.totalPaid;
      totalDebt += entry.balance;
      if (entry.balance > 0) indebtedCustomersCount++;
    }

    return {
      totalSpent,
      totalPaid,
      totalDebt,
      indebtedCustomersCount,
      totalCustomersCount: customers.length,
    };
  }, [customerLedger, customers]);

  // Currently selected customer detail for account statement
  const selectedCustomerDetail = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerLedger.find(e => e.customer.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customerLedger]);

  const handleExportCsv = () => {
    const periodSlug = `${startDate}_إلى_${endDate}`;

    if (selectedCustomerDetail) {
      // Export single customer statement
      const headers = ['رقم الفاتورة', 'التاريخ', 'النوع', 'تفاصيل الجهاز / القطع', 'إجمالي الفاتورة', 'المسدد من العميل', 'المتبقي (الرصيد)', 'حالة السداد'];
      const rows = selectedCustomerDetail.sales.map(s => {
        const paid = s.paidAmount || 0;
        return [
          s.invoiceNumber,
          s.date,
          s.saleType === 'direct' ? 'بيع مباشر' : 'صيانة',
          s.maintenance ? `${s.maintenance.brand} ${s.maintenance.deviceType} (${s.maintenance.faultDescription})` : s.items.map(i => i.partNumber).join(', '),
          s.totalAmount,
          paid,
          Math.max(0, s.totalAmount - paid),
          s.paymentStatus === 'paid' ? 'مسدد' : s.paymentStatus === 'partial' ? 'سداد جزئي' : 'غير مسدد'
        ];
      });
      exportTableToCsv(`كشف_حساب_العميل_${selectedCustomerDetail.customer.name}_${periodSlug}`, headers, rows);
    } else {
      // Export all customers ledger
      const headers = ['اسم العميل', 'الهاتف', 'العنوان', 'مبيعات مباشرة', 'عمليات صيانة', 'إجمالي التعاملات', 'المسدد منه', 'الرصيد المستحق (دين بذمته)', 'حالة الحساب'];
      const rows = filteredLedger.map(e => [
        e.customer.name,
        e.customer.phone || '—',
        e.customer.address || '—',
        e.directCount,
        e.maintCount,
        e.totalSpent,
        e.totalPaid,
        e.balance,
        e.balance === 0 ? 'خالص' : 'مدين بذمته مبالغ'
      ]);
      exportTableToCsv(`تقرير_أرصدة_وحسابات_العملاء_${periodSlug}`, headers, rows);
    }
  };

  const printConfig = useMemo(() => {
    const periodLabel = `من ${startDate} إلى ${endDate}`;

    if (selectedCustomerDetail) {
      return {
        title: `كشف حساب تفصيلي للعميل: ${selectedCustomerDetail.customer.name}`,
        summaryCards: [
          { label: 'إجمالي قيمة التعاملات', value: `${selectedCustomerDetail.totalSpent.toLocaleString()} ${settings.currency}` },
          { label: 'المسدد من العميل', value: `${selectedCustomerDetail.totalPaid.toLocaleString()} ${settings.currency}` },
          { label: 'الرصيد المتبقي بذمته (دين)', value: `${selectedCustomerDetail.balance.toLocaleString()} ${settings.currency}` },
          { label: 'عدد العمليات', value: `${selectedCustomerDetail.totalOperations} عمليات` },
        ],
        headers: ['رقم الفاتورة', 'التاريخ', 'النوع', 'تفاصيل الجهاز / القطع', 'قيمة الفاتورة', 'المسدد', 'المتبقي', 'الحالة'],
        rows: selectedCustomerDetail.sales.map(s => {
          const paid = s.paidAmount || 0;
          const rem = Math.max(0, s.totalAmount - paid);
          return [
            s.invoiceNumber,
            s.date,
            s.saleType === 'direct' ? 'بيع مباشر' : 'صيانة جهاز',
            s.maintenance ? `${s.maintenance.brand} ${s.maintenance.deviceType}` : s.items.map(i => i.partNumber).join(', '),
            `${s.totalAmount.toLocaleString()} ${settings.currency}`,
            `${paid.toLocaleString()} ${settings.currency}`,
            `${rem.toLocaleString()} ${settings.currency}`,
            rem === 0 ? 'مسدد بالكامل' : paid > 0 ? 'سداد جزئي' : 'غير مسدد',
          ];
        }),
        alignments: ['right', 'center', 'center', 'right', 'left', 'left', 'left', 'center'] as ('right' | 'center' | 'left')[],
      };
    }

    return {
      title: 'تقرير أرصدة ومستحقات العملاء الشامل',
      summaryCards: [
        { label: 'إجمالي تعاملات العملاء', value: `${overallTotals.totalSpent.toLocaleString()} ${settings.currency}` },
        { label: 'المحصل نقداً من العملاء', value: `${overallTotals.totalPaid.toLocaleString()} ${settings.currency}` },
        { label: 'إجمالي الديون المستحقة على العملاء', value: `${overallTotals.totalDebt.toLocaleString()} ${settings.currency}` },
        { label: 'عملاء عليهم ديون بذمتهم', value: `${overallTotals.indebtedCustomersCount} عميل` },
      ],
      headers: ['اسم العميل', 'الهاتف', 'العمليات', 'إجمالي التعاملات', 'المسدد منه', 'رصيد العميل (دين بذمته)', 'حالة الحساب'],
      rows: filteredLedger.map(e => [
        e.customer.name,
        e.customer.phone || '—',
        `${e.totalOperations} (مباشر: ${e.directCount} • صيانة: ${e.maintCount})`,
        `${e.totalSpent.toLocaleString()} ${settings.currency}`,
        `${e.totalPaid.toLocaleString()} ${settings.currency}`,
        `${e.balance.toLocaleString()} ${settings.currency}`,
        e.balance === 0 ? 'خالص ✓' : 'مدين بذمته مبالغ ⚠️',
      ]),
      alignments: ['right', 'center', 'right', 'left', 'left', 'left', 'center'] as ('right' | 'center' | 'left')[],
    };
  }, [selectedCustomerDetail, filteredLedger, overallTotals, settings, startDate, endDate]);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي تعاملات العملاء</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {overallTotals.totalSpent.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            من {overallTotals.totalCustomersCount} عملاء مسجلين
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold text-slate-400">المبالغ المسددة من العملاء</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {overallTotals.totalPaid.toLocaleString()} <span className="text-xs font-normal text-emerald-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            إيراد نقدي محصل بالكامل
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي ديون العملاء (متبقي)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {overallTotals.totalDebt.toLocaleString()} <span className="text-xs font-normal text-amber-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            مبالغ مستحقة للورشة على العملاء
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold text-slate-400">عملاء بذمتهم مبالغ معلقة</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {overallTotals.indebtedCustomersCount} <span className="text-xs font-normal text-purple-400">عملاء</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            من أصل {overallTotals.totalCustomersCount} عميل
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
              placeholder="بحث باسم العميل، الهاتف، أو العنوان..."
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
            <option value="all">جميع العملاء ({customers.length})</option>
            <option value="debt_only">عملاء عليهم ديون بذمتهم فقط ({overallTotals.indebtedCustomersCount})</option>
          </select>

          {selectedCustomerId && (
            <button
              onClick={() => setSelectedCustomerId(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition cursor-pointer"
            >
              ← العودة لجميع العملاء
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

      {/* VIEW 1: Individual Customer Statement if selected */}
      {selectedCustomerDetail ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-base">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{selectedCustomerDetail.customer.name}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span>هاتف: {selectedCustomerDetail.customer.phone || '—'}</span>
                  {selectedCustomerDetail.customer.address && <span>• {selectedCustomerDetail.customer.address}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-center sm:text-right">
                <span className="text-[10px] text-slate-400 block">إجمالي تعاملاته</span>
                <span className="text-sm font-black text-white font-mono">
                  {selectedCustomerDetail.totalSpent.toLocaleString()} {settings.currency}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-[10px] text-slate-400 block">المسدد منه</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {selectedCustomerDetail.totalPaid.toLocaleString()} {settings.currency}
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-[10px] text-amber-400 block font-bold">الرصيد المتبقي بذمته</span>
                <span className="text-sm font-black text-amber-300 font-mono">
                  {selectedCustomerDetail.balance.toLocaleString()} {settings.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Customer's Invoices Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-300">
              فواتير المبيعات وعمليات الصيانة لهذا العميل خلال الفترة
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">رقم الفاتورة</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">النوع</th>
                    <th className="py-2.5 px-3">تفاصيل الصيانة / القطع</th>
                    <th className="py-2.5 px-3 text-left">قيمة الفاتورة</th>
                    <th className="py-2.5 px-3 text-left">المسدد</th>
                    <th className="py-2.5 px-3 text-left">المتبقي (الرصيد)</th>
                    <th className="py-2.5 px-3 text-center">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {selectedCustomerDetail.sales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        لا توجد فواتير مسجلة لهذا العميل في الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    selectedCustomerDetail.sales.map(s => {
                      const paid = s.paidAmount || 0;
                      const rem = Math.max(0, s.totalAmount - paid);
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{s.invoiceNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{s.date}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              s.saleType === 'direct' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {s.saleType === 'direct' ? 'مباشر' : 'صيانة'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                            {s.maintenance ? (
                              <span>{s.maintenance.brand} {s.maintenance.deviceType} ({s.maintenance.faultDescription})</span>
                            ) : (
                              <span>{s.items.map(i => i.partNumber).join(', ')}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-white">{s.totalAmount.toLocaleString()} {settings.currency}</td>
                          <td className="py-2.5 px-3 text-left font-mono text-emerald-400 font-semibold">{paid.toLocaleString()}</td>
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
        /* VIEW 2: All Customers Ledger Table */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3">اسم العميل</th>
                  <th className="py-3 px-3">رقم الهاتف</th>
                  <th className="py-3 px-3">العنوان</th>
                  <th className="py-3 px-3 text-center">المبيعات المباشرة</th>
                  <th className="py-3 px-3 text-center">عمليات الصيانة</th>
                  <th className="py-3 px-3 text-left">إجمالي التعاملات</th>
                  <th className="py-3 px-3 text-left">المسدد منه</th>
                  <th className="py-3 px-3 text-left">رصيد العميل (دين بذمته)</th>
                  <th className="py-3 px-3 text-center">حالة الحساب</th>
                  <th className="py-3 px-3 text-center w-24">كشف الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      لا يوجد عملاء مطابقون للتصفية والبحث
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((entry, idx) => (
                    <tr key={entry.customer.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-white">
                        <button
                          onClick={() => setSelectedCustomerId(entry.customer.id)}
                          className="hover:text-cyan-300 text-right cursor-pointer"
                        >
                          {entry.customer.name}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{entry.customer.phone || '—'}</td>
                      <td className="py-3 px-3 text-slate-400">{entry.customer.address || '—'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                        {entry.directCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-400">
                        {entry.maintCount}
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-black text-white">
                        {entry.totalSpent.toLocaleString()} {settings.currency}
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
                            مدين بذمته ⚠️
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedCustomerId(entry.customer.id)}
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
        footerNote="كشف حساب وأرصدة العملاء المعتمد لمتابعة المبيعات والديون المستحقة للورشة."
      />
    </div>
  );
};

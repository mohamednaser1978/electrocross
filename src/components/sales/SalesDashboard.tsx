import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Plus, Search, Filter, Printer, Trash2, 
  Wrench, ShoppingBag, DollarSign, TrendingUp, CheckCircle2,
  Clock, AlertCircle, Sparkles, ChevronDown, PackageCheck, Eye, Edit3
} from 'lucide-react';
import { Sale, FinancialStats, MaintenanceStatus, WorkshopSettings, MaintenanceWorkflowStatus } from '../../db/types';

interface SalesDashboardProps {
  sales: Sale[];
  financialStats: FinancialStats;
  settings: WorkshopSettings;
  onOpenAddDirectSale: () => void;
  onOpenAddMaintenanceSale: () => void;
  onEditSale?: (sale: Sale) => void;
  onPrintSale: (sale: Sale) => void;
  onCollectPayment?: (sale: Sale) => void;
  onUpdateStatus: (saleId: number, status: MaintenanceWorkflowStatus | MaintenanceStatus) => void;
  onDeleteSale: (saleId: number) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  sales,
  financialStats,
  settings,
  onOpenAddDirectSale,
  onOpenAddMaintenanceSale,
  onEditSale,
  onPrintSale,
  onCollectPayment,
  onUpdateStatus,
  onDeleteSale,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'maintenance' | 'unpaid' | 'suspended'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MaintenanceStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Type or unpaid filter
      if (filterType === 'unpaid') {
        const rem = Math.max(0, s.totalAmount - (s.paidAmount || 0));
        if (rem <= 0) return false;
      } else if (filterType === 'suspended') {
        if (!s.isSuspended && !s.maintenance?.isSuspended) {
          return false;
        }
      } else if (filterType !== 'all' && s.saleType !== filterType) {
        return false;
      }
      // Status filter (only applies to maintenance)
      if (statusFilter !== 'all') {
        if (s.saleType !== 'maintenance' || s.maintenance?.status !== statusFilter) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInvoice = s.invoiceNumber.toLowerCase().includes(q);
        const matchesCustomer = s.customerName.toLowerCase().includes(q) || (s.customerPhone || '').includes(q);
        const matchesDevice = s.maintenance ? `${s.maintenance.brand} ${s.maintenance.deviceType} ${s.maintenance.modelOrBoard} ${s.maintenance.faultDescription}`.toLowerCase().includes(q) : false;
        const matchesParts = s.items.some(i => i.partNumber.toLowerCase().includes(q));
        const matchesTechnician = s.maintenance?.technicianName ? s.maintenance.technicianName.toLowerCase().includes(q) : false;
        if (!matchesInvoice && !matchesCustomer && !matchesDevice && !matchesParts && !matchesTechnician) {
          return false;
        }
      }
      return true;
    });
  }, [sales, filterType, statusFilter, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Financial KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي الإيرادات</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {financialStats.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {financialStats.totalSalesCount} عملية مسجلة
          </div>
        </div>

        {/* Direct Sales */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold text-slate-400">المبيعات المباشرة</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {financialStats.directSalesRevenue.toLocaleString()} <span className="text-xs font-normal text-emerald-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {financialStats.directSalesCount} بيع قطع بدون صيانة
          </div>
        </div>

        {/* Maintenance Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إيراد الصيانة والأجهزة</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {financialStats.maintenanceRevenue.toLocaleString()} <span className="text-xs font-normal text-amber-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {financialStats.maintenanceCount} عملية صيانة متكاملة
          </div>
        </div>

        {/* Labor Fees Earned */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold text-slate-400">أجور الفنيين والتركيب</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
            {financialStats.totalLaborEarned.toLocaleString()} <span className="text-xs font-normal text-purple-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            صافي عائد مهارة العمل
          </div>
        </div>

        {/* Total Net Profit */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/40 shadow-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-xs font-bold text-cyan-300">صافي الأرباح المحققة</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-200 font-mono">
            +{financialStats.totalProfit.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            بعد خصم تكاليف القطع والمصاريف
          </div>
        </div>
      </div>

      {/* Action Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Buttons for creating sales */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddDirectSale}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>+ بيع مباشر سريع</span>
          </button>

          <button
            onClick={onOpenAddMaintenanceSale}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition active:scale-95 cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>+ فاتورة وعملية صيانة</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الفاتورة، العميل، الهاتف، نوع الجهاز، أو القطعة..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          تصفية حسب النوع:
        </span>
        <button
          onClick={() => { setFilterType('all'); setStatusFilter('all'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filterType === 'all'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          الكل ({sales.length})
        </button>
        <button
          onClick={() => { setFilterType('direct'); setStatusFilter('all'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filterType === 'direct'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          مبيعات مباشرة فقط ({financialStats.directSalesCount})
        </button>
        <button
          onClick={() => { setFilterType('maintenance'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filterType === 'maintenance'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          عمليات صيانة فقط ({financialStats.maintenanceCount})
        </button>
        <button
          onClick={() => { setFilterType('unpaid'); setStatusFilter('all'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filterType === 'unpaid'
              ? 'bg-amber-500 text-slate-950 font-black'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          ديون متبقية للتحصيل ({sales.filter(s => s.totalAmount > (s.paidAmount || 0)).length})
        </button>
        <button
          onClick={() => { setFilterType('suspended'); setStatusFilter('all'); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            filterType === 'suspended'
              ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-950'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          ⏳ فواتير معلقة ({sales.filter(s => s.isSuspended || s.maintenance?.isSuspended).length})
        </button>

        {filterType === 'maintenance' && (
          <div className="flex items-center gap-1.5 mr-auto">
            <span className="text-[11px] text-slate-500">الحالة:</span>
            {(['all', 'received', 'in_progress', 'ready', 'delivered'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'الكل' :
                 st === 'received' ? 'قيد الفحص' :
                 st === 'in_progress' ? 'قيد الإصلاح' :
                 st === 'ready' ? 'جاهز للتسليم' : 'تم التسليم'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sales List Table */}
      {filteredSales.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">لا توجد عمليات مبيعات مطابقة</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            يمكنك تسجيل عملية بيع مباشر لقطع إلكترونية أو فتح بطاقة صيانة جهاز جديدة باستخدام الأزرار أعلاه.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale) => {
            const isMaintenance = sale.saleType === 'maintenance';
            const remaining = Math.max(0, sale.totalAmount - sale.paidAmount);

            return (
              <div
                key={sale.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4"
              >
                {/* Left/Main Column: Badges, Invoice No, Customer, Device */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sale Type Badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      isMaintenance
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {isMaintenance ? (
                        <>
                          <Wrench className="w-3.5 h-3.5" />
                          <span>صيانة أجهزة</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>بيع مباشر</span>
                        </>
                      )}
                    </span>

                    {/* Invoice Number & Date */}
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {sale.invoiceNumber}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {sale.date}
                    </span>

                    {/* Maintenance Status Badge & Switcher */}
                    {isMaintenance && sale.maintenance && (
                      <div className="relative inline-flex items-center gap-1 mr-auto sm:mr-0">
                        <select
                          value={sale.maintenance.status}
                          onChange={e => onUpdateStatus(sale.id, e.target.value as MaintenanceWorkflowStatus)}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer outline-none bg-slate-900 ${
                            sale.maintenance.status === 'delivered'
                              ? 'text-teal-300 border-teal-500/40 bg-teal-950/60'
                              : sale.maintenance.status === 'ready'
                              ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60'
                              : sale.maintenance.status === 'under_repair'
                              ? 'text-orange-300 border-orange-500/40 bg-orange-950/60'
                              : sale.maintenance.status === 'awaiting_part'
                              ? 'text-purple-300 border-purple-500/40 bg-purple-950/60'
                              : sale.maintenance.status === 'awaiting_approval'
                              ? 'text-pink-300 border-pink-500/40 bg-pink-950/60'
                              : sale.maintenance.status === 'under_inspection'
                              ? 'text-yellow-300 border-yellow-500/40 bg-yellow-950/60'
                              : 'text-blue-300 border-blue-500/40 bg-blue-950/60'
                          }`}
                        >
                          <option value="in_safes">📦 في الأمانات</option>
                          <option value="under_inspection">🔬 قيد الفحص والتشخيص</option>
                          <option value="under_repair">🔧 قيد الصيانة والإصلاح</option>
                          <option value="awaiting_part">⏳ بانتظار قطعة غيار</option>
                          <option value="awaiting_approval">📋 بانتظار موافقة الزبون</option>
                          <option value="ready">✨ جاهز للتسليم</option>
                          <option value="delivered">🤝 تم التسليم للزبون</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Customer & Device info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {sale.customerName}
                      </span>
                      {sale.customerPhone && sale.customerPhone !== '—' && (
                        <span className="text-xs text-slate-400 font-mono">
                          ({sale.customerPhone})
                        </span>
                      )}
                    </div>

                    {isMaintenance && sale.maintenance && (
                      <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-cyan-300">
                          {sale.maintenance.brand} {sale.maintenance.deviceType}
                        </span>
                        {sale.maintenance.modelOrBoard && (
                          <span className="text-slate-400 font-mono">
                            • بوردة: {sale.maintenance.modelOrBoard}
                          </span>
                        )}
                        <span className="text-slate-500 truncate max-w-md">
                          ({sale.maintenance.faultDescription})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Suspended Invoice Note */}
                  {(sale.isSuspended || sale.maintenance?.isSuspended) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold flex items-center gap-1 text-[11px]">
                          ⏳ فاتورة معلقة (قيد الانتظار)
                        </span>
                        {(sale.suspensionReason || sale.maintenance?.suspensionReason) && (
                          <span className="text-purple-200 text-[11px]">
                            السبب: {sale.suspensionReason || sale.maintenance?.suspensionReason}
                          </span>
                        )}
                        {(sale.requestedParts || sale.maintenance?.requestedParts) && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
                            ⚠️ القطع المطلوبة: {sale.requestedParts || sale.maintenance?.requestedParts}
                          </span>
                        )}
                      </div>
                      {onEditSale && (
                        <button
                          onClick={() => onEditSale(sale)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل واستكمال الفاتورة</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Spare parts badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-semibold">قطع الغيار:</span>
                    {sale.items.length === 0 ? (
                      <span className="text-[10px] text-slate-500">لا يوجد قطع (إصلاح برمجي / لحام)</span>
                    ) : (
                      sale.items.map(item => (
                        <span 
                          key={item.id} 
                          className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1"
                        >
                          <span className="font-bold text-cyan-400">{item.partNumber}</span>
                          <span className="text-slate-500">×{item.quantity}</span>
                        </span>
                      ))
                    )}
                    {isMaintenance && sale.maintenance && sale.maintenance.technicianName && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-purple-200 text-[10px] font-bold flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-purple-400" />
                        <span>المهندس: {sale.maintenance.technicianName}</span>
                      </span>
                    )}
                    {isMaintenance && sale.maintenance && sale.maintenance.technicianFee > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                        أجرة يد: {sale.maintenance.technicianFee.toLocaleString()} {settings.currency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column: Financial breakdown & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
                  {/* Financial totals */}
                  <div className="text-left lg:text-left space-y-1">
                    <div className="text-xs text-slate-400">الإيراد الإجمالي</div>
                    <div className="text-base sm:text-lg font-black text-white font-mono">
                      {sale.totalAmount.toLocaleString()} <span className="text-xs text-cyan-400">{settings.currency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-slate-500">التكلفة: {sale.totalCost.toLocaleString()}</span>
                      <span className="text-emerald-400 font-bold">الربح: +{sale.profit.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px]">
                      {remaining > 0 ? (
                        <span className="text-amber-400 font-semibold">متبقي: {remaining.toLocaleString()} {settings.currency}</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">مدفوع بالكامل ✓</span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    {onEditSale && (
                      <button
                        onClick={() => onEditSale(sale)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
                          sale.isSuspended || sale.maintenance?.isSuspended
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950 border border-purple-500/50'
                            : 'bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-slate-700'
                        }`}
                        title={sale.isSuspended || sale.maintenance?.isSuspended ? "تعديل الفاتورة المعلقة والقطع والبيانات" : "تعديل الفاتورة"}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{sale.isSuspended || sale.maintenance?.isSuspended ? 'تعديل المعلقة' : 'تعديل'}</span>
                      </button>
                    )}

                    {remaining > 0 && onCollectPayment && (
                      <button
                        onClick={() => onCollectPayment(sale)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition cursor-pointer"
                        title="تحصيل دفعة أو باقي الحساب من العميل"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>تحصيل دفعة</span>
                      </button>
                    )}

                    <button
                      onClick={() => onPrintSale(sale)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
                      title="عرض وطباعة الفاتورة"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">طباعة</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف هذه العملية (${sale.invoiceNumber})؟ سيتم إعادة قطع الغيار إلى المخزون تلقائياً.`)) {
                          onDeleteSale(sale.id);
                        }
                      }}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition cursor-pointer"
                      title="حذف العملية واسترجاع المخزون"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

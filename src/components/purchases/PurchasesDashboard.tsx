import React, { useState, useMemo } from 'react';
import { 
  Truck, Plus, Search, Calendar, DollarSign, Building2, 
  Trash2, Package, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Filter, CreditCard
} from 'lucide-react';
import { Purchase, Supplier, WorkshopSettings } from '../../db/types';

interface PurchasesDashboardProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  settings: WorkshopSettings;
  onOpenAddPurchase: () => void;
  onPaySupplier?: (purchase: Purchase) => void;
  onDeletePurchase: (id: number) => void;
}

export const PurchasesDashboard: React.FC<PurchasesDashboardProps> = ({
  purchases,
  suppliers,
  settings,
  onOpenAddPurchase,
  onPaySupplier,
  onDeletePurchase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<number | null>(null);

  const totalPurchasesCost = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  }, [purchases]);

  const totalPaidToSuppliers = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount), 0);
  }, [purchases]);

  const totalDebtToSuppliers = useMemo(() => {
    return purchases.reduce((sum, p) => {
      const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
      return sum + Math.max(0, p.totalAmount - paid);
    }, 0);
  }, [purchases]);

  const totalItemsCount = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.quantity, 0), 0);
  }, [purchases]);

  const duePurchasesCount = useMemo(() => {
    return purchases.filter(p => {
      const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
      return p.totalAmount > paid;
    }).length;
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
      const remaining = Math.max(0, p.totalAmount - paid);

      if (statusFilter === 'due' && remaining <= 0) return false;
      if (statusFilter === 'paid' && remaining > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInvoice = p.invoiceNumber.toLowerCase().includes(q);
        const matchesSupplier = p.supplierName.toLowerCase().includes(q);
        const matchesItems = p.items.some(i => i.partNumber.toLowerCase().includes(q));
        if (!matchesInvoice && !matchesSupplier && !matchesItems) return false;
      }

      return true;
    });
  }, [purchases, statusFilter, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي قيمة المشتريات</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalPurchasesCost.toLocaleString()} <span className="text-xs font-normal text-cyan-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {purchases.length} فواتير توريد مسجلة
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold text-slate-400">المسدد نقداً للموردين</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {totalPaidToSuppliers.toLocaleString()} <span className="text-xs font-normal text-emerald-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            تم صرفها وسدادها فعلياً
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold text-slate-400">ديون مستحقة للموردين</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {totalDebtToSuppliers.toLocaleString()} <span className="text-xs font-normal text-amber-400">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            {duePurchasesCount} فواتير بانتظار استكمال السداد
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي القطع الموردة</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalItemsCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">قطعة</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            تمت إضافتها لأرصدة المستودع
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={onOpenAddPurchase}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل فاتورة شراء وتوريد جديدة</span>
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الفاتورة، اسم المورد، أو رمز القطعة..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          حالة السداد:
        </span>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          جميع الفواتير ({purchases.length})
        </button>
        <button
          onClick={() => setStatusFilter('due')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            statusFilter === 'due'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          فواتير بانتظار السداد / آجل ({duePurchasesCount})
        </button>
        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            statusFilter === 'paid'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          مسددة بالكامل ({purchases.length - duePurchasesCount})
        </button>
      </div>

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
            <Truck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">لا توجد فواتير توريد مطابقة</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            سجل فواتير توريد القطع من الموردين لتغذية المخزون وتتبع تكاليف المستودع وسداد الذمم بدقة.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPurchases.map((purchase) => {
            const isExpanded = expandedPurchaseId === purchase.id;
            const paid = typeof purchase.paidAmount === 'number' ? purchase.paidAmount : purchase.totalAmount;
            const remaining = Math.max(0, purchase.totalAmount - paid);

            return (
              <div 
                key={purchase.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition overflow-hidden shadow-md"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                        فاتورة شراء
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {purchase.invoiceNumber}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {purchase.date}
                      </span>

                      {/* Payment Status Badge */}
                      {remaining === 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          ✓ مسددة بالكامل
                        </span>
                      ) : paid > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                          ⏳ سداد جزئي
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          ⚠️ دين آجل للمورد
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-white">
                        {purchase.supplierName}
                      </span>
                    </div>

                    {purchase.notes && (
                      <p className="text-xs text-slate-400">
                        {purchase.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-left space-y-0.5">
                      <span className="text-[11px] text-slate-400 block">إجمالي الفاتورة:</span>
                      <span className="text-base sm:text-lg font-black text-white font-mono block">
                        {purchase.totalAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
                      </span>
                      <div className="text-[11px] font-mono">
                        {remaining > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">مدفوع: {paid.toLocaleString()}</span>
                            <span className="text-amber-400 font-bold">متبقي: {remaining.toLocaleString()} {settings.currency}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-400 font-bold">مسدد بالكامل ✓</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {remaining > 0 && onPaySupplier && (
                        <button
                          onClick={() => onPaySupplier(purchase)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm shadow-cyan-950 transition cursor-pointer"
                          title="سداد دفعة للمورد"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>سداد دفعة</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
                      >
                        <span>{purchase.items.length} أصناف</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف فاتورة الشراء (${purchase.invoiceNumber})؟`)) {
                            onDeletePurchase(purchase.id);
                          }
                        }}
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                        title="حذف الفاتورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Item Breakdown */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-slate-950/60 border-t border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead className="text-slate-500 border-b border-slate-800 pb-1">
                        <tr>
                          <th className="py-1.5 font-normal">القطعة الإلكترونية</th>
                          <th className="py-1.5 font-normal text-center">الكمية المضافة</th>
                          <th className="py-1.5 font-normal text-left">سعر التكلفة (الشراء)</th>
                          <th className="py-1.5 font-normal text-left">سعر البيع بالمستودع 🏷️</th>
                          <th className="py-1.5 font-normal text-left">إجمالي التكلفة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {purchase.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 font-mono font-bold text-cyan-300">{item.partNumber}</td>
                            <td className="py-2 text-center font-mono font-bold text-emerald-400">+{item.quantity}</td>
                            <td className="py-2 text-left font-mono">{item.unitCost.toLocaleString()} {settings.currency}</td>
                            <td className="py-2 text-left font-mono text-cyan-400 font-bold">
                              {item.salePrice ? `${item.salePrice.toLocaleString()} ${settings.currency}` : '—'}
                            </td>
                            <td className="py-2 text-left font-mono font-bold">{item.totalCost.toLocaleString()} {settings.currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Users, Plus, Search, Phone, MapPin, Edit3, 
  Trash2, ShoppingBag, Wrench, DollarSign, Calendar
} from 'lucide-react';
import { Customer, Sale, WorkshopSettings } from '../../db/types';

interface CustomersDashboardProps {
  customers: Customer[];
  sales: Sale[];
  settings: WorkshopSettings;
  onOpenAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onCollectPayment?: (sale: Sale) => void;
  onDeleteCustomer: (id: number) => void;
}

export const CustomersDashboard: React.FC<CustomersDashboardProps> = ({
  customers,
  sales,
  settings,
  onOpenAddCustomer,
  onEditCustomer,
  onCollectPayment,
  onDeleteCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Compute stats per customer including debts
  const customerStats = useMemo(() => {
    const map = new Map<number, { directCount: number; maintCount: number; totalSpent: number; debt: number; oldestDueSale?: Sale }>();
    for (const c of customers) {
      map.set(c.id, { directCount: 0, maintCount: 0, totalSpent: 0, debt: 0 });
    }

    for (const s of sales) {
      if (s.customerId && map.has(s.customerId)) {
        const entry = map.get(s.customerId)!;
        if (s.saleType === 'direct') {
          entry.directCount++;
        } else {
          entry.maintCount++;
        }
        entry.totalSpent += s.totalAmount;
        const rem = Math.max(0, s.totalAmount - (s.paidAmount || 0));
        entry.debt += rem;
        if (rem > 0 && !entry.oldestDueSale) {
          entry.oldestDueSale = s;
        }
      }
    }
    return map;
  }, [customers, sales]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={onOpenAddCustomer}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الهاتف، أو العنوان..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">لا يوجد عملاء مطابقون</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            يمكنك تسجيل عملاء جدد لتتبع تاريخ مشترياتهم وأجهزتهم التي تمت صيانتها.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const stats = customerStats.get(cust.id) || { directCount: 0, maintCount: 0, totalSpent: 0, debt: 0 };

            return (
              <div 
                key={cust.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-base">
                        {cust.name.slice(0, 1)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                          {cust.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          انضم: {cust.createdAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditCustomer(cust)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="تعديل العميل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {cust.id !== 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف العميل (${cust.name})؟`)) {
                              onDeleteCustomer(cust.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                          title="حذف العميل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-300">{cust.phone || '—'}</span>
                    </div>
                    {cust.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cust.address}</span>
                      </div>
                    )}
                  </div>

                  {cust.notes && (
                    <p className="text-[11px] text-slate-400 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 leading-relaxed">
                      {cust.notes}
                    </p>
                  )}

                  {/* Customer Debt Banner if remaining debt exists */}
                  {stats.debt > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-amber-400/90 block font-bold">متبقي بذمته (ديون مستحقة):</span>
                        <span className="font-black text-amber-300 font-mono text-xs">
                          {stats.debt.toLocaleString()} {settings.currency}
                        </span>
                      </div>
                      {onCollectPayment && stats.oldestDueSale && (
                        <button
                          onClick={() => onCollectPayment(stats.oldestDueSale!)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer shadow-sm"
                        >
                          تحصيل دفعة
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom customer activity metrics */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-400" title="مبيعات مباشرة">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-white">{stats.directCount}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400" title="عمليات صيانة">
                      <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-white">{stats.maintCount}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block text-left">إجمالي التعاملات</span>
                    <span className="font-black text-cyan-400 font-mono text-xs">
                      {stats.totalSpent.toLocaleString()} {settings.currency}
                    </span>
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

import React, { useState, useMemo } from 'react';
import { 
  Building2, Plus, Search, Phone, MapPin, Edit3, 
  Trash2, Truck, DollarSign, Calendar
} from 'lucide-react';
import { Supplier, Purchase, WorkshopSettings } from '../../db/types';

interface SuppliersDashboardProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  settings: WorkshopSettings;
  onOpenAddSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onPaySupplier?: (purchase: Purchase) => void;
  onDeleteSupplier: (id: number) => void;
}

export const SuppliersDashboard: React.FC<SuppliersDashboardProps> = ({
  suppliers,
  purchases,
  settings,
  onOpenAddSupplier,
  onEditSupplier,
  onPaySupplier,
  onDeleteSupplier,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Stats per supplier
  const supplierStats = useMemo(() => {
    const map = new Map<number, { count: number; total: number; paid: number; debt: number; oldestDuePurchase?: Purchase }>();
    for (const sup of suppliers) {
      map.set(sup.id, { count: 0, total: 0, paid: 0, debt: 0 });
    }

    for (const p of purchases) {
      if (p.supplierId && map.has(p.supplierId)) {
        const entry = map.get(p.supplierId)!;
        const paid = typeof p.paidAmount === 'number' ? p.paidAmount : p.totalAmount;
        const rem = Math.max(0, p.totalAmount - paid);

        entry.count++;
        entry.total += p.totalAmount;
        entry.paid += paid;
        entry.debt += rem;

        if (rem > 0 && !entry.oldestDuePurchase) {
          entry.oldestDuePurchase = p;
        }
      }
    }
    return map;
  }, [suppliers, purchases]);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const q = searchQuery.toLowerCase();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.company && s.company.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  }, [suppliers, searchQuery]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={onOpenAddSupplier}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مورد جديد</span>
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم المورد، الشركة، أو رقم الهاتف..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
            <Building2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">لا يوجد موردون مطابقون</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            سجل موردي القطع ومصادر المكونات الإلكترونية لتنظيم فواتير الشراء والتوريد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => {
            const stats = supplierStats.get(sup.id) || { count: 0, total: 0, paid: 0, debt: 0 };

            return (
              <div 
                key={sup.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-base">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                          {sup.name}
                        </h4>
                        {sup.company && (
                          <span className="text-[11px] text-cyan-400 block font-semibold">
                            {sup.company}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditSupplier(sup)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="تعديل المورد"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف المورد (${sup.name})؟`)) {
                            onDeleteSupplier(sup.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                        title="حذف المورد"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-300">{sup.phone || '—'}</span>
                    </div>
                    {sup.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{sup.address}</span>
                      </div>
                    )}
                  </div>

                  {sup.notes && (
                    <p className="text-[11px] text-slate-400 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 leading-relaxed">
                      {sup.notes}
                    </p>
                  )}

                  {/* Debt Banner if debt exists */}
                  {stats.debt > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-amber-400/90 block font-bold">مستحق بذمتنا للمورد:</span>
                        <span className="font-black text-amber-300 font-mono text-xs">
                          {stats.debt.toLocaleString()} {settings.currency}
                        </span>
                      </div>
                      {onPaySupplier && stats.oldestDuePurchase && (
                        <button
                          onClick={() => onPaySupplier(stats.oldestDuePurchase!)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition cursor-pointer"
                        >
                          سداد دفعة
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom activity stats */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{stats.count} فواتير توريد</span>
                  </span>

                  <div>
                    <span className="text-[10px] text-slate-500 block text-left">إجمالي المشتريات منه</span>
                    <span className="font-black text-emerald-400 font-mono text-xs">
                      {stats.total.toLocaleString()} {settings.currency}
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

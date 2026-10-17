import React, { useState } from 'react';
import { 
  BarChart3, Package, ShoppingCart, Truck, Building2, Users,
  Calendar, CalendarDays, RefreshCw, Layers, Wrench
} from 'lucide-react';
import { Component, Sale, Purchase, Customer, Supplier, WorkshopSettings } from '../../db/types';
import { DatePreset, getDateRangeFromPreset } from './reportUtils';
import { InventoryReportView } from './InventoryReportView';
import { SalesReportView } from './SalesReportView';
import { PurchasesReportView } from './PurchasesReportView';
import { SuppliersReportView } from './SuppliersReportView';
import { CustomersReportView } from './CustomersReportView';
import { MaintenanceReportView } from './MaintenanceReportView';

export type ReportCategory = 'inventory' | 'maintenance' | 'sales' | 'purchases' | 'suppliers' | 'customers';

interface ReportsDashboardProps {
  components: Component[];
  sales: Sale[];
  purchases: Purchase[];
  customers: Customer[];
  suppliers: Supplier[];
  settings: WorkshopSettings;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  components,
  sales,
  purchases,
  customers,
  suppliers,
  settings,
}) => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('inventory');
  
  // Date Range state for time-based reports
  const [datePreset, setDatePreset] = useState<DatePreset>('year');
  const initialRange = getDateRangeFromPreset('year');
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const range = getDateRangeFromPreset(preset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  const categories = [
    {
      id: 'inventory' as ReportCategory,
      title: 'تقارير المستودع والمخزون',
      subtitle: 'جرد المواد، تقييم التكلفة والبيع، وقيمة المخزون',
      icon: Package,
      badge: `${components.length} صنف`,
      color: 'from-amber-600 to-amber-700',
      activeBorder: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
    },
    {
      id: 'maintenance' as ReportCategory,
      title: 'تقارير الصيانة والأمانات',
      subtitle: 'حركة الأجهزة، إيراد الفني، كشف القطع المستبدلة، والأمانات',
      icon: Wrench,
      badge: 'صيانة وأمانات',
      color: 'from-orange-600 to-amber-700',
      activeBorder: 'border-orange-500/50 text-orange-400 bg-orange-500/10',
    },
    {
      id: 'sales' as ReportCategory,
      title: 'تقارير المبيعات',
      subtitle: 'إجمالي المبيعات، تفاصيل الفواتير، والأصناف الأكثر مبيعاً',
      icon: ShoppingCart,
      badge: `${sales.length} فاتورة`,
      color: 'from-cyan-600 to-blue-700',
      activeBorder: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
    },
    {
      id: 'purchases' as ReportCategory,
      title: 'تقارير المشتريات والتوريد',
      subtitle: 'حركة الشراء، الأصناف المورّدة، وفواتير الموردين',
      icon: Truck,
      badge: `${purchases.length} توريد`,
      color: 'from-emerald-600 to-teal-700',
      activeBorder: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'suppliers' as ReportCategory,
      title: 'تقارير الموردين وأرصدتهم',
      subtitle: 'أرصدة الموردين، المستحقات والديون، وكشف الحساب',
      icon: Building2,
      badge: `${suppliers.length} مورد`,
      color: 'from-violet-600 to-purple-700',
      activeBorder: 'border-violet-500/50 text-violet-400 bg-violet-500/10',
    },
    {
      id: 'customers' as ReportCategory,
      title: 'تقارير العملاء وأرصدتهم',
      subtitle: 'مسحوبات الزبائن، المبالغ المسددة، وأرصدة الديون',
      icon: Users,
      badge: `${customers.length} عميل`,
      color: 'from-pink-600 to-rose-700',
      activeBorder: 'border-pink-500/50 text-pink-400 bg-pink-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-2xl shadow-lg shadow-cyan-900/30 border border-cyan-400/20">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  مركز التقارير والإحصائيات الشاملة
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  لوحة المتابعة التحليلية
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                متابعة حركة المخزون وتقييمه، تحليل المبيعات والأرباح، سجل التوريد، وكشف أرصدة العملاء والموردين بدقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 self-stretch md:self-auto justify-between md:justify-start">
            <span className="text-slate-400">العملة المعتمدة:</span>
            <span className="font-bold text-cyan-400 font-mono">
              {settings.currency || 'د.ل'} ({settings.shopName || 'المتحكمات الكهربائية'})
            </span>
          </div>
        </div>
      </div>

      {/* 6 Main Report Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-3.5 rounded-2xl border text-right transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                isActive
                  ? 'bg-slate-900 border-cyan-500/70 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div
                  className={`p-2 rounded-xl transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/30'
                      : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {cat.badge}
                </span>
              </div>

              <div>
                <h3 className={`text-xs sm:text-sm font-black transition-colors ${
                  isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                }`}>
                  {cat.title}
                </h3>
                <p className={`text-[10px] line-clamp-1 mt-0.5 ${
                  isActive ? 'text-cyan-200/80' : 'text-slate-500'
                }`}>
                  {cat.subtitle}
                </p>
              </div>

              {isActive && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Global Date Range Controller (Used for Sales, Purchases, Suppliers, Customers) */}
      {activeCategory !== 'inventory' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>تحديد الفترة الزمنية للتقرير:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Presets */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
              {(
                [
                  { id: 'today', label: 'اليوم' },
                  { id: 'week', label: 'آخر 7 أيام' },
                  { id: 'month', label: 'هذا الشهر' },
                  { id: 'year', label: 'هذا العام' },
                  { id: 'all', label: 'كل الفترات' },
                ] as { id: DatePreset; label: string }[]
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    datePreset === p.id
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range Picker */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-mono text-xs"
              />
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-medium">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Render Active Category View */}
      <div className="animate-fade-in">
        {activeCategory === 'inventory' && (
          <InventoryReportView
            components={components}
            settings={settings}
          />
        )}

        {activeCategory === 'maintenance' && (
          <MaintenanceReportView
            settings={settings}
          />
        )}

        {activeCategory === 'sales' && (
          <SalesReportView
            sales={sales}
            settings={settings}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeCategory === 'purchases' && (
          <PurchasesReportView
            purchases={purchases}
            suppliers={suppliers}
            settings={settings}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeCategory === 'suppliers' && (
          <SuppliersReportView
            suppliers={suppliers}
            purchases={purchases}
            settings={settings}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeCategory === 'customers' && (
          <CustomersReportView
            customers={customers}
            sales={sales}
            settings={settings}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </div>
  );
};

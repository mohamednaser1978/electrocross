import React from 'react';
import { 
  Search, ShoppingCart, Truck, Users, Building2, Settings,
  Wrench, AlertTriangle, ShieldCheck, BarChart3
} from 'lucide-react';

export type MainTabType = 'catalog' | 'maintenance' | 'sales' | 'purchases' | 'customers' | 'suppliers' | 'reports' | 'settings';

interface NavigationTabsProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  lowStockCount: number;
  activeRepairsCount: number;
  maintenanceActiveCount?: number;
  shopName: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  lowStockCount,
  activeRepairsCount,
  maintenanceActiveCount = 0,
  shopName,
}) => {
  const tabs = [
    {
      id: 'catalog' as MainTabType,
      label: 'المستودع وبدائل القطع',
      sublabel: 'فحص التوافقية والبدائل',
      icon: Search,
      badge: lowStockCount > 0 ? `${lowStockCount} نواقص` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'maintenance' as MainTabType,
      label: 'الصيانة والأمانات',
      sublabel: 'استلام • فحص • تسليم',
      icon: Wrench,
      badge: maintenanceActiveCount > 0 ? `${maintenanceActiveCount} بالصيانة` : undefined,
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      id: 'sales' as MainTabType,
      label: 'المبيعات المباشرة',
      sublabel: 'بيع قطع وفواتير صيانة',
      icon: ShoppingCart,
      badge: activeRepairsCount > 0 ? `${activeRepairsCount} قيد الإصلاح` : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'purchases' as MainTabType,
      label: 'المشتريات والتوريد',
      sublabel: 'فواتير الشراء وتغذية المخزون',
      icon: Truck,
    },
    {
      id: 'customers' as MainTabType,
      label: 'العملاء',
      sublabel: 'سجل الزبائن والفنيين',
      icon: Users,
    },
    {
      id: 'suppliers' as MainTabType,
      label: 'الموردون',
      sublabel: 'شركات التوريد والمصادر',
      icon: Building2,
    },
    {
      id: 'reports' as MainTabType,
      label: 'التقارير الشاملة',
      sublabel: 'المخزون • المبيعات • الأرصدة',
      icon: BarChart3,
    },
    {
      id: 'settings' as MainTabType,
      label: 'إعدادات الورشة',
      sublabel: shopName || 'المتحكمات الكهربائية',
      icon: Settings,
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-2 shadow-lg">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[150px] sm:min-w-0 flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-right group relative cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-transform group-hover:scale-105 shrink-0 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-slate-800 text-cyan-400 group-hover:text-cyan-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold truncate block ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {tab.label}
                  </span>
                  {tab.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                      isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] truncate block ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>
                  {tab.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Search, ShoppingCart, Truck, Users, Building2, Settings,
  Wrench, BarChart3, Zap, ChevronLeft, ChevronRight, Sun, Moon,
  Menu, X, PanelRightClose, PanelRightOpen, ShieldCheck, HelpCircle
} from 'lucide-react';
import { MainTabType } from './NavigationTabs';

interface SidebarProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  lowStockCount: number;
  activeRepairsCount: number;
  maintenanceActiveCount?: number;
  shopName: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  lowStockCount,
  activeRepairsCount,
  maintenanceActiveCount = 0,
  shopName,
  theme,
  onToggleTheme,
}) => {
  const [hoveredTab, setHoveredTab] = useState<MainTabType | null>(null);

  const navItems = [
    {
      id: 'catalog' as MainTabType,
      label: 'المستودع وبدائل القطع',
      shortLabel: 'المستودع',
      sublabel: 'فحص التوافقية والبدائل',
      icon: Search,
      badge: lowStockCount > 0 ? `${lowStockCount} نواقص` : undefined,
      badgeDot: lowStockCount > 0,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'maintenance' as MainTabType,
      label: 'الصيانة والأمانات',
      shortLabel: 'الصيانة',
      sublabel: 'استلام • فحص • تسليم',
      icon: Wrench,
      badge: maintenanceActiveCount > 0 ? `${maintenanceActiveCount} بالصيانة` : undefined,
      badgeDot: maintenanceActiveCount > 0,
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    },
    {
      id: 'sales' as MainTabType,
      label: 'المبيعات المباشرة',
      shortLabel: 'المبيعات',
      sublabel: 'بيع قطع وفواتير صيانة',
      icon: ShoppingCart,
      badge: activeRepairsCount > 0 ? `${activeRepairsCount} قيد الإصلاح` : undefined,
      badgeDot: activeRepairsCount > 0,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      id: 'purchases' as MainTabType,
      label: 'المشتريات والتوريد',
      shortLabel: 'المشتريات',
      sublabel: 'فواتير الشراء وتغذية المخزون',
      icon: Truck,
    },
    {
      id: 'customers' as MainTabType,
      label: 'العملاء',
      shortLabel: 'العملاء',
      sublabel: 'سجل الزبائن والفنيين',
      icon: Users,
    },
    {
      id: 'suppliers' as MainTabType,
      label: 'الموردون',
      shortLabel: 'الموردون',
      sublabel: 'شركات التوريد والمصادر',
      icon: Building2,
    },
    {
      id: 'reports' as MainTabType,
      label: 'التقارير الشاملة',
      shortLabel: 'التقارير',
      sublabel: 'المخزون • المبيعات • الأرصدة',
      icon: BarChart3,
    },
    {
      id: 'settings' as MainTabType,
      label: 'إعدادات الورشة',
      shortLabel: 'الإعدادات',
      sublabel: shopName || 'المتحكمات الكهربائية',
      icon: Settings,
    },
  ];

  const handleItemClick = (id: MainTabType) => {
    onTabChange(id);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity animate-fade-in print:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`
          print:hidden
          z-50
          flex flex-col
          bg-slate-950/95 dark:bg-slate-950/95 light:bg-white
          border-l border-slate-800/80 dark:border-slate-800/80 light:border-slate-200
          transition-all duration-300 ease-in-out
          shrink-0
          shadow-2xl shadow-cyan-950/10

          /* Mobile drawer mode */
          fixed inset-y-0 right-0 h-full
          ${isMobileOpen ? 'translate-x-0 w-72' : 'translate-x-full'}

          /* Desktop persistent mode */
          lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0
          ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}
        `}
        dir="rtl"
      >
        {/* Top Header / Brand Logo */}
        <div className="p-4 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo Icon */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 fill-current text-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>

            {/* Brand Title & Prominent Workshop Branding (Observation 5) */}
            <div className={`transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white dark:text-white light:text-slate-900 font-sans leading-none">
                  ElectroCross Pro
                </span>
              </div>
              <div className="mt-1">
                <span className="inline-block text-[11px] font-black bg-gradient-to-l from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent truncate max-w-[150px] font-sans">
                  {shopName || 'المتحكمات الكهربائية'}
                </span>
              </div>
            </div>
          </div>

          {/* Close button on mobile / Collapse button on desktop */}
          <div className="flex items-center">
            {/* Mobile close */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop toggle collapse icon */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-slate-800/60 transition cursor-pointer"
              title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
              aria-label={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
            >
              {isCollapsed ? (
                <PanelRightOpen className="w-5 h-5 text-cyan-400" />
              ) : (
                <PanelRightClose className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredTab === item.id;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl
                    transition-all duration-200 cursor-pointer text-right group relative
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                      : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-800/70 dark:hover:bg-slate-800/70 light:hover:bg-slate-100 font-semibold'
                    }
                    ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
                  `}
                >
                  {/* Icon with relative badge indicator in collapsed mode */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div
                      className={`
                        p-1.5 rounded-xl transition-all duration-200
                        ${isActive 
                          ? 'bg-white/20 text-white scale-105' 
                          : 'text-cyan-400 dark:text-cyan-400 group-hover:text-white group-hover:scale-110'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Small badge dot in collapsed desktop mode */}
                    {isCollapsed && item.badgeDot && (
                      <span className="hidden lg:block absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-950 animate-pulse" />
                    )}
                  </div>

                  {/* Label & Subtitle (Expanded mode only) */}
                  <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate block">
                        {item.label}
                      </span>

                      {/* Full Badge in expanded mode */}
                      {item.badge && (
                        <span
                          className={`
                            text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0
                            ${isActive 
                              ? 'bg-white/20 text-white border-white/30' 
                              : item.badgeColor
                            }
                          `}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <span
                      className={`
                        text-[11px] truncate block mt-0.5
                        ${isActive 
                          ? 'text-cyan-100 font-normal' 
                          : 'text-slate-500 dark:text-slate-500 light:text-slate-400 group-hover:text-slate-400'
                        }
                      `}
                    >
                      {item.sublabel}
                    </span>
                  </div>

                  {/* Active Right Bar Indicator (subtle neon line) */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-l-full bg-cyan-300 shadow-sm shadow-cyan-300" />
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Desktop Mode */}
                {isCollapsed && isHovered && (
                  <div
                    className="
                      hidden lg:flex
                      absolute top-1/2 -translate-y-1/2
                      right-full mr-3.5 z-60
                      bg-slate-900/95 border border-slate-700/80 rounded-xl
                      px-3.5 py-2 shadow-2xl backdrop-blur-md
                      text-right whitespace-nowrap animate-fade-in
                      pointer-events-none flex-col gap-0.5
                    "
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-cyan-300 font-medium">
                      {item.sublabel}
                    </span>
                    {/* Arrow pointing right towards sidebar */}
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-slate-900 border-t border-r border-slate-700/80 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer with Dark Mode Toggle & System Status */}
        <div className="p-3 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 shrink-0 space-y-2">
          {/* Dark Mode Toggle Switch (Styled exactly like the sample image) */}
          <div
            onClick={onToggleTheme}
            className={`
              flex items-center justify-between p-2.5 rounded-2xl
              bg-slate-900/90 dark:bg-slate-900/90 light:bg-white
              border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200
              hover:border-cyan-500/40 transition-all cursor-pointer group
              ${isCollapsed ? 'lg:justify-center lg:p-2' : ''}
            `}
            title={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            role="switch"
            aria-checked={isDark}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors">
                {isDark ? (
                  <Moon className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <span className={`text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                الوضع الليلي
              </span>
            </div>

            {/* Switch Toggle (Image 2 style) */}
            <div className={`${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <div
                className={`
                  w-10 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center
                  ${isDark ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'}
                `}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </div>
            </div>
          </div>

          {/* Quick Collapse / Expand Bar */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`
              w-full hidden lg:flex items-center justify-center gap-2 p-2 rounded-xl
              text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50 transition-colors text-xs font-semibold cursor-pointer
              ${isCollapsed ? 'px-1' : ''}
            `}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[11px]">طي القائمة الجانبية</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

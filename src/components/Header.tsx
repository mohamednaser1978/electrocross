import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, Plus, ChevronDown, Cpu, Tv, Link2, Shuffle, Sun, Moon, 
  Settings, Database, ShoppingBag, Wrench, Truck, UserPlus, Building2, UserCheck
} from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  shopName: string;
  subTitle: string;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenAddDirectSale: () => void;
  onOpenAddMaintenanceSale: () => void;
  onOpenAddPurchase: () => void;
  onOpenAddCustomer: () => void;
  onOpenAddSupplier: () => void;
  onOpenAddTechnician?: () => void;
  onOpenAddComponent: () => void;
  onOpenAddDevice: () => void;
  onOpenAddCompatibility: () => void;
  onOpenAddEquivalent: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  shopName,
  subTitle,
  onOpenSettings,
  onOpenBackup,
  onOpenAddDirectSale,
  onOpenAddMaintenanceSale,
  onOpenAddPurchase,
  onOpenAddCustomer,
  onOpenAddSupplier,
  onOpenAddTechnician,
  onOpenAddComponent,
  onOpenAddDevice,
  onOpenAddCompatibility,
  onOpenAddEquivalent,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-colors duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Workshop Identity (Shop Name from Settings) */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Zap className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white font-sans">
                  {shopName || 'المتحكمات الكهربائية'}
                </span>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono hidden sm:inline-block">
                  ElectroCross Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-md">
                {subTitle || 'منظومة إدارة توافقية وبدائل القطع الإلكترونية والمبيعات والصيانة'}
              </p>
            </div>
          </div>

          {/* Quick Actions Header Toolbar */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 transition-all active:scale-95 shadow-sm group cursor-pointer"
              title={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              aria-label="تبديل المظهر"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-500" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-600 group-hover:-rotate-12 transition-transform duration-500" />
                )}
              </div>
              <span className="text-xs font-bold hidden md:inline">
                {theme === 'dark' ? 'نهاري' : 'ليلي'}
              </span>
            </button>

            {/* Backup & Database Export */}
            <button
              type="button"
              onClick={onOpenBackup}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm cursor-pointer"
              title="النسخ الاحتياطي وتصدير قاعدة بيانات SQLite"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold hidden sm:inline">نسخ احتياطي</span>
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm cursor-pointer"
              title="إعدادات الورشة واسم المحل"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold hidden sm:inline">الإعدادات</span>
            </button>

            {/* Add Dropdown / Comprehensive Quick Create */}
            <div 
              ref={addMenuRef} 
              className="relative"
              onMouseEnter={() => setIsAddMenuOpen(true)}
              onMouseLeave={() => setIsAddMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(prev => !prev)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer ${
                  isAddMenuOpen 
                    ? 'bg-cyan-500 shadow-cyan-900' 
                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950'
                }`}
                title="إضافة عمليات أو عناصر جديدة"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة جديدة</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu Container */}
              {isAddMenuOpen && (
                <div className="absolute left-0 top-full pt-1.5 w-64 z-50 text-right animate-fade-in">
                  <div className="rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 backdrop-blur-md space-y-1">
                    {/* Section 1: Sales & Maintenance */}
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      المبيعات والصيانة
                    </div>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddDirectSale();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-emerald-950 hover:text-emerald-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>بيع مباشر لقطع إلكترونية</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Sale</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddMaintenanceSale();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-blue-950 hover:text-blue-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span>عملية صيانة وفاتورة جهاز</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Repair</span>
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    {/* Section 2: Catalog & Purchasing */}
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      المستودع والتوريد
                    </div>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddPurchase();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>فاتورة شراء وتوريد مخزون</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Stock In</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddComponent();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>قطعة إلكترونية جديدة</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">+ IC</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddDevice();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>جهاز أو شاسيه جديد</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">+ Board</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddCompatibility();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>ربط قطعة بجهاز أو شاسيه</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Link</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddEquivalent();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>تسجيل بديل / مكافئ إلكتروني</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Equiv</span>
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    {/* Section 3: Contacts */}
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      العملاء والموردون
                    </div>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddCustomer();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>إضافة عميل جديد</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Client</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddSupplier();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>إضافة مورد جديد</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Supplier</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddTechnician?.();
                      }}
                      className="w-full text-right px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-purple-950 hover:text-purple-300 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span>إضافة مهندس صيانة جديد</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Engineer</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

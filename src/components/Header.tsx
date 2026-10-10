import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, Plus, ChevronDown, Cpu, Tv, Link2, Shuffle, Sun, Moon 
} from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAddComponent: () => void;
  onOpenAddDevice: () => void;
  onOpenAddCompatibility: () => void;
  onOpenAddEquivalent: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Zap className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-100 font-mono">
                  Electro<span className="text-cyan-400">Cross</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                منظومة إدارة توافقية وبدائل القطع الإلكترونية لورش الصيانة
              </p>
            </div>
          </div>

          {/* Quick Actions Header Toolbar - Clean & Focused */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button (Light Mode / Dark Mode) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 transition-all duration-300 active:scale-95 shadow-sm group cursor-pointer"
              title={theme === 'dark' ? 'التبديل إلى الوضع النهاري (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
              aria-label="تبديل المظهر"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-500" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-600 group-hover:-rotate-12 transition-transform duration-500" />
                )}
              </div>
              <span className="text-xs font-bold font-mono hidden sm:inline">
                {theme === 'dark' ? 'نهاري' : 'ليلي'}
              </span>
            </button>
            {/* Add Dropdown / Quick Create */}
            <div 
              ref={addMenuRef} 
              className="relative"
              onMouseEnter={() => setIsAddMenuOpen(true)}
              onMouseLeave={() => setIsAddMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition active:scale-95 ${
                  isAddMenuOpen 
                    ? 'bg-cyan-500 shadow-cyan-900' 
                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950'
                }`}
                title="إضافة عناصر جديدة إلى المنظومة"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة جديدة</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu Container */}
              {isAddMenuOpen && (
                <div className="absolute left-0 top-full pt-1.5 w-60 z-50 text-right animate-fade-in">
                  <div className="rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 backdrop-blur-md space-y-0.5">
                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        onOpenAddComponent();
                      }}
                      className="w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group"
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
                      className="w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group"
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
                      className="w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group"
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
                      className="w-full text-right px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>تسجيل بديل / مكافئ إلكتروني</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Equiv</span>
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

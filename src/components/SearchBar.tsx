import React, { useRef, useEffect } from 'react';
import { Search, X, Command, Filter, Cpu, Tv, AlertTriangle, Sparkles } from 'lucide-react';
import { SearchResultItem } from '../db/types';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeFilter: 'all' | 'components' | 'devices' | 'low_stock';
  onFilterChange: (f: 'all' | 'components' | 'devices' | 'low_stock') => void;
  suggestions: SearchResultItem[];
  onSelectSuggestion: (item: SearchResultItem) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  activeFilter,
  onFilterChange,
  suggestions,
  onSelectSuggestion,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: '/' to focus, 'Escape' to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onQueryChange('');
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onQueryChange]);

  const quickChips = [
    { label: 'VIPer12A', q: 'VIPer12A' },
    { label: 'OB2269', q: 'OB2269' },
    { label: 'TP.MS338E.PB801', q: 'TP.MS338E' },
    { label: 'TL431', q: 'TL431' },
    { label: 'LG 32LM550', q: '32LM550' },
    { label: 'IRF3205', q: 'IRF3205' },
    { label: 'خلاط Moulinex', q: 'Moulinex' },
  ];

  return (
    <div className="space-y-3">
      {/* Search Bar Container */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute right-4 pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-cyan-400" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="ابحث برمز القطعة (VIPer12A, OB2269...) أو موديل الشاشة (LG 32LM550) أو رقم الشاسيه (TP.MS338E)..."
            className="w-full pr-12 pl-24 py-4 rounded-2xl bg-slate-900/90 border border-slate-750 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none text-white text-base font-medium shadow-xl placeholder:text-slate-500 transition"
          />

          {/* Quick Clear or Keyboard Shortcut Key */}
          <div className="absolute left-3 flex items-center gap-1.5">
            {query ? (
              <button
                onClick={() => onQueryChange('')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition"
                title="مسح البحث (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div 
                onClick={() => inputRef.current?.focus()}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-slate-400 cursor-pointer hover:border-cyan-500/50"
                title="اضغط على زر / للتركيز على البحث"
              >
                <span>مفتاح</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">/</kbd>
              </div>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown (When typing) */}
        {query.trim().length > 0 && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden z-30 max-h-72 overflow-y-auto">
            <div className="p-2 bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>اقتراحات البحث الفوري ({suggestions.length})</span>
              <span className="text-cyan-400">انقر للفتح المباشر</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {suggestions.slice(0, 8).map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => onSelectSuggestion(item)}
                  className="w-full p-3 text-right hover:bg-slate-800/70 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.type === 'component' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {item.type === 'component' ? <Cpu className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition font-mono">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.stock !== undefined && (
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        item.stock > 2 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-amber-950/40 text-amber-400'
                      }`}>
                        رصيد: {item.stock}
                      </span>
                    )}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.matchReason}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Quick Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'all'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => onFilterChange('components')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'components'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            القطع والآيسيهات
          </button>
          <button
            onClick={() => onFilterChange('devices')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'devices'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            الأجهزة والشاسيهات
          </button>
          <button
            onClick={() => onFilterChange('low_stock')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'low_stock'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            النواقص (≤2)
          </button>
        </div>

        {/* Quick Search Chips */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">بحث سريع:</span>
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => onQueryChange(chip.q)}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 font-mono text-[11px] border border-slate-800 transition"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

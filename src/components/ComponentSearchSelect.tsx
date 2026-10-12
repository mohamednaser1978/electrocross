import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, AlertTriangle, Package, MapPin, X } from 'lucide-react';
import { Component } from '../db/types';

interface ComponentSearchSelectProps {
  components: Component[];
  selectedComponentId: number;
  onSelectComponent: (component: Component) => void;
  currency?: string;
  placeholder?: string;
  className?: string;
}

export const ComponentSearchSelect: React.FC<ComponentSearchSelectProps> = ({
  components,
  selectedComponentId,
  onSelectComponent,
  currency = 'د.ع',
  placeholder = 'ابحث عن رمز القطعة (مثال: VIP, OB, 10N60)...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected component
  const selectedComponent = useMemo(() => {
    return components.find(c => c.id === selectedComponentId) || null;
  }, [components, selectedComponentId]);

  // Filtered components based on search query
  const filteredComponents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return components;

    return components.filter(c => {
      const partMatch = c.part_number.toLowerCase().includes(q);
      const pkgMatch = (c.package_type || '').toLowerCase().includes(q);
      const catMatch = (c.category || '').toLowerCase().includes(q);
      const binMatch = (c.bin_location || '').toLowerCase().includes(q);
      const descMatch = (c.description || '').toLowerCase().includes(q);
      return partMatch || pkgMatch || catMatch || binMatch || descMatch;
    });
  }, [components, searchQuery]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (component: Component) => {
    onSelectComponent(component);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full text-right ${className}`} dir="rtl">
      {/* Selected Box Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-cyan-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 transition-all text-right cursor-pointer group shadow-inner"
      >
        {selectedComponent ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Part number */}
            <span className="font-mono font-black text-sm text-cyan-300 truncate">
              {selectedComponent.part_number}
            </span>

            {/* Package */}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0 border border-slate-700">
              {selectedComponent.package_type}
            </span>

            {/* Stock indicator badge */}
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
              selectedComponent.stock_quantity > 2
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : selectedComponent.stock_quantity > 0
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}>
              {selectedComponent.stock_quantity > 0 
                ? `متوفر: ${selectedComponent.stock_quantity}` 
                : 'نفد المخزون'}
            </span>

            {/* Bin location */}
            {selectedComponent.bin_location && (
              <span className="text-[10px] text-slate-500 truncate hidden sm:inline-flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                {selectedComponent.bin_location}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-500">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-400 transition shrink-0 mr-1">
          <Search className="w-3.5 h-3.5" />
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Floating Searchable Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl backdrop-blur-md p-2 space-y-2 animate-fade-in max-w-full">
          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="اكتب رمز القطعة، الباقة، أو مكان الدرج للبحث الفوري..."
              className="w-full pr-9 pl-8 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Count & Hint */}
          <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span>النتائج المطابقة: <strong className="text-cyan-300 font-mono">{filteredComponents.length}</strong></span>
            {searchQuery && <span>اضغط لاختيار القطعة مباشرة</span>}
          </div>

          {/* Scrollable Items List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
            {filteredComponents.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-400 text-xs space-y-1">
                <AlertTriangle className="w-5 h-5 mx-auto text-amber-400" />
                <p className="font-semibold text-slate-300">لا توجد قطعة مطابقة للبحث</p>
                <p className="text-[11px] text-slate-500">جرب البحث برمز مختصر أو جزء من رقم الآي سي</p>
              </div>
            ) : (
              filteredComponents.map(comp => {
                const isSelected = comp.id === selectedComponentId;
                const isLowStock = comp.stock_quantity > 0 && comp.stock_quantity <= 2;
                const isOutOfStock = comp.stock_quantity <= 0;

                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelect(comp)}
                    className={`w-full text-right p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-cyan-950/80 border border-cyan-500/40 text-white'
                        : 'hover:bg-slate-800/80 text-slate-200 border border-transparent'
                    }`}
                  >
                    {/* Left: Info & Part number */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-cyan-300 group-hover:text-cyan-200">
                          {comp.part_number}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-slate-300 border border-slate-700">
                          {comp.package_type}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {comp.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        {comp.bin_location && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-2.5 h-2.5 text-slate-600" />
                            {comp.bin_location}
                          </span>
                        )}
                        {comp.sale_price !== undefined && (
                          <span className="font-mono text-emerald-400 font-semibold">
                            السعر: {comp.sale_price.toLocaleString()} {currency}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Stock Status Badge & Selection Check */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                        isOutOfStock
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : isLowStock
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {isOutOfStock ? 'نفد (0)' : `متوفر: ${comp.stock_quantity}`}
                      </span>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

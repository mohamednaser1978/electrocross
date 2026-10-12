import React from 'react';
import { 
  Cpu, Tv, Box, Shuffle, Link2, Plus, Minus, AlertTriangle, 
  CheckCircle2, ShieldAlert, ArrowLeft, Layers, Wrench 
} from 'lucide-react';
import { Component, Device, SearchResultItem } from '../db/types';

interface ResultsDashboardProps {
  searchResults: SearchResultItem[];
  components: Component[];
  devices: Device[];
  onSelectComponent: (id: number) => void;
  onSelectDevice: (id: number) => void;
  onUpdateStock: (id: number, delta: number) => void;
  onOpenAddComponent: () => void;
  onOpenAddDevice: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  searchResults,
  components,
  devices,
  onSelectComponent,
  onSelectDevice,
  onUpdateStock,
  onOpenAddComponent,
  onOpenAddDevice,
}) => {
  const compResults = searchResults.filter(r => r.type === 'component');
  const devResults = searchResults.filter(r => r.type === 'device');

  const compMap = new Map<number, Component>(components.map(c => [c.id, c]));
  const devMap = new Map<number, Device>(devices.map(d => [d.id, d]));

  const handleStockClick = (e: React.MouseEvent, id: number, delta: number) => {
    e.stopPropagation();
    onUpdateStock(id, delta);
  };

  if (searchResults.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
          <Layers className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-100">لم يتم العثور على نتائج مطابقة</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            تأكد من كتابة رمز القطعة أو موديل الشاشة بدقة، أو قم بتسجيل القطعة أو اللوحة الجديدة الآن.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenAddComponent}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            إضافة قطعة جديدة
          </button>
          <button
            onClick={onOpenAddDevice}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            إضافة جهاز أو شاسيه
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Components Section */}
      {compResults.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-100">
                القطع والآيسيهات الإلكترونية ({compResults.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              انقر على أي كارت لعرض البدائل المكافئة والأجهزة المتوافقة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {compResults.map((item) => {
              const comp = compMap.get(item.id);
              if (!comp) return null;

              const isOut = comp.stock_quantity <= 0;
              const isLow = comp.stock_quantity > 0 && comp.stock_quantity <= 2;

              return (
                <div
                  key={`comp-${comp.id}`}
                  onClick={() => onSelectComponent(comp.id)}
                  className="group relative p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 shadow-lg hover:shadow-cyan-950/30 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Part number & Badges & Photo */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {comp.image_url ? (
                          <div className="relative shrink-0 overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-950 shadow-md">
                            <img
                              src={comp.image_url}
                              alt={comp.part_number}
                              className="w-12 h-12 object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 shrink-0">
                            <Cpu className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="text-lg font-black font-mono text-slate-100 group-hover:text-cyan-400 transition tracking-tight truncate">
                            {comp.part_number}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                              {comp.package_type || 'DIP'}
                            </span>
                            <span>•</span>
                            <span className="truncate">{comp.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stock Warning Tag */}
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                          نافد
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          منخفض ({comp.stock_quantity})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          متوفر ({comp.stock_quantity})
                        </span>
                      )}
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed my-2">
                      {comp.description || 'توصيف القطعة مسجل بالورشة'}
                    </p>

                    {/* Drawer & Bin Localization Tag */}
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/30 px-2.5 py-1.5 rounded-xl border border-amber-500/20 my-2">
                      <Box className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{comp.bin_location || 'الموقع غير محدد'}</span>
                    </div>
                  </div>

                  {/* Bottom Strip: Single-click stock controls & Details prompt */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-1">
                    <span className="text-[11px] text-cyan-400 group-hover:underline flex items-center gap-1 font-semibold">
                      <span>عرض البدائل والأجهزة</span>
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition" />
                    </span>

                    {/* Fast Inventory Quantity Controls */}
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5"
                    >
                      <button
                        onClick={(e) => handleStockClick(e, comp.id, -1)}
                        disabled={comp.stock_quantity <= 0}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="إنقاص المخزون (-1)"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-slate-100 min-w-[1.75rem] text-center">
                        {comp.stock_quantity}
                      </span>
                      <button
                        onClick={(e) => handleStockClick(e, comp.id, 1)}
                        className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white transition"
                        title="زيادة المخزون (+1)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Devices Section */}
      {devResults.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Tv className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-100">
                الأجهزة واللوحات والشاسيهات ({devResults.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              انقر على أي شاسيه لعرض قطع الباور والكنترول والبدائل المتوفرة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {devResults.map((item) => {
              const dev = devMap.get(item.id);
              if (!dev) return null;

              return (
                <div
                  key={`dev-${dev.id}`}
                  onClick={() => onSelectDevice(dev.id)}
                  className="group relative p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 shadow-lg hover:shadow-blue-950/30 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Brand, Model & Board Photo */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {dev.image_url ? (
                          <div className="relative shrink-0 overflow-hidden rounded-xl border border-blue-500/30 bg-slate-950 shadow-md">
                            <img
                              src={dev.image_url}
                              alt={dev.model_number}
                              className="w-12 h-12 object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-blue-400 shrink-0">
                            <Tv className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-bold">
                              {dev.brand}
                            </span>
                            <span className="text-xs text-slate-400">
                              {dev.device_type}
                            </span>
                          </div>
                          <div className="text-base sm:text-lg font-black font-mono text-slate-100 group-hover:text-blue-400 transition mt-0.5 truncate">
                            {dev.model_number}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Board / Chassis Number */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 my-2.5">
                      <div className="text-[10px] text-slate-400">كود اللوحة / رقم الشاسيه:</div>
                      <div className="text-sm font-bold font-mono text-cyan-300 truncate">
                        {dev.board_number || 'غير مسجل باللوحة'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      فحص مكونات اللوحة
                    </span>
                    <span className="text-cyan-400 group-hover:underline flex items-center gap-1 font-semibold">
                      <span>عرض اللوحة</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

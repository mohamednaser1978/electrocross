import React from 'react';
import { Cpu, Tv, Link2, Shuffle, AlertTriangle, ShieldAlert, Layers } from 'lucide-react';
import { WorkshopStats } from '../db/types';

interface StatsBarProps {
  stats: WorkshopStats;
  activeFilter: string;
  onFilterChange: (filter: 'all' | 'components' | 'devices' | 'low_stock') => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Components */}
      <button
        onClick={() => onFilterChange('components')}
        className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between ${
          activeFilter === 'components'
            ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div>
          <div className="text-[11px] font-semibold text-slate-400">القطع المسجلة</div>
          <div className="text-xl font-black text-slate-100 font-mono mt-0.5">{stats.totalComponents}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
          <Cpu className="w-5 h-5" />
        </div>
      </button>

      {/* 2. Devices */}
      <button
        onClick={() => onFilterChange('devices')}
        className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between ${
          activeFilter === 'devices'
            ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/50'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div>
          <div className="text-[11px] font-semibold text-slate-400">الأجهزة والشاسيهات</div>
          <div className="text-xl font-black text-slate-100 font-mono mt-0.5">{stats.totalDevices}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
          <Tv className="w-5 h-5" />
        </div>
      </button>

      {/* 3. Compatibilities */}
      <div className="p-3.5 rounded-2xl border bg-slate-900/60 border-slate-800 text-right flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-400">روابط التوافقية</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{stats.totalCompatibilities}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
          <Link2 className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Substitutes */}
      <div className="p-3.5 rounded-2xl border bg-slate-900/60 border-slate-800 text-right flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-400">البدائل الموثقة</div>
          <div className="text-xl font-black text-purple-400 font-mono mt-0.5">{stats.totalEquivalents}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
          <Shuffle className="w-5 h-5" />
        </div>
      </div>

      {/* 5. Low Stock */}
      <button
        onClick={() => onFilterChange('low_stock')}
        className={`p-3.5 rounded-2xl border text-right transition flex items-center justify-between ${
          activeFilter === 'low_stock'
            ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/50'
            : stats.lowStockCount > 0
            ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
            : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div>
          <div className="text-[11px] font-semibold text-amber-300">رصيد حرج (≤2)</div>
          <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{stats.lowStockCount}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </button>

      {/* 6. Total Stock Units */}
      <div className="p-3.5 rounded-2xl border bg-slate-900/60 border-slate-800 text-right flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-400">إجمالي قطع المخزن</div>
          <div className="text-xl font-black text-cyan-300 font-mono mt-0.5">{stats.totalStockUnits}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
          <Layers className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

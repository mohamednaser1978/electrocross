import React from 'react';
import { 
  X, Tv, Cpu, Plus, Edit3, Trash2, Link2, ExternalLink, 
  CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight, Layers 
} from 'lucide-react';
import { DeviceDetail } from '../db/types';

interface DeviceDetailModalProps {
  detail: DeviceDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (dev: DeviceDetail) => void;
  onDelete: (id: number) => void;
  onAddCompatibility: (deviceId: number) => void;
  onSelectComponentById: (componentId: number) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  detail,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddCompatibility,
  onSelectComponentById,
}) => {
  if (!isOpen || !detail) return null;

  const handleDeleteClick = () => {
    if (confirm(`هل أنت متأكد من حذف الجهاز "${detail.brand} ${detail.model_number}"؟`)) {
      onDelete(detail.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 border-b border-slate-700/80 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Tv className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {detail.brand}
                </span>
                <h1 className="text-2xl font-black text-white font-mono tracking-tight">
                  {detail.model_number}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {detail.device_type}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-cyan-300 font-mono mt-1 flex items-center gap-2">
                <span className="text-slate-400">رقم الشاسيه / كود اللوحة:</span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold">
                  {detail.board_number || 'غير مسجل'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEdit(detail)}
              title="تعديل بيانات الجهاز"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              title="حذف الجهاز"
              className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Board Components Table */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                المكونات والآيسيهات المسجلة على هذه اللوحة ({detail.components.length})
              </h3>
            </div>
            <button
              onClick={() => onAddCompatibility(detail.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              ربط قطعة إلكترونية جديدة
            </button>
          </div>

          {detail.components.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center space-y-2">
              <p className="text-xs text-slate-400">
                لم يتم تسجيل أي قطع حساسة على هذه اللوحة حتى الآن.
              </p>
              <button
                onClick={() => onAddCompatibility(detail.id)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                إضافة مذبذب أو موسفيت للوحة
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">موقع البوردة</th>
                    <th className="p-3">رمز القطعة (Part Number)</th>
                    <th className="p-3">التغليف والتصنيف</th>
                    <th className="p-3">الوظيفة بالدائرة</th>
                    <th className="p-3">حالة الرصيد بالمخزن</th>
                    <th className="p-3">ملاحظات الصيانة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {detail.components.map((c) => {
                    const isOut = c.stockQuantity <= 0;
                    const isLow = c.stockQuantity > 0 && c.stockQuantity <= 2;
                    return (
                      <tr key={c.compatibilityId} className="hover:bg-slate-900/60 transition">
                        <td className="p-3 font-mono font-bold text-amber-300 text-sm">
                          {c.boardLocation || '—'}
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <button
                            onClick={() => onSelectComponentById(c.componentId)}
                            className="text-white hover:text-cyan-400 transition flex items-center gap-1.5"
                          >
                            <span>{c.partNumber}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                          </button>
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] ml-1">
                            {c.packageType}
                          </span>
                          <span className="text-slate-400 text-[11px]">{c.category}</span>
                        </td>
                        <td className="p-3 text-slate-200">
                          {c.circuitRole || '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
                                <ShieldAlert className="w-3 h-3" />
                                نافد (0)
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                {c.stockQuantity} قطع (منخفض)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                {c.stockQuantity} قطع متوفرة
                              </span>
                            )}
                            
                            {/* If out of stock, check if substitutes are available */}
                            {isOut && c.directSubstitutesCount > 0 && (
                              <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30 w-fit">
                                متوفر بديل مباشر في المخزن ({c.directSubstitutesCount})!
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {c.binLocation}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs text-[11px] leading-relaxed">
                          {c.technicianNotes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

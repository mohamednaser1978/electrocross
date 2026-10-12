import React from 'react';
import { 
  X, Cpu, Box, Layers, AlertTriangle, CheckCircle2, Shuffle, 
  Tv, Plus, Minus, Edit3, Trash2, Link2, ExternalLink, ArrowRight, Wrench, ShieldAlert 
} from 'lucide-react';
import { ComponentDetail } from '../db/types';

interface ComponentDetailModalProps {
  detail: ComponentDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStock: (id: number, delta: number) => void;
  onEdit: (comp: ComponentDetail) => void;
  onDelete: (id: number) => void;
  onAddEquivalent: (id: number) => void;
  onAddCompatibility: (id: number) => void;
  onSelectComponentById: (id: number) => void;
  onSelectDeviceById: (id: number) => void;
}

export const ComponentDetailModal: React.FC<ComponentDetailModalProps> = ({
  detail,
  isOpen,
  onClose,
  onUpdateStock,
  onEdit,
  onDelete,
  onAddEquivalent,
  onAddCompatibility,
  onSelectComponentById,
  onSelectDeviceById,
}) => {
  if (!isOpen || !detail) return null;

  const isLowStock = detail.stock_quantity > 0 && detail.stock_quantity <= 2;
  const isOutOfStock = detail.stock_quantity <= 0;

  const handleStockClick = (delta: number) => {
    onUpdateStock(detail.id, delta);
  };

  const handleDeleteClick = () => {
    if (confirm(`هل أنت متأكد من حذف القطعة "${detail.part_number}" وجميع ارتباطاتها؟`)) {
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
            {detail.image_url ? (
              <div className="relative group/img shrink-0">
                <img
                  src={detail.image_url}
                  alt={detail.part_number}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-cyan-500/40 bg-slate-950 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(detail.image_url, '_blank')}
                  title="انقر لفتح الصورة بالحجم الكامل"
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner shrink-0">
                <Cpu className="w-8 h-8" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-white font-mono tracking-tight">
                  {detail.part_number}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {detail.package_type || 'تغليف قياسي'}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {detail.category}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {detail.description || 'لا يوجد توصيف إضافي مسجل لهذه القطعة.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEdit(detail)}
              title="تعديل بيانات القطعة"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              title="حذف القطعة"
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

        {/* Quick Inventory & Drawer Strip */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          {/* Drawer Location */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">موقع التخزين بالورشة (Bin / Drawer):</div>
              <div className="text-sm font-bold text-amber-200">
                {detail.bin_location || 'غير محدد'}
              </div>
            </div>
          </div>

          {/* Stock Counter with Quick +1 / -1 Buttons */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] text-slate-400 text-left">رصيد المخزن:</div>
              <div className="flex items-center gap-2">
                {isOutOfStock ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    نافد من المخزن (0)
                  </span>
                ) : isLowStock ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    رصيد حرج ({detail.stock_quantity})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    متوفر ({detail.stock_quantity} قطعة)
                  </span>
                )}
              </div>
            </div>

            {/* +1 / -1 Quick Inventory Buttons */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => handleStockClick(-1)}
                disabled={detail.stock_quantity <= 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="إنقاص المخزون (-1)"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-mono font-bold text-white min-w-[2.5rem] text-center">
                {detail.stock_quantity}
              </span>
              <button
                onClick={() => handleStockClick(1)}
                className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
                title="زيادة المخزون (+1)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* 1. Equivalents & Substitutes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  البدائل والمكافئات المتاحة ({detail.equivalents.length})
                </h3>
              </div>
              <button
                onClick={() => onAddEquivalent(detail.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة بديل جديد
              </button>
            </div>

            {detail.equivalents.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 text-center">
                لم يتم تسجيل بدائل مكافئة لهذه القطعة حتى الآن. انقر على "إضافة بديل جديد" لتوثيق المكافئات.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {detail.equivalents.map((eq) => {
                  const isDirect = eq.equivalenceType === 'Direct_Drop_In';
                  return (
                    <div
                      key={eq.equivalentId}
                      className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                        isDirect
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <button
                              onClick={() => onSelectComponentById(eq.substituteId)}
                              className="text-base font-bold font-mono text-white hover:text-cyan-400 transition flex items-center gap-1.5"
                            >
                              <span>{eq.partNumber}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                            </button>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {eq.packageType} • {eq.category}
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                            isDirect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isDirect ? 'بديل مباشر (Drop-In)' : 'تعديل أطراف'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed my-2">
                          <div className="font-semibold text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-cyan-400" />
                            تعليمات التركيب والتعديل:
                          </div>
                          {eq.modificationInstructions}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          موقع التخزين: <strong className="text-slate-200">{eq.binLocation || 'غير محدد'}</strong>
                        </span>
                        <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                          eq.stockQuantity > 0 ? 'bg-slate-800 text-emerald-400' : 'bg-red-950/40 text-red-400'
                        }`}>
                          رصيد: {eq.stockQuantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Compatible Devices & Chassis Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  الأجهزة واللوحات المتوافقة المعروفة ({detail.compatibleDevices.length})
                </h3>
              </div>
              <button
                onClick={() => onAddCompatibility(detail.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 transition"
              >
                <Link2 className="w-3.5 h-3.5" />
                ربط بجهاز جديد
              </button>
            </div>

            {detail.compatibleDevices.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 text-center">
                لم يتم توثيق أجهزة متوافقة لهذه القطعة حتى الآن. يمكنك ربطها بأي جهاز مسجل.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th className="p-3">الجهاز والموديل</th>
                      <th className="p-3">كود الشاسيه/البوردة</th>
                      <th className="p-3">موقع البوردة</th>
                      <th className="p-3">الوظيفة بالدائرة</th>
                      <th className="p-3">ملاحظات الفني</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {detail.compatibleDevices.map((d) => (
                      <tr key={d.compatibilityId} className="hover:bg-slate-900/60 transition">
                        <td className="p-3 font-semibold">
                          <button
                            onClick={() => onSelectDeviceById(d.deviceId)}
                            className="text-white hover:text-cyan-400 transition flex items-center gap-1 text-right"
                          >
                            <span>{d.brand} {d.modelNumber}</span>
                            <span className="text-[10px] text-slate-400">({d.deviceType})</span>
                          </button>
                        </td>
                        <td className="p-3 font-mono text-cyan-300">
                          {d.boardNumber || '—'}
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-300">
                          {d.boardLocation || '—'}
                        </td>
                        <td className="p-3 text-slate-300">
                          {d.circuitRole || '—'}
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs text-[11px] leading-relaxed">
                          {d.technicianNotes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

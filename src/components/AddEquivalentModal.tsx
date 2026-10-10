import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Shuffle, Check, AlertCircle, Search, Lock, 
  Cpu, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { EquivalenceType } from '../db/types';
import { dbInstance } from '../db/sqliteEngine';

interface AddEquivalentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialOriginalId?: number;
}

export const AddEquivalentModal: React.FC<AddEquivalentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialOriginalId,
}) => {
  // Stable components list while modal is opened
  const components = useMemo(() => {
    return dbInstance.getComponents();
  }, [isOpen]);

  // State
  const [originalId, setOriginalId] = useState<number>(initialOriginalId || (components[0]?.id ?? 1));
  const [substituteId, setSubstituteId] = useState<number>(0);
  const [substituteSearch, setSubstituteSearch] = useState('');
  const [originalSearch, setOriginalSearch] = useState('');
  const [equivalenceType, setEquivalenceType] = useState<EquivalenceType>('Direct_Drop_In');
  const [modificationInstructions, setModificationInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Synchronize state ONLY when modal opens or initialOriginalId changes (do NOT depend on components array reference)
  useEffect(() => {
    if (isOpen) {
      if (initialOriginalId) {
        setOriginalId(initialOriginalId);
      } else if (components.length > 0) {
        setOriginalId(components[0].id);
      }
      setSubstituteSearch('');
      setOriginalSearch('');
      setError(null);
    }
  }, [isOpen, initialOriginalId]);

  // Is the original component locked (pre-determined)?
  const isOriginalFixed = Boolean(initialOriginalId);

  // Original component details
  const originalComponent = useMemo(() => {
    return components.find(c => c.id === originalId);
  }, [components, originalId]);

  // Filter substitute components list based on search query and excluding the original component
  const filteredSubstitutes = useMemo(() => {
    const clean = substituteSearch.trim().toLowerCase();
    return components.filter(c => {
      // Cannot substitute with itself
      if (c.id === originalId) return false;
      if (!clean) return true;
      return (
        c.part_number.toLowerCase().includes(clean) ||
        c.package_type.toLowerCase().includes(clean) ||
        c.category.toLowerCase().includes(clean) ||
        c.description.toLowerCase().includes(clean) ||
        c.bin_location.toLowerCase().includes(clean)
      );
    });
  }, [components, originalId, substituteSearch]);

  // Filter original components if not fixed
  const filteredOriginals = useMemo(() => {
    const clean = originalSearch.trim().toLowerCase();
    if (!clean) return components;
    return components.filter(c =>
      c.part_number.toLowerCase().includes(clean) ||
      c.package_type.toLowerCase().includes(clean) ||
      c.category.toLowerCase().includes(clean)
    );
  }, [components, originalSearch]);

  // Ensure substituteId is set to a valid candidate
  useEffect(() => {
    if (filteredSubstitutes.length > 0) {
      const isCurrentValid = filteredSubstitutes.some(c => c.id === substituteId);
      if (!isCurrentValid) {
        setSubstituteId(filteredSubstitutes[0].id);
      }
    }
  }, [filteredSubstitutes, substituteId]);

  // Selected substitute component details
  const selectedSubstitute = useMemo(() => {
    return components.find(c => c.id === substituteId);
  }, [components, substituteId]);

  // Auto-suggest modification instructions if packages differ
  useEffect(() => {
    if (originalComponent && selectedSubstitute) {
      if (originalComponent.package_type !== selectedSubstitute.package_type) {
        if (!modificationInstructions || modificationInstructions.includes('تعديل تغليف')) {
          setEquivalenceType('Requires_Modification');
          setModificationInstructions(
            `تعديل تغليف (${selectedSubstitute.package_type} بدلاً من ${originalComponent.package_type}): يلزم تعديل وتطويل أطراف التوصيل أو عكس المسارات بما يتوافق مع الداتا شيت.`
          );
        }
      }
    }
  }, [originalComponent?.id, selectedSubstitute?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!originalId || !substituteId) {
      setError('يرجى اختيار كل من القطعة الأصلية والبديلة.');
      return;
    }

    if (originalId === substituteId) {
      setError('لا يمكن اختيار نفس القطعة كبديل لنفسها! اختر قطعة أخرى.');
      return;
    }

    try {
      dbInstance.addEquivalent({
        original_id: Number(originalId),
        substitute_id: Number(substituteId),
        equivalence_type: equivalenceType,
        modification_instructions: modificationInstructions.trim() || 
          (equivalenceType === 'Direct_Drop_In' 
            ? 'بديل مباشر (Drop-in) مطابق تماماً في الأطراف والوظيفة بدون أي تعديل.' 
            : 'يتطلب تعديلاً بالأطراف أو قيم مقاومات الدائرة.'),
      });
      onSave();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إضافة البديل');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Shuffle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">إضافة بديل ومكافئ إلكتروني</h2>
              <p className="text-xs text-slate-400">
                {isOriginalFixed && originalComponent 
                  ? `تحديد البدائل المطابقة الخاصة بالقطعة [ ${originalComponent.part_number} ]`
                  : 'توثيق بديل مباشر أو بديل بتعديل أطراف (Cross-Reference)'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* ================= 1. القطعة الأصلية (Original IC) - ثابتة ================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>القطعة الأصلية (Original IC)</span>
                <span className="text-cyan-400">*</span>
              </label>

              {isOriginalFixed ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-bold">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  محددة وثابتة بدقة
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">اختر القطعة المراد إيجاد بديل لها</span>
              )}
            </div>

            {/* إذا كانت القطعة محددة مسبقاً، تظهر في بطاقة مقفلة ثابتة لا يمكن تغييرها */}
            {isOriginalFixed && originalComponent ? (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 shadow-inner space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white font-mono tracking-tight">
                      {originalComponent.part_number}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      {originalComponent.package_type}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-300">
                      {originalComponent.category}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-400">الرصيد:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                      originalComponent.stock_quantity > 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {originalComponent.stock_quantity} قطع
                    </span>
                  </div>
                </div>

                {originalComponent.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                    {originalComponent.description}
                  </p>
                )}

                {originalComponent.bin_location && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono pt-1 border-t border-slate-900">
                    <span className="text-slate-400">موقع الدرج:</span>
                    <span className="text-slate-300">{originalComponent.bin_location}</span>
                  </div>
                )}
              </div>
            ) : (
              /* في حال فتح النافذة بدون تحديد قطعة مسبقاً، نوفر حقل بحث + قائمة لاختيارها */
              <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={originalSearch}
                    onChange={(e) => setOriginalSearch(e.target.value)}
                    placeholder="ابحث لاختيار القطعة الأصلية..."
                    className="w-full pr-8 pl-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <select
                  value={originalId}
                  onChange={(e) => {
                    setOriginalId(Number(e.target.value));
                    setError(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  required
                >
                  {filteredOriginals.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.part_number} ({c.package_type}) — {c.category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ================= 2. القطعة البديلة (Substitute IC) - بحث فوري وكومبو ================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-emerald-400" />
                <span>القطعة البديلة (Substitute IC)</span>
                <span className="text-emerald-400">*</span>
              </label>

              <span className="text-[11px] text-slate-400 font-mono">
                المطابقات: {filteredSubstitutes.length} قطعة
              </span>
            </div>

            {/* حقل البحث الفوري عن القطعة البديلة - يمكن الكتابة فيه بحرية تامة */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-cyan-400 pointer-events-none" />
              <input
                type="text"
                value={substituteSearch}
                onChange={(e) => setSubstituteSearch(e.target.value)}
                placeholder="اكتب هنا للبحث بالرمز أو التغليف (مثال: VIPer, SOP, MOSFET, 7N65)..."
                className="w-full pr-10 pl-8 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-xs placeholder:text-slate-500 shadow-inner"
              />
              {substituteSearch && (
                <button
                  type="button"
                  onClick={() => setSubstituteSearch('')}
                  className="absolute left-3 top-3 text-slate-400 hover:text-white transition"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* اقتراحات سريعة بنقرة واحدة */}
            {filteredSubstitutes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-500">اختيار سريع:</span>
                {filteredSubstitutes.slice(0, 4).map(sub => (
                  <button
                    type="button"
                    key={sub.id}
                    onClick={() => {
                      setSubstituteId(sub.id);
                      setSubstituteSearch(sub.part_number);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition border ${
                      sub.id === substituteId 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {sub.part_number} ({sub.package_type})
                  </button>
                ))}
              </div>
            )}

            {/* قائمة الكومبو بوكس لاختيار البديل من بين النتائج المفلترة */}
            <div>
              <select
                value={substituteId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSubstituteId(id);
                  const item = components.find(c => c.id === id);
                  if (item) setSubstituteSearch(item.part_number);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                required
              >
                {filteredSubstitutes.length === 0 ? (
                  <option disabled value="">لا توجد قطع مطابقة للبحث</option>
                ) : (
                  filteredSubstitutes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.part_number} — [{c.package_type}] — {c.category} — (مخزن: {c.stock_quantity})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* بطاقة المعاينة والتأكيد للقطعة البديلة المختارة */}
            {selectedSubstitute && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-2 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-300 text-base">
                      {selectedSubstitute.part_number}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedSubstitute.package_type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                      {selectedSubstitute.category}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    selectedSubstitute.stock_quantity > 0 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {selectedSubstitute.stock_quantity > 0 
                      ? `رصيد المخزن: ${selectedSubstitute.stock_quantity}` 
                      : 'الرصيد نافد'}
                  </span>
                </div>

                {selectedSubstitute.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                    {selectedSubstitute.description}
                  </p>
                )}

                {/* مقارنة ذكية للتغليف والتوافق */}
                {originalComponent && (
                  <div className="text-[11px] pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400 font-mono">
                      موقع الدرج: <span className="text-slate-300">{selectedSubstitute.bin_location || 'غير مسجل'}</span>
                    </span>

                    {originalComponent.package_type === selectedSubstitute.package_type ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تطابق تام في نوع التغليف ({originalComponent.package_type})
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        اختلاف في التغليف ({originalComponent.package_type} مقابل {selectedSubstitute.package_type})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= 3. نوع التوافق والمكافأة (Equivalence Type) ================= */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              نوع التوافق والمكافأة (Equivalence Type) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                equivalenceType === 'Direct_Drop_In'
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-bold shadow-md shadow-emerald-950/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <input
                  type="radio"
                  name="equiv_type"
                  checked={equivalenceType === 'Direct_Drop_In'}
                  onChange={() => setEquivalenceType('Direct_Drop_In')}
                  className="hidden"
                />
                <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                  equivalenceType === 'Direct_Drop_In' 
                    ? 'border-emerald-400 bg-emerald-400' 
                    : 'border-slate-600'
                }`} />
                <div className="text-xs">
                  <div className="font-bold">بديل مباشر (Drop-In)</div>
                  <div className="text-[10px] text-slate-400">تطابق أطراف 100% دون أي تعديل</div>
                </div>
              </label>

              <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                equivalenceType === 'Requires_Modification'
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 font-bold shadow-md shadow-amber-950/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <input
                  type="radio"
                  name="equiv_type"
                  checked={equivalenceType === 'Requires_Modification'}
                  onChange={() => setEquivalenceType('Requires_Modification')}
                  className="hidden"
                />
                <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                  equivalenceType === 'Requires_Modification' 
                    ? 'border-amber-400 bg-amber-400' 
                    : 'border-slate-600'
                }`} />
                <div className="text-xs">
                  <div className="font-bold">يتطلب تعديل فني</div>
                  <div className="text-[10px] text-slate-400">تعديل أطراف، أسلاك، أو مقاومات</div>
                </div>
              </label>
            </div>
          </div>

          {/* ================= 4. إرشادات وطريقة التعديل ================= */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              إرشادات وطريقة التعديل الفني (Modification Instructions)
            </label>
            <textarea
              rows={3}
              value={modificationInstructions}
              onChange={(e) => setModificationInstructions(e.target.value)}
              placeholder="مثال: تركيب مباشر بدون تعديل، أو يلزم عكس طرف 4 مع طرف 5 وقطع المسار، أو استبدال مقاومة الـ Feedback..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-xs leading-relaxed"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950 active:scale-95"
            >
              <Check className="w-4 h-4" />
              حفظ البديل المعتمد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

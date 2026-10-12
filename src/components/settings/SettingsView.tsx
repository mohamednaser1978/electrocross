import React, { useState } from 'react';
import { 
  Settings, Save, RotateCcw, CheckCircle2, Zap, 
  Phone, MapPin, DollarSign, ShieldCheck, FileText, Sparkles,
  Users, UserCheck, Plus, Trash2, Edit3, Award, Wrench
} from 'lucide-react';
import { WorkshopSettings, Technician } from '../../db/types';

interface SettingsViewProps {
  settings: WorkshopSettings;
  onSaveSettings: (newSettings: WorkshopSettings) => void;
  onResetSettings: () => void;
  technicians?: Technician[];
  onOpenAddTechnician?: () => void;
  onEditTechnician?: (tech: Technician) => void;
  onDeleteTechnician?: (id: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetSettings,
  technicians = [],
  onOpenAddTechnician,
  onEditTechnician,
  onDeleteTechnician,
}) => {
  const [formData, setFormData] = useState<WorkshopSettings>({ ...settings });
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleChange = (field: keyof WorkshopSettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handleReset = () => {
    if (confirm('هل تريد استعادة الإعدادات الافتراضية للورشة (اسم: المتحكمات الكهربائية)؟')) {
      onResetSettings();
      setFormData({
        shopName: 'المتحكمات الكهربائية',
        subTitle: 'لصيانة الأجهزة والمتحكمات الإلكترونية وبدائل القطع',
        phone: '+218 91 123 4567',
        address: 'شارع الصناعة - عمارة النور للإلكترونيات - الطابق الأرضي',
        currency: 'د.ل',
        invoiceFooterNote: 'القطع الإلكترونية المباعة تخضع للفحص المباشر قبل الاستلام • كفالة الصيانة 15 يوماً على نفس العطل المشخص',
        warrantyTerms: 'يرجى إبراز رقم السند عند الاستلام. لا يشمل الضمان التلف الناتج عن سوء الاستخدام أو التذبذب الكهربائي الحاد أو كسر البوردة.'
      });
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>إعدادات وهوية ورشة الصيانة والعملات</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                System Settings
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تخصيص اسم المحل، أرقام التواصل، العملة (بما فيها الدينار الليبي)، وطاقم مهندسي الصيانة المسؤولين
            </p>
          </div>
        </div>

        {isSavedRecently && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم حفظ التعديلات بنجاح!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: 2 cols on lg */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            {/* 1. Shop Name & Subtitle */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                <Sparkles className="w-4 h-4" />
                هوية المحل والورشة الظاهرة في الترويسة والفواتير
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  اسم المحل أو ورشة الصيانة <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={e => handleChange('shopName', e.target.value)}
                  placeholder="مثال: المتحكمات الكهربائية"
                  className="w-full px-4 py-2.5 text-sm font-bold text-white rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none shadow-inner"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  الاسم الافتراضي هو «المتحكمات الكهربائية». يمكنك تغييره هنا إلى أي اسم آخر ترغب به وسيتم تحديثه فوراً في كامل النظام.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  الوصف أو الشعار الفرعي
                </label>
                <input
                  type="text"
                  value={formData.subTitle}
                  onChange={e => handleChange('subTitle', e.target.value)}
                  placeholder="مثال: لصيانة الأجهزة والمتحكمات الإلكترونية وبدائل القطع"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* 2. Contact & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  رقم الهاتف / الواتساب
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="مثال: +964 770 123 4567 أو 091 123 4567"
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                  رمز العملة المستخدمة
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.currency}
                    onChange={e => handleChange('currency', e.target.value)}
                    className="w-1/2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="د.ل">د.ل (دينار ليبي)</option>
                    <option value="د.ع">د.ع (دينار عراقي)</option>
                    <option value="ج.م">ج.م (جنيه مصري)</option>
                    <option value="ر.س">ر.س (ريال سعودي)</option>
                    <option value="د.إ">د.إ (درهم إماراتي)</option>
                    <option value="$">$ (دولار أمريكي)</option>
                    <option value="د.أ">د.أ (دينار أردني)</option>
                    <option value="ر.ع">ر.ع (ريال عماني)</option>
                    <option value="د.ك">د.ك (دينار كويتي)</option>
                    <option value="د.ت">د.ت (دينار تونسي)</option>
                    <option value="د.ج">د.ج (دينار جزائري)</option>
                  </select>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={e => handleChange('currency', e.target.value)}
                    placeholder="أو اكتب رمزاً مخصصاً"
                    className="w-1/2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                العنوان ومقر الورشة
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="مثال: طرابلس / بغداد - شارع الإلكترونيات"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* 3. Warranty & Invoice Note */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                شروط الضمان وسياسة الصيانة (تطبع على الفاتورة)
              </label>
              <textarea
                rows={2}
                value={formData.warrantyTerms}
                onChange={e => handleChange('warrantyTerms', e.target.value)}
                placeholder="شروط الكفالة والاستلام..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                ملاحظة أسفل الفاتورة (Footer Note)
              </label>
              <input
                type="text"
                value={formData.invoiceFooterNote}
                onChange={e => handleChange('invoiceFooterNote', e.target.value)}
                placeholder="مثال: شكراً لتعاملكم مع ورشتنا • نسعد بخدمتكم دوماً"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                استعادة الافتراضي («المتحكمات الكهربائية»)
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Card: 1 col on lg */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              معاينة فورية لهوية المحل والعملة (Live Preview)
            </div>

            {/* Mock Header Branding */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white truncate">
                  {formData.shopName || 'المتحكمات الكهربائية'}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {formData.subTitle || 'لصيانة الأجهزة والمتحكمات الإلكترونية وبدائل القطع'}
                </p>
              </div>
            </div>

            {/* Mock Printable Invoice Header */}
            <div className="p-4 rounded-xl bg-white text-slate-900 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {formData.shopName || 'المتحكمات الكهربائية'}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    {formData.phone}
                  </div>
                </div>
                <div className="text-left text-[9px] font-mono text-slate-500">
                  سند صيانة: MNT-001
                </div>
              </div>

              <div className="text-[9px] text-slate-600 py-1 border-b border-slate-100 flex justify-between">
                <span>إجمالي الفاتورة:</span>
                <strong className="font-mono text-cyan-700">350 {formData.currency}</strong>
              </div>

              <div className="text-[8px] text-slate-400 leading-tight">
                {formData.invoiceFooterNote}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 leading-relaxed">
              💡 <strong>ملاحظة هامة:</strong> عند اختيار <strong>{formData.currency}</strong>، ينعكس هذا الرمز فورياً على جميع بطاقات الصيانة، الفواتير، وحساب الأرباح في المنظومة.
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Engineers & Technicians Management Section */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">طاقم ومهندسو الصيانة المسؤولون</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 font-mono">
                  {technicians.length} مهندس مسجل
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                إدارة أسماء وتخصصات المهندسين والفنيين وتعيينهم على بطاقات وفواتير الصيانة
              </p>
            </div>
          </div>

          {onOpenAddTechnician && (
            <button
              type="button"
              onClick={onOpenAddTechnician}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950 transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة مهندس صيانة جديد</span>
            </button>
          )}
        </div>

        {technicians.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
            <Wrench className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">لا يوجد مهندسون مسجلون حالياً في النظام.</p>
            <p className="text-[11px] text-slate-500">انقر على زر "إضافة مهندس صيانة جديد" بالأعلى لإضافة الفريق الفني للورشة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 transition shadow-sm space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate">
                        {tech.name}
                      </h4>
                      {tech.specialty && (
                        <span className="text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/50 inline-block mt-0.5 truncate max-w-[190px]">
                          {tech.specialty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onEditTechnician && (
                      <button
                        type="button"
                        onClick={() => onEditTechnician(tech)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="تعديل بيانات المهندس"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteTechnician && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف المهندس "${tech.name}"؟`)) {
                            onDeleteTechnician(tech.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition cursor-pointer"
                        title="حذف المهندس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {tech.phone && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono pt-1 border-t border-slate-900">
                    <Phone className="w-3 h-3 text-purple-400" />
                    <span>{tech.phone}</span>
                  </div>
                )}

                {tech.notes && (
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-900/40 p-2 rounded-lg">
                    {tech.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


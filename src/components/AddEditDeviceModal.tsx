import React, { useState } from 'react';
import { X, Tv, Check, AlertCircle, Image, Upload, Trash2, Link } from 'lucide-react';
import { Device } from '../db/types';
import { dbInstance } from '../db/sqliteEngine';

interface AddEditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  deviceToEdit?: Device | null;
}

const COMMON_DEVICE_TYPES = ['شاشة LED', 'شاشة ذكية Smart TV', 'خلاط ومفرمة', 'قلاية هوائية Airfryer', 'كشاف ومصباح طوارئ', 'ميكروويف ديجيتال', 'غسالة ملابس ديجيتال', 'ريسيفر استقبال', 'إنفرتر طاقة شمسية'];
const COMMON_BRANDS = ['LG', 'Samsung', 'Philips', 'Moulinex', 'Vestel', 'Toshiba', 'Panasonic', 'Geepas', 'Sony', 'Sharp', 'Universal / الصين'];

export const AddEditDeviceModal: React.FC<AddEditDeviceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  deviceToEdit,
}) => {
  const [deviceType, setDeviceType] = useState(deviceToEdit?.device_type || 'شاشة LED');
  const [brand, setBrand] = useState(deviceToEdit?.brand || 'LG');
  const [modelNumber, setModelNumber] = useState(deviceToEdit?.model_number || '');
  const [boardNumber, setBoardNumber] = useState(deviceToEdit?.board_number || '');
  const [imageUrl, setImageUrl] = useState(deviceToEdit?.image_url || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelNumber.trim()) {
      setError('يرجى إدخال موديل الجهاز أو الشاسيه (Model Number)');
      return;
    }

    try {
      if (deviceToEdit) {
        dbInstance.updateDevice({
          id: deviceToEdit.id,
          device_type: deviceType.trim(),
          brand: brand.trim(),
          model_number: modelNumber.trim(),
          board_number: boardNumber.trim(),
          image_url: imageUrl.trim() || undefined,
        });
      } else {
        dbInstance.addDevice({
          device_type: deviceType.trim(),
          brand: brand.trim(),
          model_number: modelNumber.trim(),
          board_number: boardNumber.trim(),
          image_url: imageUrl.trim() || undefined,
        });
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ الجهاز');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-right max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        <div className="bg-slate-800/80 p-5 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {deviceToEdit ? 'تعديل بيانات الجهاز/الشاسيه' : 'إضافة جهاز أو شاسيه جديد'}
              </h2>
              <p className="text-xs text-slate-400">تسجيل موديل شاشة، جهاز منزلي، أو رقم لوحة باور مع الصورة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                نوع الجهاز (Device Type) *
              </label>
              <input
                type="text"
                list="device-types-list"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                placeholder="شاشة LED, خلاط..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
                required
              />
              <datalist id="device-types-list">
                {COMMON_DEVICE_TYPES.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الشركة المصنعة (Brand) *
              </label>
              <input
                type="text"
                list="brands-list"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="LG, Samsung, Moulinex..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
                required
              />
              <datalist id="brands-list">
                {COMMON_BRANDS.map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              موديل الجهاز (Model Number) *
            </label>
            <input
              type="text"
              value={modelNumber}
              onChange={(e) => {
                setModelNumber(e.target.value);
                setError(null);
              }}
              placeholder="مثال: 32LM550BPTA أو LM240"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              رقم الشاسيه / كود البوردة (Chassis / Board Number)
            </label>
            <input
              type="text"
              value={boardNumber}
              onChange={(e) => setBoardNumber(e.target.value)}
              placeholder="مثال: TP.MS338E.PB801 أو EAX68253901 أو 17IPS19"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">كود اللوحة يسهل البحث المباشر للفنيين عند تشابه شاسيهات الشاشات الصينية والماركات العالمية.</p>
          </div>

          {/* Image Upload / URL Input */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-cyan-400" />
              صورة اللوحة أو الشاسيه أو الجهاز
            </label>

            {imageUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
                <img
                  src={imageUrl}
                  alt="معاينة اللوحة"
                  className="w-16 h-16 rounded-xl object-cover border border-cyan-500/40 bg-slate-950 shrink-0 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-emerald-400 font-bold block">تم تحميل صورة اللوحة/الجهاز ✓</span>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5 font-mono">
                    {imageUrl.startsWith('data:') ? 'صورة محلية مخزنة' : imageUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                  title="إزالة الصورة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-dashed border-cyan-500/40 hover:border-cyan-400 text-xs text-cyan-300 font-bold cursor-pointer transition">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>رفع صورة اللوحة من الجهاز</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="relative">
                    <Link className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="أو الصق رابط صورة (URL)..."
                      className="w-full pr-8 pl-3 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              تظهر الصورة على كارت الشاسيه باللوحة الرئيسية لتسهيل المقارنة البصرية للمسارات والمنافذ.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {deviceToEdit ? 'حفظ التعديلات' : 'إضافة الجهاز'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

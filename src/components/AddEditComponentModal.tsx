import React, { useState } from 'react';
import { X, Cpu, Check, AlertCircle, Image, Upload, Trash2, Link } from 'lucide-react';
import { Component } from '../db/types';
import { dbInstance } from '../db/sqliteEngine';

interface AddEditComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  componentToEdit?: Component | null;
}

const COMMON_PACKAGES = ['DIP-8', 'SOP-8', 'TO-220', 'TO-92', 'DIP-4', 'TO-263', 'SMD-8', 'SOT-23', 'TO-247', 'DIP-16'];
const COMMON_CATEGORIES = ['PWM Controller', 'Power MOSFET', 'Linear Regulator', 'Precision Shunt', 'Optocoupler', 'SMPS Switcher', 'Step-Down Buck', 'LinkSwitch', 'Audio Amp', 'Schottky Diode'];

export const AddEditComponentModal: React.FC<AddEditComponentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  componentToEdit,
}) => {
  const [partNumber, setPartNumber] = useState(componentToEdit?.part_number || '');
  const [packageType, setPackageType] = useState(componentToEdit?.package_type || 'DIP-8');
  const [category, setCategory] = useState(componentToEdit?.category || 'PWM Controller');
  const [description, setDescription] = useState(componentToEdit?.description || '');
  const [stockQuantity, setStockQuantity] = useState(componentToEdit?.stock_quantity ?? 5);
  const [binLocation, setBinLocation] = useState(componentToEdit?.bin_location || 'رف A / درج 01');
  const [imageUrl, setImageUrl] = useState(componentToEdit?.image_url || '');
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

    if (!partNumber.trim()) {
      setError('يرجى إدخال رمز القطعة (Part Number)');
      return;
    }

    try {
      if (componentToEdit) {
        dbInstance.updateComponent({
          id: componentToEdit.id,
          part_number: partNumber.trim(),
          package_type: packageType.trim(),
          category: category.trim(),
          description: description.trim(),
          stock_quantity: Number(stockQuantity),
          bin_location: binLocation.trim(),
          cost_price: componentToEdit.cost_price,
          sale_price: componentToEdit.sale_price,
          image_url: imageUrl.trim() || undefined,
        });
      } else {
        dbInstance.addComponent({
          part_number: partNumber.trim(),
          package_type: packageType.trim(),
          category: category.trim(),
          description: description.trim(),
          stock_quantity: Number(stockQuantity),
          bin_location: binLocation.trim(),
          image_url: imageUrl.trim() || undefined,
        });
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ القطعة');
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
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {componentToEdit ? 'تعديل بيانات القطعة' : 'إضافة قطعة إلكترونية جديدة'}
              </h2>
              <p className="text-xs text-slate-400">تسجيل آي سي، ترانزستور، أو منظم لجدول المخزون والبدائل مع الصورة</p>
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
          {/* Part Number & Package */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رمز القطعة (Part Number) *
              </label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => {
                  setPartNumber(e.target.value);
                  setError(null);
                }}
                placeholder="مثال: VIPer12A أو OB2269"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                نوع التغليف (Package)
              </label>
              <input
                type="text"
                list="packages-list"
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                placeholder="DIP-8, SOP-8, TO-220"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
              />
              <datalist id="packages-list">
                {COMMON_PACKAGES.map(pkg => <option key={pkg} value={pkg} />)}
              </datalist>
            </div>
          </div>

          {/* Category & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                التصنيف الوظيفي (Category)
              </label>
              <input
                type="text"
                list="categories-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="PWM Controller, Mosfet..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
              />
              <datalist id="categories-list">
                {COMMON_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رصيد المخزن الحالي (Stock Quantity)
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono"
              />
            </div>
          </div>

          {/* Bin Location */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              موقع التخزين بالورشة (الدرج / الرف / العلبة)
            </label>
            <input
              type="text"
              value={binLocation}
              onChange={(e) => setBinLocation(e.target.value)}
              placeholder="مثال: رف A / درج 01 / علبة 3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
            />
          </div>

          {/* Image Upload / URL Input */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-cyan-400" />
              صورة القطعة / الآيسي / مخطط الأطراف (Pinout)
            </label>

            {imageUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
                <img
                  src={imageUrl}
                  alt="معاينة القطعة"
                  className="w-16 h-16 rounded-xl object-cover border border-cyan-500/40 bg-slate-950 shrink-0 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-emerald-400 font-bold block">تم تحميل صورة القطعة ✓</span>
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
                    <span>رفع صورة من الجهاز</span>
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
              تظهر الصورة على كارت القطعة باللوحة الرئيسية لتسهيل التعرف البصري ومطابقة الشكل والأطراف.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              التوصيف التقني والملاحظات
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مذبذب باور لدوائر SMPS بقدرة 13W، جهد تغذية VDD حتى 38V..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-xs leading-relaxed"
            />
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
              {componentToEdit ? 'حفظ التعديلات' : 'إضافة القطعة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

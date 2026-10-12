import React, { useState, useEffect } from 'react';
import { X, Wrench, UserCheck, Phone, Award, CheckCircle } from 'lucide-react';
import { Technician } from '../../db/types';

interface AddTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Technician, 'id' | 'createdAt'>) => void;
  technicianToEdit?: Technician | null;
}

export const AddTechnicianModal: React.FC<AddTechnicianModalProps> = ({
  isOpen,
  onClose,
  onSave,
  technicianToEdit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (technicianToEdit) {
      setName(technicianToEdit.name);
      setPhone(technicianToEdit.phone || '');
      setSpecialty(technicianToEdit.specialty || '');
      setNotes(technicianToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setSpecialty('');
      setNotes('');
    }
  }, [technicianToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      phone: phone.trim() || undefined,
      specialty: specialty.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {technicianToEdit ? 'تعديل بيانات مهندس الصيانة' : 'إضافة مهندس صيانة جديد'}
              </h3>
              <p className="text-xs text-slate-400">
                تسجيل المهندسين والفنيين المسؤولين عن تشخيص وإصلاح الأجهزة
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              اسم المهندس أو الفني <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: م. عمر الليبي أو م. سرمد الكرخي"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              التخصص الفني الدقيق
            </label>
            <input
              type="text"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="مثال: صيانة شاشات LED، كروت مكيفات إنفرتر، كروت غسالات، باور سبلاي..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              رقم الهاتف / الواتساب
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="مثال: 091 234 5678 أو 0770 123 4567"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: متواجد بالفترة الصباحية، خبير بلحام الـ SMD والميكروكنترولر"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-purple-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              حفظ المهندس
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

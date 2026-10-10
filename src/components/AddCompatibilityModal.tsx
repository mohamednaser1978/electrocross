import React, { useState } from 'react';
import { X, Link2, Check, AlertCircle } from 'lucide-react';
import { dbInstance } from '../db/sqliteEngine';

interface AddCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialComponentId?: number;
  initialDeviceId?: number;
}

export const AddCompatibilityModal: React.FC<AddCompatibilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialComponentId,
  initialDeviceId,
}) => {
  const components = dbInstance.getComponents();
  const devices = dbInstance.getDevices();

  const [componentId, setComponentId] = useState<number>(initialComponentId || (components[0]?.id ?? 1));
  const [deviceId, setDeviceId] = useState<number>(initialDeviceId || (devices[0]?.id ?? 1));
  const [circuitRole, setCircuitRole] = useState('مذبذب الباور الرئيسي SMPS');
  const [boardLocation, setBoardLocation] = useState('IC901');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      dbInstance.addCompatibility({
        component_id: Number(componentId),
        device_id: Number(deviceId),
        circuit_role: circuitRole.trim(),
        board_location: boardLocation.trim(),
        technician_notes: technicianNotes.trim(),
      });
      onSave();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء ربط التوافقية');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        <div className="bg-slate-800/80 p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">ربط قطعة بجهاز أو شاسيه</h2>
              <p className="text-xs text-slate-400">توثيق وجود الآي سي في لوحة معينة مع موقع البوردة وملاحظات التركيب</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              القطعة الإلكترونية (Component) *
            </label>
            <select
              value={componentId}
              onChange={(e) => setComponentId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
              required
            >
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.part_number} ({c.package_type}) - {c.category} [رصيد: {c.stock_quantity}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              الجهاز أو اللوحة المتوافقة (Target Device / Chassis) *
            </label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
              required
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.model_number} ({d.device_type}) {d.board_number ? `[${d.board_number}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                موقع القطعة على البوردة (Board Location)
              </label>
              <input
                type="text"
                value={boardLocation}
                onChange={(e) => setBoardLocation(e.target.value)}
                placeholder="IC901, U102, Q501..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الوظيفة بالدائرة (Circuit Role)
              </label>
              <input
                type="text"
                value={circuitRole}
                onChange={(e) => setCircuitRole(e.target.value)}
                placeholder="SMPS Switcher, Inverter Driver..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ملاحظات فنية خاصة بالصيانة (Technician Notes)
            </label>
            <textarea
              rows={2}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="مثال: فحص مكثف السنبر ومقاومة الحماية 47Ω قبل التشغيل تجنباً لتلف المذبذب..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-xs leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-950"
            >
              <Check className="w-4 h-4" />
              حفظ التوافقية
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

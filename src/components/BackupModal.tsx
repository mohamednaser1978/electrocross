import React, { useState } from 'react';
import { X, Download, Upload, RotateCcw, Database, FileText, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { dbInstance } from '../db/sqliteEngine';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExportingDb, setIsExportingDb] = useState(false);

  if (!isOpen) return null;

  const handleDownloadSql = () => {
    const sql = dbInstance.generateSqlDump();
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electrocross_backup_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('تم تصدير ملف SQL بنجاح!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDownloadBinaryDb = async () => {
    setIsExportingDb(true);
    try {
      const binary = await dbInstance.exportSqliteBinary();
      if (binary) {
        const blob = new Blob([binary.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'electro.db';
        a.click();
        URL.revokeObjectURL(url);
        setStatusMessage('تم تصدير ملف SQLite (electro.db) بنجاح!');
      } else {
        // Fallback to SQL export
        handleDownloadSql();
      }
    } catch {
      handleDownloadSql();
    } finally {
      setIsExportingDb(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDownloadJson = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      components: dbInstance.getComponents(),
      devices: dbInstance.getDevices(),
      compatibilities: dbInstance.getCompatibilities(),
      equivalents: dbInstance.getEquivalents(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electrocross_db_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('تم تصدير ملف JSON بنجاح!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.components && parsed.devices) {
          dbInstance.importFromData(parsed);
          onDataChanged();
          setStatusMessage('تمت استعادة البيانات بنجاح من النسخة الاحتياطية!');
        } else {
          alert('الملف المحدد لا يحتوي على بنية بيانات ElectroCross صالحة.');
        }
      } catch {
        alert('خطأ في قراءة ملف JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToFactory = () => {
    if (confirm('هل أنت متأكد من استعادة بيانات المصنع الافتراضية؟ سيتم إرجاع كافة القطع واللوحات الأصلية.')) {
      dbInstance.resetToSeed();
      onDataChanged();
      setStatusMessage('تمت استعادة البيانات الافتراضية بنجاح!');
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-slate-800/80 p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">إدارة والنسخ الاحتياطي لقاعدة البيانات</h2>
              <p className="text-xs text-slate-400">تصدير واستيراد ملفات SQLite و SQL لضمان سلامة بيانات الورشة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {statusMessage}
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Export section */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              تصدير وحفظ نسخة احتياطية
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadBinaryDb}
                disabled={isExportingDb}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md shadow-cyan-950"
              >
                <Database className="w-4 h-4" />
                {isExportingDb ? 'جاري إنشاء الملف...' : 'تصدير ملف (electro.db)'}
              </button>

              <button
                onClick={handleDownloadSql}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                تصدير سكربت (schema.sql)
              </button>
            </div>

            <button
              onClick={handleDownloadJson}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition border border-dashed border-slate-700"
            >
              تصدير بصيغة JSON كاملة
            </button>
          </div>

          {/* Import section */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              استعادة نسخة احتياطية (Restore)
            </h3>
            <p className="text-xs text-slate-400">
              اختر ملف نسخة احتياطية سابقة (JSON) لاسترجاع القطع واللوحات كاملة إلى ورشتك.
            </p>

            <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition">
              <Upload className="w-4 h-4 text-emerald-400" />
              تحديد ملف للاستعادة
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportJson} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Reset section */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>إعادة ضبط البيانات إلى المحتوى الأولي (Factory Reset)</span>
            </div>
            <button
              onClick={handleResetToFactory}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              استعادة الأولية
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

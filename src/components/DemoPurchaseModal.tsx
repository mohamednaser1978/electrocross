import React from 'react';
import { ShieldCheck, HardDrive, WifiOff, Zap, CheckCircle2, MessageCircle, Mail, ExternalLink, X, Laptop } from 'lucide-react';

interface DemoPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableSimulator: () => void;
}

export const DemoPurchaseModal: React.FC<DemoPurchaseModalProps> = ({
  isOpen,
  onClose,
  onEnableSimulator,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 p-6 border-b border-cyan-500/20 relative">
          <button 
            onClick={onClose}
            className="absolute left-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              نسخة العرض التفاعلية (Web Demo)
            </span>
            <span className="text-xs text-slate-400">نظام ElectroCross للورش</span>
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            امتلك النسخة المكتبية المستقلة الكاملة لورشتك
          </h2>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            أنت حالياً تتصفح النسخة الاستعراضية المخصصة للموقع. لحفظ التعديلات وإدارة مخزون ورشتك بحرية تامة دون قيود، احصل على البرنامج المكتبي المستقل (Desktop Standalone).
          </p>
        </div>

        {/* Feature Grid */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">يعمل 100% بدون إنترنت (Offline)</h4>
                <p className="text-xs text-slate-400 mt-0.5">لا حاجة لأي اتصال شبكي؛ يعمل مباشرة على طاولة الصيانة في أي وقت.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">قاعدة بيانات محلية SQLite (electro.db)</h4>
                <p className="text-xs text-slate-400 mt-0.5">بياناتك ملكك تماماً بخصوصية وسرعة فائقة وسهولة النسخ الاحتياطي على فلاشة USB.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">إدارة مخزون وأدراج غير محدودة</h4>
                <p className="text-xs text-slate-400 mt-0.5">إضافة آلاف القطع، تتبع الأرفف والأدراج، وتنبيهات النواقص بضغطة زر واحدة.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">برنامج تنفيذي Windows (.exe)</h4>
                <p className="text-xs text-slate-400 mt-0.5">تثبيت فوري على ويندوز بنقرة واحدة (Tauri / Electron) واستهلاك خفيف جداً للرام.</p>
              </div>
            </div>
          </div>

          {/* Pricing & Guarantee Box */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-cyan-300 font-semibold">ترخيص مدى الحياة للورشة (Lifetime License)</div>
              <div className="text-lg font-black text-white mt-0.5">دفع لمرة واحدة • بدون اشتراكات شهرية • دعم فني وتحديثات</div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/?text=السلام%20عليكم%2C%20أرغب%20في%20شراء%20النسخة%20المكتبية%20من%20برنامج%20ElectroCross%20لورشة%20الصيانة"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                طلب الشراء عبر واتساب
              </a>
              <a
                href="mailto:workshop-sales@electrocross.local?subject=طلب شراء برنامج ElectroCross لورشة الصيانة"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition"
              >
                <Mail className="w-4 h-4" />
                إيميل
              </a>
            </div>
          </div>

          {/* Test Sandbox option */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              تريد تجربة إضافة وتعديل القطع الآن في المتصفح؟
            </span>
            <button
              onClick={() => {
                onEnableSimulator();
                onClose();
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 underline underline-offset-4"
            >
              تفعيل وضع محاكي الديسكتوب التجريبي (In-Memory Simulator)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

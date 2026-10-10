import React, { useState } from 'react';
import { X, Terminal, Copy, Check, HardDrive, Cpu, PackageCheck, FileCode, Layers } from 'lucide-react';

interface PackagingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PackagingGuideModal: React.FC<PackagingGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tauri' | 'electron' | 'sqlite'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tauriConfigSnippet = `{
  "$schema": "../node_modules/@tauri-apps/cli/schema.json",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:3000",
    "distDir": "../dist"
  },
  "package": {
    "productName": "ElectroCross",
    "version": "1.0.0"
  },
  "tauri": {
    "windows": [
      {
        "title": "ElectroCross - منظومة بدائل وتوافقية القطع الإلكترونية",
        "width": 1280,
        "height": 820,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.electrocross.workshop",
      "icon": ["icons/icon.ico", "icons/icon.png"]
    }
  }
}`;

  const electronMainSnippet = `// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

let db;
function initDatabase() {
  const dbDir = path.join(app.getPath('userData'), 'ElectroCross');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, 'electro.db');
  db = new Database(dbPath);
  
  // Read schema.sql on first launch
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-slate-800/80 p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">دليل تحزيم وتوزيع برنامج ElectroCross</h2>
              <p className="text-xs text-slate-400">كيفية إطلاق نسخة الويب التسويقية وتوليد ملف .exe للعملاء بنقرة زر</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            المسار المزدوج (Dual-Target)
          </button>
          <button
            onClick={() => setActiveTab('tauri')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'tauri'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            التحزيم عبر Tauri (الأسرع والأخف)
          </button>
          <button
            onClick={() => setActiveTab('electron')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'electron'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            التحزيم عبر Electron (الأسهل لـ JS)
          </button>
          <button
            onClick={() => setActiveTab('sqlite')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sqlite'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            ملف electro.db والنسخ الاحتياطي
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-sm leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <h3 className="font-bold text-white text-base mb-2">استراتيجية التسويق والبيع المقترحة:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-cyan-500/20">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-cyan-500/20 text-cyan-300 mb-2 inline-block">1. نسخة الويب (Online Demo)</span>
                    <p className="text-xs text-slate-300">
                      ارفَع مجلد <code>dist</code> بعد أمر <code>npm run build</code> إلى أي استضافة مجانية (Vercel أو Cloudflare Pages أو موقعك الشخصي).
                      تكون مفعلة بوضع <code>IS_DEMO_MODE = true</code> للقراءة والبحث، ليرى الفني قوة البحث الفوري وأرقام البدائل، مع ظهور نافذة الشراء عند محاولة التعديل.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-500/20">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/20 text-emerald-300 mb-2 inline-block">2. نسخة العميل (Desktop Standalone)</span>
                    <p className="text-xs text-slate-300">
                      عند تحويل المبلغ، تصدر ملف التثبيت <code>ElectroCross_v1.0_Setup.exe</code> مع وضع <code>IS_DEMO_MODE = false</code> وقاعدة البيانات المحلية المرفقة، ويقوم بتثبيته على حاسوبه وتشغيله 100% دون إنترنت.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <h4 className="font-bold text-white mb-2">أوامر البناء الأساسية:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-cyan-400" dir="ltr">
                    <span>npm run build</span>
                    <button 
                      onClick={() => copyCode('npm run build', 'cmd-build')} 
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'cmd-build' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-xs text-slate-400">يقوم بتوليد مجلد <code>dist/</code> الجاهز للنشر المباشر على الويب أو التحزيم المكتبي.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tauri' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <h3 className="font-bold text-white text-base">بناء ملف تثبيت خفيف للغاية عبر Tauri (حجم ~8MB فقط!)</h3>
                <p className="text-xs text-slate-300">
                  يستخدم Tauri محرك نظام التشغيل الافتراضي (Microsoft Edge WebView2 على ويندوز) ولغة Rust للخلفية، مما يمنحه سرعة استجابة هائلة بدون استهلاك الرام العالي.
                </p>

                <h4 className="font-bold text-xs text-cyan-400 pt-2">1. تثبيت أدوات Tauri في المشروع:</h4>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-cyan-400" dir="ltr">
                  <span>npm install -D @tauri-apps/cli</span>
                  <button onClick={() => copyCode('npm install -D @tauri-apps/cli', 'tauri-cli')} className="text-slate-400 hover:text-white">
                    {copiedKey === 'tauri-cli' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <h4 className="font-bold text-xs text-cyan-400 pt-2">2. تهيئة إعدادات Tauri:</h4>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-cyan-400" dir="ltr">
                  <span>npx tauri init</span>
                  <button onClick={() => copyCode('npx tauri init', 'tauri-init')} className="text-slate-400 hover:text-white">
                    {copiedKey === 'tauri-init' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <h4 className="font-bold text-xs text-cyan-400 pt-2">3. ملف <code>src-tauri/tauri.conf.json</code>:</h4>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 overflow-x-auto max-h-48" dir="ltr">
                    {tauriConfigSnippet}
                  </pre>
                  <button 
                    onClick={() => copyCode(tauriConfigSnippet, 'tauri-conf')} 
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'tauri-conf' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <h4 className="font-bold text-xs text-cyan-400 pt-2">4. إنشاء ملف التثبيت النهائي (Windows Installer .exe):</h4>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 font-bold" dir="ltr">
                  <span>npx tauri build</span>
                  <button onClick={() => copyCode('npx tauri build', 'tauri-build')} className="text-slate-400 hover:text-white">
                    {copiedKey === 'tauri-build' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">ستجد الملف التنفيذي في المجلد: <code>src-tauri/target/release/bundle/msi/</code></p>
              </div>
            </div>
          )}

          {activeTab === 'electron' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <h3 className="font-bold text-white text-base">التحزيم عبر Electron مع محرك better-sqlite3</h3>
                <p className="text-xs text-slate-300">
                  إذا كنت تفضل بيئة Node.js بالكامل بدون الحاجة لـ Rust، يمكنك استخدام Electron وحزم قاعدة بيانات <code>better-sqlite3</code> المحلية.
                </p>

                <h4 className="font-bold text-xs text-cyan-400 pt-2">1. تثبيت حزم Electron و electron-builder:</h4>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-cyan-400" dir="ltr">
                  <span>npm install -D electron electron-builder better-sqlite3</span>
                  <button onClick={() => copyCode('npm install -D electron electron-builder better-sqlite3', 'elec-inst')} className="text-slate-400 hover:text-white">
                    {copiedKey === 'elec-inst' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <h4 className="font-bold text-xs text-cyan-400 pt-2">2. كود الدخول الرئيسي <code>electron/main.js</code>:</h4>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 overflow-x-auto max-h-48" dir="ltr">
                    {electronMainSnippet}
                  </pre>
                  <button 
                    onClick={() => copyCode(electronMainSnippet, 'elec-main')} 
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'elec-main' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <h4 className="font-bold text-xs text-cyan-400 pt-2">3. بناء ملف الـ .exe عبر electron-builder:</h4>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 font-bold" dir="ltr">
                  <span>npx electron-builder --win</span>
                  <button onClick={() => copyCode('npx electron-builder --win', 'elec-build')} className="text-slate-400 hover:text-white">
                    {copiedKey === 'elec-build' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sqlite' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <h3 className="font-bold text-white text-base">إدارة ملف قاعدة البيانات المحلية (electro.db)</h3>
                <p className="text-xs text-slate-300">
                  ملف SQLite واحد يحوي كافة القطع والبدائل واللوحات وأرصدة الأدراج. يمنح العميل تحكماً كاملاً وسرعة استعلام لحظية.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">مسار حفظ الملف الافتراضي في ويندوز:</div>
                      <code className="text-xs text-cyan-400" dir="ltr">%APPDATA%\ElectroCross\electro.db</code>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                    <div className="text-xs font-bold text-white mb-1">النسخ الاحتياطي السريع:</div>
                    <div className="text-xs text-slate-400">
                      يمكن للفني أخذ نسخة احتياطية من زر "نسخ احتياطي" في أعلى البرنامج لحفظ ملف <code>electro.db</code> مباشرة على أي فلاش ميموري USB، واستعادته في ثوانٍ على أي حاسوب آخر.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};

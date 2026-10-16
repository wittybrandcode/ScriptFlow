import React, { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../../hooks/queries/useScenarios';
import { initDb, appSettingsRepository } from '@scriptflow/database';
import { initMediaStorage } from '../../services/mediaStorage';
import { invoke } from '@tauri-apps/api/core';
import { 
  Film, 
  ArrowLeft, 
  Lock, 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  FolderOpen, 
  ShieldCheck, 
  Database 
} from 'lucide-react';

export function getAuthToken() { return 'local_token'; }
export function setAuthToken(token) {}
export function clearAuthToken() {}
export async function authFetch(url, options = {}) { return fetch(url, options); }

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function seedDefaultAuth() {
  try {
    const existingEmail = await appSettingsRepository.get('auth_email');
    if (!existingEmail) {
      const defaultHash = await sha256('12345678');
      await appSettingsRepository.set('auth_email', 'admin@scriptflow.com');
      await appSettingsRepository.set('auth_password_hash', defaultHash);
    }
  } catch (err) {
    console.error("Failed to seed default credentials:", err);
  }
}

export default function LockScreen({ children }) {
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem('scriptflow_unlocked') !== 'true';
  });
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Database state & recovery
  const [dbReady, setDbReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [actionNotice, setActionNotice] = useState('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const initializeDatabase = useCallback(async () => {
    setIsInitializing(true);
    setDbError(null);
    setActionNotice('');

    // Watchdog timer: flag if init exceeds 8 seconds
    const watchdog = setTimeout(() => {
      setDbError('استغرقت محاولة تهيئة قاعدة البيانات وقتاً غير متوقع. قد يكون هناك قفل غير مغلق على الملف.');
      setIsInitializing(false);
    }, 8000);

    try {
      await initDb();
      await initMediaStorage();
      await seedDefaultAuth();
      clearTimeout(watchdog);
      setDbReady(true);
      setIsInitializing(false);
    } catch (err) {
      clearTimeout(watchdog);
      console.error("Failed to initialize database:", err);
      const rawMsg = err?.message || String(err);
      setDbError(rawMsg);
      setIsInitializing(false);

      // Attempt to load diagnostic metadata from Rust
      try {
        const diag = await invoke('get_db_diagnostic_info');
        setDiagnostic(diag);
      } catch (dErr) {
        console.warn("Could not fetch diagnostic info:", dErr);
      }
    }
  }, []);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  const handleOpenFolder = async () => {
    try {
      await invoke('open_app_data_folder');
      setActionNotice('تم فتح مجلد البيانات في مستكشف الملفات.');
    } catch (err) {
      setActionNotice(`تعذر فتح المجلد: ${err}`);
    }
  };

  const handleRestoreBackup = async () => {
    setIsPerformingAction(true);
    setActionNotice('');
    try {
      const res = await invoke('restore_safety_backup');
      setActionNotice('تمت استعادة أحدث نسخة احتياطية بنجاح! جاري إعادة الاتصال...');
      setTimeout(() => {
        setIsPerformingAction(false);
        initializeDatabase();
      }, 1500);
    } catch (err) {
      setIsPerformingAction(false);
      setActionNotice(`تعذر استعادة النسخة الاحتياطية: ${err}`);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsUnlocking(true);

    try {
      const storedEmail = await appSettingsRepository.get('auth_email');
      const storedHash = await appSettingsRepository.get('auth_password_hash');

      const enteredHash = await sha256(password);

      if (email === storedEmail && enteredHash === storedHash) {
        localStorage.setItem('scriptflow_unlocked', 'true');
        setTimeout(() => {
          setIsLocked(false);
        }, 600);
      } else {
        setIsUnlocking(false);
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error(err);
      setIsUnlocking(false);
      setErrorMsg('تعذر التحقق من الهوية (تأكد من إعدادات قاعدة البيانات)');
    }
  };

  // 1. Recovery Center if database fails to initialize
  if (dbError) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07070E] p-6 text-white font-sans" dir="rtl">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl shadow-2xl flex flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle size={36} />
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-wide text-center">مركز استعادة وتهيئة قاعدة البيانات</h2>
          <p className="text-sm text-white/60 mb-6 text-center leading-relaxed max-w-md">
            واجه التطبيق صعوبة أثناء الاتصال بملف قاعدة البيانات المحلية. بياناتك وسيناريوهاتك محفوظة، ويمكنك الاختيار من بين حلول الاستعادة الفورية أدناه:
          </p>

          <div className="w-full mb-6 rounded-2xl bg-black/50 border border-white/5 p-4 text-xs font-mono text-rose-300/90 overflow-x-auto max-h-36">
            <div className="flex items-center gap-2 font-bold text-rose-400 mb-2">
              <Database size={14} />
              <span>رسالة التشخيص الفني:</span>
            </div>
            <code>{dbError}</code>
            {diagnostic && (
              <div className="mt-3 pt-3 border-t border-white/10 text-white/50 text-[11px] space-y-1">
                <p>المسار النشط: {diagnostic.db_path}</p>
                <p>الحالة: {diagnostic.status} ({diagnostic.db_size_bytes} بايت)</p>
                {diagnostic.legacy_found && (
                  <p className="text-emerald-400">تم رصد قاعدة بيانات سابقة متوفرة في: {diagnostic.legacy_path}</p>
                )}
              </div>
            )}
          </div>

          {actionNotice && (
            <div className="w-full mb-4 py-2 px-3 rounded-xl bg-primary/20 border border-primary/30 text-xs text-primary-200 text-center font-medium">
              {actionNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <button
              onClick={initializeDatabase}
              disabled={isPerformingAction || isInitializing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition-all shadow-lg disabled:opacity-50"
            >
              <RefreshCw size={14} className={isInitializing ? 'animate-spin' : ''} />
              <span>إعادة المحاولة</span>
            </button>

            <button
              onClick={handleRestoreBackup}
              disabled={isPerformingAction || isInitializing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-all disabled:opacity-50"
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>استعادة النسخة</span>
            </button>

            <button
              onClick={handleOpenFolder}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-all"
            >
              <FolderOpen size={14} className="text-sky-400" />
              <span>مجلد البيانات</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading splash while initializing environment
  if (!dbReady) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A]">
         <div className="flex flex-col items-center gap-4">
           <Loader2 size={32} className="text-white animate-spin" />
           <p className="text-white/50 text-sm font-medium tracking-widest uppercase font-sans">
             تهيئة بيئة استوديو سيناريو...
           </p>
         </div>
      </div>
    );
  }

  // 3. Main app if unlocked
  if (!isLocked) {
    return <>{children}</>;
  }

  // 4. Studio Lock screen
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A] transition-opacity duration-500 ${isUnlocking ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-[#05050A] to-[#05050A] opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[500px] bg-primary/10 blur-[120px] pointer-events-none rounded-full -translate-y-1/2" />
      
      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-card/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl backdrop-blur-xl">
          <Film size={40} className="text-white drop-shadow-lg" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2 tracking-wide font-sans">SCRIPTFLOW ENTERPRISE</h1>
        <p className="text-sm font-medium text-white/50 mb-10 text-center tracking-widest uppercase">
          Studio Production Environment
        </p>

        <form onSubmit={handleUnlock} className="w-full space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
              <Film size={16} />
            </div>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني..." 
              className="w-full pl-4 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all font-sans"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
              <Lock size={16} />
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور..." 
              className="w-full pl-4 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all font-sans"
            />
          </div>
          
          {import.meta.env.DEV && (
            <button 
              type="button"
              onClick={() => { setEmail('admin@scriptflow.com'); setPassword('12345678'); }}
              className="w-full text-xs text-white/50 hover:text-white/80 transition-colors text-right font-medium"
            >
              تعبئة تلقائية (للتطوير)
            </button>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-500 font-bold text-center mt-2">
              {errorMsg}
            </p>
          )}
          
          <button 
            type="submit"
            disabled={!dbReady}
            className="w-full group relative flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-all overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dbReady ? (
              <>
                <span className="relative z-10 tracking-wide">تسجيل الدخول</span>
                <ArrowLeft size={16} className="relative z-10 group-hover:-translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <span className="relative z-10 tracking-wide">جاري تهيئة قاعدة البيانات...</span>
                <Loader2 size={16} className="relative z-10 animate-spin" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

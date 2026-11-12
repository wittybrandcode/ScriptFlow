import React, { useState, useEffect, useCallback } from 'react';
import { initDb, appSettingsRepository } from '@scriptflow/database';
import { initMediaStorage } from '../../services/mediaStorage';
import { invoke } from '@tauri-apps/api/core';
import { useTheme } from '../../hooks/useTheme';
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

export function getAuthToken(): string { return 'local_token'; }
export function setAuthToken(_token: string): void {}
export function clearAuthToken(): void {}
export async function authFetch(url: string | URL | Request, options: RequestInit = {}): Promise<Response> { return fetch(url, options); }

async function pbkdf2Hash(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const saltBuffer = enc.encode(salt);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function legacySha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function seedDefaultAuth(): Promise<void> {
  try {
    const existingEmail = await appSettingsRepository.get('auth_email');
    const existingHash = await appSettingsRepository.get('auth_password_hash');
    if (!existingEmail || !existingHash) {
      const salt = crypto.randomUUID();
      const defaultHash = await pbkdf2Hash('12345678', salt);
      await appSettingsRepository.set('auth_email', 'admin@scriptflow.com');
      await appSettingsRepository.set('auth_password_salt', salt);
      await appSettingsRepository.set('auth_password_hash', defaultHash);
    }
  } catch (err) {
    console.error("Failed to seed default credentials:", err);
  }
}

export interface LockScreenProps {
  children?: React.ReactNode;
}

export default function LockScreen({ children }: LockScreenProps): React.JSX.Element {
  const { theme } = useTheme();
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage?.getItem('scriptflow_session_unlocked') !== 'true';
  });
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Database state & recovery
  const [dbReady, setDbReady] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<string>('');
  const [isPerformingAction, setIsPerformingAction] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

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
      setDbError(null);
      setDbReady(true);
      setIsInitializing(false);
    } catch (err: any) {
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
      await invoke('restore_safety_backup');
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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsVerifying(true);

    try {
      const storedEmail = await appSettingsRepository.get('auth_email');
      const storedHash = await appSettingsRepository.get('auth_password_hash');
      const salt = await appSettingsRepository.get('auth_password_salt');

      let isValid = false;

      // 1. Try PBKDF2 if salt exists
      if (salt) {
        const enteredHash = await pbkdf2Hash(password, salt);
        if (email === storedEmail && enteredHash === storedHash) {
          isValid = true;
        }
      }

      // 2. If not valid yet, check legacy SHA-256 for backward compatibility & upgrade
      if (!isValid) {
        const legacyHash = await legacySha256(password);
        if (email === storedEmail && legacyHash === storedHash) {
          isValid = true;
          const activeSalt = salt || crypto.randomUUID();
          const upgradedHash = await pbkdf2Hash(password, activeSalt);
          await appSettingsRepository.set('auth_password_salt', activeSalt);
          await appSettingsRepository.set('auth_password_hash', upgradedHash);
        }
      }

      if (isValid) {
        setIsVerifying(false);
        setIsUnlocking(true);
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('scriptflow_session_unlocked', 'true');
        }
        setTimeout(() => {
          setIsLocked(false);
        }, 600);
      } else {
        setIsVerifying(false);
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setIsVerifying(false);
      setErrorMsg('تعذر التحقق من الهوية (تأكد من إعدادات قاعدة البيانات)');
    }
  };

  // 1. Recovery Center if database fails to initialize
  if (dbError) {
    return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-background p-6 text-foreground font-sans ${theme}`} dir="rtl">
        <div className="w-full max-w-xl border border-border bg-card p-8 shadow-2xl flex flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle size={36} />
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-wide text-center">مركز استعادة وتهيئة قاعدة البيانات</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center leading-relaxed max-w-md">
            واجه التطبيق صعوبة أثناء الاتصال بملف قاعدة البيانات المحلية. بياناتك وسيناريوهاتك محفوظة، ويمكنك الاختيار من بين حلول الاستعادة الفورية أدناه:
          </p>

          <div className="w-full mb-6 bg-secondary/40 border border-border p-4 text-xs font-mono text-rose-600 dark:text-rose-400 overflow-x-auto max-h-36">
            <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 mb-2">
              <Database size={14} />
              <span>رسالة التشخيص الفني:</span>
            </div>
            <code>{dbError}</code>
            {diagnostic && (
              <div className="mt-3 pt-3 border-t border-border text-muted-foreground text-[11px] space-y-1">
                <p>المسار النشط: {diagnostic.db_path}</p>
                <p>الحالة: {diagnostic.status} ({diagnostic.db_size_bytes} بايت)</p>
                {diagnostic.legacy_found && (
                  <p className="text-emerald-600 dark:text-emerald-400">تم رصد قاعدة بيانات سابقة متوفرة في: {diagnostic.legacy_path}</p>
                )}
              </div>
            )}
          </div>

          {actionNotice && (
            <div className="w-full mb-4 py-2 px-3 bg-primary/10 border border-primary/20 text-xs text-primary text-center font-medium">
              {actionNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <button
              type="button"
              onClick={initializeDatabase}
              disabled={isPerformingAction || isInitializing}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={isInitializing ? 'animate-spin' : ''} />
              <span>إعادة المحاولة</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreBackup}
              disabled={isPerformingAction || isInitializing}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-all disabled:opacity-50"
            >
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>استعادة النسخة</span>
            </button>

            <button
              type="button"
              onClick={handleOpenFolder}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-all"
            >
              <FolderOpen size={14} className="text-sky-600 dark:text-sky-400" />
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
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-background text-foreground ${theme}`}>
         <div className="flex flex-col items-center gap-4">
           <Loader2 size={32} className="text-primary animate-spin" />
           <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase font-sans">
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
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-background text-foreground transition-opacity duration-500 ${theme} ${isUnlocking ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} dir="rtl">
      <div className="w-full max-w-md p-8 bg-card border border-border shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/5 border border-border flex items-center justify-center mb-5">
          <Film size={32} className="text-primary" />
        </div>
        
        <h1 className="text-2xl font-black text-foreground mb-1 tracking-wide font-sans">SCRIPTFLOW ENTERPRISE</h1>
        <p className="text-xs font-semibold text-muted-foreground mb-8 text-center tracking-widest uppercase">
          Studio Production Environment
        </p>

        <form onSubmit={handleUnlock} className="w-full space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Film size={16} />
            </div>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني..." 
              className="w-full pl-4 pr-11 py-2.5 bg-secondary/30 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-sans"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Lock size={16} />
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور..." 
              className="w-full pl-4 pr-11 py-2.5 bg-secondary/30 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-sans"
            />
          </div>
          
          {import.meta.env.DEV && (
            <button 
              type="button"
              onClick={() => { setEmail('admin@scriptflow.com'); setPassword('12345678'); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-right font-medium"
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
            disabled={!dbReady || isVerifying}
            className="w-full group relative flex items-center justify-center gap-3 py-3 bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-sm mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <span className="relative z-10 tracking-wide">جاري التحقق من الهوية...</span>
                <Loader2 size={16} className="relative z-10 animate-spin" />
              </>
            ) : dbReady ? (
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

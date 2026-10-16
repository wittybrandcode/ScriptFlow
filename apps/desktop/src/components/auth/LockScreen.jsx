import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../../hooks/queries/useScenarios';
import { initDb, dbSelect, dbExecute } from '@scriptflow/database';
import { initMediaStorage } from '../../services/mediaStorage';
import { Film, ArrowLeft, Lock, Loader2 } from 'lucide-react';

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
    const existingEmail = await dbSelect("SELECT value FROM app_settings WHERE key = 'auth_email'");
    if (existingEmail.length === 0) {
      const defaultHash = await sha256('12345678');
      await dbExecute("INSERT INTO app_settings (key, value) VALUES ('auth_email', 'admin@scriptflow.com')");
      await dbExecute(`INSERT INTO app_settings (key, value) VALUES ('auth_password_hash', '${defaultHash}')`);
    }
  } catch (err) {
    console.error("Failed to seed default credentials:", err);
  }
}

export default function LockScreen({ children }) {
  const [isLocked, setIsLocked] = useState(() => {
    // Check if already unlocked permanently
    return localStorage.getItem('scriptflow_unlocked') !== 'true';
  });
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dbReady, setDbReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function initialize() {
      try {
        await initDb();
        await initMediaStorage();
        await seedDefaultAuth();
        setDbReady(true);
      } catch (err) {
        console.error("Failed to initialize database:", err);
      }
    }
    initialize();
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsUnlocking(true);

    try {
      const emailRows = await dbSelect("SELECT value FROM app_settings WHERE key = 'auth_email'");
      const hashRows = await dbSelect("SELECT value FROM app_settings WHERE key = 'auth_password_hash'");

      const storedEmail = emailRows[0]?.value;
      const storedHash = hashRows[0]?.value;

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

  if (!dbReady) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A]">
         <div className="flex flex-col items-center gap-4">
           <Loader2 size={32} className="text-white animate-spin" />
           <p className="text-white/50 text-sm font-medium tracking-widest uppercase font-sans">Initializing Environment...</p>
         </div>
      </div>
    );
  }

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A] transition-opacity duration-500 ${isUnlocking ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Cinematic Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-[#05050A] to-[#05050A] opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[500px] bg-primary/10 blur-[120px] pointer-events-none rounded-full -translate-y-1/2" />
      
      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center">
        {/* Logo Area */}
        <div className="w-20 h-20 bg-card/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl backdrop-blur-xl">
          <Film size={40} className="text-white drop-shadow-lg" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2 tracking-wide font-sans">SCRIPTFLOW</h1>
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

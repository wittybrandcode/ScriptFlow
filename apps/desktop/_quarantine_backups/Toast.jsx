import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onDismiss }) {
  const Icon = toast.type === 'success' ? CheckCircle2 :
               toast.type === 'error' ? AlertCircle : Info;

  const colorClass = toast.type === 'success' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                     toast.type === 'error' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' :
                     'text-blue-500 bg-blue-500/10 border-blue-500/20';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300 ${colorClass}`}>
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-bold tracking-wide text-foreground">
        {toast.message}
      </span>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="ml-auto shrink-0 p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-12 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

export default Toast;

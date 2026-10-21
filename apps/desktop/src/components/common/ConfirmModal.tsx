import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الإجراء',
  message,
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isLoading) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBg = isDanger 
    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
    : isWarning 
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
      : 'bg-primary/10 text-primary border-primary/20';

  const confirmBtnClass = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
    : isWarning
      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
      : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20';

  const IconComponent = isDanger ? Trash2 : isWarning ? AlertTriangle : Info;

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => !isLoading && onClose()}
    >
      <div 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${iconBg}`}>
              <IconComponent size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <div className="text-sm font-medium text-muted-foreground leading-relaxed">
            {message}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border/50 bg-secondary/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-border bg-background hover:bg-secondary text-foreground text-sm font-bold transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 ${confirmBtnClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export interface ErrorModalMessage {
  message: string;
  isWarning?: boolean;
  actionParams?: any;
}

export interface ErrorModalProps {
  errorModalMessage: ErrorModalMessage | null;
  onClose: () => void;
  onBypass: (params?: any) => void;
  addingPartner?: boolean;
}

export default function ErrorModal({
  errorModalMessage,
  onClose,
  onBypass,
  addingPartner
}: ErrorModalProps): React.JSX.Element | null {
  if (!errorModalMessage) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" dir="rtl">
      <div className={`bg-card border ${errorModalMessage.isWarning ? 'border-amber-500/30' : 'border-destructive/30'} shadow-2xl rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200`}>
        <div className={`${errorModalMessage.isWarning ? 'bg-amber-500/10 border-amber-500/20' : 'bg-destructive/10 border-destructive/20'} border-b p-4 flex items-center gap-3`}>
          <div className={`${errorModalMessage.isWarning ? 'bg-amber-500/20 text-amber-500' : 'bg-destructive/20 text-destructive'} p-2 rounded-full`}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className={`font-bold ${errorModalMessage.isWarning ? 'text-amber-500' : 'text-destructive'}`}>
              {errorModalMessage.isWarning ? 'تحذير بيولوجي (علاقة شائكة)' : 'تعذر إنشاء العلاقة'}
            </h3>
            <p className={`text-xs ${errorModalMessage.isWarning ? 'text-amber-500/80' : 'text-destructive/80'}`}>
              مكتبة نَسَب (NASAB)
            </p>
          </div>
        </div>
        <div className="p-6">
          <p className="text-foreground text-sm leading-relaxed font-medium">
            {errorModalMessage.message}
          </p>
        </div>
        <div className="bg-muted/50 p-4 border-t border-border flex justify-end gap-2">
          {errorModalMessage.isWarning && (
            <button
              type="button"
              onClick={() => onBypass(errorModalMessage.actionParams)}
              disabled={addingPartner}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {addingPartner && <Loader2 size={14} className="animate-spin" />}
              تجاوز (كسر درامي)
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-6 rounded-lg text-sm transition-colors"
          >
            {errorModalMessage.isWarning ? 'إلغاء' : 'حسناً، فهمت'}
          </button>
        </div>
      </div>
    </div>
  );
}

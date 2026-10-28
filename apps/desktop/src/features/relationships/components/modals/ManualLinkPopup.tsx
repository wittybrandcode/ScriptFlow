import React from 'react';
import { Link2, Loader2 } from 'lucide-react';

export interface ManualLinkPopupData {
  sourceName: string;
  targetName: string;
  sourceId?: string | number;
  targetId?: string | number;
  [key: string]: any;
}

export interface ManualLinkPopupProps {
  manualLinkPopup: ManualLinkPopupData | null;
  manualLinkLabel: string;
  setManualLinkLabel: (val: string) => void;
  onClose: () => void;
  onLink: () => void;
  addingPartner?: boolean;
}

export default function ManualLinkPopup({
  manualLinkPopup,
  manualLinkLabel,
  setManualLinkLabel,
  onClose,
  onLink,
  addingPartner
}: ManualLinkPopupProps): React.JSX.Element | null {
  if (!manualLinkPopup) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-card border border-primary/30 shadow-2xl rounded-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-primary/10 border-b border-primary/20 p-4 flex items-center gap-3">
          <div className="bg-primary/20 text-primary p-2 rounded-full">
            <Link2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-primary">ربط يدوي (درامي)</h3>
            <p className="text-xs text-primary/70">هذا الرابط لن يمر عبر مكتبة نَسَب</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="bg-secondary px-3 py-1.5 rounded-lg font-bold text-foreground">
              {manualLinkPopup.sourceName}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="bg-secondary px-3 py-1.5 rounded-lg font-bold text-foreground">
              {manualLinkPopup.targetName}
            </span>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5">اسم العلاقة</label>
            <input
              type="text"
              value={manualLinkLabel}
              onChange={e => setManualLinkLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onLink(); }}
              placeholder="مثال: عدو، صديق، زواج سري..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            💡 هذا الرابط يُخزّن من جهة التطبيق فقط ولن يؤثر على منطق المكتبة البيولوجية. يمكنك تسميته بأي اسم تريده للحبكة الدرامية.
          </p>
        </div>
        <div className="bg-muted/50 p-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onLink}
            disabled={addingPartner || !manualLinkLabel.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-5 rounded-lg text-sm transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {addingPartner && <Loader2 size={14} className="animate-spin" />}
            ربط
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

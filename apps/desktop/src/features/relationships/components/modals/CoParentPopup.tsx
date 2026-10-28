import React from 'react';

export interface CoParentPopupProps {
  coParentPopup: { x: number; y: number } | null;
  onClose: () => void;
  onChoice: (choice: 'MARRIAGE' | 'EX_MARRIAGE' | 'CO_PARENTS') => void;
  addingPartner?: boolean;
}

export default function CoParentPopup({
  coParentPopup,
  onClose,
  onChoice,
  addingPartner
}: CoParentPopupProps): React.JSX.Element | null {
  if (!coParentPopup) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60]" 
        onClick={onClose}
      />
      {/* Popup */}
      <div 
        className="fixed z-[70] bg-card border-2 border-amber-500/60 rounded-2xl shadow-2xl p-1 min-w-[220px]"
        style={{
          left: Math.min(coParentPopup.x, window.innerWidth - 240),
          top: Math.min(coParentPopup.y - 60, window.innerHeight - 220),
        }}
        dir="rtl"
      >
        <div className="px-3 py-2 border-b border-border">
          <p className="text-[11px] font-black text-amber-500 flex items-center gap-1.5">
            ❓ أبوان مشتركان — ما طبيعة علاقتهما؟
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">اختر لتحويل العلاقة المستنتجة إلى ثابتة</p>
        </div>
        <div className="flex flex-col gap-0.5 p-1">
          <button 
            type="button"
            onClick={() => onChoice('MARRIAGE')}
            disabled={addingPartner}
            className="flex items-center gap-2.5 w-full text-right px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/10 hover:text-emerald-400 transition-all group disabled:opacity-50"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">💍</span>
            <span>متزوجان</span>
          </button>
          <button 
            type="button"
            onClick={() => onChoice('EX_MARRIAGE')}
            disabled={addingPartner}
            className="flex items-center gap-2.5 w-full text-right px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-500/10 hover:text-rose-400 transition-all group disabled:opacity-50"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">💔</span>
            <span>مطلقان</span>
          </button>
          <button 
            type="button"
            onClick={() => onChoice('CO_PARENTS')}
            disabled={addingPartner}
            className="flex items-center gap-2.5 w-full text-right px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-500/10 hover:text-amber-400 transition-all group disabled:opacity-50"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">🤝</span>
            <span>أبوان دون زواج</span>
          </button>
        </div>
      </div>
    </>
  );
}

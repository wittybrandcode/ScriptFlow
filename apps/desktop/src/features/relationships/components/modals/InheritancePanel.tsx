import React from 'react';
import { Scale, X, ScrollText, Trash2, Info } from 'lucide-react';
import { COLORS } from '../../utils/relationColors';

const parseFraction = (fractionStr?: string | number | null): number => {
  if (!fractionStr) return 0;
  if (fractionStr === '0' || fractionStr === 0) return 0;
  const parts = fractionStr.toString().split('/');
  if (parts.length === 2) {
    return parseFloat(parts[0]) / parseFloat(parts[1]);
  }
  return parseFloat(fractionStr.toString()) || 0;
};

export interface InheritancePanelProps {
  inheritanceResult: {
    heirs?: Array<{
      heirId: string;
      share: string | number;
      nameAr?: string;
      reason?: string;
      isBlocked?: boolean;
      [key: string]: any;
    }>;
    summary?: string;
    [key: string]: any;
  } | null;
  characters?: any[];
  partner1?: string | number | null;
  onClose: () => void;
}

export default function InheritancePanel({
  inheritanceResult,
  characters = [],
  partner1,
  onClose
}: InheritancePanelProps): React.JSX.Element | null {
  if (!inheritanceResult) return null;

  const validHeirs = inheritanceResult.heirs || [];

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-left-8 duration-300" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm border border-amber-200/50">
            <Scale size={20} />
          </div>
          <div>
            <h2 className="text-[15px] font-black text-gray-800">تفاصيل المسألة الإرثية</h2>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              وفاة {characters?.find(c => String(c.id) === String(partner1))?.name}
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onClose} 
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          title="إغلاق"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 shadow-sm">
          <div className="text-emerald-600 text-[11px] font-bold flex items-center gap-1.5 mb-1.5">
            <ScrollText size={14} /> خلاصة المسألة
          </div>
          <div className="text-sm font-bold text-emerald-900 mt-2">{inheritanceResult.summary}</div>
        </div>
        
        <h3 className="text-xs font-black text-gray-400 mb-3 px-1 uppercase tracking-wider">الورثة والنصيب</h3>
        <div className="flex flex-col gap-2.5">
          {validHeirs.map((share, idx) => {
            const personName = characters?.find(c => String(c.id) === share.heirId)?.name || share.heirId;
            const isExcluded = share.isBlocked;
            return (
              <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border ${isExcluded ? 'bg-gray-50/50 border-gray-100 opacity-70' : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all shadow-sm'}`}>
                <div className="flex items-center gap-3">
                   <div className="w-3.5 h-3.5 rounded-full shadow-sm mt-1 self-start" style={{ backgroundColor: isExcluded ? '#cbd5e1' : COLORS[idx % COLORS.length] }} />
                   <div className="flex flex-col gap-1">
                     <span className={`font-bold text-[13px] ${isExcluded ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                       {personName}
                     </span>
                     <span className="text-[11px] text-gray-600 font-bold">{share.nameAr}</span>
                     <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                       {isExcluded ? <Trash2 size={10} className="text-red-400"/> : <Info size={10} className="text-indigo-400"/>}
                       {share.reason}
                     </span>
                   </div>
                </div>
                <div className="text-left shrink-0" dir="ltr">
                  {isExcluded ? (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md flex items-center gap-1 border border-red-100"><Trash2 size={12}/> مُحجوب</span>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-indigo-600">{share.share}</span>
                        <span className="text-[10px] font-bold text-gray-400">التركة</span>
                      </div>
                      <span className="text-[10px] text-indigo-400/80 font-bold bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5">
                        {(parseFraction(share.share) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {validHeirs.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-[11px] font-bold bg-gray-50 rounded-xl border border-gray-100">
              لا يوجد ورثة مسجلون
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

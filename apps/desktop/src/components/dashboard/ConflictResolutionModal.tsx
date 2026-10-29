import React from 'react';
import { X, Trash2, Save, Plus } from 'lucide-react';

export type ConflictResolutionMode = 'OVERWRITE' | 'MERGE' | 'COPY';

export interface ConflictData {
  type?: 'ID_CONFLICT' | 'NAME_CONFLICT' | string;
  existing: {
    title: string;
    [key: string]: any;
  };
  json: {
    scenario: {
      title: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export interface ConflictResolutionModalProps {
  conflictData: ConflictData | null;
  onResolve: (mode: ConflictResolutionMode) => void;
  onCancel: () => void;
}

export default function ConflictResolutionModal({ 
  conflictData, 
  onResolve, 
  onCancel 
}: ConflictResolutionModalProps): React.JSX.Element | null {
  if (!conflictData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000] animate-in fade-in duration-200">
      <div 
        dir="rtl"
        className="w-full max-w-lg bg-white border border-black/5 shadow-2xl rounded-3xl p-8 flex flex-col gap-6 scale-in-center animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-black/5 pb-4">
          <div>
            <h3 className="text-xl font-black text-black tracking-tight font-sans">
              تعارض في استيراد المشروع
            </h3>
            <p className="text-sm font-medium text-black/50 mt-1">
              تم الكشف عن مشروع موجود مسبقاً بنفس {conflictData.type === 'ID_CONFLICT' ? 'المعرّف الفريد' : 'الاسم'}.
            </p>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conflict Details */}
        <div className="bg-[#F9F9FB] rounded-2xl p-4 border border-black/5 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold text-black/40">
            <span>اسم المشروع المحلي:</span>
            <span className="text-black font-extrabold">{conflictData.existing?.title}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-black/40">
            <span>اسم المشروع المستورد:</span>
            <span className="text-[#3b82f6] font-extrabold">{conflictData.json?.scenario?.title}</span>
          </div>
        </div>

        {/* Options List */}
        <div className="flex flex-col gap-3">
          {/* Option 1: Overwrite */}
          <button
            type="button"
            onClick={() => onResolve('OVERWRITE')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-red-100 hover:border-red-200 bg-red-50/25 hover:bg-red-50/60 transition-all text-right group"
          >
            <div className="p-3 bg-red-100 rounded-xl text-red-600 transition-colors">
              <Trash2 size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-800 text-sm">استبدال المشروع بالكامل (Overwrite)</h4>
              <p className="text-xs text-red-600/80 mt-0.5">مسح المشروع المحلي الحالي وتجاوزه بالبيانات المستوردة الجديدة.</p>
            </div>
          </button>

          {/* Option 2: Merge */}
          <button
            type="button"
            onClick={() => onResolve('MERGE')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-blue-100 hover:border-blue-200 bg-blue-50/25 hover:bg-blue-50/60 transition-all text-right group"
          >
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 transition-colors">
              <Save size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-800 text-sm">دمج التغييرات الذكي (Merge)</h4>
              <p className="text-xs text-blue-600/80 mt-0.5">تحديث الحقول والبيانات وإدخال العناصر غير المتكررة مع الحفاظ على الأصول الحالية.</p>
            </div>
          </button>

          {/* Option 3: Copy */}
          <button
            type="button"
            onClick={() => onResolve('COPY')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-black/5 hover:border-black/10 bg-black/[0.01] hover:bg-black/[0.03] transition-all text-right group"
          >
            <div className="p-3 bg-black/5 rounded-xl text-black/60 transition-colors">
              <Plus size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-black/80 text-sm">حفظ كنسخة جديدة مكررة (Create Copy)</h4>
              <p className="text-xs text-black/50 mt-0.5">توليد معرّف جديد كلياً وتعديل الاسم تلقائياً لمنع التضارب.</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-2 border-t border-black/5 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-full border border-black/10 text-black/60 font-bold text-xs hover:bg-black/5 hover:text-black transition-all"
          >
            إلغاء الاستيراد
          </button>
        </div>
      </div>
    </div>
  );
}

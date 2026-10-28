import React, { useState } from 'react';
import { X, Edit3, Save, ArrowDownUp, MoveHorizontal } from 'lucide-react';

export interface SceneEditData {
  title: string;
  scene_number: number;
  order_mode: 'PUSH' | 'SWAP';
}

export interface QuickEditSceneItem {
  id: string | number;
  title?: string;
  scene_number?: number;
  episode_id?: string | number | null;
}

export interface QuickEditSceneModalProps {
  scene: QuickEditSceneItem | null;
  onClose: () => void;
  onSave: (sceneId: any, data: SceneEditData) => Promise<void> | void;
  allowReorder?: boolean;
}

export default function QuickEditSceneModal({ 
  scene, 
  onClose, 
  onSave, 
  allowReorder = true 
}: QuickEditSceneModalProps): React.JSX.Element | null {
  const [title, setTitle] = useState(scene?.title || '');
  const [sceneNumber, setSceneNumber] = useState(scene?.scene_number || 1);
  const [orderMode, setOrderMode] = useState<'PUSH' | 'SWAP'>('PUSH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!scene) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(scene.id, { 
        title, 
        scene_number: typeof sceneNumber === 'string' ? parseInt(sceneNumber, 10) : sceneNumber, 
        order_mode: orderMode 
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Edit3 size={16} />
            </div>
            <h3 className="font-bold text-foreground">تعديل سريع للمشهد</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              عنوان المشهد
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: المواجهة الأخيرة..."
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {!scene.episode_id ? (
              <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center gap-1 text-center">
                <span className="text-amber-600 text-xs font-bold">هذا المشهد لا ينتمي لأي حلقة</span>
                <span className="text-muted-foreground text-[10px]">يجب نقل المشهد لحلقة أولاً ليتم منحه رقماً</span>
              </div>
            ) : !allowReorder ? (
              <div className="w-full p-3 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center gap-1 text-center">
                <span className="text-primary text-xs font-bold">تعديل الترتيب مقفل هنا</span>
                <span className="text-muted-foreground text-[10px]">لتغيير ترتيب المشهد، يرجى الدخول إلى تبويب الحلقة الخاصة به (حلقة {scene.episode_id})</span>
              </div>
            ) : (
              <>
                <div className="space-y-2 w-full sm:w-24 shrink-0">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sceneNumber}
                    onChange={(e) => setSceneNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center"
                    required
                  />
                </div>
                
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    طريقة تغيير الترتيب
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderMode('PUSH')}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${orderMode === 'PUSH' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                      <ArrowDownUp size={14} />
                      <span>دفع وإزاحة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderMode('SWAP')}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${orderMode === 'SWAP' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                      <MoveHorizontal size={14} />
                      <span>استبدال المشهدين</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-input bg-background hover:bg-secondary text-foreground text-sm font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="animate-pulse">جاري الحفظ...</span>
              ) : (
                <>
                  <Save size={16} />
                  حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

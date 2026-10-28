import { useState } from 'react'
import { X, Copy, Tv, Film } from 'lucide-react'
import { useEpisodesQuery } from '../hooks/queries/useEpisodes';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';

import { useToast } from '../hooks/useToast';

const CLONE_TYPES = [
  { id: 'FLASHBACK', label: 'فلاشباك', desc: 'استرجاع حدث ماضي' },
  { id: 'FLASHFORWARD', label: 'فلاشفوروارد', desc: 'استباق حدث مستقبلي' },
  { id: 'RECALL', label: 'استدعاء', desc: 'تذكر شخصية لحدث' },
  { id: 'DUPLICATE', label: 'نسخة مكررة', desc: 'نسخ للعمل عليه كبديل' },
  { id: 'ALTERNATE', label: 'نسخة بديلة', desc: 'نسخة درامية بديلة' },
]

export default function CloneSceneModal({ scene, onClose, onClone }) {
  const { activeScenarioId } = useUIStore();
  const { showToast } = useToast();
  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId);
  const [targetEpisodeId, setTargetEpisodeId] = useState(scene.episode_id || '')
  const [cloneType, setCloneType] = useState('FLASHBACK')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!scene) return null

  const handleClone = async () => {
    try {
      setIsSubmitting(true)
      await onClone(scene.id, targetEpisodeId ? parseInt(targetEpisodeId) : null, cloneType)
      onClose()
    } catch (error) {
      console.error(error)
      showToast('حدث خطأ أثناء استنساخ المشهد', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Copy size={16} />
            </div>
            <div>
              <h3 className="font-bold text-foreground">استنساخ المشهد</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                مشهد {scene.scene_number} {scene.title ? `— ${scene.title}` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Information box */}
          <div className="bg-secondary/50 border border-border rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
            الاستنساخ ينشئ <strong>نسخة عميقة (Deep Copy)</strong> مستقلة تماماً بجميع الحوارات والكتل. تعديل النسخة الجديدة لن يؤثر على هذا المشهد الأصلي.
          </div>

          {/* Episode Selection */}
          {episodes.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-2">
                <Tv size={14} className="text-primary" />
                الحلقة المستهدفة
              </label>
              <select
                value={targetEpisodeId}
                onChange={(e) => setTargetEpisodeId(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">(بدون حلقة)</option>
                {episodes.map(ep => (
                  <option key={ep.id} value={ep.id}>
                    الحلقة {ep.episode_number} {ep.title ? `— ${ep.title}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clone Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <Film size={14} className="text-primary" />
              النوع الدرامي (Clone Type)
            </label>
            <div className="grid gap-2">
              {CLONE_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setCloneType(type.id)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-right transition-all ${
                    cloneType === type.id 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-background border-border hover:border-primary/40 hover:bg-secondary/30'
                  }`}
                >
                  <span className={`text-sm font-bold ${cloneType === type.id ? 'text-primary' : 'text-foreground'}`}>
                    {type.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-secondary/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-input bg-background hover:bg-secondary text-foreground text-sm font-bold transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleClone}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">جاري الاستنساخ...</span>
            ) : (
              <>
                <Copy size={16} />
                تأكيد الاستنساخ
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

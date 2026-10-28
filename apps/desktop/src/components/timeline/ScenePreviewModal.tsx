import React, { useEffect, useMemo } from 'react';
import { 
  X, MapPin, Clock, 
  Users, FileText, Camera, Clapperboard, Eye,
  Tag, Loader2
} from 'lucide-react';
import { useSceneDetailQuery } from '../../hooks/queries/useScenes';
import { useCharactersQuery } from '../../hooks/queries/useCharacters';

const TIME_LABELS: Record<string, string> = {
  'DAY': 'نهار', 'NIGHT': 'ليل', 'DAWN': 'فجر', 'DUSK': 'غروب',
  'MORNING': 'صباح', 'AFTERNOON': 'بعد الظهر', 'EVENING': 'مساء', 'MIDNIGHT': 'منتصف الليل',
};

export interface ScenePreviewModalProps {
  sceneId: string | number | null;
  onClose: () => void;
}

export default function ScenePreviewModal({ sceneId, onClose }: ScenePreviewModalProps): React.JSX.Element | null {
  const { data: sceneData, isLoading: loadingScene } = useSceneDetailQuery(sceneId ? String(sceneId) : null);
  const scene = sceneData as any;
  const { data: allCharacters = [] } = useCharactersQuery(scene?.scenario_id ? String(scene.scenario_id) : null);

  const loading = loadingScene;
  const characters = useMemo(() => {
    if (!scene?.present_characters) return [];
    try {
      const charIds = JSON.parse(scene.present_characters);
      return (allCharacters as any[]).filter(c => charIds.some((id: any) => String(id) === String(c.id)));
    } catch {
      return [];
    }
  }, [scene?.present_characters, allCharacters]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!sceneId) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-card border border-border rounded-2xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : scene ? (
          <>
            {/* ─── Header ─── */}
            <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Eye size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground leading-tight">
                      {scene.scene_number}. {scene.title || 'بدون عنوان'}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${scene.location_type === 'INT' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {scene.location_type || 'INT'}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {TIME_LABELS[scene.time_of_day || ''] || 'نهار'}
                      </span>
                      {scene.weather && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          {scene.weather}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Meta Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {scene.location_name && (
                  <div className="flex items-center gap-1 text-[10px] font-bold bg-secondary/50 px-2 py-1 rounded-lg text-muted-foreground">
                    <MapPin size={10} className="text-primary/70" /> {scene.location_name}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] font-bold bg-secondary/50 px-2 py-1 rounded-lg text-muted-foreground">
                  <Clock size={10} /> {scene.estimated_duration || 0} دقيقة
                </div>
                {scene.revision_color && scene.revision_color !== 'WHITE' && (
                  <div className="flex items-center gap-1 text-[10px] font-bold bg-secondary/50 px-2 py-1 rounded-lg text-muted-foreground">
                    <Tag size={10} /> {scene.revision_color}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Scrollable Body ─── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

              {/* Characters Strip */}
              {characters.length > 0 && (
                <div className="px-5 py-3 border-b border-border/50 bg-secondary/10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-muted-foreground flex items-center gap-1 ml-2">
                      <Users size={11} /> الشخصيات:
                    </span>
                    {characters.map(char => (
                      <div key={char.id} className="flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1">
                        {char.image_url ? (
                          <img src={char.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary">
                            {(char.name || '?')[0]}
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-foreground">{char.name}</span>
                        <Clapperboard size={9} className={char.actor_name ? 'text-primary/60' : 'text-muted-foreground/30'} />
                        <span className={`text-[9px] font-bold ${char.actor_name ? 'text-primary/70' : 'text-muted-foreground/40 italic'}`}>
                          {char.actor_name || '—'}
                        </span>
                        {char.role && <span className="text-[9px] text-muted-foreground">({char.role})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {scene.description && (
                <div className="px-5 py-3 border-b border-border/50">
                  <p className="text-[12px] font-medium text-foreground/80 leading-relaxed">{scene.description}</p>
                </div>
              )}

              {/* ─── Screenplay Content ─── */}
              {scene.blocks && scene.blocks.length > 0 && (
                <div className="px-5 py-4">
                  <h4 className="text-[10px] font-black text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Clapperboard size={11} /> محتوى السيناريو
                    <span className="bg-secondary px-1.5 rounded text-[9px]">{scene.blocks.length}</span>
                  </h4>

                  <div className="bg-background rounded-xl border border-border p-4 flex flex-col gap-0.5">
                    {scene.blocks.map((block: any, i: number) => {
                      let meta: Record<string, any> = {};
                      try { 
                        meta = JSON.parse(block.metadata || '{}'); 
                      } catch (e) {
                        console.warn('Failed to parse block metadata in ScenePreviewModal', e);
                      }

                      if (block.type === 'DIALOGUE') {
                        return (
                          <div key={block.id || i} className="py-2">
                            {/* Character name - centered screenplay style */}
                            <div className="text-center mb-0.5">
                              <span className="text-[11px] font-black text-foreground uppercase tracking-wider">
                                {block.character_name || '...'}
                              </span>
                              {meta.tone && (
                                <span className="text-[9px] font-bold text-muted-foreground mr-1">
                                  ({meta.tone})
                                </span>
                              )}
                            </div>
                            {/* Dialogue text - centered narrower */}
                            <div className="mx-auto max-w-[85%]">
                              <p className="text-[12px] font-medium text-foreground/90 leading-relaxed text-center whitespace-pre-wrap">
                                {block.content || ''}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      if (block.type === 'ACTION' || block.type === 'DESCRIPTION') {
                        return (
                          <div key={block.id || i} className="py-2 border-t border-border/30 first:border-t-0">
                            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {block.content || ''}
                            </p>
                          </div>
                        );
                      }

                      if (block.type === 'SHOT') {
                        return (
                          <div key={block.id || i} className="py-1.5">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                              {block.content || ''}
                            </p>
                          </div>
                        );
                      }

                      if (block.type === 'TRANSITION') {
                        return (
                          <div key={block.id || i} className="py-1.5 text-left">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                              {block.content || ''}
                            </p>
                          </div>
                        );
                      }

                      // NOTE or other
                      return (
                        <div key={block.id || i} className="py-1.5 bg-amber-500/5 rounded px-2 my-1">
                          <p className="text-[10px] font-bold text-amber-700 italic">
                            {block.content || ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── Notes Section ─── */}
              {(scene.extras_note || scene.director_notes || scene.continuity) && (
                <div className="px-5 py-3 border-t border-border/50 flex flex-col gap-3">
                  {scene.extras_note && (
                    <div>
                      <h4 className="text-[10px] font-black text-muted-foreground mb-1 flex items-center gap-1">
                        <Users size={10} /> الكومبارس
                      </h4>
                      <p className="text-[11px] font-medium text-foreground/70 leading-relaxed pr-4">{scene.extras_note}</p>
                    </div>
                  )}
                  {scene.director_notes && (
                    <div>
                      <h4 className="text-[10px] font-black text-muted-foreground mb-1 flex items-center gap-1">
                        <Camera size={10} /> ملاحظات المخرج
                      </h4>
                      <p className="text-[11px] font-medium text-foreground/70 leading-relaxed pr-4">{scene.director_notes}</p>
                    </div>
                  )}
                  {scene.continuity && (
                    <div>
                      <h4 className="text-[10px] font-black text-muted-foreground mb-1 flex items-center gap-1">
                        <FileText size={10} /> الاستمرارية
                      </h4>
                      <p className="text-[11px] font-medium text-foreground/70 leading-relaxed pr-4">{scene.continuity}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Footer ─── */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0 bg-secondary/10">
              <span className="text-[9px] font-bold text-muted-foreground/50">#{scene.id}</span>
              <button 
                onClick={onClose}
                className="px-4 py-1.5 text-[11px] font-bold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors border border-border"
              >
                إغلاق
              </button>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <p className="font-bold">لم يتم العثور على المشهد</p>
          </div>
        )}
      </div>
    </div>
  );
}

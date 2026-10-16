import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckSquare, Square, Save, Loader2, PlaySquare, Film } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useCharactersQuery, useCrewAssignmentsQuery, useSyncCrewAssignmentsMutation, useEpisodesQuery, useScenesQuery } from '../hooks/queries';

export default function CrewAssignmentModal({ member, onClose }) {
  const activeScenarioId = useUIStore().activeScenarioId; const activeScenario = null;
  const { data: assignments = [] } = useCrewAssignmentsQuery(activeScenarioId);
  const syncMutation = useSyncCrewAssignmentsMutation();
  const { data: characters = [] } = useCharactersQuery(activeScenarioId);
  
  const isActor = member.category === 'CAST';
  
  const { data: episodes = [], isLoading: loadingEpisodes } = useEpisodesQuery(activeScenarioId);
  const { data: scenes = [], isLoading: loadingScenes } = useScenesQuery(activeScenarioId);
  const [saving, setSaving] = useState(false);
  
  const loading = loadingEpisodes || loadingScenes;
  
  // Set of strings: "ep:1" or "sc:5" or "ep:1:sc:5"
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!loading && activeScenarioId) {
      // Parse initial assignments for this member
      const memberAssignments = assignments.filter(a => a.crew_id === member.id);
      const initSet = new Set();
      memberAssignments.forEach(a => {
        if (a.scene_id) {
          initSet.add(`sc:${a.scene_id}`);
        } else if (a.episode_id) {
          initSet.add(`ep:${a.episode_id}`);
        }
      });
      setSelected(initSet);
    }
  }, [activeScenarioId, activeScenario, assignments, member.id, loading]);

  const handleToggle = (idStr) => {
    const newSet = new Set(selected);
    if (newSet.has(idStr)) {
      newSet.delete(idStr);
    } else {
      newSet.add(idStr);
    }
    setSelected(newSet);
  };

  const handleToggleEpisodeContent = (epId, epScenes) => {
    const newSet = new Set(selected);
    const epStr = `ep:${epId}`;
    const isAllSelected = newSet.has(epStr) && epScenes.every(s => newSet.has(`sc:${s.id}`));
    
    if (isAllSelected) {
      newSet.delete(epStr);
      epScenes.forEach(s => newSet.delete(`sc:${s.id}`));
    } else {
      newSet.add(epStr);
      epScenes.forEach(s => newSet.add(`sc:${s.id}`));
    }
    setSelected(newSet);
  };

  const handleSave = async () => {
    setSaving(true);
    const resultList = [];
    selected.forEach(val => {
      if (val.startsWith('ep:')) {
        resultList.push({ episode_id: parseInt(val.split(':')[1]), scene_id: null });
      } else if (val.startsWith('sc:')) {
        // Find which episode this scene belongs to, if any
        const scId = parseInt(val.split(':')[1]);
        const sceneObj = scenes.find(s => s.id === scId);
        resultList.push({ 
          episode_id: sceneObj?.episode_id || null, 
          scene_id: scId 
        });
      }
    });

    try {
      await syncMutation.mutateAsync({ crewId: member.id, scenarioId: activeScenarioId, assignments: resultList });
      setSaving(false);
      onClose();
    } catch(err) {
      setSaving(false);
      alert('حدث خطأ أثناء حفظ التكليفات.');
    }
  };

  const isSeries = episodes && episodes.length > 0;

  const ROLE_LABELS = {
    DIRECTOR: 'الإخراج', PRODUCTION: 'الإنتاج', CAMERA: 'التصوير', LIGHTING: 'الإضاءة',
    SOUND: 'الصوت', ART: 'الديكور', WARDROBE: 'الملابس', MAKEUP: 'المكياج', POST: 'مونتاج'
  };
  const roleName = ROLE_LABELS[member.role] || member.role || 'أخرى';
  const jobTitleStr = member.job_title ? ` - ${member.job_title}` : '';

  // Determine scenes for Actor (implicitly assigned via character)
  const actorCharacters = useMemo(() => {
    return isActor ? characters.filter(c => c.actor_id === member.id) : [];
  }, [characters, member.id, isActor]);

  const actorCharacterIds = useMemo(() => {
    return actorCharacters.map(c => c.id);
  }, [actorCharacters]);

  const actorScenesList = useMemo(() => {
    if (!isActor) return [];
    return scenes.filter(sc => {
      try {
        const pc = JSON.parse(sc.present_characters || '[]');
        return pc.some(id => actorCharacterIds.includes(id));
      } catch (e) {
        return false;
      }
    });
  }, [scenes, actorCharacterIds, isActor]);

  // Group scenes by episode
  const tree = useMemo(() => {
    const sourceScenes = isActor ? actorScenesList : scenes;
    if (!isSeries) return { null: sourceScenes };
    const groups = { null: [] };
    episodes.forEach(ep => groups[ep.id] = []);
    sourceScenes.forEach(sc => {
      if (groups[sc.episode_id]) {
        groups[sc.episode_id].push(sc);
      } else {
        groups.null.push(sc);
      }
    });
    return groups;
  }, [episodes, scenes, isSeries, isActor, actorScenesList]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div 
        className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0 bg-secondary/30">
          <div>
            <h2 className="text-lg font-black text-foreground">
              {isActor ? (
                <div className="flex items-center flex-wrap gap-1 leading-relaxed">
                  <span>{member.name}</span>
                  <span className="text-muted-foreground font-medium text-sm px-1">- في دور -</span>
                  {actorCharacters.map((c, i) => (
                    <React.Fragment key={c.id}>
                      {i > 0 && <span className="text-muted-foreground font-normal">،</span>}
                      <a href={`/characters/${c.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline hover:text-primary/80 transition-colors">
                        {c.name}
                      </a>
                    </React.Fragment>
                  ))}
                  {actorCharacters.length === 0 && <span className="text-muted-foreground italic text-sm font-normal">لم يسند لأي شخصية بعد</span>}
                </div>
              ) : (
                "تكليف المهام"
              )}
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {isActor ? (
                <>استعراض المشاهد التي تظهر فيها شخصيات هذا الممثل داخل السيناريو.</>
              ) : (
                <>ربط <span className="text-primary font-bold">{member.name}</span> <span className="text-xs">({roleName}{jobTitleStr})</span> بحلقات ومشاهد المشروع.</>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={32} className="text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {isSeries && episodes.map(ep => {
                const epScenes = tree[ep.id] || [];
                const epStr = `ep:${ep.id}`;
                const isEpSelected = selected.has(epStr);
                const isAllSelected = isEpSelected && epScenes.every(s => selected.has(`sc:${s.id}`));
                
                return (
                  <div key={ep.id} className="border border-border rounded-xl overflow-hidden">
                    <div 
                      className={`bg-secondary/50 p-3 flex items-center gap-3 transition-colors ${!isActor ? 'cursor-pointer hover:bg-secondary' : ''}`}
                      onClick={() => !isActor && handleToggleEpisodeContent(ep.id, epScenes)}
                    >
                      {!isActor && (
                        <button className="text-primary">
                          {isAllSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-muted-foreground" />}
                        </button>
                      )}
                      <PlaySquare size={16} className="text-muted-foreground" />
                      <span className="font-bold text-sm">الحلقة {ep.episode_number}: {ep.title || 'بدون عنوان'}</span>
                      {isActor && <span className="mr-auto text-xs font-bold text-muted-foreground bg-background px-2 py-1 rounded-md">{epScenes.length} مشاهد</span>}
                    </div>
                    
                    {epScenes.length > 0 && (
                      <div className="p-2 bg-background border-t border-border">
                        {epScenes.map(sc => {
                          const scStr = `sc:${sc.id}`;
                          const isScSelected = selected.has(scStr);
                          
                          // For Actor: find which characters are in this scene
                          let scCharacters = [];
                          if (isActor) {
                            try {
                              const pc = JSON.parse(sc.present_characters || '[]');
                              scCharacters = characters.filter(c => c.actor_id === member.id && pc.includes(c.id));
                            } catch (e) {
                              console.warn('Failed to parse present_characters in CrewAssignmentModal', e);
                            }
                          }

                          const Wrapper = isActor ? 'a' : 'div';
                          const wrapperProps = isActor 
                            ? { href: `/scene/${sc.id}`, target: "_blank", rel: "noopener noreferrer" } 
                            : { onClick: () => handleToggle(scStr) };

                          return (
                            <Wrapper 
                              key={sc.id} 
                              className={`flex items-center gap-3 p-2 rounded-lg transition-colors mr-6 ${!isActor ? 'cursor-pointer hover:bg-secondary/30' : 'bg-secondary/10 border border-border/30 mb-1 hover:bg-secondary/30 cursor-pointer group'}`}
                              {...wrapperProps}
                            >
                              {!isActor && (
                                <button className="text-primary">
                                  {isScSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-muted-foreground" />}
                                </button>
                              )}
                              <Film size={14} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                              <span className="text-xs font-bold truncate flex-1 group-hover:text-primary transition-colors" title={`${sc.location_type ? sc.location_type + '. ' : ''}${sc.title || sc.location_name || 'بدون عنوان'}${sc.time_of_day ? ' - ' + sc.time_of_day : ''}`}>
                                مشهد {sc.scene_number || sc.id}: {sc.location_type ? sc.location_type + '. ' : ''}{sc.title || sc.location_name || 'بدون عنوان'}{sc.time_of_day ? ' - ' + sc.time_of_day : ''}
                              </span>
                              
                              {isActor && scCharacters.length > 0 && (
                                <div className="flex gap-1 shrink-0">
                                  {scCharacters.map(c => (
                                    <span key={c.id} className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </Wrapper>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unassigned or Movie Scenes */}
              {tree.null && tree.null.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  {!isSeries && (
                    <div className="bg-secondary/50 p-3 flex items-center gap-2 border-b border-border">
                      <Film size={16} className="text-muted-foreground" />
                      <span className="font-bold text-sm">مشاهد الفيلم</span>
                    </div>
                  )}
                  <div className="p-2 bg-background">
                    {tree.null.map(sc => {
                      const scStr = `sc:${sc.id}`;
                      const isScSelected = selected.has(scStr);
                      const Wrapper = isActor ? 'a' : 'div';
                      const wrapperProps = isActor 
                        ? { href: `/scene/${sc.id}`, target: "_blank", rel: "noopener noreferrer" } 
                        : { onClick: () => handleToggle(scStr) };

                      return (
                        <Wrapper 
                          key={sc.id} 
                          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${!isActor ? 'cursor-pointer hover:bg-secondary/30' : 'bg-secondary/10 border border-border/30 mb-1 hover:bg-secondary/30 cursor-pointer group'}`}
                          {...wrapperProps}
                        >
                          {!isActor && (
                            <button className="text-primary">
                              {isScSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-muted-foreground" />}
                            </button>
                          )}
                          <Film size={14} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                          <span className="text-xs font-bold truncate flex-1 group-hover:text-primary transition-colors" title={`${sc.location_type ? sc.location_type + '. ' : ''}${sc.title || sc.location_name || 'بدون عنوان'}${sc.time_of_day ? ' - ' + sc.time_of_day : ''}`}>
                            مشهد {sc.scene_number || sc.id}: {sc.location_type ? sc.location_type + '. ' : ''}{sc.title || sc.location_name || 'بدون عنوان'}{sc.time_of_day ? ' - ' + sc.time_of_day : ''}
                          </span>

                          {isActor && (() => {
                            let scCharacters = [];
                            try {
                              const pc = JSON.parse(sc.present_characters || '[]');
                              scCharacters = characters.filter(c => c.actor_id === member.id && pc.includes(c.id));
                            } catch (e) {}
                            if (scCharacters.length === 0) return null;
                            return (
                              <div className="flex gap-1 shrink-0">
                                {scCharacters.map(c => (
                                  <span key={c.id} className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            )
                          })()}
                        </Wrapper>
                      );
                    })}
                  </div>
                </div>
              )}

              {scenes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm font-bold bg-secondary/20 rounded-xl border border-dashed border-border">
                  لا توجد مشاهد مسجلة في هذا المشروع بعد.
                </div>
              )}
              
              {isActor && actorScenesList.length === 0 && scenes.length > 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm font-bold bg-secondary/20 rounded-xl border border-dashed border-border">
                  هذا الممثل لا يظهر في أي مشهد حالياً. تأكد من إسناده لشخصيات، وتأكد من وجود تلك الشخصيات داخل أحداث المشاهد.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-3 bg-secondary/20 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className={`px-4 py-2 text-sm font-bold transition-colors ${isActor ? 'bg-primary text-white rounded-lg hover:bg-primary/90' : 'text-muted-foreground hover:bg-secondary rounded-lg'}`}
          >
            {isActor ? 'إغلاق' : 'إلغاء'}
          </button>
          {!isActor && (
            <button 
              onClick={handleSave} 
              disabled={loading || saving}
              className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              حفظ التكليفات
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

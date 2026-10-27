import React, { useState, memo } from 'react';
import { FileText, ChevronRight, LayoutList, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export interface NavigatorSceneItem {
  id: string | number;
  scene_number: number;
  title?: string;
  status?: string;
  description?: string;
  director_notes?: string;
  time_of_day?: string;
  location_name?: string;
  location_type?: string;
  page_count?: number | string;
  [key: string]: any;
}

export interface PageNumberingRecord {
  item_id: string | number;
  item_type?: string;
  page_count?: number | string;
  [key: string]: any;
}

export interface SceneNavigatorProps {
  scenes: NavigatorSceneItem[];
  activeSceneId?: string | number | null;
  onSelectScene: (sceneId: string) => void;
  drafts?: NavigatorSceneItem[];
  onImportDraft?: (draftId: string) => void;
  currentEpisodeId?: string | number | null;
  pageNumbering?: PageNumberingRecord[];
}

const SceneNavigatorComponent: React.FC<SceneNavigatorProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  drafts = [],
  onImportDraft,
  currentEpisodeId,
  pageNumbering = []
}) => {
  const [hoveredScene, setHoveredScene] = useState<NavigatorSceneItem | null>(null);

  const getSmartPages = (scene: NavigatorSceneItem): string => {
    // 1. Check Page Numbering System (Calculated Source of Truth)
    const pgnRecord = pageNumbering.find(p => String(p.item_id) === String(scene.id) && (p.item_type === 'SCENE' || !p.item_type));
    if (pgnRecord && pgnRecord.page_count) {
      return String(pgnRecord.page_count);
    }
    // 2. Direct Fallback to stored page count
    return scene.page_count ? String(scene.page_count) : '1';
  };

  const [previewPos, setPreviewPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { pinnedSceneId, setPinnedSceneId } = useUIStore();
  const pinnedScene = scenes.find(s => String(s.id) === String(pinnedSceneId));

  const calculatePos = (rect: DOMRect) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const previewWidth = 360;
    const previewHeight = 250;

    let top = rect.top;
    let left = rect.right + 20;

    if (top + previewHeight > windowHeight) {
      top = windowHeight - previewHeight - 20;
    }
    if (left + previewWidth > windowWidth) {
      left = rect.left - previewWidth - 20;
    }
    return { top, left };
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, scene: NavigatorSceneItem) => {
    const pos = calculatePos(e.currentTarget.getBoundingClientRect());
    setPreviewPos(pos);
    setHoveredScene(scene);
  };

  const handleTogglePin = (e: React.MouseEvent, scene: NavigatorSceneItem) => {
    e?.stopPropagation?.();
    if (String(pinnedSceneId) === String(scene.id)) {
      setPinnedSceneId(null);
    } else {
      setPinnedSceneId(scene.id);
    }
  };

  return (
    <div className={`border-r border-border bg-card/10 backdrop-blur-md flex flex-col h-screen animate-in slide-in-from-left duration-500 relative shrink-0 z-[100] transition-all ${isCollapsed ? 'w-[60px]' : 'w-[250px]'}`}>
      <div className={`h-16 px-5 border-b border-border/50 bg-secondary/20 flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <LayoutList size={20} className="text-muted-foreground" />
            <div className="bg-primary/10 text-primary text-[11px] font-black px-2.5 py-1 rounded-md">
              {scenes.length}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-black/5 rounded-lg"
          title={isCollapsed ? "فتح القائمة" : "غلق القائمة"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar pb-10">
        {scenes.map((scene) => {
          const isActive = String(scene.id) === String(activeSceneId);
          const isPinned = String(pinnedSceneId) === String(scene.id);

          return (
            <div key={scene.id} className="relative group/parent">
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.ctrlKey || e.metaKey) {
                    handleTogglePin(e, scene);
                  } else {
                    onSelectScene(String(scene.id));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectScene(String(scene.id));
                  }
                }}
                onMouseEnter={(e) => handleMouseEnter(e, scene)}
                onMouseLeave={() => setHoveredScene(null)}
                className={`
                  w-full text-right transition-all duration-300 group relative cursor-pointer outline-none border select-none
                  ${isCollapsed
                    ? 'p-1.5 flex justify-center border-transparent bg-transparent hover:-translate-x-1'
                    : `p-2 rounded-lg ${isActive
                        ? 'bg-primary border-primary shadow-sm -translate-x-1'
                        : isPinned
                          ? 'bg-secondary/40 border-primary shadow-inner opacity-90'
                          : 'bg-card/40 border-border/50 hover:border-primary/40 hover:bg-card hover:-translate-x-1'
                      }`
                  }
                `}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                  {/* Compact Page Number */}
                  <div className={`
                    w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-sm font-black transition-all border
                    ${!isCollapsed ? (
                      // Expanded State Bubble
                      isActive ? 'bg-white text-primary shadow-inner border-transparent' : 'bg-secondary text-muted-foreground group-hover:text-primary border-transparent'
                    ) : (
                      // Collapsed State Bubble
                      isActive ? 'bg-primary text-white shadow-md shadow-primary/40 border-primary' :
                      isPinned ? 'bg-secondary/80 border-primary text-primary opacity-80' :
                      'bg-secondary/50 border-transparent text-muted-foreground hover:bg-white hover:shadow-sm'
                    )}
                  `}>
                    {scene.scene_number > 0 ? scene.scene_number : '-'}
                  </div>

                  {!isCollapsed && (
                    <>
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className={`text-sm font-bold truncate m-0 ${isActive ? 'text-white' : 'text-foreground'}`}>
                          {scene.title || 'بدون عنوان'}
                        </h4>
                      </div>

                      {isActive && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 animate-in fade-in duration-300">
                          <ChevronRight size={12} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drafts Pool Section (Pre-Freeze Feature) */}
      {!isCollapsed && drafts.length > 0 && currentEpisodeId && (
        <div className="mx-3 mb-4 p-3 bg-primary/5 rounded-xl border border-primary/20 animate-in slide-in-from-bottom duration-500">
           <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">مجمع المسودات</span>
             <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">{drafts.length}</span>
           </div>
           <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {drafts.map(draft => (
                <div key={draft.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-white/50 rounded-lg transition-colors group">
                  <span className="text-[11px] font-bold text-foreground/70 truncate flex-1">{draft.title || 'مسودة بدون عنوان'}</span>
                  {onImportDraft && (
                    <button
                      type="button"
                      onClick={() => onImportDraft(String(draft.id))}
                      className="opacity-0 group-hover:opacity-100 bg-primary text-white p-1 rounded-md transition-all hover:scale-110"
                      title="استيراد لهذه الحلقة"
                    >
                      <Plus size={10} />
                    </button>
                  )}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 1. TRANSIENT HOVER PREVIEW (COMPACT VERSION) */}
      {hoveredScene && String(hoveredScene.id) !== String(activeSceneId) && pinnedScene?.id !== hoveredScene.id && (
        <div
          style={{
            top: previewPos.top,
            left: previewPos.left
          }}
          className="fixed w-[360px] p-4 bg-card opacity-100 border-2 border-border/80 rounded-xl z-[5000] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200 shadow-2xl flex flex-col gap-3"
        >
           {/* Header: Title & Scene Number */}
           <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
              <h5 className="font-bold text-base text-foreground line-clamp-2 text-right leading-tight flex-1">
                {hoveredScene.title || 'مشهد بدون عنوان'}
              </h5>
              <div className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-black border
                ${hoveredScene.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                {hoveredScene.scene_number > 0 ? hoveredScene.scene_number : '-'}
              </div>
           </div>

           {/* Middle: Description & Notes */}
           {(hoveredScene.description || hoveredScene.director_notes) ? (
             <div className="flex flex-col gap-2">
               {hoveredScene.description && (
                 <p className="text-sm text-foreground/80 leading-relaxed text-right line-clamp-3">
                    {hoveredScene.description}
                 </p>
               )}
               {hoveredScene.director_notes && (
                 <div className="bg-primary/5 p-2.5 rounded-lg border-r-2 border-primary">
                   <p className="text-xs font-bold text-primary/90 text-right line-clamp-2">
                      {hoveredScene.director_notes}
                   </p>
                 </div>
               )}
             </div>
           ) : (
             <div className="text-xs text-muted-foreground text-center py-2 italic">
                لا توجد تفاصيل إضافية
             </div>
           )}

           {/* Bottom: Meta Info (Location, Time, Pages) */}
           <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50 text-[11px] font-bold text-muted-foreground">
              <div className="flex flex-col gap-0.5">
                 <span className="text-primary uppercase">{hoveredScene.time_of_day}</span>
                 <span className="truncate max-w-[200px]">{hoveredScene.location_name || hoveredScene.location_type}</span>
              </div>
              <div className="bg-secondary/60 px-2.5 py-1.5 rounded-md text-foreground flex items-center gap-1.5 border border-border/50">
                 <FileText size={12} className="text-primary" />
                 <span>{getSmartPages(hoveredScene)} صفحة</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default memo(SceneNavigatorComponent, (prevProps, nextProps) => {
  if (prevProps.activeSceneId !== nextProps.activeSceneId) return false;
  if (prevProps.currentEpisodeId !== nextProps.currentEpisodeId) return false;
  if (prevProps.scenes !== nextProps.scenes) return false;
  if (prevProps.drafts !== nextProps.drafts) return false;
  if (prevProps.pageNumbering !== nextProps.pageNumbering) return false;
  return true;
});

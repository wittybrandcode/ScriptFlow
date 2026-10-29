import React from 'react';
import { 
  Tv, ChevronRight, Edit3, Copy, Trash2, MapPin, Plus, FileText
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from '../SortableItem';
import { TIME_MAP } from '../../constants/sceneConstants';

export default function SceneKanbanBoard({
  filteredScenes,
  episodes,
  filterEpisode,
  collapsedEpisodes,
  toggleEpisodeCollapse,
  handleDragEnd,
  handleMoveScene,
  navigate,
  setQuickEditScene,
  setCloneModalScene,
  handleDeleteScene,
  handleNewScene,
  sensors,
  totalScenes
}) {
  if (filteredScenes.length === 0) {
    return (
      <div className="text-center py-24 bg-card border border-border rounded-2xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground font-sans">
          <FileText size={36} />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2 font-sans">
          {totalScenes === 0 ? 'لا توجد مشاهد بعد' : 'لا توجد نتائج تطابق بحثك'}
        </h2>
        <p className="text-muted-foreground mb-6 font-sans">
          {totalScenes === 0 ? 'ابدأ بإضافة مشهدك الأول' : 'حاول تغيير معايير البحث أو التصفية'}
        </p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredScenes.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-[10px]">
            {(() => {
              const groups = [];
              let lastEpId = undefined;

              filteredScenes.forEach(scene => {
                if (filterEpisode === 'ALL') {
                  if (scene.episode_id !== lastEpId) {
                    groups.push({ episodeId: scene.episode_id, scenes: [] });
                    lastEpId = scene.episode_id;
                  }
                  groups[groups.length - 1].scenes.push(scene);
                } else {
                  if (groups.length === 0) groups.push({ episodeId: scene.episode_id, scenes: [] });
                  groups[0].scenes.push(scene);
                }
              });

              return groups.map((group, index) => {
                const currentEpisode = episodes.find(e => e.id === group.episodeId);
                const isCollapsed = group.episodeId && collapsedEpisodes.includes(group.episodeId);

                return (
                  <div key={`${group.episodeId || 'pool'}-${index}`} className="flex flex-col">
                    {filterEpisode === 'ALL' && currentEpisode && (
                      <div 
                        onClick={() => toggleEpisodeCollapse(currentEpisode.id)}
                        className="py-[5px] flex items-center gap-4 cursor-pointer group/sep"
                      >
                        <div className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-primary/20 group-hover/sep:scale-105 transition-transform">
                          <Tv size={14} />
                          <span>حلقة {currentEpisode.episode_number}</span>
                          {currentEpisode.title && <span className="opacity-80">| {currentEpisode.title}</span>}
                          <ChevronRight size={14} className={`ml-1 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                        </div>
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
                      </div>
                    )}

                    <div className={`flex flex-col gap-[10px] transition-all duration-500 ease-in-out origin-top ${
                      isCollapsed 
                        ? 'max-h-0 opacity-0 pointer-events-none scale-y-95 overflow-hidden invisible mt-[-10px]' 
                        : 'max-h-[10000px] opacity-100 scale-y-100 visible'
                    }`}>
                      {group.scenes.map(scene => (
                        <SortableItem 
                          key={scene.id}
                          id={scene.id} 
                          disabled={filterEpisode === 'ALL'}
                          onMoveUp={() => handleMoveScene(scene.id, 'up')}
                          onMoveDown={() => handleMoveScene(scene.id, 'down')}
                          virtualize={true}
                        >
                          <div
                            onClick={() => navigate(`/scene/${scene.id}`)}
                            className="bg-card border border-border rounded-lg px-4 py-2 hover:shadow-sm hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden flex-1"
                          >
                            <div className="flex items-center gap-4 text-sm">
                              <div className="w-8 shrink-0 text-center font-black text-primary/40 text-lg">
                                {scene.scene_number > 0 ? String(scene.scene_number).padStart(2, '0') : '--'}
                              </div>
                              <div className="w-12 shrink-0 text-center">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                  scene.location_type === 'INT' ? 'bg-blue-100 text-blue-700' : 
                                  scene.location_type === 'EXT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {scene.location_type === 'INT' ? 'داخلي' : 'خارجي'}
                                </span>
                              </div>
                              <div className="w-16 shrink-0 text-center text-[10px] font-black text-muted-foreground uppercase bg-secondary/40 rounded py-0.5">
                                {TIME_MAP[scene.time_of_day] || scene.time_of_day}
                              </div>
                              <div className="w-48 shrink-0 font-bold text-foreground truncate text-right">
                                {scene.title || 'بدون عنوان'}
                              </div>
                              <div className="flex-1 min-w-0 text-xs text-muted-foreground truncate opacity-60 text-right">
                                {scene.description || '...'}
                              </div>
                              <div className="w-32 shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/80 truncate justify-end">
                                <MapPin size={12} className="shrink-0" />
                                <span className="truncate">{scene.location_name || '...'}</span>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 border-r border-border pr-2 mr-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setQuickEditScene(scene); }}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  title="تعديل سريع"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setCloneModalScene(scene); }}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  title="استنساخ"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteScene(scene.id, e)}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Scene Button at the bottom */}
      <div className="mt-8 flex justify-center pb-8">
        <button
          onClick={handleNewScene}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-secondary/80 text-muted-foreground border border-border hover:bg-primary hover:text-white hover:-translate-y-1 hover:shadow-lg hover:border-primary transition-all group"
          title="إضافة مشهد جديد"
        >
          <Plus size={24} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </>
  );
}

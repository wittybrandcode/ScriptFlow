import React, { useState, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { FolderKanban, Search, MapPin, MapPinOff, Sun, Moon } from 'lucide-react';
import CompactSceneCard from './CompactSceneCard';
import { useUIStore } from '../../store/useUIStore';
import { useEpisodesQuery } from '../../hooks/queries/useEpisodes';
import type { IEpisode } from '@scriptflow/core';

export interface TimelineSidebarProps {
  scenes: any[];
}

export default function TimelineSidebar({ scenes = [] }: TimelineSidebarProps): React.JSX.Element {
  const { activeScenarioId } = useUIStore();
  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationTab, setLocationTab] = useState<'ALL' | 'WITH_LOC' | 'NO_LOC'>('ALL');
  const [settingFilter, setSettingFilter] = useState<'ALL' | 'INT' | 'EXT'>('ALL');

  const { setNodeRef } = useDroppable({
    id: 'unscheduled-bank',
    data: {
      type: 'Bank'
    }
  });

  const filteredScenes = useMemo(() => {
    return scenes.filter(scene => {
      // Location Tab Filter
      if (locationTab === 'WITH_LOC' && !scene.location_id) return false;
      if (locationTab === 'NO_LOC' && scene.location_id) return false;

      // Setting Filter
      if (settingFilter === 'INT' && scene.setting !== 'INT') return false;
      if (settingFilter === 'EXT' && scene.setting !== 'EXT') return false;

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = (scene.title || '').toLowerCase();
        const locName = (scene.location_name || '').toLowerCase();
        const num = scene.scene_number?.toString() || '';
        if (!title.includes(query) && !locName.includes(query) && !num.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [scenes, locationTab, settingFilter, searchQuery]);

  const sceneIds = useMemo(() => filteredScenes.map(s => s.id.toString()), [filteredScenes]);

  const groupedScenes = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredScenes.forEach(scene => {
      const ep = scene.episode_id || 'unassigned';
      if (!groups[ep]) groups[ep] = [];
      groups[ep].push(scene);
    });
    return groups;
  }, [filteredScenes]);

  const sortedEpisodeIds = Object.keys(groupedScenes).sort((a, b) => {
    if (a === 'unassigned') return 1;
    if (b === 'unassigned') return -1;
    const epA = episodes.find((e: IEpisode) => String(e.id) === a);
    const epB = episodes.find((e: IEpisode) => String(e.id) === b);
    const numA = epA ? epA.episode_number : parseInt(a, 10);
    const numB = epB ? epB.episode_number : parseInt(b, 10);
    return numA - numB;
  });

  const getEpisodeTitle = (epId: string): string => {
    if (epId === 'unassigned') return 'مشاهد غير مصنفة لحلقات';
    const ep = episodes.find((e: IEpisode) => String(e.id) === String(epId));
    if (ep) {
       return `حلقة ${ep.episode_number} | ${ep.title}`;
    }
    return `الحلقة ${epId}`;
  };

  return (
    <div className="w-[300px] shrink-0 border-r border-border bg-card flex flex-col h-full z-20" dir="rtl">
      <div className="p-3 border-b border-border/50 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <FolderKanban size={16} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-black text-foreground leading-none mb-1">بنك المشاهد</h2>
          <p className="text-[10px] font-bold text-muted-foreground">
            {filteredScenes.length} مشاهد معروضة
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-3 border-b border-border/50 bg-secondary/10 flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="بحث..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded text-[11px] font-bold pl-2 pr-7 py-1.5 focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Location Tabs */}
        <div className="flex bg-background border border-border rounded p-0.5">
          <button 
            type="button"
            onClick={() => setLocationTab('ALL')}
            className={`flex-1 text-[9px] font-bold py-1 rounded-sm transition-colors ${locationTab === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            الكل
          </button>
          <button 
            type="button"
            onClick={() => setLocationTab('WITH_LOC')}
            className={`flex-1 text-[9px] font-bold py-1 rounded-sm transition-colors flex items-center justify-center gap-1 ${locationTab === 'WITH_LOC' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <MapPin size={10} /> بمواقع
          </button>
          <button 
            type="button"
            onClick={() => setLocationTab('NO_LOC')}
            className={`flex-1 text-[9px] font-bold py-1 rounded-sm transition-colors flex items-center justify-center gap-1 ${locationTab === 'NO_LOC' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <MapPinOff size={10} /> بدون موقع
          </button>
        </div>

        {/* Setting Toggle */}
        <div className="flex gap-1 mt-1">
          <button 
            type="button"
            onClick={() => setSettingFilter(settingFilter === 'INT' ? 'ALL' : 'INT')}
            className={`flex-1 flex items-center justify-center gap-1 text-[9px] font-bold py-1 rounded border transition-colors ${
              settingFilter === 'INT' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-background border-border text-muted-foreground hover:border-amber-500/20 hover:bg-amber-500/5'
            }`}
          >
            <Sun size={10} /> داخلي
          </button>
          <button 
            type="button"
            onClick={() => setSettingFilter(settingFilter === 'EXT' ? 'ALL' : 'EXT')}
            className={`flex-1 flex items-center justify-center gap-1 text-[9px] font-bold py-1 rounded border transition-colors ${
              settingFilter === 'EXT' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : 'bg-background border-border text-muted-foreground hover:border-blue-500/20 hover:bg-blue-500/5'
            }`}
          >
            <Moon size={10} /> خارجي
          </button>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2"
      >
        <SortableContext items={sceneIds} strategy={verticalListSortingStrategy}>
          {sortedEpisodeIds.map(epId => (
            <React.Fragment key={epId}>
              <div className="text-[10px] font-black text-muted-foreground bg-secondary/50 px-2 py-1.5 rounded mt-2 border border-border first:mt-0 flex items-center justify-between">
                <span className="truncate flex-1">{getEpisodeTitle(epId)}</span>
                <span className="bg-background px-1.5 rounded text-[9px] shrink-0 mr-2">
                  {groupedScenes[epId].length} مشهد
                </span>
              </div>
              {groupedScenes[epId].map(scene => (
                <CompactSceneCard key={scene.id} scene={scene} virtualize={true} />
              ))}
            </React.Fragment>
          ))}
        </SortableContext>

        {filteredScenes.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 opacity-50">
            <Search size={24} className="mb-2 text-muted-foreground" />
            <p className="text-xs font-bold text-muted-foreground">لا توجد مشاهد مطابقة للفلتر!</p>
          </div>
        )}
      </div>
    </div>
  );
}

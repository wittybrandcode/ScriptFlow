import React from 'react';
import { 
  Plus, Tv, Maximize2, Minimize2, History, ChevronRight
} from 'lucide-react';
import { TIME_MAP } from '../../constants/sceneConstants';
import AdvancedFilterBar from '../ui/AdvancedFilterBar';

export interface SceneToolbarProps {
  episodes: any[];
  filterEpisode: string;
  setFilterEpisode: (ep: string) => void;
  setShowAddEpisodeModal: (show: boolean) => void;
  setShowQuickAddModal: (show: boolean) => void;
  handleNewScene: () => void;
  handleToggleAll: () => void;
  collapsedEpisodes: (string | number)[];
  filterLocation: string;
  setFilterLocation: (loc: string) => void;
  filterRealLocation: string;
  setFilterRealLocation: (loc: string) => void;
  uniqueLocations: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredScenesCount: number;
  filterTimes: string[];
  setFilterTimes: React.Dispatch<React.SetStateAction<string[]>>;
  uniqueCustomTimes: string[];
}

export default function SceneToolbar({
  episodes,
  filterEpisode, setFilterEpisode,
  setShowAddEpisodeModal,
  setShowQuickAddModal,
  handleNewScene,
  handleToggleAll,
  collapsedEpisodes,
  filterLocation, setFilterLocation,
  filterRealLocation, setFilterRealLocation,
  uniqueLocations,
  searchQuery, setSearchQuery,
  filteredScenesCount,
  filterTimes, setFilterTimes,
  uniqueCustomTimes
}: SceneToolbarProps) {
  return (
    <>
      {/* Top Controls Bar (Episodes + Add Scene) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {episodes.length > 0 ? (
            <>
              <Tv size={14} className="text-primary shrink-0" />
              <button
                type="button"
                onClick={() => setFilterEpisode('ALL')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${filterEpisode === 'ALL' ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
              >
                المسلسل بالكامل
              </button>
              <button
                type="button"
                onClick={() => setFilterEpisode('NONE')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${filterEpisode === 'NONE' ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
              >
                مشاهد غير مصنفة
              </button>
              
              <div className="relative group">
                <select
                  value={['ALL', 'NONE'].includes(filterEpisode) ? '' : filterEpisode}
                  onChange={(e) => setFilterEpisode(e.target.value)}
                  className="appearance-none bg-secondary/50 border border-border rounded-xl px-4 py-1.5 pr-8 text-xs font-bold text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="" disabled>انتقل للحلقة...</option>
                  {episodes.map(ep => (
                    <option key={ep.id} value={String(ep.id)}>
                      حلقة {ep.episode_number}{ep.title ? ` — ${ep.title}` : ''} ({ep.scene_count || 0})
                    </option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none rotate-90" />
              </div>

              <button
                type="button"
                onClick={() => setShowAddEpisodeModal(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary text-muted-foreground border border-dashed border-border hover:border-primary hover:text-primary transition-all"
                title="إضافة حلقة جديدة"
              >
                <Plus size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddEpisodeModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-card text-muted-foreground border border-dashed border-border hover:border-primary hover:text-primary transition-all"
            >
              <Tv size={14} />
              تفعيل نظام الحلقات (للمسلسلات)
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
             type="button"
             onClick={() => setShowQuickAddModal(true)}
             className="shrink-0 h-10 px-4 flex items-center justify-center gap-2 rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground text-xs font-bold transition-all border border-transparent hover:border-border"
             title="إضافة سريعة في القائمة"
           >
             <Plus size={16} />
             إضافة سريعة
          </button>
          <button
             type="button"
             onClick={handleNewScene}
             className="shrink-0 h-10 px-5 flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-xs font-black shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
           >
             <Plus size={16} />
             إضافة مشهد
          </button>
        </div>
      </div>

      {/* Professional Multi-Row Toolbar */}
      {filterEpisode === 'ALL' && episodes.length > 0 && (
        <div className="mb-[10px]">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={handleToggleAll}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
              title={episodes.every(e => collapsedEpisodes.includes(e.id)) ? "توسيع الكل" : "طي الكل"}
            >
              {episodes.every(e => collapsedEpisodes.includes(e.id)) ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <div className="flex-1">
              <AdvancedFilterBar 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="بحث عن مشهد..."
                hasActiveFilters={filterLocation !== 'ALL' || filterRealLocation !== 'ALL' || filterTimes.length > 0 || searchQuery !== ''}
                onClearFilters={() => {
                  setSearchQuery('');
                  setFilterLocation('ALL');
                  setFilterRealLocation('ALL');
                  setFilterTimes([]);
                }}
                filters={[
                  {
                    type: 'toggle',
                    value: filterLocation,
                    onChange: setFilterLocation,
                    options: [
                      { value: 'ALL', label: 'الكل' },
                      { value: 'INT', label: 'داخلي' },
                      { value: 'EXT', label: 'خارجي' }
                    ]
                  },
                  {
                    type: 'select',
                    value: filterRealLocation,
                    onChange: setFilterRealLocation,
                    options: [
                      { value: 'ALL', label: 'كل المواقع' },
                      ...uniqueLocations.map(loc => ({ value: loc, label: loc }))
                    ]
                  }
                ]}
              />
            </div>
          </div>
          
          {/* Time Filters - Custom Row */}
          <div className="flex items-center gap-2 pt-1.5 px-1 overflow-x-auto custom-scrollbar pb-1">
            <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5 min-w-max border border-border/50">
              <button
                type="button"
                onClick={() => setFilterTimes([])}
                className={`w-10 h-7 flex items-center justify-center rounded-md transition-all shrink-0 ${filterTimes.length === 0 ? 'bg-background text-primary shadow-sm border border-border/40' : 'text-muted-foreground hover:text-foreground'}`}
                title="كل الأوقات"
              >
                <History size={14} />
              </button>
              <div className="flex flex-wrap items-center gap-1">
                {Object.entries(TIME_MAP).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setFilterTimes(prev => 
                        prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
                      );
                    }}
                    className={`px-3 h-7 text-[10px] font-black rounded-md transition-all whitespace-nowrap ${filterTimes.includes(key) ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-background'}`}
                  >
                    {label}
                  </button>
                ))}
                {uniqueCustomTimes.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      setFilterTimes(prev => 
                        prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
                      );
                    }}
                    className={`px-3 h-7 text-[10px] font-black rounded-md transition-all whitespace-nowrap border-r border-border/50 pr-2 mr-1 ${filterTimes.includes(time) ? 'bg-primary text-white shadow-sm' : 'text-primary/70 hover:bg-primary/10'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            <div className="mr-auto px-3 text-[10px] font-black text-muted-foreground/50 whitespace-nowrap">
              {filteredScenesCount} مشهد متاح
            </div>
          </div>
        </div>
      )}
    </>
  );
}

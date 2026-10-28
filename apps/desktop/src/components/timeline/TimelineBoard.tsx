import React, { useState, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Calendar, Clock, Film, MapPin, AlertTriangle, Trash2, Edit2, List } from 'lucide-react';
import CompactSceneCard from './CompactSceneCard';
import { useUpdateShootDayMutation } from '../../hooks/queries/useTimeline';
import { useUIStore } from '../../store/useUIStore';
import { analyzeContinuity } from '../../utils/continuityAnalyzer';
import type { ICharacter } from '@scriptflow/core';

// ─── Zero-Allocation Line Counter ───
function countLines(str?: string | null): number {
  if (!str) return 0;
  let lines = 1;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\n') lines++;
  }
  return lines;
}

// ─── Status Utilities ───
interface StatusConfigItem {
  label: string;
  color: string;
  dot: string;
  ring: string;
}

const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  DRAFT:     { label: 'مبرمج',       color: 'bg-secondary/40 border-border text-muted-foreground',     dot: 'bg-muted-foreground', ring: 'ring-muted-foreground/20' },
  SHOOTING:  { label: 'قيد التصوير',  color: 'bg-amber-500/10 border-amber-500/30 text-amber-700',     dot: 'bg-amber-500',        ring: 'ring-amber-500/30' },
  COMPLETED: { label: 'تم التصوير',   color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700', dot: 'bg-emerald-500',      ring: 'ring-emerald-500/30' },
  POSTPONED: { label: 'مؤجل',        color: 'bg-blue-500/10 border-blue-500/30 text-blue-700',         dot: 'bg-blue-500',         ring: 'ring-blue-500/30' },
  CANCELED:  { label: 'ملغى',        color: 'bg-rose-500/10 border-rose-500/30 text-rose-700',         dot: 'bg-rose-500',         ring: 'ring-rose-500/30' },
};

// ─── Day Mini Card (Selector) ───
interface DayMiniCardProps {
  day: any;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function DayMiniCard({ day, index, isActive, onClick }: DayMiniCardProps): React.JSX.Element {
  const sceneCount = (day.scenes || []).length;
  const status = day.status || 'DRAFT';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const isEmpty = sceneCount === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-right p-2.5 rounded-xl border-2 transition-all duration-200
        ${isActive 
          ? `${config.color} ring-2 ${config.ring} shadow-md scale-[1.02]` 
          : isEmpty 
            ? 'bg-secondary/10 border-dashed border-border/40 hover:border-border hover:bg-secondary/20' 
            : `${config.color} hover:shadow-sm`
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isEmpty ? 'bg-border' : config.dot}`} />
        <span className="font-black text-[11px] leading-none flex-1">يوم {index + 1}</span>
        {sceneCount > 0 && (
          <span className="text-[9px] font-bold bg-background/70 px-1.5 py-0.5 rounded-full border border-border/50">
            {sceneCount}
          </span>
        )}
      </div>

      {day.shoot_date && (
        <p className="text-[9px] font-bold opacity-60 mr-4 truncate">
          {new Date(day.shoot_date).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' })}
        </p>
      )}
    </button>
  );
}

// ─── Active Day Column (Full View) ───
interface ActiveDayColumnProps {
  day: any;
  index: number;
  shootDays?: any[];
  characters?: ICharacter[] | any[];
  onDelete?: (id: string | number) => void;
  onEdit?: (day: any) => void;
  viewMode: 'scenes' | 'locations' | string;
  onToggleViewMode: (mode: 'scenes' | 'locations') => void;
}

function ActiveDayColumn({
  day,
  index,
  shootDays = [],
  characters = [],
  onDelete,
  onEdit,
  viewMode,
  onToggleViewMode
}: ActiveDayColumnProps): React.JSX.Element {
  const updateMutation = useUpdateShootDayMutation();
  const { activeScenarioId } = useUIStore();

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `day-drop-${day.id}`,
    data: { type: 'DayDropZone', day },
    disabled: viewMode === 'locations'
  });

  const sceneIds = useMemo(() => (day.scenes || []).map((s: any) => s.id.toString()), [day.scenes]);

  const totalDuration = useMemo(() => {
    return (day.scenes || []).reduce((acc: number, s: any) => {
      let duration = s.estimated_duration;
      if (!duration || duration <= 0) {
        if (s.page_count) {
          duration = s.page_count * 60; // 60 seconds per page
        } else if (s.line_count) {
          duration = Math.ceil(s.line_count / 8); // 1 minute per 8 script lines
        } else if (s.content) {
          duration = Math.ceil(countLines(s.content) / 8);
        } else if (s.description) {
          duration = Math.max(1, Math.ceil(countLines(s.description) / 8));
        } else {
          duration = 1; // 1 minute fallback
        }
      }
      return acc + duration;
    }, 0);
  }, [day.scenes]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set<string | number>();
    (day.scenes || []).forEach((s: any) => { if (s.location_id) locs.add(s.location_id); });
    return locs.size;
  }, [day.scenes]);

  const groupedByLocation = useMemo(() => {
    if (viewMode !== 'locations') return {};
    const groups: Record<string, any[]> = {};
    (day.scenes || []).forEach((scene: any) => {
      const locName = scene.location_name || 'بدون موقع';
      if (!groups[locName]) groups[locName] = [];
      groups[locName].push(scene);
    });
    return groups;
  }, [day.scenes, viewMode]);

  const dayWarnings = useMemo(() => {
    if (!shootDays || shootDays.length === 0) return [];
    return analyzeContinuity(shootDays, characters).filter(
      w => w.dayId === day.id || w.nextDayId === day.id
    );
  }, [day.id, shootDays, characters]);

  const handleStatusChange = (newStatus: string) => {
    if (activeScenarioId) {
      updateMutation.mutate({ scenarioId: activeScenarioId, dayId: day.id, data: { status: newStatus } });
    }
  };

  const maxMinutes = 720;
  const progressPercent = Math.min((totalDuration / maxMinutes) * 100, 100);
  const isOverload = totalDuration > maxMinutes;
  const isWarning = totalDuration > (maxMinutes * 0.8) && !isOverload;
  const progressColor = isOverload ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
  const status = day.status || 'DRAFT';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden h-full shadow-sm" dir="rtl">
      {/* Header */}
      <div className={`p-4 border-b-2 ${config.color} relative group shrink-0`}>
        <div className="absolute left-3 top-3 flex items-center opacity-0 group-hover:opacity-100 transition-all gap-1">
          <button 
            type="button"
            onClick={() => onEdit && onEdit(day)}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-all"
            title="تعديل بيانات اليوم"
          >
            <Edit2 size={14} />
          </button>
          <button 
            type="button"
            onClick={() => onDelete && onDelete(day.id)}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
            title="حذف اليوم"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.dot}`} />
            <span className="font-black text-lg text-foreground">
              يوم التصوير {index + 1}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-background px-2.5 py-1 rounded-lg border border-border">
            <Clock size={12} />
            <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-2">
          <select 
            value={status} 
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-[11px] font-bold bg-background border border-border rounded-lg px-2 py-1.5 outline-none text-foreground cursor-pointer focus:border-primary/50"
          >
            <option value="DRAFT">مبرمج</option>
            <option value="SHOOTING">قيد التصوير</option>
            <option value="COMPLETED">تم التصوير</option>
            <option value="POSTPONED">مؤجل</option>
            <option value="CANCELED">ملغى</option>
          </select>

          {day.shoot_date && (
            <span className="text-[10px] font-bold text-muted-foreground bg-background px-2 py-1 rounded-lg border border-border flex items-center gap-1">
              <Calendar size={10} />
              {new Date(day.shoot_date).toLocaleDateString('ar-DZ', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          )}

          <div className="flex-1" />

          {/* View Toggle */}
          <div className="flex bg-background border border-border rounded-lg p-0.5">
            <button 
              type="button"
              onClick={() => onToggleViewMode('scenes')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'scenes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              title="عرض المشاهد"
            >
              <List size={12} />
            </button>
            <button 
              type="button"
              onClick={() => onToggleViewMode('locations')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'locations' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              title="عرض حسب المواقع"
            >
              <MapPin size={12} />
            </button>
          </div>
        </div>

        {/* Warnings */}
        {uniqueLocations > 2 && (
          <div className="flex items-start gap-1.5 bg-rose-500/10 text-rose-600 p-2 rounded-lg mt-3 border border-rose-500/20 animate-pulse">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span className="text-[10px] font-bold leading-tight text-right">
              تنبيه: تنقل بين {uniqueLocations} مواقع مختلفة!
            </span>
          </div>
        )}

        {/* Dynamic Continuity Conflict Warnings */}
        {dayWarnings.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-3">
            {dayWarnings.map(warning => {
              const styleClass = 
                warning.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 animate-pulse' :
                warning.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-700' :
                'bg-blue-500/10 border-blue-500/30 text-blue-700';

              return (
                <div key={warning.id} className={`flex items-start gap-1.5 p-2 rounded-lg border ${styleClass} text-right`}>
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span className="text-[10px] font-bold leading-tight">
                    {warning.title}: {warning.description}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border/50 mt-3">
          <div 
            className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Droppable Scene Area */}
      <div 
        ref={setDroppableNodeRef}
        className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-2 relative"
      >
        {viewMode === 'locations' && (
          <div className="absolute inset-0 bg-background/30 z-0 pointer-events-none" />
        )}

        {viewMode === 'scenes' ? (
          <SortableContext items={sceneIds} strategy={verticalListSortingStrategy}>
            {(day.scenes || []).map((scene: any) => (
              <CompactSceneCard key={scene.id} scene={scene} virtualize={true} />
            ))}
          </SortableContext>
        ) : (
          <div className="flex flex-col gap-3 relative z-10">
            {Object.keys(groupedByLocation).map(locName => (
              <div key={locName} className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-secondary/50 p-2.5 border-b border-border flex items-center gap-2">
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span className="text-xs font-black text-foreground truncate">{locName}</span>
                  <span className="text-[9px] bg-background border border-border/50 px-2 rounded-full mr-auto font-bold text-muted-foreground">
                    {groupedByLocation[locName].length}
                  </span>
                </div>
                <div className="p-2 flex flex-col gap-1.5">
                  {groupedByLocation[locName].map((scene: any) => (
                    <div key={scene.id} className="flex items-center gap-2 text-[11px] bg-secondary/20 p-2 rounded-lg border border-border/50">
                      <span className={`px-1.5 py-0.5 rounded font-black leading-none text-[10px] ${scene.setting === 'INT' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {scene.setting || 'INT'}
                      </span>
                      <span className="font-bold truncate text-muted-foreground flex-1">
                        {scene.scene_number}. {scene.title || 'بدون عنوان'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {(!day.scenes || day.scenes.length === 0) && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/40 rounded-xl text-muted-foreground/40 text-xs font-bold p-6 text-center">
            <div>
              <Film size={32} className="mx-auto mb-2 opacity-30" />
              <p>اسحب المشاهد وأفلتها هنا</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Board Component ───
export interface TimelineBoardProps {
  shootDays: any[];
  characters?: ICharacter[] | any[];
  onDeleteDay?: (id: string | number) => void;
  onEditDay?: (day: any) => void;
  columnViewModes: Record<string, 'scenes' | 'locations'>;
  setColumnViewModes: React.Dispatch<React.SetStateAction<Record<string, 'scenes' | 'locations'>>>;
}

export default function TimelineBoard({
  shootDays = [],
  characters = [],
  onDeleteDay,
  onEditDay,
  columnViewModes,
  setColumnViewModes
}: TimelineBoardProps): React.JSX.Element {
  const [activeDayId, setActiveDayId] = useState<string | number | null>(null);

  // Auto-select first day if none selected
  const effectiveActiveDayId = useMemo(() => {
    if (activeDayId && shootDays.find(d => String(d.id) === String(activeDayId))) return activeDayId;
    return shootDays.length > 0 ? shootDays[0].id : null;
  }, [activeDayId, shootDays]);

  const activeDay = useMemo(() => {
    return shootDays.find(d => String(d.id) === String(effectiveActiveDayId)) || null;
  }, [shootDays, effectiveActiveDayId]);

  const activeDayIndex = useMemo(() => {
    return shootDays.findIndex(d => String(d.id) === String(effectiveActiveDayId));
  }, [shootDays, effectiveActiveDayId]);

  if (shootDays.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[url('/grid.svg')] bg-center">
        <div className="text-center">
          <Calendar size={48} className="mx-auto mb-3 text-muted-foreground/20" />
          <h3 className="text-lg font-black text-muted-foreground mb-1">لا توجد أيام تصوير</h3>
          <p className="text-xs font-bold text-muted-foreground/60">قم بإضافة يوم تصوير من الشريط العلوي أو من الأجندة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[url('/grid.svg')] bg-center" dir="rtl">
      {/* Day Selector Panel */}
      <div className="w-[160px] shrink-0 border-l border-border bg-card/80 backdrop-blur-sm flex flex-col h-full z-10">
        <div className="p-2.5 border-b border-border/50 bg-secondary/20">
          <h3 className="text-[10px] font-black text-muted-foreground text-center">
            أيام التصوير ({shootDays.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">
          {shootDays.map((day, index) => (
            <DayMiniCard 
              key={day.id}
              day={day} 
              index={index} 
              isActive={String(day.id) === String(effectiveActiveDayId)}
              onClick={() => setActiveDayId(day.id)}
            />
          ))}
        </div>
      </div>

      {/* Active Day Column */}
      <div className="flex-1 p-4 flex overflow-hidden">
        {activeDay && (
          <ActiveDayColumn
            key={activeDay.id}
            day={activeDay}
            index={activeDayIndex}
            shootDays={shootDays}
            characters={characters}
            onDelete={onDeleteDay}
            onEdit={onEditDay}
            viewMode={columnViewModes[activeDay.id] || 'scenes'}
            onToggleViewMode={(mode) => setColumnViewModes(prev => ({...prev, [activeDay.id]: mode}))}
          />
        )}
      </div>
    </div>
  );
}

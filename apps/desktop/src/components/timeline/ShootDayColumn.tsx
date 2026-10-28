import React, { useMemo } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, AlertTriangle, Trash2, Edit2, List, MapPin, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CompactSceneCard from './CompactSceneCard';
import { useUpdateShootDayMutation } from '../../hooks/queries/useTimeline';
import { useUIStore } from '../../store/useUIStore';

export interface ShootDayColumnProps {
  day: any;
  index?: number;
  onDelete?: (id: string | number) => void;
  onEdit?: (day: any) => void;
  viewMode: 'scenes' | 'locations' | string;
  onToggleViewMode: (mode: 'scenes' | 'locations') => void;
}

export default function ShootDayColumn({ 
  day, 
  index, 
  onDelete, 
  onEdit, 
  viewMode, 
  onToggleViewMode 
}: ShootDayColumnProps): React.JSX.Element {
  const updateMutation = useUpdateShootDayMutation();
  const { activeScenarioId } = useUIStore();
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `day-${day.id}`,
    data: {
      type: 'Column',
      day
    }
  });

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `day-drop-${day.id}`,
    data: {
      type: 'DayDropZone',
      day
    },
    disabled: viewMode === 'locations'
  });

  const sceneIds = useMemo(() => ((day.scenes as any[]) || []).map(s => s.id.toString()), [day.scenes]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalDuration = useMemo(() => {
    return ((day.scenes as any[]) || []).reduce((acc, s) => acc + (s.estimated_duration || 0), 0);
  }, [day.scenes]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set();
    ((day.scenes as any[]) || []).forEach(s => {
      if (s.location_id) locs.add(s.location_id);
    });
    return locs.size;
  }, [day.scenes]);

  const groupedByLocation = useMemo(() => {
    if (viewMode !== 'locations') return {};
    const groups: Record<string, any[]> = {};
    ((day.scenes as any[]) || []).forEach(scene => {
      const locName = scene.location_name || 'بدون موقع';
      if (!groups[locName]) groups[locName] = [];
      groups[locName].push(scene);
    });
    return groups;
  }, [day.scenes, viewMode]);

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({ scenarioId: activeScenarioId ? String(activeScenarioId) : '', dayId: day.id, data: { status: newStatus } });
  };

  // Assume budget is 12 hours = 720 minutes
  const maxMinutes = 720;
  const progressPercent = Math.min((totalDuration / maxMinutes) * 100, 100);
  
  const isOverload = totalDuration > maxMinutes;
  const isWarning = totalDuration > (maxMinutes * 0.8) && !isOverload;
  
  const progressColor = isOverload ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
  const navigate = useNavigate();

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex flex-col w-[280px] shrink-0 bg-secondary/20 border border-border rounded-xl overflow-hidden h-full"
    >
      {/* Header */}
      <div 
        {...attributes} 
        {...listeners}
        className="p-3 bg-secondary/50 border-b border-border/50 cursor-grab active:cursor-grabbing relative group"
      >
        <div className="absolute left-2 top-2 flex items-center opacity-0 group-hover:opacity-100 transition-all z-10 gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reports?day=${day.id}`);
            }}
            className="p-1.5 rounded text-muted-foreground/50 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
            title="طباعة كشف الاستدعاء"
            aria-label="طباعة كشف الاستدعاء"
          >
            <Printer size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(day);
            }}
            className="p-1.5 rounded text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-all"
            title="تعديل بيانات اليوم"
            aria-label="تعديل بيانات اليوم"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(day.id);
            }}
            className="p-1.5 rounded text-muted-foreground/50 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
            title="حذف اليوم"
            aria-label="حذف اليوم"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-2 pr-6">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-primary" />
            <span className="font-black text-sm text-foreground">
              يوم التصوير {index !== undefined ? index + 1 : ''}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
            <Clock size={10} />
            <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
          </div>
        </div>

        {/* Status and View Toggles */}
        <div className="flex items-center gap-1 mb-2">
          {/* Status Select */}
          <select 
            value={day.status || 'DRAFT'} 
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-[10px] font-bold bg-background border border-border rounded px-1.5 py-1 outline-none text-foreground cursor-pointer focus:border-primary/50"
            onClick={(e) => e.stopPropagation()} // Prevent drag start when clicking select
          >
            <option value="DRAFT">مبرمج</option>
            <option value="SHOOTING">قيد التصوير</option>
            <option value="COMPLETED">تم التصوير</option>
            <option value="POSTPONED">مؤجل</option>
            <option value="CANCELED">ملغى</option>
          </select>

          <div className="flex-1" />

          {/* View Toggle */}
          <div className="flex bg-background border border-border rounded p-0.5" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => onToggleViewMode('scenes')}
              className={`p-1 rounded-sm transition-colors ${viewMode === 'scenes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              title="عرض المشاهد"
              aria-label="عرض المشاهد"
            >
              <List size={10} />
            </button>
            <button 
              onClick={() => onToggleViewMode('locations')}
              className={`p-1 rounded-sm transition-colors ${viewMode === 'locations' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              title="عرض حسب المواقع"
              aria-label="عرض حسب المواقع"
            >
              <MapPin size={10} />
            </button>
          </div>
        </div>

        {/* Warnings */}
        {uniqueLocations > 2 && (
          <div className="flex items-start gap-1.5 bg-rose-500/10 text-rose-600 p-1.5 rounded mb-2 border border-rose-500/20">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span className="text-[9px] font-bold leading-tight">
              تنبيه: تنقل بين {uniqueLocations} مواقع مختلفة!
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-border/50">
          <div 
            className={`h-full ${progressColor} transition-all duration-300`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Droppable Area for Scenes */}
      <div 
        ref={setDroppableNodeRef}
        className="flex-1 p-2 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-[150px] relative"
      >
        {viewMode === 'locations' && (
          <div className="absolute inset-0 bg-background/50 z-0 pointer-events-none" /> /* Subtle dimming to indicate non-droppable */
        )}

        {viewMode === 'scenes' ? (
          <SortableContext items={sceneIds} strategy={verticalListSortingStrategy}>
            {((day.scenes as any[]) || []).map(scene => (
              <CompactSceneCard key={scene.id} scene={scene} />
            ))}
          </SortableContext>
        ) : (
          <div className="flex flex-col gap-3 relative z-10">
            {Object.keys(groupedByLocation).map(locName => (
              <div key={locName} className="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-secondary/50 p-2 border-b border-border flex items-center gap-1.5">
                  <MapPin size={12} className="text-primary shrink-0" />
                  <span className="text-[11px] font-black text-foreground truncate">{locName}</span>
                  <span className="text-[9px] bg-background border border-border/50 px-1.5 rounded mr-auto font-bold text-muted-foreground">
                    {groupedByLocation[locName].length}
                  </span>
                </div>
                <div className="p-2 flex flex-col gap-1.5">
                  {groupedByLocation[locName].map((scene: any) => (
                     <div key={scene.id} className="flex items-center gap-2 text-[10px] bg-secondary/20 p-1.5 rounded border border-border/50">
                        <span className={`px-1 py-0.5 rounded font-black leading-none ${scene.setting === 'INT' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
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
        
        {(!day.scenes || (day.scenes as any[]).length === 0) && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg text-muted-foreground/50 text-[10px] font-bold p-4 text-center">
            اسحب المشاهد وأفلتها هنا
          </div>
        )}
      </div>
    </div>
  );
}

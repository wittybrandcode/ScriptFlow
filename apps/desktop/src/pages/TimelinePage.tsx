import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTimelineReordering } from '../hooks/queries/useTimelineReordering';
import { useTimelineQuery, useAssignSceneMutation, useCreateShootDayMutation, useDeleteShootDayMutation, useUpdateShootDayMutation } from '../hooks/queries/useTimeline';
import { useScenarioQuery } from '../hooks/queries/useScenarios';
import { useUIStore } from '../store/useUIStore';
import { useCharactersQuery } from '../hooks/queries/useCharacters';
import { useEpisodesQuery } from '../hooks/queries/useEpisodes';
import TimelineSidebar from '../components/timeline/TimelineSidebar';
import TimelineBoard from '../components/timeline/TimelineBoard';
import TimelineAgenda from '../components/timeline/TimelineAgenda';
import WeeklyCalendar from '../components/timeline/views/WeeklyCalendar';
import DailyView from '../components/timeline/views/DailyView';
import YearlyHeatmap from '../components/timeline/views/YearlyHeatmap';
import StripBoard from '../components/timeline/views/StripBoard';
import TimelineStats from '../components/timeline/TimelineStats';
import CompactSceneCard from '../components/timeline/CompactSceneCard';
import ContinuityPanel from '../components/timeline/ContinuityPanel';
import ShootDayModal from '../components/timeline/ShootDayModal';
import { Plus, Printer, HelpCircle, Columns, Calendar as CalendarIcon, CalendarDays, CalendarRange, Activity, AlignJustify } from 'lucide-react';

export default function TimelinePage() {
  const navigate = useNavigate();
  const { activeScenarioId, setTopBarConfig } = useUIStore();
  const { data: activeScenario } = useScenarioQuery(activeScenarioId);
  const { data: timelineData, isLoading } = useTimelineQuery(activeScenarioId);
  const shootDays = timelineData?.shootDays || [];
  const unscheduledScenes = timelineData?.unscheduledScenes || [];
  
  const assignMutation = useAssignSceneMutation();
  const createDayMutation = useCreateShootDayMutation();
  const deleteDayMutation = useDeleteShootDayMutation();
  const updateDayMutation = useUpdateShootDayMutation();

  const assignScene = (scenId: string, scnId: string, destDayId: string | null) => 
    assignMutation.mutate({ scenarioId: scenId, sceneId: scnId, destDayId });
  const createShootDay = (scenId: string, data: any) => 
    createDayMutation.mutate({ scenarioId: scenId, data });
  const deleteShootDay = (scenId: string, dayId: string) => 
    deleteDayMutation.mutate({ scenarioId: scenId, dayId });
  const updateShootDay = (scenId: string, dayId: string, data: any) => 
    updateDayMutation.mutate({ scenarioId: scenId, dayId, data });
  
  const { data: characters = [] } = useCharactersQuery(activeScenarioId);
  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId);
  
  const [columnViewModes, setColumnViewModes] = useState<Record<string, 'scenes' | 'locations'>>({});
  const [activeTab, setActiveTab] = useState<'board' | 'stripboard' | 'daily' | 'weekly' | 'agenda' | 'yearly'>('board');
  const [selectedDailyDayId, setSelectedDailyDayId] = useState<string | null>(null);
  const [continuityOpen, setContinuityOpen] = useState<boolean>(false);
  const [editingDay, setEditingDay] = useState<any>(null);

  const {
    activeId,
    activeScene,
    localShootDays,
    localUnscheduled,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useTimelineReordering({
    timelineData,
    shootDays,
    unscheduledScenes,
    assignScene,
    activeScenarioId,
    columnViewModes
  });

  // Set TopBar Context
  useEffect(() => {
    if (!activeScenario) return;
    setTopBarConfig({
      title: 'جدول التصوير',
      subtitle: activeScenario.title,
      actions: [
        {
          label: 'إضافة يوم تصوير',
          icon: Plus,
          variant: 'primary',
          onClick: () => {
            if (activeScenarioId) {
              createShootDay(activeScenarioId, { 
                shoot_date: new Date().toISOString(),
                start_time: '08:00',
                end_time: '20:00'
              });
            }
          }
        },
        {
          label: 'طباعة كشف الاستدعاء المجمع',
          icon: Printer,
          variant: 'outline',
          onClick: () => {
            navigate('/reports');
          }
        }
      ]
    });
    return () => setTopBarConfig(null);
  }, [activeScenarioId, activeScenario, navigate, setTopBarConfig]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDeleteDay = (id: string) => {
    if (!activeScenarioId) return;
    if (confirm('هل أنت متأكد من حذف يوم التصوير هذا؟ سيتم إرجاع جميع المشاهد المجدولة فيه إلى البنك.')) {
      deleteShootDay(activeScenarioId, id);
    }
  };

  if (!activeScenarioId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[url('/grid.svg')] bg-center">
        <HelpCircle size={48} className="text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-black text-foreground mb-2">الرجاء تحديد مشروع أولاً</h2>
        <p className="text-sm font-bold text-muted-foreground">لا يمكنك استخدام جدول التصوير بدون تحديد السيناريو.</p>
      </div>
    );
  }

  if (isLoading && shootDays.length === 0 && unscheduledScenes.length === 0) {
    return <div className="flex items-center justify-center h-full">جاري التحميل...</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TimelineStats shootDays={localShootDays} unscheduledScenes={localUnscheduled} />
      
      <div className="flex-1 flex overflow-hidden relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Right side in RTL */}
          <TimelineSidebar scenes={localUnscheduled} />
        
        {/* Left side in RTL */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Tabs */}
          <div className="flex items-center gap-2 p-2 bg-secondary/10 border-b border-border z-20 shrink-0 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'board' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <Columns size={14} />
              لوحة الأعمدة
            </button>
            <button 
              onClick={() => setActiveTab('stripboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'stripboard' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <AlignJustify size={14} />
              لوحة الشرائط
            </button>
            <button 
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'daily' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <CalendarIcon size={14} />
              يومي
            </button>
            <button 
              onClick={() => setActiveTab('weekly')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'weekly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <CalendarDays size={14} />
              أسبوعي
            </button>
            <button 
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'agenda' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <CalendarRange size={14} />
              شهري
            </button>
            <button 
              onClick={() => setActiveTab('yearly')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'yearly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <Activity size={14} />
              سنوي
            </button>
          </div>

          {activeTab === 'board' && (
            <TimelineBoard 
              shootDays={localShootDays} 
              characters={characters}
              onDeleteDay={handleDeleteDay}
              onEditDay={setEditingDay}
              columnViewModes={columnViewModes}
              setColumnViewModes={setColumnViewModes}
            />
          )}
          {activeTab === 'stripboard' && (
            <StripBoard 
              shootDays={localShootDays} 
              characters={characters} 
              scenario={activeScenario} 
              episodes={episodes}
            />
          )}
          {activeTab === 'daily' && (
            <DailyView 
              shootDays={localShootDays} 
              characters={characters} 
              initialSelectedDayId={selectedDailyDayId}
              onDayChange={setSelectedDailyDayId}
            />
          )}
          {activeTab === 'weekly' && (
            <WeeklyCalendar 
              shootDays={localShootDays} 
              onCreateShootDay={(dateStr: string) => {
                if (activeScenarioId) {
                  createShootDay(activeScenarioId, { 
                    shoot_date: dateStr, start_time: '08:00', end_time: '20:00'
                  });
                }
              }}
            />
          )}
          {activeTab === 'agenda' && (
            <TimelineAgenda 
              shootDays={localShootDays} 
              onCreateShootDay={(dateStr: string) => {
                if (activeScenarioId) {
                  createShootDay(activeScenarioId, { 
                    shoot_date: dateStr, start_time: '08:00', end_time: '20:00'
                  });
                }
              }}
            />
          )}
          {activeTab === 'yearly' && (
            <YearlyHeatmap 
              shootDays={localShootDays} 
              onDayClick={(dayId: string) => {
                setSelectedDailyDayId(dayId);
                setActiveTab('daily');
              }}
            />
          )}
        </div>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeId && activeScene ? <CompactSceneCard scene={activeScene} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Continuity Analyzer Panel */}
      <ContinuityPanel
        shootDays={localShootDays}
        characters={characters}
        isOpen={continuityOpen}
        onToggle={() => setContinuityOpen(!continuityOpen)}
      />

      {/* Shoot Day Editing Modal */}
      {editingDay && (
        <ShootDayModal 
          day={editingDay}
          onClose={() => setEditingDay(null)}
          onSave={(data: any) => {
            if (activeScenarioId) {
              updateShootDay(activeScenarioId, editingDay.id, data);
            }
            setEditingDay(null);
          }}
        />
      )}
    </div>
  );
}

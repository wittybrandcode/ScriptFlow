import { useState, useEffect } from 'react';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';

export interface TimelineSceneItem {
  id: string | number;
  scene_number?: number;
  title?: string;
  location_name?: string;
  location_type?: string;
  time_of_day?: string;
  estimated_duration?: number;
  page_count?: number;
  line_count?: number;
  content?: string;
  description?: string;
  episode_id?: string | number | null;
  shoot_order?: number;
  [key: string]: any;
}

export interface ShootDayTimelineItem {
  id: string | number;
  day_number?: number;
  date?: string;
  title?: string;
  scenes?: TimelineSceneItem[];
  [key: string]: any;
}

export interface UseTimelineReorderingParams {
  timelineData?: {
    shootDays?: ShootDayTimelineItem[];
    unscheduledScenes?: TimelineSceneItem[];
  } | null;
  shootDays?: ShootDayTimelineItem[];
  unscheduledScenes?: TimelineSceneItem[];
  assignScene: (scenarioId: string, sceneId: string, destDayId: string | null, newOrder?: number) => void;
  activeScenarioId: string;
  columnViewModes?: Record<string | number, string>;
}

export function useTimelineReordering({ 
  timelineData, 
  shootDays = [], 
  unscheduledScenes = [], 
  assignScene, 
  activeScenarioId,
  columnViewModes = {}
}: UseTimelineReorderingParams) {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [activeScene, setActiveScene] = useState<TimelineSceneItem | null>(null);
  const [localShootDays, setLocalShootDays] = useState<ShootDayTimelineItem[]>([]);
  const [localUnscheduled, setLocalUnscheduled] = useState<TimelineSceneItem[]>([]);

  useEffect(() => {
    if (timelineData) {
      setLocalShootDays(timelineData.shootDays || []);
      setLocalUnscheduled(timelineData.unscheduledScenes || []);
    } else {
      setLocalShootDays([]);
      setLocalUnscheduled([]);
    }
  }, [timelineData]);

  const findContainer = (id: string | number): string | number | null => {
    const idStr = id.toString();
    if (idStr === 'unscheduled-bank') return 'bank';
    if (localUnscheduled.find(s => s.id.toString() === idStr)) return 'bank';
    
    for (const day of localShootDays) {
      if (`day-${day.id}` === idStr || `day-drop-${day.id}` === idStr) {
        return columnViewModes[day.id] === 'locations' ? null : day.id;
      }
      if (day.scenes && day.scenes.find(s => s.id.toString() === idStr)) {
        return columnViewModes[day.id] === 'locations' ? null : day.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string | number);
    
    // Find the scene being dragged
    let scene = localUnscheduled.find(s => s.id.toString() === active.id.toString());
    if (!scene) {
      for (const day of localShootDays) {
        scene = day.scenes?.find(s => s.id.toString() === active.id.toString());
        if (scene) break;
      }
    }
    setActiveScene(scene || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) {
      return;
    }

    const activeContainer = findContainer(active.id as string | number);
    const overContainer = findContainer(overId as string | number);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    if (activeContainer === 'bank') {
      const sceneIndex = localUnscheduled.findIndex(s => s.id.toString() === active.id.toString());
      const scene = localUnscheduled[sceneIndex];
      if (!scene) return;
      
      setLocalUnscheduled(prev => prev.filter(s => s.id.toString() !== active.id.toString()));
      setLocalShootDays(prev => prev.map(day => {
        if (day.id === overContainer) {
          return { ...day, scenes: [...(day.scenes || []), scene] };
        }
        return day;
      }));
    } else {
      let sceneToMove: TimelineSceneItem | undefined;
      setLocalShootDays(prev => prev.map(day => {
        if (day.id === activeContainer && day.scenes) {
          const sIndex = day.scenes.findIndex(s => s.id.toString() === active.id.toString());
          sceneToMove = day.scenes[sIndex];
          return { ...day, scenes: day.scenes.filter(s => s.id.toString() !== active.id.toString()) };
        }
        return day;
      }));

      if (!sceneToMove) return;

      if (overContainer === 'bank') {
        setLocalUnscheduled(prev => [...prev, sceneToMove!]);
      } else {
        setLocalShootDays(prev => prev.map(day => {
          if (day.id === overContainer) {
            return { ...day, scenes: [...(day.scenes || []), sceneToMove!] };
          }
          return day;
        }));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveScene(null);

    if (!over) {
      // Revert if dropped outside
      setLocalShootDays(shootDays);
      setLocalUnscheduled(unscheduledScenes);
      return;
    }

    const activeContainer = findContainer(active.id as string | number);
    const overContainer = findContainer(over.id as string | number);

    if (!activeContainer || !overContainer) {
      setLocalShootDays(shootDays);
      setLocalUnscheduled(unscheduledScenes);
      return;
    }

    const sceneId = active.id.toString();
    
    // Calculate new order
    let newOrder = 0;
    if (overContainer !== 'bank') {
      const destDay = localShootDays.find(d => d.id === overContainer);
      if (destDay && destDay.scenes) {
        const dropIndex = destDay.scenes.findIndex(s => s.id.toString() === active.id.toString());
        newOrder = dropIndex >= 0 ? dropIndex * 10 : destDay.scenes.length * 10; 
      }
    }

    const destDayId = overContainer === 'bank' ? null : String(overContainer);

    // Trigger API call
    assignScene(activeScenarioId, sceneId, destDayId, newOrder);
  };

  return {
    activeId,
    activeScene,
    localShootDays,
    localUnscheduled,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}

export default useTimelineReordering;

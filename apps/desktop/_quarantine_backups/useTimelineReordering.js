import { useState, useEffect } from 'react';

export function useTimelineReordering({ 
  timelineData, 
  shootDays, 
  unscheduledScenes, 
  assignScene, 
  activeScenarioId,
  columnViewModes 
}) {
  const [activeId, setActiveId] = useState(null);
  const [activeScene, setActiveScene] = useState(null);
  const [localShootDays, setLocalShootDays] = useState([]);
  const [localUnscheduled, setLocalUnscheduled] = useState([]);

  useEffect(() => {
    if (timelineData) {
      setLocalShootDays(timelineData.shootDays || []);
      setLocalUnscheduled(timelineData.unscheduledScenes || []);
    } else {
      setLocalShootDays([]);
      setLocalUnscheduled([]);
    }
  }, [timelineData]);

  const findContainer = (id) => {
    if (id === 'unscheduled-bank') return 'bank';
    if (localUnscheduled.find(s => s.id.toString() === id)) return 'bank';
    
    for (const day of localShootDays) {
      if (`day-${day.id}` === id || `day-drop-${day.id}` === id) {
        return columnViewModes[day.id] === 'locations' ? null : day.id;
      }
      if (day.scenes && day.scenes.find(s => s.id.toString() === id)) {
        return columnViewModes[day.id] === 'locations' ? null : day.id;
      }
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the scene being dragged
    let scene = localUnscheduled.find(s => s.id.toString() === active.id);
    if (!scene) {
      for (const day of localShootDays) {
        scene = day.scenes?.find(s => s.id.toString() === active.id);
        if (scene) break;
      }
    }
    setActiveScene(scene);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) {
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    if (activeContainer === 'bank') {
      const sceneIndex = localUnscheduled.findIndex(s => s.id.toString() === active.id);
      const scene = localUnscheduled[sceneIndex];
      if (!scene) return;
      
      setLocalUnscheduled(prev => prev.filter(s => s.id.toString() !== active.id));
      setLocalShootDays(prev => prev.map(day => {
        if (day.id === overContainer) {
          return { ...day, scenes: [...(day.scenes || []), scene] };
        }
        return day;
      }));
    } else {
      let sceneToMove;
      setLocalShootDays(prev => prev.map(day => {
        if (day.id === activeContainer) {
          const sIndex = day.scenes.findIndex(s => s.id.toString() === active.id);
          sceneToMove = day.scenes[sIndex];
          return { ...day, scenes: day.scenes.filter(s => s.id.toString() !== active.id) };
        }
        return day;
      }));

      if (!sceneToMove) return;

      if (overContainer === 'bank') {
        setLocalUnscheduled(prev => [...prev, sceneToMove]);
      } else {
        setLocalShootDays(prev => prev.map(day => {
          if (day.id === overContainer) {
            return { ...day, scenes: [...(day.scenes || []), sceneToMove] };
          }
          return day;
        }));
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveScene(null);

    if (!over) {
      // Revert if dropped outside
      setLocalShootDays(shootDays);
      setLocalUnscheduled(unscheduledScenes);
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer) {
      setLocalShootDays(shootDays);
      setLocalUnscheduled(unscheduledScenes);
      return;
    }

    const sceneId = active.id;
    
    // Calculate new order
    let newOrder = 0;
    if (overContainer !== 'bank') {
      const destDay = localShootDays.find(d => d.id === overContainer);
      if (destDay && destDay.scenes) {
        const dropIndex = destDay.scenes.findIndex(s => s.id.toString() === active.id);
        newOrder = dropIndex >= 0 ? dropIndex * 10 : destDay.scenes.length * 10; 
      }
    }

    const destDayId = overContainer === 'bank' ? null : overContainer;

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

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Plus, Search, Edit3, Trash2, MapPin, Clock, Filter, ChevronRight, 
  Tv, FileText, LayoutGrid, Copy, Minimize2, Maximize2, Timer,
  Layers, History, FileDown, FileJson
} from 'lucide-react';
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import { exportToPDF } from '../utils/exportPDF';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery } from '../hooks/queries/useScenarios';
import ExportWizardModal from '../components/export/ExportWizardModal';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { PDFExportStrategy } from '../services/exportStrategies';





import { useEpisodesQuery, useCreateEpisodeMutation } from '../hooks/queries';
import { TIME_MAP } from '../constants/sceneConstants';
import { useQueryClient } from '@tanstack/react-query';
import { useScenesQuery, useCreateSceneMutation, useDeleteSceneMutation, useUpdateSceneMutation, useReorderScenesMutation, useCloneSceneMutation } from '../hooks/queries/useScenes';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import SortableItem from '../components/SortableItem'
import CloneSceneModal from '../components/CloneSceneModal'
import AddEpisodeModal from '../components/AddEpisodeModal'
import QuickEditSceneModal from '../components/QuickEditSceneModal'
import QuickAddSceneModal from '../components/QuickAddSceneModal'
import SceneToolbar from '../components/scenes/SceneToolbar'
import SceneKanbanBoard from '../components/scenes/SceneKanbanBoard'

/**
 * ScenesPage - مكتبة المشاهد الخاصة بسيناريو محدد
 */
export default function ScenesPage() {
  const [scenes, setScenes] = useState([])
  const { setTopBarConfig, setSidebarContext, clearSidebarContext, hasHydrated } = useUIStore();
  const { activeScenarioId, setActiveScenarioId } = useUIStore();
  const { data: activeScenario } = useScenarioQuery(activeScenarioId);
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // الأولية لمعرف السيناريو في الرابط، ثم المخزن
  let scenarioId = searchParams.get('scenario') || activeScenarioId;
  if (scenarioId === 'null') scenarioId = null;
  const { toasts, showToast, dismissToast } = useToast()
  const [isExporting, setIsExporting] = useState(false);
  const [showExportWizard, setShowExportWizard] = useState(false);
  const exportProjectMutation = useExportProjectMutation();
  const { data: episodes = [] } = useEpisodesQuery(scenarioId);
  const createEpisodeMutation = useCreateEpisodeMutation();
  const [filterEpisode, setFilterEpisode] = useState('ALL')
  
  // Modals State
  const [cloneModalScene, setCloneModalScene] = useState(null)
  const [quickEditScene, setQuickEditScene] = useState(null)
  const [showAddEpisodeModal, setShowAddEpisodeModal] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)

  const { data: scenesData = [], refetch: fetchScenes } = useScenesQuery(scenarioId);
  const createSceneMutation = useCreateSceneMutation();
  const updateSceneMutation = useUpdateSceneMutation();
  const deleteSceneMutation = useDeleteSceneMutation();
  const reorderScenesMutation = useReorderScenesMutation();

  useEffect(() => {
    if (scenesData) {
      setScenes(scenesData);
    }
  }, [scenesData]);

  useEffect(() => {
    if (!hasHydrated) return; 

    if (scenarioId) {
       if (!activeScenarioId) setActiveScenarioId(scenarioId)
       fetchScenes()
    } else {
       // إذا لم يوجد مشروع نشط، نعود للمكتبة
       navigate('/')
    }
  }, [scenarioId, activeScenarioId, hasHydrated])

  // fetchScenes is now managed by React Query refetch
  // It's still good to keep this dummy function since other code might call it
  async function legacyFetchScenes() {
    fetchScenes();
  }

  // States for Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedEpisodes, setCollapsedEpisodes] = useState([]);
  const [filterLocation, setFilterLocation] = useState('ALL')
  const [filterTimes, setFilterTimes] = useState([])
  const [filterRealLocation, setFilterRealLocation] = useState('ALL')

  const uniqueLocations = useMemo(() => {
    const locs = scenes.map(s => s.location_name).filter(Boolean);
    return Array.from(new Set(locs)).sort();
  }, [scenes]);

  const uniqueCustomTimes = useMemo(() => {
    const times = scenes.map(s => s.time_of_day).filter(Boolean);
    const customTimes = times.filter(t => !TIME_MAP[t]);
    return Array.from(new Set(customTimes)).sort();
  }, [scenes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleNewScene = useCallback(async () => {
    if (episodes.length === 0) {
      showToast('يجب إنشاء حلقة أولاً قبل إضافة المشاهد', 'error');
      return;
    }

    try {
      const body = { scenario_id: scenarioId };
      
      // Auto-assign to current filtered episode or the first one available
      if (filterEpisode !== 'ALL' && filterEpisode !== 'NONE') {
        body.episode_id = filterEpisode;
      } else {
        body.episode_id = episodes[0].id;
      }

      const scene = await createSceneMutation.mutateAsync(body)
      navigate(`/scene/${scene.id}`);
    } catch (err) {
      console.error('Failed to create scene:', err)
      showToast('حدث خطأ أثناء إنشاء المشهد', 'error')
    }
  }, [scenarioId, navigate, showToast, episodes, filterEpisode, createSceneMutation]);

  const handleExportJSON = useCallback(async () => {
    if (!scenarioId) return;
    setIsExporting(true);
    try {
      showToast('تصدير JSON غير مدعوم بالكامل حالياً', 'info');
    } catch (err) {
      console.error(err);
      showToast('فشل تصدير ملف JSON', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [scenarioId, showToast]);

  const handleExportPDF = useCallback(() => {
    setShowExportWizard(true);
  }, []);

  async function handleDeleteScene(id, e) {
    e.stopPropagation()
    if (!confirm('هل تريد حذف هذا المشهد؟')) return
    try {
      await deleteSceneMutation.mutateAsync(id)
      showToast('تم حذف المشهد', 'info')
      fetchScenes()
      fetchStats()
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  }

  const cloneSceneMutation = useCloneSceneMutation();

  const handleCloneScene = async (originalId, targetEpisodeId, cloneType) => {
    try {
      const clonedScene = await cloneSceneMutation.mutateAsync({
        originalSceneId: originalId,
        targetEpisodeId: targetEpisodeId ? targetEpisodeId : null,
        cloneType
      });

      setScenes(prev => [...prev, clonedScene].sort((a,b) => a.scene_number - b.scene_number));
      showToast('تم استنساخ المشهد وإرساله إلى المسودة', 'success');
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء استنساخ المشهد', 'error');
    }
  }

  const handleQuickEditSave = async (id, updates) => {
    try {
      const { title, scene_number: newSceneNumber, order_mode } = updates;
      
      // Update title first
      await updateSceneMutation.mutateAsync({ id, data: { title } });
      
      setScenes(prevScenes => {
        // Find scenes belonging to the current context (episode or drafts pool)
        const activeScene = prevScenes.find(s => s.id === id);
        if (!activeScene) return prevScenes;

        const currentEpId = activeScene.episode_id; // could be null
        const contextScenes = prevScenes.filter(s => s.episode_id === currentEpId).sort((a,b) => a.scene_number - b.scene_number);
        const otherScenes = prevScenes.filter(s => s.episode_id !== currentEpId);

        const oldIndex = contextScenes.findIndex(s => s.id === id);
        if (oldIndex === -1) return prevScenes;
        
        const oldSceneNumber = contextScenes[oldIndex].scene_number;
        const isReordering = newSceneNumber && newSceneNumber !== oldSceneNumber;

        let workingScenes = contextScenes.map(s => s.id === id ? { ...s, title } : s);

        if (isReordering) {
          let targetIndex = newSceneNumber - 1;
          if (targetIndex < 0) targetIndex = 0;
          if (targetIndex >= workingScenes.length) targetIndex = workingScenes.length - 1;

          let reordered;
          if (order_mode === 'SWAP') {
            reordered = [...workingScenes];
            const temp = reordered[oldIndex];
            reordered[oldIndex] = reordered[targetIndex];
            reordered[targetIndex] = temp;
          } else {
            // PUSH
            reordered = arrayMove(workingScenes, oldIndex, targetIndex);
          }

          // Force unique sequential numbers for scenes IN THIS CONTEXT ONLY
          const updatedContextScenes = reordered.map((s, index) => ({ ...s, scene_number: index + 1 }));

          // Sync database in background
          reorderScenesMutation.mutateAsync(updatedContextScenes.map(s => s.id)).then(() => {
             fetchStats();
          });

          return [...otherScenes, ...updatedContextScenes].sort((a,b) => {
             if (a.episode_id !== b.episode_id) return (a.episode_id || 0) - (b.episode_id || 0);
             return a.scene_number - b.scene_number;
          });
        }



        return workingScenes;
      });

      showToast('تم التحديث بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const handleAddEpisode = async ({ title }) => {
    await createEpisodeMutation.mutateAsync({ scenario_id: scenarioId, title })
    showToast('تم إنشاء حلقة جديدة', 'success')
  }

  const handleQuickAddScene = async ({ title, description }) => {
    if (episodes.length === 0) {
      showToast('يجب إنشاء حلقة أولاً قبل إضافة المشاهد', 'error');
      return;
    }

    try {
      const body = { 
        scenario_id: scenarioId,
        title,
        description
      };

      if (filterEpisode !== 'ALL' && filterEpisode !== 'NONE') {
        body.episode_id = filterEpisode;
      } else {
        body.episode_id = episodes[0].id;
      }

      const scene = await createSceneMutation.mutateAsync(body)
      setScenes(prev => [...prev, scene].sort((a, b) => a.scene_number - b.scene_number))
      showToast('تمت إضافة المشهد بسرعة', 'success')
      fetchStats()
    } catch (err) {
      console.error(err)
      showToast('حدث خطأ أثناء الإضافة', 'error')
    }
  }

  // تزامن أزرار الصفحة مع التوب بار العالمي
  const handleExportPDFRef = React.useRef(handleExportPDF);
  const handleExportJSONRef = React.useRef(handleExportJSON);
  handleExportPDFRef.current = handleExportPDF;
  handleExportJSONRef.current = handleExportJSON;

  useEffect(() => {
    const totalDuration = scenes.reduce((sum, s) => sum + (s.estimated_duration || 0), 0);
    const durationText = totalDuration > 0 ? ` • ${totalDuration.toFixed(1)} دقيقة` : '';

    setTopBarConfig({
      pageName: 'مكتبة المشاهد',
      actions: [
        { id: 'info', label: `${scenes.length} مشهد مسجل${durationText}`, variant: 'ghost' }
      ],
      rightActions: [
        { id: 'export-pdf', label: 'تصدير PDF', icon: FileDown, onClick: () => handleExportPDFRef.current(), disabled: isExporting, variant: 'outline' },
        { id: 'export-json', label: 'تصدير JSON', icon: FileJson, onClick: () => handleExportJSONRef.current(), disabled: isExporting, variant: 'outline' }
      ]
    });

    return () => {
      setTopBarConfig(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenario, scenes.length, isExporting]);

  // Register sidebar context
  const completedCount = useMemo(() => scenes.filter(s => s.status === 'COMPLETED').length, [scenes]);
  const draftsCount = useMemo(() => scenes.filter(s => s.status === 'DRAFT').length, [scenes]);

  useEffect(() => {
    setSidebarContext({
      title: 'إحصائيات المشاهد',
      stats: [
        { label: 'إجمالي', value: scenes.length },
        { label: 'مكتمل', value: completedCount },
        { label: 'مسودة', value: draftsCount },
        { label: 'حلقات', value: episodes.length },
      ],
    });
    return () => clearSidebarContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes.length, completedCount, draftsCount, episodes.length]);

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return;
    if (active.id !== over.id) {
      setScenes(prevScenes => {
        const activeScene = prevScenes.find(s => s.id === active.id);
        if (!activeScene) return prevScenes;

        const currentEpId = activeScene.episode_id; // could be null
        const contextScenes = prevScenes.filter(s => s.episode_id === currentEpId).sort((a,b) => a.scene_number - b.scene_number);
        const otherScenes = prevScenes.filter(s => s.episode_id !== currentEpId);

        const oldIndex = contextScenes.findIndex(s => s.id === active.id)
        const newIndex = contextScenes.findIndex(s => s.id === over.id)
        
        if (oldIndex === -1 || newIndex === -1) return prevScenes;

        const reordered = arrayMove(contextScenes, oldIndex, newIndex)
        
        const updatedContextScenes = reordered.map((s, index) => ({ ...s, scene_number: index + 1 }));

        reorderScenesMutation.mutateAsync(updatedContextScenes.map(s => s.id)).then(() => {
          fetchStats();
        }).catch(err => {
          console.error(err);
          fetchScenes() // Revert to backend state on error
        });

        return [...otherScenes, ...updatedContextScenes].sort((a,b) => {
           if (a.episode_id !== b.episode_id) return (a.episode_id || 0) - (b.episode_id || 0);
           return a.scene_number - b.scene_number;
        });
      });
    }
  }

  const toggleEpisodeCollapse = (episodeId) => {
    setCollapsedEpisodes(prev => 
      prev.includes(episodeId) 
        ? prev.filter(id => id !== episodeId) 
        : [...prev, episodeId]
    );
  };

  const handleToggleAll = () => {
    const epIds = episodes.map(e => e.id);
    const allCollapsed = epIds.every(id => collapsedEpisodes.includes(id));
    
    if (allCollapsed) {
      setCollapsedEpisodes([]);
    } else {
      setCollapsedEpisodes(epIds);
    }
  };

  const handleMoveScene = async (id, direction) => {
    setScenes(prevScenes => {
      const activeScene = prevScenes.find(s => s.id === id);
      if (!activeScene) return prevScenes;

      const currentEpId = activeScene.episode_id; // could be null
      const contextScenes = prevScenes.filter(s => s.episode_id === currentEpId).sort((a,b) => a.scene_number - b.scene_number);
      const otherScenes = prevScenes.filter(s => s.episode_id !== currentEpId);

      const oldIndex = contextScenes.findIndex(s => s.id === id);
      const newIndex = direction === 'up' ? oldIndex - 1 : oldIndex + 1;

      if (newIndex < 0 || newIndex >= contextScenes.length) return prevScenes;

      const reordered = arrayMove(contextScenes, oldIndex, newIndex);
      const updatedContextScenes = reordered.map((s, index) => ({ ...s, scene_number: index + 1 }));

      reorderScenesMutation.mutateAsync(updatedContextScenes.map(s => s.id)).then(() => fetchStats());

      return [...otherScenes, ...updatedContextScenes].sort((a,b) => {
         if (a.episode_id !== b.episode_id) return (a.episode_id || 0) - (b.episode_id || 0);
         return a.scene_number - b.scene_number;
      });
    });
  };

  const filteredScenes = useMemo(() => {
    let result = scenes.filter(scene => {
      const matchesSearch = !searchQuery || 
        (scene.title && scene.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (scene.description && scene.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (scene.location_name && scene.location_name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesLocation = filterLocation === 'ALL' || scene.location_type === filterLocation
      if (!matchesSearch || !matchesLocation) return false;
      if (filterTimes.length > 0 && !filterTimes.includes(scene.time_of_day)) return false;
      if (filterRealLocation !== 'ALL' && scene.location_name !== filterRealLocation) return false;
      return true;
    })

    if (filterEpisode === 'ALL') {
      // "Whole Series" - Only show scenes that BELONG to an episode
      return result.filter(scene => !!scene.episode_id)
        .sort((a, b) => {
          // Sort by episode first, then by scene number
          if (a.episode_id !== b.episode_id) {
            const epA = episodes.find(e => e.id === a.episode_id);
            const epB = episodes.find(e => e.id === b.episode_id);
            const numA = epA ? epA.episode_number : 9999;
            const numB = epB ? epB.episode_number : 9999;
            if (numA !== numB) return numA - numB;
            return (a.episode_id || 0) - (b.episode_id || 0);
          }
          return a.scene_number - b.scene_number;
        });
    } else if (filterEpisode === 'NONE') {
      // "Unclassified" - Only show scenes with NO episode
      return result.filter(scene => !scene.episode_id);
    } else {
      // Specific Episode
      return result.filter(scene => String(scene.episode_id) === filterEpisode);
    }
  }, [scenes, searchQuery, filterLocation, filterTimes, filterRealLocation, filterEpisode, episodes])

  return (
    <div className="min-h-full font-sans animate-in fade-in duration-500 bg-background/30 pb-20 pt-8">
      
      <main className="w-full px-8">



        <SceneToolbar
          episodes={episodes}
          filterEpisode={filterEpisode}
          setFilterEpisode={setFilterEpisode}
          setShowAddEpisodeModal={setShowAddEpisodeModal}
          setShowQuickAddModal={setShowQuickAddModal}
          handleNewScene={handleNewScene}
          handleToggleAll={handleToggleAll}
          collapsedEpisodes={collapsedEpisodes}
          filterLocation={filterLocation}
          setFilterLocation={setFilterLocation}
          filterRealLocation={filterRealLocation}
          setFilterRealLocation={setFilterRealLocation}
          uniqueLocations={uniqueLocations}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredScenesCount={filteredScenes.length}
          filterTimes={filterTimes}
          setFilterTimes={setFilterTimes}
          uniqueCustomTimes={uniqueCustomTimes}
        />

        <SceneKanbanBoard
          filteredScenes={filteredScenes}
          episodes={episodes}
          filterEpisode={filterEpisode}
          collapsedEpisodes={collapsedEpisodes}
          toggleEpisodeCollapse={toggleEpisodeCollapse}
          handleDragEnd={handleDragEnd}
          handleMoveScene={handleMoveScene}
          navigate={navigate}
          setQuickEditScene={setQuickEditScene}
          setCloneModalScene={setCloneModalScene}
          handleDeleteScene={handleDeleteScene}
          handleNewScene={handleNewScene}
          sensors={sensors}
          totalScenes={scenes.length}
        />
      </main>

      <ToastContainer toasts={toasts} dismissToast={dismissToast} />

      {showAddEpisodeModal && (
        <AddEpisodeModal 
          onClose={() => setShowAddEpisodeModal(false)}
          onSubmit={handleAddEpisode}
        />
      )}

      {quickEditScene && (
        <QuickEditSceneModal 
          scene={quickEditScene}
          onClose={() => setQuickEditScene(null)}
          onSave={handleQuickEditSave}
          allowReorder={filterEpisode !== 'ALL' && filterEpisode !== 'NONE'}
        />
      )}

      {showQuickAddModal && (
        <QuickAddSceneModal 
          onClose={() => setShowQuickAddModal(false)}
          onSubmit={handleQuickAddScene}
        />
      )}

      {cloneModalScene && (
        <CloneSceneModal 
          scene={cloneModalScene} 
          onClose={() => setCloneModalScene(null)} 
          onClone={handleCloneScene}
        />
      )}
      <ExportWizardModal 
        isOpen={showExportWizard}
        scenario={activeScenario}
        isExporting={isExporting}
        onClose={() => !isExporting && setShowExportWizard(false)}
        onConfirm={async (options) => {
          try {
            setIsExporting(true);
            showToast('جاري تحضير محرك التصدير...', 'info');
            await exportProjectMutation.mutateAsync({
              scenarioId: activeScenarioId,
              strategy: new PDFExportStrategy(options)
            });
            showToast('تم تصدير ملف PDF بنجاح', 'success');
            setShowExportWizard(false);
          } catch (err) {
            console.error(err);
            showToast('فشل تصدير ملف PDF', 'error');
          } finally {
            setIsExporting(false);
          }
        }}
      />
    </div>
  )
}

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileDown, FileJson } from 'lucide-react';
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery } from '../hooks/queries/useScenarios';
import ExportWizardModal from '../components/export/ExportWizardModal';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { PDFExportStrategy } from '../services/exportStrategies';
import ConfirmModal from '../components/common/ConfirmModal';
import { useEpisodesQuery, useCreateEpisodeMutation } from '../hooks/queries';
import { TIME_MAP } from '../constants/sceneConstants';
import { useQueryClient } from '@tanstack/react-query';
import { useScenesQuery, useCreateSceneMutation, useDeleteSceneMutation, useUpdateSceneMutation, useReorderScenesMutation, useCloneSceneMutation } from '../hooks/queries/useScenes';
import type { IScene, IEpisode, IScenario } from '@scriptflow/core';

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import CloneSceneModal from '../components/CloneSceneModal'
import AddEpisodeModal from '../components/AddEpisodeModal'
import QuickEditSceneModal from '../components/QuickEditSceneModal'
import QuickAddSceneModal from '../components/QuickAddSceneModal'
import SceneToolbar from '../components/scenes/SceneToolbar'
import SceneKanbanBoard from '../components/scenes/SceneKanbanBoard'

const SafeCloneSceneModal = CloneSceneModal as React.ComponentType<any>;
const SafeAddEpisodeModal = AddEpisodeModal as React.ComponentType<any>;
const SafeQuickEditSceneModal = QuickEditSceneModal as React.ComponentType<any>;
const SafeQuickAddSceneModal = QuickAddSceneModal as React.ComponentType<any>;
const SafeSceneToolbar = SceneToolbar as React.ComponentType<any>;
const SafeSceneKanbanBoard = SceneKanbanBoard as React.ComponentType<any>;
const SafeExportWizardModal = ExportWizardModal as React.ComponentType<any>;

/**
 * ScenesPage - مكتبة المشاهد الخاصة بسيناريو محدد
 */
export default function ScenesPage() {
  const [scenes, setScenes] = useState<IScene[]>([])
  const { setTopBarConfig, setSidebarContext, clearSidebarContext, hasHydrated } = useUIStore();
  const { activeScenarioId, setActiveScenarioId } = useUIStore();
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient();
  
  // الأولية لمعرف السيناريو في الرابط، ثم المخزن
  let rawScenarioId = searchParams.get('scenario') || activeScenarioId;
  if (rawScenarioId === 'null') rawScenarioId = null;
  const scenarioId = rawScenarioId || '';

  const { data: rawScenario } = useScenarioQuery(scenarioId);
  const activeScenario = rawScenario as IScenario | undefined;

  const { toasts, showToast, dismissToast } = useToast()
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportWizard, setShowExportWizard] = useState<boolean>(false);
  const exportProjectMutation = useExportProjectMutation() as any;
  const { data: rawEpisodes = [] } = useEpisodesQuery(scenarioId);
  const episodes = (rawEpisodes as IEpisode[]) || [];
  const createEpisodeMutation = useCreateEpisodeMutation();
  const [filterEpisode, setFilterEpisode] = useState<string>('ALL')
  
  // Modals State
  const [cloneModalScene, setCloneModalScene] = useState<IScene | null>(null)
  const [quickEditScene, setQuickEditScene] = useState<IScene | null>(null)
  const [showAddEpisodeModal, setShowAddEpisodeModal] = useState<boolean>(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false)
  const [sceneToDelete, setSceneToDelete] = useState<any>(null)

  const { data: scenesData = [], refetch: fetchScenes } = useScenesQuery(scenarioId);
  const createSceneMutation = useCreateSceneMutation();
  const updateSceneMutation = useUpdateSceneMutation();
  const deleteSceneMutation = useDeleteSceneMutation();
  const reorderScenesMutation = useReorderScenesMutation();

  const fetchStats = useCallback(() => {
    if (scenarioId) {
      queryClient.invalidateQueries({ queryKey: ['scenario-stats', scenarioId] });
      queryClient.invalidateQueries({ queryKey: ['scenario', scenarioId] });
    }
  }, [scenarioId, queryClient]);

  useEffect(() => {
    if (scenesData) {
      setScenes(scenesData as IScene[]);
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
  }, [scenarioId, activeScenarioId, hasHydrated, setActiveScenarioId, fetchScenes, navigate])

  // States for Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [collapsedEpisodes, setCollapsedEpisodes] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState<string>('ALL')
  const [filterTimes, setFilterTimes] = useState<string[]>([])
  const [filterRealLocation, setFilterRealLocation] = useState<string>('ALL')

  const uniqueLocations = useMemo(() => {
    const locs = scenes.map(s => s.location_name).filter(Boolean) as string[];
    return Array.from(new Set(locs)).sort();
  }, [scenes]);

  const uniqueCustomTimes = useMemo(() => {
    const times = scenes.map(s => s.time_of_day).filter(Boolean) as string[];
    const customTimes = times.filter(t => !(TIME_MAP as Record<string, string>)[t]);
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
      const body: any = { scenario_id: scenarioId };
      
      // Auto-assign to current filtered episode or the first one available
      if (filterEpisode !== 'ALL' && filterEpisode !== 'NONE') {
        body.episode_id = filterEpisode;
      } else {
        body.episode_id = episodes[0].id;
      }

      const scene = await createSceneMutation.mutateAsync(body) as any;
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

  function handleDeleteScene(sceneOrId: any, e?: React.MouseEvent) {
    if (e && e.stopPropagation) e.stopPropagation()
    setSceneToDelete(sceneOrId)
  }

  async function handleConfirmDeleteScene() {
    if (!sceneToDelete) return
    try {
      const sceneId = typeof sceneToDelete === 'object' ? sceneToDelete.id : sceneToDelete
      await deleteSceneMutation.mutateAsync(sceneId)
      showToast('تم حذف المشهد بنجاح', 'info')
      fetchScenes()
      fetchStats()
      setSceneToDelete(null)
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  }

  const cloneSceneMutation = useCloneSceneMutation();

  const handleCloneScene = async (originalId: string, targetEpisodeId: string | null, cloneType: any) => {
    try {
      const clonedScene = await cloneSceneMutation.mutateAsync({
        originalSceneId: originalId,
        targetEpisodeId: targetEpisodeId ? targetEpisodeId : null,
        cloneType
      }) as any;

      setScenes(prev => [...prev, clonedScene].sort((a,b) => a.scene_number - b.scene_number));
      showToast('تم استنساخ المشهد وإرساله إلى المسودة', 'success');
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء استنساخ المشهد', 'error');
    }
  }

  const handleQuickEditSave = async (id: string, updates: any) => {
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

          let reordered: IScene[];
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

          return [...otherScenes, ...updatedContextScenes].sort((a: any, b: any) => {
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

  const handleAddEpisode = async ({ title }: { title: string }) => {
    await createEpisodeMutation.mutateAsync({ scenario_id: scenarioId, title, episode_number: episodes.length + 1 })
    showToast('تم إنشاء حلقة جديدة', 'success')
  }

  const handleQuickAddScene = async ({ title, description }: { title: string; description: string }) => {
    if (episodes.length === 0) {
      showToast('يجب إنشاء حلقة أولاً قبل إضافة المشاهد', 'error');
      return;
    }

    try {
      const body: any = { 
        scenario_id: scenarioId,
        title,
        description
      };

      if (filterEpisode !== 'ALL' && filterEpisode !== 'NONE') {
        body.episode_id = filterEpisode;
      } else {
        body.episode_id = episodes[0].id;
      }

      const scene = await createSceneMutation.mutateAsync(body) as any;
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
  }, [activeScenario, scenes.length, isExporting, setTopBarConfig, scenes]);

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
  }, [scenes.length, completedCount, draftsCount, episodes.length, setSidebarContext, clearSidebarContext]);

  function handleDragEnd(event: any) {
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

        return [...otherScenes, ...updatedContextScenes].sort((a: any, b: any) => {
           if (a.episode_id !== b.episode_id) return (a.episode_id || 0) - (b.episode_id || 0);
           return a.scene_number - b.scene_number;
        });
      });
    }
  }

  const toggleEpisodeCollapse = (episodeId: string) => {
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

  const handleMoveScene = async (id: string, direction: 'up' | 'down') => {
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

      return [...otherScenes, ...updatedContextScenes].sort((a: any, b: any) => {
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
      if (filterTimes.length > 0 && !filterTimes.includes(scene.time_of_day || '')) return false;
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
            return (a.episode_id ? 1 : 0) - (b.episode_id ? 1 : 0);
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

        <SafeSceneToolbar
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

        <SafeSceneKanbanBoard
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

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showAddEpisodeModal && (
        <SafeAddEpisodeModal 
          onClose={() => setShowAddEpisodeModal(false)}
          onSubmit={handleAddEpisode}
        />
      )}

      {quickEditScene && (
        <SafeQuickEditSceneModal 
          scene={quickEditScene}
          onClose={() => setQuickEditScene(null)}
          onSave={handleQuickEditSave}
          allowReorder={filterEpisode !== 'ALL' && filterEpisode !== 'NONE'}
        />
      )}

      {showQuickAddModal && (
        <SafeQuickAddSceneModal 
          onClose={() => setShowQuickAddModal(false)}
          onSubmit={handleQuickAddScene}
        />
      )}

      {cloneModalScene && (
        <SafeCloneSceneModal 
          scene={cloneModalScene} 
          onClose={() => setCloneModalScene(null)} 
          onClone={handleCloneScene}
        />
      )}
      <SafeExportWizardModal 
        isOpen={showExportWizard}
        scenario={activeScenario}
        isExporting={isExporting}
        onClose={() => !isExporting && setShowExportWizard(false)}
        onConfirm={async (options: any) => {
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

      <ConfirmModal 
        isOpen={!!sceneToDelete}
        title="حذف المشهد"
        message={`هل أنت متأكد من رغبتك في حذف ${sceneToDelete?.scene_number ? `المشهد ${sceneToDelete.scene_number}` : 'هذا المشهد'}؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="تأكيد حذف المشهد"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteSceneMutation.isPending}
        onClose={() => setSceneToDelete(null)}
        onConfirm={handleConfirmDeleteScene}
      />
    </div>
  )
}

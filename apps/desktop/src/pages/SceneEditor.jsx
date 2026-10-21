import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Plus, Save, Undo2, Redo2, FileDown, BookOpen, CheckCircle2, MessageSquare, X, Timer, Sparkles, Edit3, Settings, CheckSquare, AlignLeft, Users2, Search, UserPlus, Camera, Volume2, MonitorPlay, AlertCircle, StickyNote, Scissors, ChevronDown } from 'lucide-react'
import CharacterModal from '../components/CharacterModal'
import { useToast } from '../hooks/useToast'
import { useKeyboard } from '../hooks/useKeyboard'
import SceneMetadataForm from '../components/editor/SceneMetadataForm'
import SmartEditor from '../components/editor/SmartEditor'
import SceneNavigator from '../components/editor/SceneNavigator'
import SceneTasksBoard from '../components/editor/SceneTasksBoard'
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import LocationModal from '../components/LocationModal';
import SceneRemindersModal from '../components/editor/SceneRemindersModal';
import ExportSettingsModal from '../components/pdf/ExportSettingsModal';
import PaperEditor from '../components/editor/paper/PaperEditor';
import { useCharactersQuery, useLocationsQuery, useEpisodesQuery, useCreateCharacterMutation } from '../hooks/queries';
import { useCreateSnapshotMutation } from '../hooks/queries/useSnapshots';
import SceneEditorModals from './editor/SceneEditorModals';
import SceneEditorHeader from './editor/SceneEditorHeader';

import { 
  useScenesQuery, 
  useSceneDetailQuery, 
  useCreateSceneMutation, 
  useUpdateSceneMutation,
  useDeleteSceneMutation,
  sceneApi as sceneRepo,
  sceneKeys
} from '../hooks/queries/useScenes';
import { 
  useBlocksQuery, 
  useCreateBlockMutation, 
  useUpdateBlockMutation, 
  useDeleteBlockMutation, 
  useReorderBlocksMutation,
  blockApi as blockRepo
} from '../hooks/queries/useBlocks';
import ScenePaperRenderer from '../components/editor/ScenePaperRenderer';
import WorkspaceCanvas from '../components/editor/WorkspaceCanvas';
import { groupBlocksByPage, expandBlocksToLayoutNodes, calculateSceneEighths } from '../components/editor/TextMeasurementEngine';
import { usePageNumberingQuery } from '../hooks/queries/usePageNumbering';
import { useExportWorker } from '../hooks/useExportWorker';
import { useQueryClient } from '@tanstack/react-query';

export default function SceneEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const { toasts, showToast, dismissToast } = useToast()
  const queryClient = useQueryClient();
  const { precalculate: precalculateExport, isProcessing: isExportPrecalculating } = useExportWorker();
  
  // Zustand Center
  const { saveStatus, setSaveStatus, setTopBarConfig, setSidebarContext, clearSidebarContext, pinnedSceneId, setPinnedSceneId } = useUIStore();
  const { activeScenarioId, setActiveScenarioId } = useUIStore();
  const { data: activeScenario } = useScenarioQuery(activeScenarioId);
  const { data: pageNumbering = [] } = usePageNumberingQuery(activeScenarioId);
  
  const { data: characters = [] } = useCharactersQuery(activeScenarioId);
  const { data: locations = [] } = useLocationsQuery(activeScenarioId);
  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId);
  const createCharacterMutation = useCreateCharacterMutation();
  const createSnapshotMutation = useCreateSnapshotMutation();

  const createSceneMutation = useCreateSceneMutation();
  const updateSceneMutation = useUpdateSceneMutation();
  const deleteSceneMutation = useDeleteSceneMutation();

  
  const createBlockMutation = useCreateBlockMutation();
  const updateBlockMutation = useUpdateBlockMutation();
  const deleteBlockMutation = useDeleteBlockMutation();
  const reorderBlocksMutation = useReorderBlocksMutation();

  const [scene, setScene] = useState({
    scenario_id: activeScenarioId,
    scene_number: 1,
    title: '',
    description: '',
    location_type: 'INT',
    location_name: '',
    time_of_day: 'DAY',
    exact_time: '',
    director_notes: '',
    status: 'DRAFT',
    continuity: '',
    time_shift: '',
    weather: '',
    revision_color: 'WHITE',
    location_id: null,
    present_characters: '[]',
    planned_shoot_date: '',
    estimated_duration: 0,
    episode_id: null,
    source_scene_id: null,
    clone_type: null,
    version: 1
  })
  const [blocks, setBlocks] = useState([])
  const lastSavedBlocksJsonRef = useRef('')
  const lastSavedSceneJsonRef = useRef('')
  const isSavingRef = useRef(false)
  const isSettledRef = useRef(false)
  const saveStatusRef = useRef(saveStatus)
  saveStatusRef.current = saveStatus
  const [pinnedSceneData, setPinnedSceneData] = useState(null)
  const [allScenes, setAllScenes] = useState([])
  const [selectedCharId, setSelectedCharId] = useState('')
  const [showCharModal, setShowCharModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)

  const [editingLocationId, setEditingLocationId] = useState(null)
  const [showRemindersModal, setShowRemindersModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [gapMode, setGapMode] = useState('line')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showCharMenu, setShowCharMenu] = useState(false)
  const [charSearch, setCharSearch] = useState('')
  const [showSceneMenu, setShowSceneMenu] = useState(false)
  const [activeBlockId, setActiveBlockId] = useState(null)
  const pendingWritesRef = useRef(0)

  useEffect(() => {
    if (id === 'undefined') {
      navigate('/scenarios');
      return;
    }
    
    // Reset loaded state to avoid race conditions with old state
    setLoaded(false);
    
    if (!isNew && id) {
       fetchScene()
    } else if (isNew) {
       setLoaded(true)
    }
    
    // Fetch characters only if we have a scenario context
    if (activeScenarioId) {
      fetchAllScenes()
    }
  }, [id, activeScenarioId])

  // ==========================================
  // Snapshot Safety Net & Unsaved Changes Guard
  // ==========================================
  
  // 1. Initial Load Snapshot
  useEffect(() => {
    if (loaded && !isNew && id && blocks.length > 0) {
      // Small timeout to ensure everything is mounted
      const timer = setTimeout(() => {
        createSnapshotMutation.mutate({ sceneId: id, blocks, trigger: 'scene_load' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loaded, isNew, id]); // Only run when loaded state changes to true

  // 2. Periodic 5-minute Auto-Snapshot
  useEffect(() => {
    if (!id || isNew) return;
    const interval = setInterval(() => {
      // We check ref instead of state to avoid re-triggering the effect
      if (saveStatus === 'unsaved' || saveStatus === 'saving') {
         createSnapshotMutation.mutate({ sceneId: id, blocks, trigger: 'auto_5min' });
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [id, isNew, saveStatus, blocks, createSnapshotMutation]);

  // 3. Tauri Unsaved Changes Guard
  useEffect(() => {
    let unlisten = null;
    
    const setupGuard = async () => {
      try {
        const appWindow = getCurrentWindow();
        unlisten = await appWindow.onCloseRequested(async (event) => {
          if (saveStatus === 'unsaved') {
            const confirmed = await window.confirm('لديك تغييرات غير محفوظة في هذا المشهد. هل أنت متأكد أنك تريد إغلاق التطبيق وفقدانها؟');
            if (!confirmed) {
              event.preventDefault();
            } else {
              // Optionally take a desperate snapshot before dying
              if (id && blocks.length > 0) {
                 createSnapshotMutation.mutate({ sceneId: id, blocks, trigger: 'app_close_panic' });
              }
            }
          }
        });
      } catch (err) {
        console.warn('Could not hook into Tauri onCloseRequested (might be running in web mode)');
      }
    };
    
    setupGuard();
    
    return () => {
      if (unlisten) unlisten();
    };
  }, [saveStatus, id, blocks, createSnapshotMutation]);

  // 4. Silent Flush on Route Exit / Unmount
  useEffect(() => {
    return () => {
      if (saveStatusRef.current === 'unsaved' && saveSceneRef.current) {
        saveSceneRef.current().catch((e) => console.error('Unmount flush error:', e));
      }
    };
  }, []);

  // ==========================================

  // Auto-detect characters from dialogue blocks
  useEffect(() => {
    if (!loaded || isNew) return;
    const dialogueCharIds = Array.from(new Set(
      blocks.filter(b => b.type === 'DIALOGUE' && b.character_id).map(b => String(b.character_id))
    ));
    
    let currentPresent = [];
    try {
      const parsed = JSON.parse(scene.present_characters || '[]');
      currentPresent = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch(e) {
      console.warn('Failed to parse present_characters in SceneEditor', e);
    }
    
    // Auto-add characters that speak in the scene to the present_characters list
    const newPresentSet = new Set(currentPresent);
    let changed = false;
    
    dialogueCharIds.forEach(charId => {
      if (!newPresentSet.has(charId)) {
        newPresentSet.add(charId);
        changed = true;
      }
    });
    
    if (changed) {
      const newPresentString = JSON.stringify(Array.from(newPresentSet));
      setScene(prev => ({ ...prev, present_characters: newPresentString }));
      // Silently persist auto-detected characters without triggering the unsaved warning prompt
      if (id && !isNew) {
        updateSceneMutation.mutate({ id, data: { present_characters: newPresentString } });
      }
    }
  }, [blocks, loaded, isNew, scene.present_characters, updateSceneMutation, id]);

  // جلب بيانات المشهد المثبت للمقارنة مع التحقق من ملكية المشروع
  useEffect(() => {
    if (pinnedSceneId) {
      sceneRepo.findById(pinnedSceneId)
        .then(data => {
          if (!data) throw new Error('Scene not found');
          if (data.scenario_id && activeScenarioId && String(data.scenario_id) !== String(activeScenarioId)) {
            console.warn('Pinned scene belongs to another project. Clearing pin.');
            setPinnedSceneId(null);
            setPinnedSceneData(null);
          } else {
            blockRepo.getSceneBlocks(pinnedSceneId).then(blocks => {
              setPinnedSceneData({ ...data, blocks });
            });
          }
        })
        .catch(err => {
          console.error('Failed to fetch pinned scene', err);
          setPinnedSceneId(null);
        })
    } else {
      setPinnedSceneData(null);
    }
  }, [pinnedSceneId, activeScenarioId, setPinnedSceneId])

  // Keep pinnedSceneData in sync if the pinned scene is the one currently being edited
  useEffect(() => {
    if (pinnedSceneId && scene && (String(pinnedSceneId) === String(scene.id) || String(pinnedSceneId) === String(id))) {
      setPinnedSceneData({ ...scene, id: scene.id || id, blocks });
    }
  }, [pinnedSceneId, scene, blocks, id]);

  // Project-wide page count cache and retrieval
  const pageCountsCacheRef = useRef({});

  const getSortedScenarioScenes = useCallback(async () => {
    if (!activeScenarioId) return [];
    try {
      const all = await sceneRepo.getByScenarioId(activeScenarioId);
      const active = all.filter(s => s.deleted_at === null);
      
      const sortScenes = (a, b) => {
        const numA = parseFloat(a.scene_number);
        const numB = parseFloat(b.scene_number);
        
        if (isNaN(numA) && isNaN(numB)) {
          return String(a.scene_number).localeCompare(String(b.scene_number), undefined, { numeric: true, sensitivity: 'base' });
        }
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        
        if (numA !== numB) {
          return numA - numB;
        }
        return String(a.scene_number).localeCompare(String(b.scene_number), undefined, { numeric: true, sensitivity: 'base' });
      };

      active.sort((a, b) => {
        if (a.episode_id !== b.episode_id) {
          if (!a.episode_id) return 1;
          if (!b.episode_id) return -1;
          
          const epA = episodes.find(e => e.id === a.episode_id);
          const epB = episodes.find(e => e.id === b.episode_id);
          const numA = epA ? epA.episode_number : 9999;
          const numB = epB ? epB.episode_number : 9999;
          
          if (numA !== numB) return numA - numB;
        }
        return sortScenes(a, b);
      });

      return active;
    } catch (err) {
      console.error('Failed to get sorted scenes', err);
      return [];
    }
  }, [activeScenarioId, episodes]);

  // Reactive active scene page count cacher
  useEffect(() => {
    const currentSceneId = scene?.id || id;
    if (currentSceneId && blocks.length > 0) {
      const mappedBlocks = blocks.map(b => ({
        id: b.id,
        type: b.type,
        content: b.content,
        character_id: b.character_id,
        metadata: b.metadata
      }));
      const layoutNodes = expandBlocksToLayoutNodes(mappedBlocks, characters);
      const { totalPages } = groupBlocksByPage(layoutNodes, { hasSceneHeader: true });
      pageCountsCacheRef.current[currentSceneId] = totalPages;
    }
  }, [scene.id, id, blocks, characters]);

  const [startPageNumber, setStartPageNumber] = useState(1);

  useEffect(() => {
    let active = true;
    async function calculateStartPage() {
      const currentSceneId = scene?.id || id;
      if (!currentSceneId || !activeScenarioId) {
        setStartPageNumber(1);
        return;
      }
      // Check database page numbering first
      const record = pageNumbering.find(r => r.item_id === currentSceneId && r.item_type === 'SCENE');
      if (record) {
        if (active) setStartPageNumber(record.start_page);
        return;
      }
      try {
        const sortedScenes = await getSortedScenarioScenes();
        const currentIndex = sortedScenes.findIndex(s => s.id === currentSceneId);
        if (currentIndex <= 0) {
          if (active) setStartPageNumber(1);
          return;
        }
        const precedingScenes = sortedScenes.slice(0, currentIndex);
        
        const missingSceneIds = precedingScenes
          .map(s => s.id)
          .filter(id => pageCountsCacheRef.current[id] === undefined);

        let missingBlocksByScene = {};
        if (missingSceneIds.length > 0) {
          const allMissingBlocks = await blockRepo.getBlocksForScenes(missingSceneIds);
          allMissingBlocks.forEach(b => {
            if (!missingBlocksByScene[b.scene_id]) missingBlocksByScene[b.scene_id] = [];
            missingBlocksByScene[b.scene_id].push(b);
          });
        }

        let precedingPagesCount = 0;
        for (const s of precedingScenes) {
          if (pageCountsCacheRef.current[s.id] !== undefined) {
            precedingPagesCount += pageCountsCacheRef.current[s.id];
          } else {
            const sceneBlocks = missingBlocksByScene[s.id] || [];
            const mappedBlocks = sceneBlocks.map(b => ({
              id: b.id,
              type: b.type,
              content: b.content,
              character_id: b.character_id,
              metadata: b.metadata
            }));
            const layoutNodes = expandBlocksToLayoutNodes(mappedBlocks, characters);
            const { totalPages } = groupBlocksByPage(layoutNodes, { hasSceneHeader: true });
            pageCountsCacheRef.current[s.id] = totalPages;
            precedingPagesCount += totalPages;
          }
        }
        
        if (active) {
          setStartPageNumber(precedingPagesCount + 1);
        }
      } catch (err) {
        console.error('Failed to calculate starting page number', err);
      }
    }
    
    calculateStartPage();
    return () => {
      active = false;
    };
  }, [scene.id, id, activeScenarioId, getSortedScenarioScenes, characters, pageNumbering]);

  const [pinnedStartPageNumber, setPinnedStartPageNumber] = useState(1);

  useEffect(() => {
    let active = true;
    async function calculatePinnedStartPage() {
      if (!pinnedSceneId || !activeScenarioId) {
        setPinnedStartPageNumber(1);
        return;
      }
      // Check database page numbering first
      const record = pageNumbering.find(r => r.item_id === pinnedSceneId && r.item_type === 'SCENE');
      if (record) {
        if (active) setPinnedStartPageNumber(record.start_page);
        return;
      }
      try {
        const sortedScenes = await getSortedScenarioScenes();
        const currentIndex = sortedScenes.findIndex(s => s.id === pinnedSceneId);
        if (currentIndex <= 0) {
          if (active) setPinnedStartPageNumber(1);
          return;
        }
        const precedingScenes = sortedScenes.slice(0, currentIndex);
        
        const missingSceneIds = precedingScenes
          .map(s => s.id)
          .filter(id => pageCountsCacheRef.current[id] === undefined);

        let missingBlocksByScene = {};
        if (missingSceneIds.length > 0) {
          const allMissingBlocks = await blockRepo.getBlocksForScenes(missingSceneIds);
          allMissingBlocks.forEach(b => {
            if (!missingBlocksByScene[b.scene_id]) missingBlocksByScene[b.scene_id] = [];
            missingBlocksByScene[b.scene_id].push(b);
          });
        }

        let precedingPagesCount = 0;
        for (const s of precedingScenes) {
          if (pageCountsCacheRef.current[s.id] !== undefined) {
            precedingPagesCount += pageCountsCacheRef.current[s.id];
          } else {
            const sceneBlocks = missingBlocksByScene[s.id] || [];
            const mappedBlocks = sceneBlocks.map(b => ({
              id: b.id,
              type: b.type,
              content: b.content,
              character_id: b.character_id,
              metadata: b.metadata
            }));
            const layoutNodes = expandBlocksToLayoutNodes(mappedBlocks, characters);
            const { totalPages } = groupBlocksByPage(layoutNodes, { hasSceneHeader: true });
            pageCountsCacheRef.current[s.id] = totalPages;
            precedingPagesCount += totalPages;
          }
        }
        
        if (active) {
          setPinnedStartPageNumber(precedingPagesCount + 1);
        }
      } catch (err) {
        console.error('Failed to calculate pinned starting page number', err);
      }
    }
    
    calculatePinnedStartPage();
    return () => {
      active = false;
    };
  }, [pinnedSceneId, activeScenarioId, getSortedScenarioScenes, characters, pageNumbering]);

  async function fetchScene() {
    setSaveStatus('saved');
    try {
      const data = await sceneRepo.findById(id);
      if (!data) throw new Error('Scene not found');
      
      if (data.scenario_id) {
        if (!activeScenarioId) {
          setActiveScenarioId(data.scenario_id);
        } else if (String(data.scenario_id) !== String(activeScenarioId)) {
          console.warn('Scene does not belong to active scenario. Redirecting...');
          navigate('/scenarios');
          return;
        }
      }

      const fetchedScene = {
        id: data.id,
        scenario_id: data.scenario_id,
        scene_number: data.scene_number,
        title: data.title || '',
        description: data.description || '',
        location_type: data.location_type,
        location_name: data.location_name,
        time_of_day: data.time_of_day,
        exact_time: data.exact_time || '',
        director_notes: data.director_notes || '',
        status: data.status || 'DRAFT',
        continuity: data.continuity || '',
        time_shift: data.time_shift || '',
        weather: data.weather || '',
        revision_color: data.revision_color || 'WHITE',
        location_id: data.location_id || null,
        present_characters: data.present_characters || '[]',
        planned_shoot_date: data.planned_shoot_date || '',
        estimated_duration: data.estimated_duration || 1,
        episode_id: data.episode_id || null,
        source_scene_id: data.source_scene_id || null,
        clone_type: data.clone_type || null,
        version: data.version || 1
      };
      setScene(fetchedScene)
      lastSavedSceneJsonRef.current = JSON.stringify(fetchedScene)
      const sceneBlocks = await blockRepo.getSceneBlocks(id);
      setBlocks(sceneBlocks || [])
      lastSavedBlocksJsonRef.current = JSON.stringify(sceneBlocks || [])
      setLoaded(true)
      
      // Fetch navigation list and update pagination for the scenario
      if (data.scenario_id) {
        fetchAllScenes(data.episode_id || null);
        import('../utils/paginationCalculator').then(({ updateScenarioPageNumbering }) => {
          updateScenarioPageNumbering(data.scenario_id).then(() => {
            queryClient.invalidateQueries({ queryKey: ['pageNumbering'] });
            queryClient.invalidateQueries({ queryKey: sceneKeys.all });
            fetchAllScenes(data.episode_id || null);
          });
        });
      }

      setSaveStatus('saved')
      // Mark scene as settled after initial mount normalization window
      setTimeout(() => {
        isSettledRef.current = true;
      }, 600);
    } catch (err) {
      console.error(err)
      navigate('/scenarios');
    }
  }

  const [draftScenes, setDraftScenes] = useState([])

  async function fetchAllScenes(contextEpisodeId) {
    if (!activeScenarioId) return;
    try {
      const all = await sceneRepo.getByScenarioId(activeScenarioId);
      
      // If contextEpisodeId is provided, use it. Otherwise use the current scene's state.
      const epId = contextEpisodeId !== undefined ? contextEpisodeId : scene.episode_id;
      
      // Natural sorting helper for scene numbers (e.g. 1, 2, ..., 10, 10A)
      const sortScenes = (a, b) => {
        const numA = parseFloat(a.scene_number);
        const numB = parseFloat(b.scene_number);
        
        if (isNaN(numA) && isNaN(numB)) {
          return String(a.scene_number).localeCompare(String(b.scene_number), undefined, { numeric: true, sensitivity: 'base' });
        }
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        
        if (numA !== numB) {
          return numA - numB;
        }
        
        return String(a.scene_number).localeCompare(String(b.scene_number), undefined, { numeric: true, sensitivity: 'base' });
      };

      // 1. Current Context Scenes (Same Episode or Same Drafts Pool)
      const contextScenes = all.filter(s => s.episode_id === epId && s.deleted_at === null);
      contextScenes.sort(sortScenes);
      setAllScenes(contextScenes);
      
      // 2. Drafts Pool (No Episode) - always show this for importing if we are in an episode
      const drafts = all.filter(s => !s.episode_id && s.deleted_at === null);
      drafts.sort(sortScenes);
      setDraftScenes(drafts);
    } catch (err) {
      console.error('Failed to fetch scenes list', err)
    }
  }

  const importFromDrafts = async (draftId) => {
    if (!scene.episode_id) return; // Can't import if not in an episode
    try {
      await updateSceneMutation.mutateAsync({ id: draftId, data: { episode_id: scene.episode_id } });
      showToast('تم استيراد المشهد من المسودة بنجاح', 'success');
      fetchAllScenes();
    } catch (err) {
      showToast('فشل استيراد المشهد', 'error');
    }
  }

  const saveBlocksToDb = useCallback(async (currentBlocks, targetId = id) => {
    if (!targetId) return;
    try {
      const dbBlocks = await blockRepo.getSceneBlocks(targetId);
      const dbBlocksMap = new Map(dbBlocks.map(b => [b.id, b]));
      const newBlocksMap = new Map(currentBlocks.map(b => [b.id, b]));

      // 1. Delete blocks removed from list
      const toDelete = dbBlocks.filter(b => !newBlocksMap.has(b.id));
      for (const b of toDelete) {
        await blockRepo.delete(b.id);
      }

      // 2. Insert/Update remaining blocks
      for (const b of currentBlocks) {
        const dbBlock = dbBlocksMap.get(b.id);
        const record = {
          id: b.id,
          scene_id: targetId,
          type: b.type,
          content: b.content || '',
          character_id: b.character_id,
          metadata: b.metadata || '{}',
          sort_order: b.sort_order
        };

        if (!dbBlock) {
          await blockRepo.insert(record);
        } else {
          const isChanged = 
            dbBlock.type !== record.type ||
            dbBlock.content !== record.content ||
            dbBlock.character_id !== record.character_id ||
            dbBlock.metadata !== record.metadata ||
            dbBlock.sort_order !== record.sort_order;

          if (isChanged) {
            await blockRepo.update(b.id, record);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['blocks', 'scene', targetId] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      
      lastSavedBlocksJsonRef.current = JSON.stringify(currentBlocks);
    } catch (err) {
      console.error('Failed to save blocks:', err);
      throw err;
    }
  }, [id, queryClient]);

  const saveScene = useCallback(async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setSaving(true)
    setSaveStatus('saving')
    try {
      const calculatedEighths = calculateSceneEighths(blocks, characters);
      const mappedBlocks = blocks.map(b => ({
        id: b.id,
        type: b.type,
        content: b.content,
        character_id: b.character_id,
        metadata: b.metadata
      }));
      const layoutNodes = expandBlocksToLayoutNodes(mappedBlocks, characters);
      const { totalPages } = groupBlocksByPage(layoutNodes, { hasSceneHeader: true });
      
      const nextVersion = (scene.version || 0) + 1;
      const sceneToSave = { 
        ...scene, 
        scenario_id: scene.scenario_id || activeScenarioId,
        page_eighths: calculatedEighths, 
        page_count: totalPages || 1,
        version: nextVersion 
      };

      if (isNew) {
        const created = await createSceneMutation.mutateAsync(sceneToSave);
        await saveBlocksToDb(blocks, created.id);
        const { updateScenarioPageNumbering } = await import('../utils/paginationCalculator');
        await updateScenarioPageNumbering(activeScenarioId);
        queryClient.invalidateQueries({ queryKey: ['pageNumbering', 'scenario', activeScenarioId] });
        const finalSavedScene = { ...sceneToSave, id: created.id, version: created.version || nextVersion };
        lastSavedSceneJsonRef.current = JSON.stringify(finalSavedScene);
        setScene(finalSavedScene);
        showToast('تم إنشاء المشهد بنجاح', 'success')
        // fetchStats() removed
        navigate(`/scene/${created.id}`, { replace: true })
      } else {
        await updateSceneMutation.mutateAsync({ id, data: sceneToSave });
        await saveBlocksToDb(blocks, id);
        const { updateScenarioPageNumbering } = await import('../utils/paginationCalculator');
        await updateScenarioPageNumbering(activeScenarioId);
        queryClient.invalidateQueries({ queryKey: ['pageNumbering', 'scenario', activeScenarioId] });
        const finalSavedScene = { ...sceneToSave, version: nextVersion };
        lastSavedSceneJsonRef.current = JSON.stringify(finalSavedScene);
        setScene(finalSavedScene)
        setSaveStatus('saved')
        showToast('تم حفظ المشهد بنجاح', 'success')
        // fetchStats() removed
      }
    } catch (err) { 
      console.error('Manual save error details:', err)
      setSaveStatus('error')
      if (err.message && err.message.includes('CONFLICT')) {
        showToast(err.message, 'error', 5000)
      } else {
        showToast('خطأ أثناء حفظ المشهد', 'error')
      }
    } finally {
      isSavingRef.current = false;
      setSaving(false)
    }
  }, [isNew, scene, blocks, id, navigate, showToast, setSaveStatus, createSceneMutation, updateSceneMutation, saveBlocksToDb, characters]);

  const handleExportPDF = useCallback(async () => {
    if (isNew) {
      showToast('يجب حفظ المشهد قبل التصدير', 'error')
      return
    }
    setShowExportModal(true)
  }, [isNew, showToast]);

  const onExportWithSettings = useCallback(async (exportSettings) => {
    setShowExportModal(false)
    setExporting(true)
    try {
      // معالجة مسبقة في خيط خلفي (Web Worker) لحساب التقطيع دون تجميد الواجهة
      const precalcResult = await precalculateExport([{ ...scene, blocks }], characters);
      if (precalcResult) {
        console.log(`[ExportWorker] Pre-calculated ${precalcResult.totalEstimatedPages} pages in background thread`);
      }

      const { exportToPDF } = await import('../utils/exportPDF')
      
      const currentActiveScenario = activeScenario;
      const currentActiveScenarioId = activeScenarioId;
      
      const currentEpisode = episodes.find(e => e.id === scene.episode_id);
      const episodeTitle = currentEpisode ? (currentEpisode.title || ('حلقة ' + currentEpisode.episode_number)) : null;
      
      let scenarioTitle = currentActiveScenario?.title || '';
      let directorName = exportSettings.directorName || currentActiveScenario?.director_name || '';
      if ((!scenarioTitle || !directorName) && currentActiveScenarioId) {
        try {
          // wait
          const freshScenario = activeScenario;
          scenarioTitle = scenarioTitle || freshScenario?.title || '';
          directorName = directorName || freshScenario?.director_name || '';
        } catch (e) { /* fallback silently */ }
      }
      
      const sceneTitleStr = scene.title ? scene.title.trim() : '';
      const finalFilename = `المشهد ${scene.scene_number}${sceneTitleStr ? ' ' + sceneTitleStr : ''}`;

      await exportToPDF({ 
        scenario: { title: scenarioTitle || finalFilename }, 
        scenes: [{ ...scene, blocks }],
        characters,
        episodes
      }, { 
        filename: finalFilename,
        exportLevel: 'SCENE',
        targetEntityId: scene.id,
        includeMasterCover: !!exportSettings.enableCoverPage,
        coverPage: exportSettings.enableCoverPage ? {
          scenarioTitle: scenarioTitle,
          directorName: directorName,
          episodeTitle: episodeTitle,
          sceneNumber: scene.scene_number,
          sceneTitle: sceneTitleStr
        } : null,
        exportSettings,
        startPageNumber: startPageNumber,
        scenarioName: scenarioTitle
      })
      showToast('تم تصدير المشهد بنجاح', 'success')
    } catch (err) {
      console.error('Export error:', err);
      showToast('فشل التصدير', 'error')
    } finally {
      setExporting(false)
    }
  }, [scene, blocks, characters, episodes, showToast]);

  // تزامن أزرار الصفحة مع التوب بار العالمي
  const handleExportPDFRef = useRef(handleExportPDF);
  const saveSceneRef = useRef(saveScene);
  handleExportPDFRef.current = handleExportPDF;
  saveSceneRef.current = saveScene;

  useEffect(() => {
    const actions = [];
    
    // Status Badge
    actions.push({
      id: 'status',
      label: scene.status === 'COMPLETED' ? 'مكتمل' : 'مسودة',
      variant: 'ghost'
    });

    // Clone Tag
    if (scene.source_scene_id) {
      const cloneLabels = {
        FLASHBACK: 'فلاشباك',
        FLASHFORWARD: 'فلاشفوروارد',
        RECALL: 'استدعاء',
        DUPLICATE: 'نسخة مكررة',
        ALTERNATE: 'نسخة بديلة'
      };
      actions.push({
        id: 'clone_link',
        label: cloneLabels[scene.clone_type] || 'نسخة',
        onClick: () => navigate(`/scene/${scene.source_scene_id}`),
        variant: 'outline',
        title: 'الذهاب للمشهد الأصلي'
      });
    }

    const rightActions = [];
    if (!isNew) {
      rightActions.push({ id: 'export-pdf', label: 'تصدير PDF', icon: FileDown, onClick: () => handleExportPDFRef.current(), disabled: exporting, variant: 'outline' });
    }
    rightActions.push({ id: 'save', label: 'حفظ', icon: Save, onClick: () => saveSceneRef.current(), disabled: saving, variant: 'primary' });

    setTopBarConfig({
      pageName: isNew ? 'تبويب جديد' : `المشهد: ${scene.scene_number} ${scene.title ? `(${scene.title})` : ''}`,
      actions,
      rightActions
    });

    return () => {
      setTopBarConfig(null);
      clearSidebarContext();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.scene_number, scene.title, scene.status, scene.source_scene_id, scene.clone_type, saving, exporting, isNew]);

  // Register sidebar context for scene editor
  useEffect(() => {
    if (!loaded || isNew) return;
    setSidebarContext({
      title: `مشهد ${scene.scene_number}`,
      stats: [
        { label: 'الكتل', value: blocks.length },
        { label: 'الحالة', value: scene.status === 'COMPLETED' ? 'مكتمل' : scene.status === 'IN_PROGRESS' ? 'قيد العمل' : 'مسودة' },
      ],
      badge: pinnedSceneId 
        ? { text: 'وضع المرجع مفعّل', color: 'amber' } 
        : null,
    });
  }, [scene.scene_number, scene.status, blocks.length, pinnedSceneId, loaded, isNew]);

  const getInsertIndex = () => {
    if (!activeBlockId) return blocks.length;
    const idx = blocks.findIndex(b => b.id === activeBlockId);
    return idx !== -1 ? idx + 1 : blocks.length;
  };

  async function addBlock(index, type = 'ACTION', character_id = null) {
    const currentSceneId = isNew ? await createSceneAndGetId() : id
    if (!currentSceneId) return

    let sortOrder = 0.0;
    if (blocks.length === 0) {
      sortOrder = 65536;
    } else if (index >= blocks.length) {
      sortOrder = blocks[blocks.length - 1].sort_order + 65536;
    } else if (index === 0) {
      sortOrder = blocks[0].sort_order - 65536;
    } else {
      sortOrder = (blocks[index - 1].sort_order + blocks[index].sort_order) / 2.0;
    }

    try {
      const newBlock = await createBlockMutation.mutateAsync({ sceneId: currentSceneId, data: { type, content: '', sort_order: sortOrder, character_id } });
      
      setBlocks(prev => {
        const newBlocks = [...prev];
        newBlocks.splice(index, 0, newBlock);
        newBlocks.sort((a, b) => a.sort_order - b.sort_order);
        return newBlocks;
      });
      
      showToast('تمت الإضافة', 'success', 1000)
    } catch (err) { 
      showToast('فشل الإضافة', 'error')
    }
  }

  async function createSceneAndGetId() {
    try {
      const created = await createSceneMutation.mutateAsync(scene);
      navigate(`/scene/${created.id}`, { replace: true })
      return created.id
    } catch (err) { return null }
  }

  const updateBlock = useCallback(async (blockId, updates) => {
    try {
      pendingWritesRef.current++;
      setSaveStatus('saving');
      await updateBlockMutation.mutateAsync({ id: blockId, data: updates });
    } catch (err) { 
      console.error(err);
      setSaveStatus('error');
    } finally {
      pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      if (pendingWritesRef.current === 0) {
        setSaveStatus('saved');
      }
    }
  }, [setSaveStatus])

  async function deleteBlock(blockId) {
    try {
      await deleteBlockMutation.mutateAsync(blockId);
      setBlocks(prev => prev.filter(b => b.id !== blockId))
      showToast('تم الحذف', 'info', 1000)
    } catch (err) { 
      showToast('فشل الحذف', 'error')
    }
  }

  function handleReorderBlocks(newBlocks) {
    if (!id || isNew) return;
    reorderBlocksMutation.mutateAsync(newBlocks.map(b => b.id))
      .catch(() => console.error('Failed to save block order'))
  }

  function handleSceneChange(field, value) {
    setScene(prev => ({ ...prev, [field]: value }))
    setSaveStatus('unsaved')
  }

  const debounceRef = useRef()
  useEffect(() => {
    if (!loaded || isNew || !id || saveStatus === 'saved') return

    const currentSceneJson = JSON.stringify(scene)
    const currentBlocksJson = JSON.stringify(blocks)

    if (currentSceneJson === lastSavedSceneJsonRef.current && currentBlocksJson === lastSavedBlocksJsonRef.current) {
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(async function runSave() {
      if (isSavingRef.current) {
        debounceRef.current = setTimeout(runSave, 500)
        return
      }
      isSavingRef.current = true
      setSaveStatus('saving')
      try {
        const nextVersion = (scene.version || 0) + 1;
        const calculatedEighths = calculateSceneEighths(blocks, characters);
        const sceneToSave = { 
          ...scene, 
          scenario_id: scene.scenario_id || activeScenarioId,
          page_eighths: calculatedEighths, 
          version: nextVersion 
        };
        const currentSceneJsonWithEighths = JSON.stringify(sceneToSave);

        if (currentSceneJsonWithEighths !== lastSavedSceneJsonRef.current) {
          await updateSceneMutation.mutateAsync({ id, data: sceneToSave })
          const finalSavedScene = { ...sceneToSave, version: nextVersion };
          lastSavedSceneJsonRef.current = JSON.stringify(finalSavedScene);
          setScene(finalSavedScene);
        }
        
        if (currentBlocksJson !== lastSavedBlocksJsonRef.current) {
          await saveBlocksToDb(blocks, id)
        }
        
        setSaveStatus('saved')
        showToast('تم الحفظ تلقائياً', 'success', 1000)
      } catch (err) {
        console.error('Auto-save error details:', err)
        setSaveStatus('error')
        if (err.message && err.message.includes('CONFLICT')) {
          showToast(err.message, 'error', 5000)
        } else {
          showToast('فشل الحفظ التلقائي', 'error', 2000)
        }
      } finally {
        isSavingRef.current = false
      }
    }, 1500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [scene, blocks, loaded, isNew, id, saveBlocksToDb, setSaveStatus, showToast, characters, updateSceneMutation])

  const blockDebounceRef = useRef({})
  const debouncedUpdateBlock = useCallback((blockId, updates) => {
    setSaveStatus('unsaved')
    if (blockDebounceRef.current[blockId]) clearTimeout(blockDebounceRef.current[blockId])
    blockDebounceRef.current[blockId] = setTimeout(() => {
      updateBlock(blockId, updates)
    }, 500)
  }, [updateBlock, setSaveStatus])

  
  useKeyboard({
    'ctrl+s': (e) => { e.preventDefault(); saveScene() },
    'ctrl+p': (e) => { e.preventDefault(); handleExportPDF() },
    'escape': () => navigate('/')
  })

  const quickAddCharacter = useCallback(async (name) => {
    const scenarioId = activeScenarioId;
    if (!scenarioId) return null;
    try {
      const data = await createCharacterMutation.mutateAsync({ name, scenario_id: scenarioId });
      showToast(`تم إنشاء الشخصية "${name}" بسرعة`, 'success', 2000);
      return data;
    } catch (err) {
      showToast('فشل إنشاء الشخصية', 'error');
      return null;
    }
  }, [activeScenarioId, showToast, createCharacterMutation]);

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-sans">جاري التحميل...</div>

   return (
    <div className="flex flex-col animate-in fade-in duration-500 h-full overflow-hidden">
      <div className="flex-1 flex overflow-hidden flex-row-reverse">
        
        {/* Scene Navigator - The PDF-like thumbnails rail (Far Left) */}
        <SceneNavigator 
          scenes={allScenes}
          activeSceneId={id}
          drafts={draftScenes}
          onImportDraft={importFromDrafts}
          currentEpisodeId={scene.episode_id}
          pageNumbering={pageNumbering}
          onSelectScene={async (targetId) => {
            if (targetId === id) return;
            try {
              if (saveStatus === 'unsaved') {
                await saveSceneRef.current();
              }
              // Snapshot before leaving if it was saved during this session
              if (id && blocks.length > 0) {
                createSnapshotMutation.mutate({ sceneId: id, blocks, trigger: 'scene_switch' });
              }
              navigate(`/scene/${targetId}`);
            } catch (err) {
              console.error('Failed to auto-save scene before switching:', err);
              showToast('تعذر الانتقال: حدث خطأ أثناء حفظ المشهد', 'error');
            }
          }}
        />
        {/* Cinematic Page Preview (PDF Identity) - Middle Area / Split Mode */}
        <WorkspaceCanvas>
           <PaperEditor 
              key={scene.id || id}
              scene={scene}
              initialBlocks={blocks}
              characters={characters}
              locations={locations}
              onUpdateBlocks={(newBlocks) => {
                // Ignore programmatic normalization during initial mount/settling phase
                if (!isSettledRef.current) {
                  setBlocks(newBlocks);
                  lastSavedBlocksJsonRef.current = JSON.stringify(newBlocks);
                  return;
                }

                const cleanContent = (str) => String(str || '')
                  .replace(/<[^>]*>/g, '')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/\s+/g, ' ')
                  .trim();

                const normNewObj = (newBlocks || []).map(b => ({
                  type: String(b.type || '').toUpperCase(),
                  content: cleanContent(b.content),
                  character_id: b.character_id ? String(b.character_id) : null
                }));
                const normNew = JSON.stringify(normNewObj);
                
                let normOldObj = [];
                try {
                  const parsedOld = JSON.parse(lastSavedBlocksJsonRef.current || '[]');
                  normOldObj = (parsedOld || []).map(b => ({
                    type: String(b.type || '').toUpperCase(),
                    content: cleanContent(b.content),
                    character_id: b.character_id ? String(b.character_id) : null
                  }));
                } catch(e) {}
                const normOld = JSON.stringify(normOldObj);

                // Prevent false 'unsaved' status when TipTap auto-injects an empty action block into an empty scene
                if ((normOld === '[]' || normOld === '') && (normNew === '[{"type":"ACTION","content":"","character_id":null}]' || normNew === '[]')) {
                  setBlocks(newBlocks);
                  return;
                }

                if (normNew !== normOld && normOld !== '') {
                  setBlocks(newBlocks);
                  setSaveStatus('unsaved');
                }
              }}
              onUpdateScene={handleSceneChange}
              startPageNumber={startPageNumber}
              scenarioName={activeScenario?.title || activeScenario?.name || 'مشروع بدون عنوان'}
              episodes={episodes}
              onAddCharacter={quickAddCharacter}
           />

          {pinnedSceneData && (
            <ScenePaperRenderer 
              scene={pinnedSceneData}
              blocks={pinnedSceneData.blocks || []}
              characters={characters}
              isReference={true}
              onCloseReference={() => setPinnedSceneId(null)}
              startPageNumber={pinnedStartPageNumber}
              scenarioName={activeScenario?.title || activeScenario?.name || 'مشروع بدون عنوان'}
              episodes={episodes}
            />
          )}
        </WorkspaceCanvas>

        {/* Professional Editing Sidebar (Form) - Right Side */}
        <div className="w-[420px] shrink-0 border-l border-border bg-card flex flex-col h-full shadow-2xl relative z-10">
          
          <SceneEditorHeader
            scene={scene}
            id={id}
            isNew={isNew}
            allScenes={allScenes}
            characters={characters}
            handleSceneChange={handleSceneChange}
            saveScene={saveScene}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showSceneMenu={showSceneMenu}
            setShowSceneMenu={setShowSceneMenu}
            showCharMenu={showCharMenu}
            setShowCharMenu={setShowCharMenu}
            charSearch={charSearch}
            setCharSearch={setCharSearch}
            setShowCharModal={setShowCharModal}
            setShowRemindersModal={setShowRemindersModal}
            addBlock={addBlock}
            getInsertIndex={getInsertIndex}
            quickAddCharacter={quickAddCharacter}
            onRestoreSnapshot={(snapshotBlocks) => {
              setBlocks(snapshotBlocks);
              setSaveStatus('unsaved');
              showToast('تم استعادة النسخة، اضغط حفظ لتأكيد التغييرات', 'info', 3000);
            }}
          />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pt-1.5 pb-16 relative">
            {activeTab === 'metadata' ? (
              <SceneMetadataForm 
                scene={scene} 
                onSceneChange={handleSceneChange} 
                locations={locations}
                characters={characters}
                episodes={episodes}
                onEditLocation={(id) => {
                  setEditingLocationId(id);
                  setShowLocationModal(true);
                }}
                onAddLocation={() => {
                  setEditingLocationId(null);
                  setShowLocationModal(true);
                }}
              />
            ) : activeTab === 'tasks' ? (
              <SceneTasksBoard sceneId={id} />
            ) : (
              <div className="flex flex-col min-h-full relative">
                <SmartEditor 
                  key={scene.id || id}
                  blocks={blocks}
                  setBlocks={setBlocks}
                  onAddBlock={addBlock}
                  onUpdateBlock={debouncedUpdateBlock}
                  onDeleteBlock={deleteBlock}
                  onReorderBlocks={handleReorderBlocks}
                  characters={characters}
                  onShowCharModal={() => setShowCharModal(true)}
                  onOpenReminders={() => setShowRemindersModal(true)}
                  onQuickAddCharacter={quickAddCharacter}
                  scene={scene}
                  onSceneChange={handleSceneChange}
                  activeBlockId={activeBlockId}
                  setActiveBlockId={setActiveBlockId}
                />
              </div>
            )}
          </div>
        </div>

      </div>

      <SceneEditorModals 
        showCharModal={showCharModal}
        setShowCharModal={setShowCharModal}
        setSelectedCharId={setSelectedCharId}
        showLocationModal={showLocationModal}
        setShowLocationModal={setShowLocationModal}
        editingLocationId={editingLocationId}
        locations={locations}
        scene={scene}
        setScene={setScene}
        setSaveStatus={setSaveStatus}
        showRemindersModal={showRemindersModal}
        setShowRemindersModal={setShowRemindersModal}
        sceneId={id}
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
        onExportWithSettings={onExportWithSettings}
        activeScenario={activeScenario}
      />
    </div>
  )
}

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';
import { useScenarioQuery } from '../../hooks/queries/useScenarios';
import { usePageNumberingQuery } from '../../hooks/queries/usePageNumbering';
import { useCharactersQuery, useLocationsQuery, useEpisodesQuery } from '../../hooks/queries';
import { sceneApi as sceneRepo } from '../../hooks/queries/useScenes';
import { blockApi as blockRepo } from '../../hooks/queries/useBlocks';

export interface UseSceneEditorStateOptions {
  id?: string;
  showToast: (message: string, type: 'info' | 'error' | 'success') => void;
}

export function useSceneEditorState({ id, showToast }: UseSceneEditorStateOptions) {
  const navigate = useNavigate();
  const isNew = !id;
  
  const { activeScenarioId, setActiveScenarioId } = useUIStore();
  const { data: activeScenario } = useScenarioQuery(activeScenarioId);
  const { data: pageNumbering = [] } = usePageNumberingQuery(activeScenarioId);
  
  const { data: characters = [] } = useCharactersQuery(activeScenarioId);
  const { data: locations = [] } = useLocationsQuery(activeScenarioId);
  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId);

  const [scene, setScene] = useState<any>({
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
  });
  
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [allScenes, setAllScenes] = useState<any[]>([]);

  const fetchScene = async () => {
    if (!id) return;
    try {
      const data = await sceneRepo.getById(id);
      if (data) {
        if (data.scenario_id && data.scenario_id !== activeScenarioId) {
          setActiveScenarioId(data.scenario_id);
        }
        
        setScene(data);
        const blks = await blockRepo.getBySceneId(id);
        const sorted = (blks || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        setBlocks(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch scene:', err);
      showToast('خطأ في تحميل المشهد', 'error');
    } finally {
      setLoaded(true);
    }
  };

  const fetchAllScenes = async () => {
    if (!activeScenarioId) return;
    try {
      const scenesData = await sceneRepo.getByScenarioId(activeScenarioId);
      setAllScenes(scenesData || []);
    } catch (e) {
      console.error('Failed to fetch all scenes', e);
    }
  };

  useEffect(() => {
    if (id === 'undefined') {
      navigate('/scenarios');
      return;
    }
    
    setLoaded(false);
    
    if (!isNew && id) {
       fetchScene();
    } else if (isNew) {
       setLoaded(true);
    }
    
    if (activeScenarioId) {
      fetchAllScenes();
    }
  }, [id, activeScenarioId]);

  const sceneStartPage = useMemo(() => {
    if (!id || !pageNumbering) return 1;
    const record = pageNumbering.find((r: any) => r.item_id === id && r.item_type === 'SCENE');
    return record ? record.start_page : 1;
  }, [id, pageNumbering]);

  return {
    isNew,
    activeScenarioId,
    activeScenario,
    sceneStartPage,
    characters,
    locations,
    episodes,
    scene,
    setScene,
    blocks,
    setBlocks,
    loaded,
    allScenes
  };
}

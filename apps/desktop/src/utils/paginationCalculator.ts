import { generateId } from '@scriptflow/core';
import { 
  PageNumberingRepository, 
  SceneRepository, 
  EpisodeRepository, 
  ScenarioRepository, 
  ScriptBlockRepository,
  CharacterRepository
} from '@scriptflow/database';
import { groupBlocksByPage, expandBlocksToLayoutNodes, calculateSceneEighths } from '../components/editor/TextMeasurementEngine';

const pageNumberingRepo = new PageNumberingRepository();
const sceneRepo = new SceneRepository();
const episodeRepo = new EpisodeRepository();
const scenarioRepo = new ScenarioRepository();
const blockRepo = new ScriptBlockRepository();
const characterRepo = new CharacterRepository();

export async function updateScenarioPageNumbering(scenarioId: string): Promise<void> {
  if (!scenarioId) return;

  // 1. Fetch scenario settings
  const scenario = await scenarioRepo.findById(scenarioId);
  if (!scenario) return;

  const includeMasterCover = scenario.include_master_cover !== undefined ? scenario.include_master_cover : 1;
  const includeEpisodeCovers = scenario.include_episode_covers !== undefined ? scenario.include_episode_covers : 1;
  const includeSceneCovers = scenario.include_scene_covers !== undefined ? scenario.include_scene_covers : 0;

  // 2. Fetch characters, episodes, and sorted scenes
  const characters = await characterRepo.getByScenarioId(scenarioId);
  const episodes = await episodeRepo.getByScenarioId(scenarioId);
  const rawScenes = await sceneRepo.getByScenarioId(scenarioId);
  
  // Sort episodes by episode_number
  const sortedEpisodes = [...episodes].sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));

  // Sort scenes: first by episode_number then by scene_number
  const sortedScenes = [...rawScenes].sort((a, b) => {
    if (a.episode_id !== b.episode_id) {
      if (!a.episode_id) return 1;
      if (!b.episode_id) return -1;
      
      const epA = episodes.find(e => e.id === a.episode_id);
      const epB = episodes.find(e => e.id === b.episode_id);
      const numA = epA?.episode_number ?? 9999;
      const numB = epB?.episode_number ?? 9999;
      
      if (numA !== numB) return numA - numB;
    }
    return (a.scene_number || 0) - (b.scene_number || 0);
  });

  // 3. Batch fetch all blocks for all scenes in chunks to prevent SQLite IPC & Bind limit overhead
  const allSceneIds = sortedScenes.map(s => s.id);
  const CHUNK_SIZE = 500;
  const allBlocks: any[] = [];
  
  for (let i = 0; i < allSceneIds.length; i += CHUNK_SIZE) {
    const chunk = allSceneIds.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 0) {
      const fetched = await blockRepo.getBlocksForScenes(chunk) as any[];
      allBlocks.push(...fetched);
    }
  }

  const blocksByScene: Record<string, any[]> = {};
  allBlocks.forEach((b: any) => {
    if (!blocksByScene[b.scene_id]) blocksByScene[b.scene_id] = [];
    blocksByScene[b.scene_id].push(b);
  });

  const updatePromises = [];
  
  for (const s of sortedScenes) {
    const sceneBlocks = blocksByScene[s.id] || [];
    const mappedBlocks = sceneBlocks.map((b: any) => ({
      id: b.id,
      type: b.type,
      content: b.content,
      character_id: b.character_id,
      metadata: b.metadata
    }));
    const layoutNodes = expandBlocksToLayoutNodes(mappedBlocks, characters);
    const { totalPages } = groupBlocksByPage(layoutNodes, { hasSceneHeader: true });
    const calculatedEighths = calculateSceneEighths(mappedBlocks, characters);
    const freshPageCount = totalPages || 1;

    // Only write to DB if values actually changed
    if (s.page_count !== freshPageCount || s.page_eighths !== calculatedEighths) {
      updatePromises.push(sceneRepo.update(s.id, { 
        page_count: freshPageCount,
        page_eighths: calculatedEighths 
      } as any));
    }
    s.page_count = freshPageCount;
    s.page_eighths = calculatedEighths;
  }
  
  await Promise.all(updatePromises);

  // 4. Group and build page_numbering records
  const records: any[] = [];
  let currentPage = 1;
  let sortOrder = 0;

  // Master Cover Page
  if (includeMasterCover === 1) {
    records.push({
      id: generateId('pgn') || `pgn_${Math.random().toString(36).substr(2, 9)}`,
      scenario_id: scenarioId,
      item_id: scenarioId,
      item_type: 'MASTER_COVER',
      page_count: 1,
      start_page: currentPage,
      sort_order: sortOrder++
    });
    currentPage += 1;
  }

  // Group scenes by episode
  const scenesByEpisode: Record<string, typeof sortedScenes> = {};
  const unassignedScenes: typeof sortedScenes = [];

  sortedScenes.forEach(s => {
    if (s.episode_id) {
      if (!scenesByEpisode[s.episode_id]) {
        scenesByEpisode[s.episode_id] = [];
      }
      scenesByEpisode[s.episode_id].push(s);
    } else {
      unassignedScenes.push(s);
    }
  });

  // Episodes
  for (const ep of sortedEpisodes) {
    const epScenes = scenesByEpisode[ep.id] || [];
    if (epScenes.length === 0) continue; // Skip empty episodes

    // Episode Cover Page
    if (includeEpisodeCovers === 1) {
      records.push({
        id: generateId('pgn') || `pgn_${Math.random().toString(36).substr(2, 9)}`,
        scenario_id: scenarioId,
        item_id: ep.id,
        item_type: 'EPISODE_COVER',
        page_count: 1,
        start_page: currentPage,
        sort_order: sortOrder++
      });
      currentPage += 1;
    }

    // Episode Scenes
    for (const s of epScenes) {
      if (includeSceneCovers === 1) {
        records.push({
          id: generateId('pgn') || `pgn_${Math.random().toString(36).substr(2, 9)}`,
          scenario_id: scenarioId,
          item_id: s.id,
          item_type: 'SCENE_COVER',
          page_count: 1,
          start_page: currentPage,
          sort_order: sortOrder++
        });
        currentPage += 1;
      }

      records.push({
        id: generateId('pgn') || `pgn_${Math.random().toString(36).substr(2, 9)}`,
        scenario_id: scenarioId,
        item_id: s.id,
        item_type: 'SCENE',
        page_count: s.page_count || 1,
        start_page: currentPage,
        sort_order: sortOrder++
      });
      currentPage += s.page_count || 1;
    }
  }

  // Unassigned Scenes
  for (const s of unassignedScenes) {
    if (includeSceneCovers === 1) {
      records.push({
        id: generateId('pgn') || `pgn_${Math.random().toString(36).substr(2, 9)}`,
        scenario_id: scenarioId,
        item_id: s.id,
        item_type: 'SCENE_COVER',
        page_count: 1,
        start_page: currentPage,
        sort_order: sortOrder++
      });
      currentPage += 1;
    }

    records.push({
      id: generateId('pgn') || `pgn_${Math.random().toString(36).substr(2, 9)}`,
      scenario_id: scenarioId,
      item_id: s.id,
      item_type: 'SCENE',
      page_count: s.page_count || 1,
      start_page: currentPage,
      sort_order: sortOrder++
    });
    currentPage += s.page_count || 1;
  }

  // 5. Save to database
  await pageNumberingRepo.savePageNumbering(scenarioId, records);
}

/**
 * Pure helper function to calculate page numbers array from scene list.
 */
export function calculatePageNumbers(scenes: any[] = [], episodes: any[] = []): any[] {
  if (!scenes || scenes.length === 0) return [];
  let currentPage = 1;
  return scenes.map((s, idx) => {
    const pageCount = s.page_count || 1;
    const startPage = currentPage;
    currentPage += pageCount;
    return {
      id: s.id,
      item_id: s.id,
      item_type: 'SCENE',
      start_page: startPage,
      page_count: pageCount,
      sort_order: idx
    };
  });
}

/**
 * Pure helper function to calculate total page count from scene list.
 */
export function calculateTotalPages(scenes: any[] = [], episodes: any[] = []): number {
  if (!scenes || scenes.length === 0) return 0;
  return scenes.reduce((sum, s) => sum + (s.page_count || 1), 0);
}


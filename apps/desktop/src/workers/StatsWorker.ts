import * as Comlink from 'comlink';

export interface StatsPayload {
  scenes: any[];
  characters: any[];
  locations: any[];
  blocks: any[];
}

export interface CharacterStat {
  name: string;
  appearances: number;
  linesOfDialogue: number;
}

export interface LocationStat {
  name: string;
  sceneCount: number;
}

export interface StatsResult {
  success: boolean;
  executionTimeMs: number;
  characterStats: CharacterStat[];
  locationStats: LocationStat[];
  error?: string;
}

export const StatsWorker = {
  /**
   * Heavy analytics calculation (Map/Reduce) for script screenplay.
   */
  async calculateGlobalStats(payload: StatsPayload): Promise<StatsResult> {
    const { scenes = [], characters = [], locations = [], blocks = [] } = payload || {};
    
    console.log('[StatsWorker] Starting heavy analytics computation...');
    const startTime = performance.now();

    // 1. Character Screen Time / Appearances
    const characterStats: Record<string, CharacterStat> = {};
    characters.forEach(c => {
      if (c && c.id) {
        characterStats[c.id] = { name: c.name || 'غير مسمى', appearances: 0, linesOfDialogue: 0 };
      }
    });

    // 2. Blocks Analysis
    blocks.forEach(block => {
       if (block && block.type === 'DIALOGUE' && block.character_id && characterStats[block.character_id]) {
         characterStats[block.character_id].linesOfDialogue++;
       }
    });

    // 3. Locations Analysis & Presence
    const locationStats: Record<string, LocationStat> = {};
    locations.forEach(l => {
      if (l && l.id) {
        locationStats[l.id] = { name: l.name || 'موقع غير معروف', sceneCount: 0 };
      }
    });

    scenes.forEach(scene => {
       if (!scene) return;
       // Add location presence
       if (scene.location_id && locationStats[scene.location_id]) {
         locationStats[scene.location_id].sceneCount++;
       }
       
       // Add character presence in scene
       try {
         const presentChars: string[] = typeof scene.present_characters === 'string'
           ? JSON.parse(scene.present_characters || '[]')
           : (Array.isArray(scene.present_characters) ? scene.present_characters : []);
         
         presentChars.forEach(charId => {
           if (characterStats[charId]) {
             characterStats[charId].appearances++;
           }
         });
       } catch (e) {
         // Ignore corrupt scenes
       }
    });

    const endTime = performance.now();
    console.log(`[StatsWorker] Analytics completed in ${(endTime - startTime).toFixed(2)}ms`);

    return {
      success: true,
      executionTimeMs: (endTime - startTime),
      characterStats: Object.values(characterStats).sort((a, b) => b.appearances - a.appearances),
      locationStats: Object.values(locationStats).sort((a, b) => b.sceneCount - a.sceneCount)
    };
  }
};

export type IStatsWorker = typeof StatsWorker;

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  Comlink.expose(StatsWorker);
}

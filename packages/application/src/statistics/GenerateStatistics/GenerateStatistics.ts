import { dbSelect } from '@scriptflow/database';

export class GenerateStatistics {
  /**
   * Generates overall stats for a scenario
   */
  public async execute(scenarioId: string, episodeId?: string): Promise<any> {
    try {
      // 1. Basic counts
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL ${episodeId && episodeId !== 'ALL' ? `AND episode_id = '${episodeId}'` : ''}) as sceneCount,
          (SELECT COUNT(*) FROM characters WHERE scenario_id = $1 AND deleted_at IS NULL) as characterCount,
          (SELECT COUNT(*) FROM locations WHERE scenario_id = $1 AND deleted_at IS NULL) as locationCount,
          (SELECT COUNT(*) FROM crew WHERE scenario_id = $1 AND deleted_at IS NULL) as crewCount
      `;
      const results = await dbSelect<any>(statsQuery, [scenarioId]);
      const row = results[0] || { sceneCount: 0, characterCount: 0, locationCount: 0, crewCount: 0 };

      // 2. Fetch all active scenes
      let scenesQuery = `
        SELECT id, scene_number, title, time_of_day, location_type 
        FROM scenes 
        WHERE scenario_id = $1 AND deleted_at IS NULL 
      `;
      const queryParams: any[] = [scenarioId];
      if (episodeId && episodeId !== 'ALL') {
        scenesQuery += ` AND episode_id = $2 `;
        queryParams.push(episodeId);
      }
      scenesQuery += ` ORDER BY scene_number ASC`;
      const scenes = await dbSelect<any>(scenesQuery, queryParams);

      // 3. Fetch all script blocks associated with active scenes
      let blocksQuery = `
        SELECT sb.scene_id, sb.type, sb.content, sb.character_id, sb.metadata 
        FROM script_blocks sb
        JOIN scenes s ON sb.scene_id = s.id
        WHERE s.scenario_id = $1 AND s.deleted_at IS NULL
      `;
      if (episodeId && episodeId !== 'ALL') {
        blocksQuery += ` AND s.episode_id = $2`;
      }
      const blocks = await dbSelect<any>(blocksQuery, queryParams);

      // 4. Fetch all active characters
      const chars = await dbSelect<any>(`
        SELECT id, name 
        FROM characters 
        WHERE scenario_id = $1 AND deleted_at IS NULL
      `, [scenarioId]);

      const charMap = new Map<string, string>();
      chars.forEach((c: any) => charMap.set(c.id, c.name));

      // Group blocks by scene
      const blocksByScene: Record<string, any[]> = {};
      blocks.forEach((b: any) => {
        if (!blocksByScene[b.scene_id]) {
          blocksByScene[b.scene_id] = [];
        }
        blocksByScene[b.scene_id].push(b);
      });

      // 5. Compute Rhythm DNA, Word counts, Pacing, and Complexity
      let totalDialogues = 0;
      let totalDialogueWords = 0;
      let totalActionWords = 0;
      const rhythmDNA: any[] = [];
      
      scenes.forEach((s: any) => {
        const sceneBlocks = blocksByScene[s.id] || [];
        let dialogueBlocks = 0;
        let productionBlocks = 0;
        let wordCount = 0;
        let sceneDialogueWords = 0;
        let sceneActionWords = 0;
        const speakingCharacters = new Set<string>();

        sceneBlocks.forEach((b: any) => {
          const type = b.type || '';
          const content = b.content || '';
          const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
          wordCount += words;

          if (type === 'DIALOGUE' || type === 'PARENTHETICAL') {
            dialogueBlocks++;
            totalDialogues++;
            sceneDialogueWords += words;
            totalDialogueWords += words;
            if (b.character_id && charMap.has(b.character_id)) {
              speakingCharacters.add(b.character_id);
            }
          } else {
            sceneActionWords += words;
            totalActionWords += words;
            if (['CAMERA', 'AUDIO', 'TRANSITION', 'ACTION'].includes(type)) {
              productionBlocks++;
            }
          }
        });

        // Estimated duration: 150 words per minute -> 2.5 words per second
        const durationSeconds = Math.round(wordCount * 0.4);

        // Production Complexity score calculation:
        // Speaks = 5 points per character, Actions/Cams = 3 points, Ext Nights are very hard = 25 points, etc.
        let complexityPoints = speakingCharacters.size * 5 + productionBlocks * 3;
        const isExt = (s.location_type || 'INT').toUpperCase().includes('EXT');
        const tod = (s.time_of_day || '').toUpperCase();
        const isNight = tod.includes('NIGHT') || tod.includes('ليل') || tod.includes('DARK');

        if (isExt && isNight) complexityPoints += 25;
        else if (isExt) complexityPoints += 15;
        else if (isNight) complexityPoints += 10;
        else complexityPoints += 5; // INT DAY

        let complexityLevel = 'بسيط';
        if (complexityPoints > 35) complexityLevel = 'معقد';
        else if (complexityPoints > 18) complexityLevel = 'متوسط';

        // Pacing Style: Dialogue vs Action ratio
        let pacingStyle = 'متوازن';
        if (wordCount > 0) {
          const dialoguePct = (sceneDialogueWords / wordCount) * 100;
          if (dialoguePct > 65) pacingStyle = 'حواري';
          else if (dialoguePct < 30) pacingStyle = 'حركي';
        }

        rhythmDNA.push({
          scene_number: s.scene_number,
          title: s.title || `مشهد ${s.scene_number}`,
          dialogues: dialogueBlocks,
          characters: speakingCharacters.size,
          production: productionBlocks,
          words: wordCount,
          dialogueWords: sceneDialogueWords,
          actionWords: sceneActionWords,
          durationSeconds,
          complexityPoints,
          complexityLevel,
          pacingStyle
        });
      });

      // 6. Compute Character dialogue and word stats
      const charDialogues: Record<string, number> = {};
      const charWords: Record<string, number> = {};
      chars.forEach((c: any) => {
        charDialogues[c.name] = 0;
        charWords[c.name] = 0;
      });

      blocks.forEach((b: any) => {
        const type = b.type || '';
        if ((type === 'DIALOGUE' || type === 'PARENTHETICAL') && b.character_id) {
          const name = charMap.get(b.character_id);
          if (name) {
            charDialogues[name] = (charDialogues[name] || 0) + 1;
            const words = b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0;
            charWords[name] = (charWords[name] || 0) + words;
          }
        }
      });

      const characterStats = Object.entries(charDialogues)
        .map(([name, count]) => ({ 
          name, 
          dialogueCount: count,
          wordCount: charWords[name] || 0
        }))
        .sort((a, b) => b.dialogueCount - a.dialogueCount);

      // 7. Compute Location type distribution
      const locCounts = { 'INT': 0, 'EXT': 0, 'INT/EXT': 0 };
      scenes.forEach((s: any) => {
        const type = (s.location_type || 'INT').toUpperCase();
        if (type.includes('INT') && type.includes('EXT')) {
          locCounts['INT/EXT']++;
        } else if (type.includes('EXT')) {
          locCounts['EXT']++;
        } else {
          locCounts['INT']++;
        }
      });
      const locationStats = Object.entries(locCounts).map(([type, count]) => ({
        location_type: type,
        count
      }));

      // 8. Compute Tone spectrum distribution
      const toneCounts: Record<string, number> = {};
      let totalDialoguesWithTone = 0;

      blocks.forEach((b: any) => {
        const type = b.type || '';
        if (type === 'DIALOGUE' && b.metadata) {
          try {
            const meta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata;
            if (meta && meta.tone && meta.tone.trim()) {
              const toneName = meta.tone.trim();
              toneCounts[toneName] = (toneCounts[toneName] || 0) + 1;
              totalDialoguesWithTone++;
            }
          } catch (e) {
            // ignore parse error
          }
        }
      });

      const toneDistribution = Object.entries(toneCounts)
        .map(([tone, count]) => ({
          tone,
          count,
          percentage: totalDialoguesWithTone > 0 ? Math.round((count / totalDialoguesWithTone) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      // 9. Compute Day/Night Ratio
      let day = 0;
      let night = 0;
      scenes.forEach((s: any) => {
        const tod = (s.time_of_day || '').toUpperCase();
        if (tod.includes('NIGHT') || tod.includes('ليل') || tod.includes('DARK')) {
          night++;
        } else {
          day++;
        }
      });
      const dayNightRatio = { day, night };

      // 10. Compute Interaction Matrix (Pairs speaking in same scenes)
      const pairs: Record<string, number> = {};
      scenes.forEach((s: any) => {
        const sceneBlocks = blocksByScene[s.id] || [];
        const activeCharsInScene = new Set<string>();
        
        sceneBlocks.forEach((b: any) => {
          if ((b.type === 'DIALOGUE' || b.type === 'PARENTHETICAL') && b.character_id) {
            const name = charMap.get(b.character_id);
            if (name) {
              activeCharsInScene.add(name);
            }
          }
        });

        const charArray = Array.from(activeCharsInScene);
        for (let i = 0; i < charArray.length; i++) {
          for (let j = i + 1; j < charArray.length; j++) {
            const key = [charArray[i], charArray[j]].sort().join('::');
            pairs[key] = (pairs[key] || 0) + 1;
          }
        }
      });

      const interactionMatrix = Object.entries(pairs)
        .map(([key, count]) => {
          const [char1_name, char2_name] = key.split('::');
          return { char1_name, char2_name, shared_scenes: count };
        })
        .sort((a, b) => b.shared_scenes - a.shared_scenes)
        .slice(0, 8); // top 8 pairings

      // 11. Compute Production Department Workload
      let tasks: any[] = [];
      try {
        tasks = await dbSelect<any>(`
          SELECT department 
          FROM production_tasks 
          WHERE scenario_id = $1
        `, [scenarioId]);
      } catch (e) {
        console.warn("Table production_tasks might not exist yet or failed to query:", e);
      }

      const depCounts: Record<string, number> = {};
      tasks.forEach((t: any) => {
        const dep = t.department || 'أخرى';
        depCounts[dep] = (depCounts[dep] || 0) + 1;
      });

      const departmentWorkload = Object.entries(depCounts)
        .map(([department, taskCount]) => ({ department, taskCount }))
        .sort((a, b) => b.taskCount - a.taskCount);

      // Compute general complexity levels
      const simpleScenesCount = rhythmDNA.filter(s => s.complexityLevel === 'بسيط').length;
      const moderateScenesCount = rhythmDNA.filter(s => s.complexityLevel === 'متوسط').length;
      const complexScenesCount = rhythmDNA.filter(s => s.complexityLevel === 'معقد').length;

      const totalWordsCalculated = totalDialogueWords + totalActionWords;

      return {
        sceneCount: row.sceneCount,
        characterCount: row.characterCount,
        locationCount: row.locationCount,
        crewCount: row.crewCount,
        scenes: row.sceneCount,
        characters: row.characterCount,
        locations: row.locationCount,
        crew: row.crewCount,
        totalScenes: row.sceneCount,
        totalCharacters: row.characterCount,
        totalLocations: row.locationCount,
        totalRealLocations: row.locationCount,
        totalCrew: row.crewCount,
        totalDialogues,
        isProjectSpecific: true,
        rhythmDNA,
        characterStats,
        locationStats,
        toneDistribution,
        dayNightRatio,
        interactionMatrix,
        departmentWorkload,
        totalDialogueWords,
        totalActionWords,
        dialogueToActionRatio: {
          dialoguePercentage: totalWordsCalculated > 0 ? Math.round((totalDialogueWords / totalWordsCalculated) * 100) : 0,
          actionPercentage: totalWordsCalculated > 0 ? Math.round((totalActionWords / totalWordsCalculated) * 100) : 0
        },
        complexitySummary: {
          simple: simpleScenesCount,
          moderate: moderateScenesCount,
          complex: complexScenesCount
        }
      };
    } catch (err: any) {
      console.error("Fatal error generating statistics:", err);
      return {
        isProjectSpecific: true,
        hasError: true,
        errorMessage: err?.message || String(err),
        errorStack: err?.stack || '',
        sceneCount: 0,
        characterCount: 0,
        locationCount: 0,
        crewCount: 0,
        scenes: 0,
        characters: 0,
        locations: 0,
        crew: 0,
        totalScenes: 0,
        totalCharacters: 0,
        totalLocations: 0,
        totalRealLocations: 0,
        totalCrew: 0,
        totalDialogues: 0,
        rhythmDNA: [],
        characterStats: [],
        locationStats: [],
        toneDistribution: [],
        dayNightRatio: { day: 0, night: 0 },
        interactionMatrix: [],
        departmentWorkload: [],
        totalDialogueWords: 0,
        totalActionWords: 0,
        dialogueToActionRatio: { dialoguePercentage: 0, actionPercentage: 0 },
        complexitySummary: { simple: 0, moderate: 0, complex: 0 }
      };
    }
  }

  /**
   * Generates overall stats across ALL scenarios
   */
  public async executeGlobalStats(): Promise<any> {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM scenes WHERE deleted_at IS NULL) as sceneCount,
        (SELECT COUNT(*) FROM characters WHERE deleted_at IS NULL) as characterCount,
        (SELECT COUNT(*) FROM locations WHERE deleted_at IS NULL) as locationCount,
        (SELECT COUNT(*) FROM crew WHERE deleted_at IS NULL) as crewCount
    `;
    const results = await dbSelect<any>(statsQuery);
    const row = results[0] || { sceneCount: 0, characterCount: 0, locationCount: 0, crewCount: 0 };
    return {
      sceneCount: row.sceneCount,
      characterCount: row.characterCount,
      locationCount: row.locationCount,
      crewCount: row.crewCount,
      scenes: row.sceneCount,
      characters: row.characterCount,
      locations: row.locationCount,
      crew: row.crewCount
    };
  }

  /**
   * Generates character specific stats
   */
  public async executeCharacterStats(scenarioId: string) {
    const totalRes = await dbSelect<{count: number}>("SELECT COUNT(*) as count FROM script_blocks WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL) AND type IN ('DIALOGUE', 'PARENTHETICAL')", [scenarioId]);
    const totalDialogues = totalRes[0]?.count || 0;

    const stats = await dbSelect<any>(`
      SELECT 
        c.id as character_id,
        COUNT(CASE WHEN b.type IN ('DIALOGUE', 'PARENTHETICAL') THEN 1 END) as dialogue_count,
        COUNT(DISTINCT b.scene_id) as scene_count
      FROM characters c
      LEFT JOIN script_blocks b ON c.id = b.character_id
      WHERE c.scenario_id = $1 AND c.deleted_at IS NULL
      GROUP BY c.id
    `, [scenarioId]);

    const map: Record<string, { dialogueCount: number, wordCount: number, sceneCount: number, appearancePercent: number }> = {};
    if (stats && stats.length > 0) {
      stats.forEach((stat) => {
        const percent = totalDialogues > 0 ? Math.round((stat.dialogue_count / totalDialogues) * 100) : 0;
        map[stat.character_id] = {
          dialogueCount: stat.dialogue_count || 0,
          wordCount: 0,
          sceneCount: stat.scene_count || 0,
          appearancePercent: percent
        };
      });
    }
    return map;
  }
}

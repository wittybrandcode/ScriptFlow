import { useMutation } from '@tanstack/react-query';
import { 
  ScenarioRepository, 
  SceneRepository, 
  ScriptBlockRepository, 
  CharacterRepository, 
  LocationRepository, 
  EpisodeRepository, 
  CrewRepository 
} from '@scriptflow/database';
import { updateScenarioPageNumbering } from '../../utils/paginationCalculator';

const scenarioRepo = new ScenarioRepository();
const sceneRepo = new SceneRepository();
const blockRepo = new ScriptBlockRepository();
const charRepo = new CharacterRepository();
const locRepo = new LocationRepository();
const epRepo = new EpisodeRepository();
const crewRepo = new CrewRepository();

/**
 * هذا الـ Hook يقوم بجمع بيانات المشروع من المستودعات مباشرة
 * ثم يستدعي استراتيجية التصدير بعد إغلاق كل عمليات قاعدة البيانات.
 * 
 * السبب: ExportProject الأصلي يستخدم withTransaction التي تبقى مفتوحة
 * أثناء window.print()، مما يسبب خطأ "cannot rollback - no transaction is active".
 */
export function useExportProjectMutation() {
  return useMutation({
    mutationFn: async ({ scenarioId, strategy }) => {
      const opts = strategy.options || {};
      console.log('[useExport] Starting export mutation for scenario:', scenarioId);
      
      // Update scenario cover options asynchronously in background without blocking export execution
      if (opts.includeMasterCover !== undefined || opts.includeEpisodeCovers !== undefined || opts.includeSceneCovers !== undefined) {
        scenarioRepo.update(scenarioId, {
          include_master_cover: opts.includeMasterCover ? 1 : 0,
          include_episode_covers: opts.includeEpisodeCovers ? 1 : 0,
          include_scene_covers: opts.includeSceneCovers ? 1 : 0,
        }).catch(e => console.warn('[useExport] Cover prefs update non-critical warning:', e));
        
        // Recalculate page numbering asynchronously in background
        updateScenarioPageNumbering(scenarioId).catch(e => console.warn('[useExport] Background pagination update warning:', e));
      }

      // Step 1: Gather all data from repositories (no transaction needed for reads)
      console.log('[useExport] Step 1: Gathering scenario data...');
      const scenario = await scenarioRepo.findById(scenarioId);
      if (!scenario) {
        throw new Error(`Scenario with ID ${scenarioId} not found.`);
      }

      const scenes = await sceneRepo.getByScenarioId(scenarioId);
      
      const allSceneIds = scenes.map(s => s.id);
      const allBlocks = allSceneIds.length > 0 ? await blockRepo.getBlocksForScenes(allSceneIds) : [];
      
      const blocksByScene = {};
      allBlocks.forEach(b => {
        if (!blocksByScene[b.scene_id]) blocksByScene[b.scene_id] = [];
        blocksByScene[b.scene_id].push(b);
      });

      const scenesWithBlocks = scenes.map(scene => ({
        ...scene,
        blocks: blocksByScene[scene.id] || []
      }));

      const characters = await charRepo.getByScenarioId(scenarioId);
      const episodes = await epRepo.getByScenarioId(scenarioId);
      
      // We also need shoot_days for the Call Sheet Strategy
      let shoot_days = [];
      try {
        const ShootDayRepository = (await import('@scriptflow/database')).ShootDayRepository;
        const shootDayRepo = new ShootDayRepository();
        shoot_days = await shootDayRepo.getByScenarioId(scenarioId);
      } catch (sdErr) {
        console.warn('[useExport] Shoot days load warning:', sdErr);
      }

      let pageNumbering = [];
      try {
        const PageNumberingRepository = (await import('@scriptflow/database')).PageNumberingRepository;
        const pageNumberingRepo = new PageNumberingRepository();
        pageNumbering = await pageNumberingRepo.getByScenarioId(scenarioId);
      } catch (pnErr) {
        console.warn('[useExport] Page numbering load warning:', pnErr);
      }

      // Fallback: If pageNumbering is empty, calculate dynamically in-memory immediately
      if (!pageNumbering || pageNumbering.length === 0) {
        const { calculatePageNumbers } = await import('../../utils/paginationCalculator');
        pageNumbering = calculatePageNumbers(scenesWithBlocks, episodes);
      }

      const payload = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        scenario,
        episodes,
        scenes: scenesWithBlocks,
        characters,
        shoot_days,
        pageNumbering,
      };

      console.log(`[useExport] Step 2: Data loaded (${scenesWithBlocks.length} scenes, ${allBlocks.length} blocks). Executing strategy...`);

      // Step 2: All DB work is done. Now call the strategy (which may open print dialog)
      const result = await strategy.export(payload);
      console.log('[useExport] Step 3: Strategy export completed successfully.');
      return result;
    }
  });
}

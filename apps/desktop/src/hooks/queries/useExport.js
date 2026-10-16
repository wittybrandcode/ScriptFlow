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
      
      // Update scenario cover options if they are explicitly passed
      if (opts.includeMasterCover !== undefined || opts.includeEpisodeCovers !== undefined || opts.includeSceneCovers !== undefined) {
        await scenarioRepo.update(scenarioId, {
          include_master_cover: opts.includeMasterCover ? 1 : 0,
          include_episode_covers: opts.includeEpisodeCovers ? 1 : 0,
          include_scene_covers: opts.includeSceneCovers ? 1 : 0,
        });
        
        // Recalculate page numbering
        await updateScenarioPageNumbering(scenarioId);
      }

      // Step 1: Gather all data from repositories (no transaction needed for reads)
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
      const ShootDayRepository = (await import('@scriptflow/database')).ShootDayRepository;
      const shootDayRepo = new ShootDayRepository();
      const shoot_days = await shootDayRepo.getByScenarioId(scenarioId);

      const PageNumberingRepository = (await import('@scriptflow/database')).PageNumberingRepository;
      const pageNumberingRepo = new PageNumberingRepository();
      const pageNumbering = await pageNumberingRepo.getByScenarioId(scenarioId);

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

      // Step 2: All DB work is done. Now call the strategy (which may open print dialog)
      const result = await strategy.export(payload);
      return result;
    }
  });
}

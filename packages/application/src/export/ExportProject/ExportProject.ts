import { Outcome, DomainError, ErrorCode } from '@scriptflow/core';
import { 
  SceneRepository, 
  ScriptBlockRepository, 
  ScenarioRepository, 
  CharacterRepository, 
  LocationRepository, 
  EpisodeRepository, 
  CrewRepository,
  SceneCharacterRepository,
  CharacterRelationshipRepository,
  LocationImageRepository,
  ShootDayRepository,
  ProductionTaskRepository,
  CrewAssignmentRepository,
  withTransaction,
  TransactionContext
} from '@scriptflow/database';
import { ExportStrategy } from './Types.js';

export class ExportProject {
  constructor(
    private scenarioRepo: ScenarioRepository,
    private sceneRepo: SceneRepository,
    private blockRepo: ScriptBlockRepository,
    private charRepo: CharacterRepository,
    private locRepo: LocationRepository,
    private epRepo: EpisodeRepository,
    private crewRepo: CrewRepository,
    private sceneCharRepo: SceneCharacterRepository,
    private charRelRepo: CharacterRelationshipRepository,
    private locImgRepo: LocationImageRepository,
    private shootDayRepo: ShootDayRepository,
    private prodTaskRepo: ProductionTaskRepository,
    private crewAssignRepo: CrewAssignmentRepository
  ) {}

  public async execute(scenarioId: string, strategy: ExportStrategy): Promise<Outcome<any>> {
    try {
      return await withTransaction(async (tx: TransactionContext) => {
        const scenario = await this.scenarioRepo.findById(scenarioId, tx);
        if (!scenario) {
          return Outcome.fail(new DomainError({
            code: ErrorCode.VALIDATION,
            message: `Scenario with ID ${scenarioId} not found.`
          }));
        }

        const scenes = await this.sceneRepo.getByScenarioId(scenarioId, tx);
        
        const scenesWithBlocks = await Promise.all(scenes.map(async (scene) => {
          try {
            const blocks = await this.blockRepo.getSceneBlocks(scene.id);
            return { ...scene, blocks };
          } catch (e) {
            console.warn(`Failed to fetch blocks for scene ${scene.id}`, e);
            return { ...scene, blocks: [] };
          }
        }));

        const characters = await this.charRepo.getByScenarioId(scenarioId, tx);
        const locations = await this.locRepo.getByScenarioId(scenarioId, tx);
        const episodes = await this.epRepo.getByScenarioId(scenarioId, tx);
        const crew = await this.crewRepo.getByScenarioId(scenarioId, tx);
        const scene_characters = await this.sceneCharRepo.getByScenarioId(scenarioId);
        const character_relationships = await this.charRelRepo.getByScenarioId(scenarioId, tx);
        const location_images = await this.locImgRepo.getByScenarioId(scenarioId);
        const shoot_days = await this.shootDayRepo.getByScenarioId(scenarioId, tx);
        const production_tasks = await this.prodTaskRepo.getByScenarioId(scenarioId, tx);
        const crew_assignments = await this.crewAssignRepo.getByScenarioId(scenarioId, tx);

        const payload = {
          version: '1.0',
          exported_at: new Date().toISOString(),
          scenario,
          episodes,
          scenes: scenesWithBlocks,
          characters,
          locations,
          crew,
          shoot_days,
          scene_characters,
          character_relationships,
          location_images,
          production_tasks,
          crew_assignments
        };

        const result = await strategy.export(payload);
        return Outcome.ok(result);
      });
    } catch (e) {
      throw new DomainError({
        code: ErrorCode.INTEGRITY,
        message: 'Failed to export project',
        cause: e
      });
    }
  }
}

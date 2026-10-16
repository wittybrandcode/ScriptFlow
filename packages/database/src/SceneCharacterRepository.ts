import { BaseRepository } from './BaseRepository.js';

export interface SceneCharacter {
  id: string;
  scene_id: string;
  character_id: string;
}

export class SceneCharacterRepository extends BaseRepository<SceneCharacter> {
  protected readonly tableName = 'scene_characters';

  async getBySceneId(sceneId: string): Promise<SceneCharacter[]> {
    return this.findAllBy('scene_id', sceneId);
  }

  async getByScenarioId(scenarioId: string): Promise<SceneCharacter[]> {
    const { dbSelect } = await import('./client.js');
    return await dbSelect(`
      SELECT sc.* FROM scene_characters sc
      JOIN scenes s ON sc.scene_id = s.id
      WHERE s.scenario_id = $1
    `, [scenarioId]);
  }
}

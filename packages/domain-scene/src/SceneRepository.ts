import { BaseRepository } from '@scriptflow/database';
import { IScene, ProjectID } from '@scriptflow/core';

export class SceneRepository extends BaseRepository<IScene> {
  protected readonly tableName = 'scenes';

  async getByScenarioId(scenarioId: ProjectID): Promise<IScene[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'scene_number ASC');
  }

  async getByEpisodeId(episodeId: string): Promise<IScene[]> {
    return this.findActiveBy('episode_id', episodeId, 'scene_number ASC');
  }

  async getByShootDay(shootDayId: string): Promise<IScene[]> {
    return this.findActiveBy('shoot_day_id', shootDayId, 'shoot_order ASC');
  }
}

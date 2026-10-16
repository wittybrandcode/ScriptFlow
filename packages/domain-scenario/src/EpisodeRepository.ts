import { BaseRepository } from '@scriptflow/database';
import { IEpisode, ProjectID } from '@scriptflow/core';

export class EpisodeRepository extends BaseRepository<IEpisode> {
  protected readonly tableName = 'episodes';

  async getByScenarioId(scenarioId: ProjectID): Promise<IEpisode[]> {
    return this.findAllBy('scenario_id', scenarioId);
  }
}

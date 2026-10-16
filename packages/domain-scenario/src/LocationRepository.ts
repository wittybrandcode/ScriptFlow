import { BaseRepository } from '@scriptflow/database';
import { ILocation, ProjectID } from '@scriptflow/core';

export class LocationRepository extends BaseRepository<ILocation> {
  protected readonly tableName = 'locations';

  async getByScenarioId(scenarioId: ProjectID): Promise<ILocation[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'created_at DESC');
  }
}

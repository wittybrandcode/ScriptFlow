import { BaseRepository } from './BaseRepository.js';

export interface CrewAssignment {
  id: string;
  scenario_id: string;
  crew_id: string;
  episode_id?: number | string | null;
  scene_id?: number | string | null;
  assigned_at?: string;
}

export class CrewAssignmentRepository extends BaseRepository<CrewAssignment> {
  protected readonly tableName = 'crew_assignments';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<CrewAssignment[]> {
    return this.findAllBy('scenario_id', scenarioId, tx);
  }
}

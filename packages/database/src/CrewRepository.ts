import { BaseRepository } from './BaseRepository.js';
import type { ICrewMember } from '@scriptflow/core';

export class CrewRepository extends BaseRepository<ICrewMember> {
  protected readonly tableName = 'crew';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<ICrewMember[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'created_at DESC', tx);
  }

  async getAssignments(_scenarioId: string): Promise<any[]> {
    // TODO: Implement actual assignments logic when the table exists
    return [];
  }

  async deleteAllByScenario(scenarioId: string): Promise<void> {
    await this.deleteAllBy('scenario_id', scenarioId);
  }

  async syncAssignments(_crewId: string, _scenarioId: string, _assignments: any[]): Promise<void> {
    // TODO: Implement actual assignment sync
    console.warn('syncAssignments not fully implemented yet');
  }
}

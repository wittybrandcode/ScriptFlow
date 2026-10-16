import { BaseRepository } from '@scriptflow/database';
import { ICrewMember, ProjectID } from '@scriptflow/core';
import { dbSelect, dbExecute } from '@scriptflow/database';

export class CrewRepository extends BaseRepository<ICrewMember> {
  protected readonly tableName = 'crew';

  async getByScenarioId(scenarioId: ProjectID): Promise<ICrewMember[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'name ASC');
  }

  /**
   * Get crew assignments for a scenario.
   */
  async getAssignments(scenarioId: ProjectID): Promise<any[]> {
    return await dbSelect(
      'SELECT * FROM crew_assignments WHERE scenario_id = $1',
      [scenarioId]
    );
  }

  /**
   * Sync assignments for a crew member: delete old, insert new.
   */
  async syncAssignments(crewId: string, scenarioId: ProjectID, assignments: { scene_id: string; role?: string; notes?: string }[]): Promise<void> {
    await dbExecute(
      'DELETE FROM crew_assignments WHERE crew_id = $1 AND scenario_id = $2',
      [crewId, scenarioId]
    );
    for (const a of assignments) {
      await dbExecute(
        'INSERT INTO crew_assignments (id, crew_id, scenario_id, scene_id) VALUES ($1, $2, $3, $4)',
        [`asn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, crewId, scenarioId, a.scene_id]
      );
    }
  }

  /**
   * Hard delete all crew + assignments for a scenario.
   */
  async deleteAllByScenario(scenarioId: ProjectID): Promise<void> {
    await dbExecute('DELETE FROM crew_assignments WHERE scenario_id = $1', [scenarioId]);
    await dbExecute('DELETE FROM crew WHERE scenario_id = $1', [scenarioId]);
  }
}

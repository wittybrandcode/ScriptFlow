import { BaseRepository } from './BaseRepository.js';
import type { ICrewMember } from '@scriptflow/core';
import { dbSelect, withTransaction, TransactionContext } from './client.js';
import { generateId } from '@scriptflow/core';

export class CrewRepository extends BaseRepository<ICrewMember> {
  protected readonly tableName = 'crew';
  protected readonly allowedColumns = [
    'id', 'scenario_id', 'name', 'role', 'category', 'department',
    'image_url', 'phone', 'email', 'notes', 'daily_rate',
    'created_at', 'deleted_at'
  ];

  async getByScenarioId(scenarioId: string, tx?: TransactionContext): Promise<ICrewMember[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'name ASC', tx);
  }

  async getAssignments(scenarioId: string, tx?: TransactionContext): Promise<any[]> {
    const query = `
      SELECT ca.*, c.name as crew_name, c.role as crew_role
      FROM crew_assignments ca
      LEFT JOIN crew c ON ca.crew_id = c.id
      WHERE ca.scenario_id = $1
      ORDER BY ca.assigned_at DESC
    `;
    return tx ? tx.select(query, [scenarioId]) : dbSelect(query, [scenarioId]);
  }

  async deleteAllByScenario(scenarioId: string, tx?: TransactionContext): Promise<void> {
    await this.deleteAllBy('scenario_id', scenarioId, tx);
  }

  async syncAssignments(crewId: string, scenarioId: string, assignments: Array<{ episode_id?: string | null; scene_id?: string | null; role?: string | null; id?: string }>, tx?: TransactionContext): Promise<void> {
    const runSync = async (context: TransactionContext) => {
      await context.execute('DELETE FROM crew_assignments WHERE crew_id = $1 AND scenario_id = $2', [crewId, scenarioId]);
      for (const assignment of assignments) {
        const id = assignment.id || generateId('asn');
        await context.execute(
          'INSERT INTO crew_assignments (id, scenario_id, crew_id, episode_id, scene_id, assigned_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
          [id, scenarioId, crewId, assignment.episode_id || null, assignment.scene_id || null]
        );
      }
    };

    if (tx) {
      await runSync(tx);
    } else {
      await withTransaction(runSync);
    }
  }
}

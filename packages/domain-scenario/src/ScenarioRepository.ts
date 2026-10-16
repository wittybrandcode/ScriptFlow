import { BaseRepository } from '@scriptflow/database';
import { IScenario } from '@scriptflow/core';
import { dbSelect, dbExecute } from '@scriptflow/database';

export class ScenarioRepository extends BaseRepository<IScenario> {
  protected readonly tableName = 'scenarios';

  /**
   * Get all active (non-deleted) scenarios.
   */
  async getAllActive(): Promise<IScenario[]> {
    return this.findAllActive();
  }

  /**
   * Fetch all scenarios with metadata (director, scene count, episode count)
   */
  async getAllWithMetadata(): Promise<any[]> {
    try {
      // Auto-migrate: ensure cover_video column exists
      await dbExecute(`ALTER TABLE scenarios ADD COLUMN cover_video TEXT DEFAULT ''`);
    } catch (e) {
      console.warn('Migration warning: cover_video column might already exist.', e);
    }

    return await dbSelect(`
      SELECT s.id, s.title, s.description, s.status, s.genre, s.notes, s.created_at, 
             (SELECT c.name FROM crew c WHERE c.scenario_id = s.id AND (c.role = 'DIRECTOR' OR c.role = 'مخرج' OR c.job_title LIKE '%مخرج%' OR c.job_title LIKE '%Director%') LIMIT 1) as director_name,
             (SELECT c.name FROM crew c WHERE c.scenario_id = s.id AND (c.role = 'WRITER' OR c.role = 'كاتب' OR c.role = 'مؤلف' OR c.job_title LIKE '%كاتب%' OR c.job_title LIKE '%Writer%' OR c.job_title LIKE '%مؤلف%') LIMIT 1) as writer_name,
             (SELECT COUNT(*) FROM scenes sc WHERE sc.scenario_id = s.id AND sc.deleted_at IS NULL) as scene_count,
             (SELECT COUNT(*) FROM episodes e WHERE e.scenario_id = s.id) as episode_count
      FROM scenarios s 
      WHERE s.deleted_at IS NULL 
      ORDER BY s.created_at DESC
    `);
  }

  /**
   * Fetch a single scenario with metadata
   */
  async getByIdWithMetadata(id: string): Promise<any> {
    const rows = await dbSelect(`
      SELECT s.*, 
             (SELECT c.name FROM crew c WHERE c.scenario_id = s.id AND (c.role = 'DIRECTOR' OR c.role = 'مخرج' OR c.job_title LIKE '%مخرج%' OR c.job_title LIKE '%Director%') LIMIT 1) as director_name,
             (SELECT c.name FROM crew c WHERE c.scenario_id = s.id AND (c.role = 'WRITER' OR c.role = 'كاتب' OR c.role = 'مؤلف' OR c.job_title LIKE '%كاتب%' OR c.job_title LIKE '%Writer%' OR c.job_title LIKE '%مؤلف%') LIMIT 1) as writer_name
      FROM scenarios s 
      WHERE s.id = $1 AND s.deleted_at IS NULL
    `, [id]);
    if (rows.length === 0) throw new Error('Scenario not found');
    return rows[0];
  }

  /**
   * Get scenario stats (counts of related entities).
   */
  async getStats(scenarioId: string): Promise<{ totalScenes: number, totalCharacters: number, totalLocations: number, totalCrew: number }> {
    const [scenes] = await Promise.all([
      dbSelect<{ count: number }>('SELECT COUNT(*) as count FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL', [scenarioId])
    ]);
    const [characters] = await Promise.all([
      dbSelect<{ count: number }>('SELECT COUNT(*) as count FROM characters WHERE scenario_id = $1 AND deleted_at IS NULL', [scenarioId])
    ]);
    const [locations] = await Promise.all([
      dbSelect<{ count: number }>('SELECT COUNT(*) as count FROM locations WHERE scenario_id = $1 AND deleted_at IS NULL', [scenarioId])
    ]);
    const [crew] = await Promise.all([
      dbSelect<{ count: number }>('SELECT COUNT(*) as count FROM crew WHERE scenario_id = $1 AND deleted_at IS NULL', [scenarioId])
    ]);

    return {
      totalScenes: scenes[0]?.count ?? 0,
      totalCharacters: characters[0]?.count ?? 0,
      totalLocations: locations[0]?.count ?? 0,
      totalCrew: crew[0]?.count ?? 0,
    };
  }
}

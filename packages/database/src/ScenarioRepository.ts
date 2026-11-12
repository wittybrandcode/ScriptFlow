import { BaseRepository } from './BaseRepository.js';
import type { IScenario } from '@scriptflow/core';
import { dbSelect, TransactionContext } from './client.js';

export class ScenarioRepository extends BaseRepository<IScenario> {
  protected readonly tableName = 'scenarios';

  async getByProjectId(projectId: string): Promise<IScenario[]> {
    return this.findActiveBy('id', projectId);
  }

  async getAllWithMetadata(): Promise<IScenario[]> {
    const query = `
      SELECT 
        s.*,
        (SELECT name FROM crew WHERE scenario_id = s.id AND (category = 'DIRECTOR' OR role = 'DIRECTOR' OR role LIKE '%مخرج%') AND deleted_at IS NULL LIMIT 1) as director_name,
        (SELECT name FROM crew WHERE scenario_id = s.id AND (category = 'WRITER' OR role = 'WRITER' OR role LIKE '%كاتب%' OR role LIKE '%مؤلف%') AND deleted_at IS NULL LIMIT 1) as writer_name,
        (SELECT COUNT(*) FROM scenes WHERE scenario_id = s.id AND deleted_at IS NULL) as scene_count,
        (SELECT COUNT(*) FROM episodes WHERE scenario_id = s.id) as episode_count
      FROM scenarios s
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC
    `;
    return dbSelect<IScenario>(query);
  }

  async getByIdWithMetadata(id: string): Promise<IScenario | null> {
    const query = `
      SELECT 
        s.*,
        (SELECT name FROM crew WHERE scenario_id = s.id AND (category = 'DIRECTOR' OR role = 'DIRECTOR' OR role LIKE '%مخرج%') AND deleted_at IS NULL LIMIT 1) as director_name,
        (SELECT name FROM crew WHERE scenario_id = s.id AND (category = 'WRITER' OR role = 'WRITER' OR role LIKE '%كاتب%' OR role LIKE '%مؤلف%') AND deleted_at IS NULL LIMIT 1) as writer_name,
        (SELECT COUNT(*) FROM scenes WHERE scenario_id = s.id AND deleted_at IS NULL) as scene_count,
        (SELECT COUNT(*) FROM episodes WHERE scenario_id = s.id) as episode_count
      FROM scenarios s
      WHERE s.id = $1 AND s.deleted_at IS NULL
    `;
    const results = await dbSelect<any>(query, [id]);
    return results[0] || null;
  }

  async getStats(id: string): Promise<any> {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL) as sceneCount,
        (SELECT COUNT(*) FROM characters WHERE scenario_id = $1 AND deleted_at IS NULL) as characterCount,
        (SELECT COUNT(*) FROM locations WHERE scenario_id = $1 AND deleted_at IS NULL) as locationCount,
        (SELECT COUNT(*) FROM crew WHERE scenario_id = $1 AND deleted_at IS NULL) as crewCount
    `;
    const results = await dbSelect<any>(statsQuery, [id]);
    const row = results[0] || { sceneCount: 0, characterCount: 0, locationCount: 0, crewCount: 0 };
    return {
      sceneCount: row.sceneCount,
      characterCount: row.characterCount,
      locationCount: row.locationCount,
      crewCount: row.crewCount,
      scenes: row.sceneCount,
      characters: row.characterCount,
      locations: row.locationCount,
      crew: row.crewCount,
      totalScenes: row.sceneCount,
      totalCharacters: row.characterCount,
      totalLocations: row.locationCount,
      totalRealLocations: row.locationCount,
      totalCrew: row.crewCount
    };
  }

  async clearScenarioContents(scenarioId: string, tx?: TransactionContext): Promise<void> {
    const runDeletes = async (context: TransactionContext) => {
      // 1. Scene children
      await context.execute(`DELETE FROM script_blocks WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1)`, [scenarioId]);
      await context.execute(`DELETE FROM scene_characters WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1)`, [scenarioId]);
      await context.execute(`DELETE FROM scene_snapshots WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1)`, [scenarioId]);
      await context.execute(`DELETE FROM scene_reminders WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1)`, [scenarioId]);

      // 2. Crew assignments
      await context.execute(`DELETE FROM crew_day_assignments WHERE shoot_day_id IN (SELECT id FROM shoot_days WHERE scenario_id = $1)`, [scenarioId]);
      await context.execute(`DELETE FROM crew_assignments WHERE scenario_id = $1`, [scenarioId]);

      // 3. Character & Location details
      await context.execute(`DELETE FROM character_relationships WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`DELETE FROM location_images WHERE location_id IN (SELECT id FROM locations WHERE scenario_id = $1)`, [scenarioId]);
      await context.execute(`DELETE FROM location_documents WHERE location_id IN (SELECT id FROM locations WHERE scenario_id = $1)`, [scenarioId]);

      // 4. Tasks & Metadata
      await context.execute(`DELETE FROM production_tasks WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`DELETE FROM page_numbering WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`DELETE FROM tones WHERE scenario_id = $1`, [scenarioId]);

      // 5. Unlink self-referencing and foreign keys before deletion
      await context.execute(`UPDATE characters SET actor_id = NULL, father_id = NULL, mother_id = NULL WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`UPDATE locations SET parent_location_id = NULL WHERE scenario_id = $1`, [scenarioId]);

      // 6. Delete main entities in topological order
      await context.execute(`DELETE FROM scenes WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`DELETE FROM characters WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`DELETE FROM locations WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`DELETE FROM shoot_days WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`DELETE FROM episodes WHERE scenario_id = $1`, [scenarioId]);
      await context.execute(`DELETE FROM crew WHERE scenario_id = $1`, [scenarioId]);
    };

    if (tx) {
      await runDeletes(tx);
    } else {
      const { withTransaction } = await import('./client.js');
      await withTransaction(async (innerTx) => {
        await runDeletes(innerTx);
      });
    }
  }

  async hardDeleteScenario(scenarioId: string, tx?: TransactionContext): Promise<void> {
    const runHardDelete = async (context: TransactionContext) => {
      await this.clearScenarioContents(scenarioId, context);
      await context.execute('DELETE FROM scenarios WHERE id = $1', [scenarioId]);
    };

    if (tx) {
      await runHardDelete(tx);
    } else {
      const { withTransaction } = await import('./client.js');
      await withTransaction(async (innerTx) => {
        await runHardDelete(innerTx);
      });
    }
  }
}

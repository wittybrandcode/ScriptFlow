import { BaseRepository } from './BaseRepository.js';
import type { IScenario } from '@scriptflow/core';
import { dbSelect } from './client.js';

export class ScenarioRepository extends BaseRepository<IScenario> {
  protected readonly tableName = 'scenarios';

  async getByProjectId(projectId: string): Promise<IScenario[]> {
    return this.findActiveBy('id', projectId);
  }

  async getAllWithMetadata(): Promise<IScenario[]> {
    const query = `
      SELECT 
        s.*,
        (SELECT name FROM crew WHERE scenario_id = s.id AND role = 'DIRECTOR' AND deleted_at IS NULL LIMIT 1) as director_name,
        (SELECT name FROM crew WHERE scenario_id = s.id AND role = 'WRITER' AND deleted_at IS NULL LIMIT 1) as writer_name,
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
        (SELECT name FROM crew WHERE scenario_id = s.id AND role = 'DIRECTOR' AND deleted_at IS NULL LIMIT 1) as director_name,
        (SELECT name FROM crew WHERE scenario_id = s.id AND role = 'WRITER' AND deleted_at IS NULL LIMIT 1) as writer_name,
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

  async hardDeleteScenario(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<void> {
    const execute = tx ? tx.execute.bind(tx) : (await import('./client.js')).dbExecute;
    
    const tables = [
      'script_blocks',
      'scene_characters',
      'character_relationships',
      'location_images',
      'crew_assignments',
      'production_tasks',
      'scenes',
      'characters',
      'locations',
      'episodes',
      'shoot_days',
      'scenarios'
    ];
    
    for (const table of tables) {
      if (table === 'script_blocks') {
        await execute(`
          DELETE FROM script_blocks WHERE scene_id IN (
            SELECT id FROM scenes WHERE scenario_id = $1
          )
        `, [scenarioId]);
      } else if (table === 'location_images') {
        await execute(`
          DELETE FROM location_images WHERE location_id IN (
            SELECT id FROM locations WHERE scenario_id = $1
          )
        `, [scenarioId]);
      } else if (table === 'scene_characters') {
        await execute(`
          DELETE FROM scene_characters WHERE scene_id IN (
            SELECT id FROM scenes WHERE scenario_id = $1
          )
        `, [scenarioId]);
      } else if (table === 'scenarios') {
        await execute('DELETE FROM scenarios WHERE id = $1', [scenarioId]);
      } else {
        await execute(`DELETE FROM ${table} WHERE scenario_id = $1`, [scenarioId]);
      }
    }
  }

  async clearScenarioContents(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<void> {
    const execute = tx ? tx.execute.bind(tx) : (await import('./client.js')).dbExecute;
    
    const tables = [
      'script_blocks',
      'scene_characters',
      'character_relationships',
      'location_images',
      'crew_assignments',
      'production_tasks',
      'scenes',
      'characters',
      'locations',
      'episodes',
      'shoot_days'
    ];
    
    for (const table of tables) {
      if (table === 'script_blocks') {
        await execute(`
          DELETE FROM script_blocks WHERE scene_id IN (
            SELECT id FROM scenes WHERE scenario_id = $1
          )
        `, [scenarioId]);
      } else if (table === 'location_images') {
        await execute(`
          DELETE FROM location_images WHERE location_id IN (
            SELECT id FROM locations WHERE scenario_id = $1
          )
        `, [scenarioId]);
      } else if (table === 'scene_characters') {
        await execute(`
          DELETE FROM scene_characters WHERE scene_id IN (
            SELECT id FROM scenes WHERE scenario_id = $1
          )
        `, [scenarioId]);
      } else {
        await execute(`DELETE FROM ${table} WHERE scenario_id = $1`, [scenarioId]);
      }
    }
  }
}

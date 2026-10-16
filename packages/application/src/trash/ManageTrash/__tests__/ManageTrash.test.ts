import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../../../test/setup';
import { dbExecute, dbSelect } from '@scriptflow/database';
import { ManageTrash } from '../ManageTrash';

describe('ManageTrash Service', () => {
  let trashService: ManageTrash;

  beforeAll(async () => {
    await setupTestDatabase();
    trashService = new ManageTrash();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    const tables = [
      'script_blocks', 'scene_characters', 'character_relationships',
      'location_images', 'crew_assignments', 'production_tasks',
      'scenes', 'characters', 'locations', 'crew', 'scenarios'
    ];
    for (const table of tables) {
      await dbExecute(`DELETE FROM ${table}`);
    }

    // Seed Data with some deleted_at
    await dbExecute(`
      INSERT INTO scenarios (id, title, deleted_at)
      VALUES 
      ('scen-1', 'Active Scenario', NULL),
      ('scen-2', 'Deleted Scenario', '2026-07-01T12:00:00Z')
    `);

    await dbExecute(`
      INSERT INTO scenes (id, scenario_id, scene_number, deleted_at)
      VALUES ('scn-1', 'scen-1', 1, '2026-07-01T12:00:00Z')
    `);

    await dbExecute(`
      INSERT INTO characters (id, scenario_id, name, deleted_at)
      VALUES ('chr-1', 'scen-1', 'Deleted Char', '2026-07-01T12:00:00Z')
    `);
  });

  it('should restore a deleted scenario', async () => {
    await trashService.restoreItem('scenario', 'scen-2');
    const result = await dbSelect('SELECT deleted_at FROM scenarios WHERE id = $1', ['scen-2']);
    expect(result[0].deleted_at).toBeNull();
  });

  it('should restore a deleted scene', async () => {
    await trashService.restoreItem('scene', 'scn-1');
    const result = await dbSelect('SELECT deleted_at FROM scenes WHERE id = $1', ['scn-1']);
    expect(result[0].deleted_at).toBeNull();
  });

  it('should permanently purge a scene and its dependencies', async () => {
    // Add dependencies
    await dbExecute(`INSERT INTO script_blocks (id, scene_id, type) VALUES ('blk-1', 'scn-1', 'ACTION')`);
    await dbExecute(`INSERT INTO scene_characters (scene_id, character_id) VALUES ('scn-1', 'chr-1')`);

    await trashService.purgeItem('scene', 'scn-1');

    const scenes = await dbSelect('SELECT * FROM scenes WHERE id = $1', ['scn-1']);
    expect(scenes.length).toBe(0);

    const blocks = await dbSelect('SELECT * FROM script_blocks WHERE scene_id = $1', ['scn-1']);
    expect(blocks.length).toBe(0);

    const sceneChars = await dbSelect('SELECT * FROM scene_characters WHERE scene_id = $1', ['scn-1']);
    expect(sceneChars.length).toBe(0);
  });

  it('should throw an error for unknown type restoration', async () => {
    await expect(trashService.restoreItem('unknown', 'id-1')).rejects.toThrow('Unknown type');
  });

  it('should throw an error for unknown type purging', async () => {
    await expect(trashService.purgeItem('unknown', 'id-1')).rejects.toThrow('Unknown type');
  });
});

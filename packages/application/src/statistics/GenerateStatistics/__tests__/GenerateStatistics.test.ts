import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../../../test/setup';
import { dbExecute } from '@scriptflow/database';
import { GenerateStatistics } from '../GenerateStatistics';

describe('GenerateStatistics Service', () => {
  let statsService: GenerateStatistics;

  beforeAll(async () => {
    await setupTestDatabase();
    statsService = new GenerateStatistics();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean up
    const tables = ['script_blocks', 'scenes', 'characters', 'locations', 'crew', 'scenarios'];
    for (const table of tables) {
      await dbExecute(`DELETE FROM ${table}`);
    }

    // Seed Data
    await dbExecute(`
      INSERT INTO scenarios (id, title)
      VALUES ('scen-1', 'Stats Scenario')
    `);

    await dbExecute(`
      INSERT INTO scenes (id, scenario_id, scene_number)
      VALUES 
      ('scn-1', 'scen-1', 1),
      ('scn-2', 'scen-1', 2)
    `);

    await dbExecute(`
      INSERT INTO characters (id, scenario_id, name)
      VALUES 
      ('chr-1', 'scen-1', 'John'),
      ('chr-2', 'scen-1', 'Jane')
    `);

    await dbExecute(`
      INSERT INTO locations (id, scenario_id, name)
      VALUES ('loc-1', 'scen-1', 'House')
    `);

    await dbExecute(`
      INSERT INTO crew (id, scenario_id, name, role)
      VALUES ('crew-1', 'scen-1', 'Director', 'ACTOR')
    `);

    // Add script blocks for character stats
    await dbExecute(`
      INSERT INTO script_blocks (id, scene_id, character_id, type, content)
      VALUES 
      ('blk-1', 'scn-1', 'chr-1', 'DIALOGUE', 'Hello'),
      ('blk-2', 'scn-1', 'chr-2', 'DIALOGUE', 'Hi'),
      ('blk-3', 'scn-2', 'chr-1', 'DIALOGUE', 'World')
    `);
  });

  it('should generate overall statistics correctly', async () => {
    const stats = await statsService.execute('scen-1');
    expect(stats.sceneCount).toBe(2);
    expect(stats.characterCount).toBe(2);
    expect(stats.locationCount).toBe(1);
    expect(stats.crewCount).toBe(1);
  });

  it('should generate character specific stats correctly', async () => {
    const charStats = await statsService.executeCharacterStats('scen-1');
    
    // Total dialogues = 3. chr-1 has 2, chr-2 has 1
    expect(charStats['chr-1']).toBeDefined();
    expect(charStats['chr-1'].dialogueCount).toBe(2);
    expect(charStats['chr-1'].sceneCount).toBe(2); // Appears in scn-1 and scn-2
    expect(charStats['chr-1'].appearancePercent).toBe(67); // 2/3 * 100 = 67%

    expect(charStats['chr-2']).toBeDefined();
    expect(charStats['chr-2'].dialogueCount).toBe(1);
    expect(charStats['chr-2'].sceneCount).toBe(1); // Appears in scn-1
    expect(charStats['chr-2'].appearancePercent).toBe(33); // 1/3 * 100 = 33%
  });
});

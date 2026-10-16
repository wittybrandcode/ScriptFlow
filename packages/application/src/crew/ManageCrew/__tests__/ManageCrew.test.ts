import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../../../test/setup';
import { dbExecute, dbSelect } from '@scriptflow/database';
import { ManageCrew } from '../ManageCrew';

describe('ManageCrew Service', () => {
  let crewService: ManageCrew;

  beforeAll(async () => {
    await setupTestDatabase();
    crewService = new ManageCrew();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    const tables = ['crew_assignments', 'scenes', 'crew', 'scenarios'];
    for (const table of tables) {
      await dbExecute(`DELETE FROM ${table}`);
    }

    // Seed Data
    await dbExecute(`
      INSERT INTO scenarios (id, title)
      VALUES ('scen-1', 'Crew Scenario')
    `);

    await dbExecute(`
      INSERT INTO crew (id, scenario_id, name, role)
      VALUES ('crw-1', 'scen-1', 'Camera Operator', 'ACTOR')
    `);

    await dbExecute(`
      INSERT INTO scenes (id, scenario_id, scene_number)
      VALUES 
      ('scn-1', 'scen-1', 1),
      ('scn-2', 'scen-1', 2)
    `);

    // Existing assignment
    await dbExecute(`
      INSERT INTO crew_assignments (id, crew_id, scenario_id, scene_id)
      VALUES ('cra-old', 'crw-1', 'scen-1', 'scn-1')
    `);
  });

  it('should sync crew assignments by replacing old ones with new ones', async () => {
    const assignments = [
      { scene_id: 'scn-1' },
      { scene_id: 'scn-2' }
    ];

    await crewService.syncAssignments('crw-1', 'scen-1', assignments);

    const currentAssignments = await dbSelect('SELECT * FROM crew_assignments WHERE crew_id = $1', ['crw-1']);
    
    expect(currentAssignments.length).toBe(2);
    // Old one should be gone
    expect(currentAssignments.find((a: any) => a.id === 'cra-old')).toBeUndefined();
    
    const scn1Assign = currentAssignments.find((a: any) => a.scene_id === 'scn-1');
    expect(scn1Assign).toBeDefined();

    const scn2Assign = currentAssignments.find((a: any) => a.scene_id === 'scn-2');
    expect(scn2Assign).toBeDefined();
  });

  it('should clear assignments if empty array is passed', async () => {
    await crewService.syncAssignments('crw-1', 'scen-1', []);
    const currentAssignments = await dbSelect('SELECT * FROM crew_assignments WHERE crew_id = $1', ['crw-1']);
    expect(currentAssignments.length).toBe(0);
  });
});

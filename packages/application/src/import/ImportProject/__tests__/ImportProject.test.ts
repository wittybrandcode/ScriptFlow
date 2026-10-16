import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../../../test/setup';
import { dbSelect, dbExecute } from '@scriptflow/database';
import { ImportProject } from '../ImportProject';

describe('ImportProject Conflict Resolution', () => {
  let importService: ImportProject;

  beforeAll(async () => {
    await setupTestDatabase();
    importService = new ImportProject();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean up all tables
    const tables = [
      'script_blocks', 'scene_characters', 'character_relationships',
      'location_images', 'crew_assignments', 'production_tasks',
      'scenes', 'characters', 'locations', 'episodes', 'shoot_days', 'scenarios'
    ];
    for (const table of tables) {
      await dbExecute(`DELETE FROM ${table}`);
    }
  });

  const mockScenarioData = {
    scenario: {
      id: 'scen-test-123',
      title: 'Original Title',
      description: 'Original description',
      status: 'DRAFT',
      genre: 'Drama'
    },
    episodes: [
      { id: 'epi-1', episode_number: 1, title: 'Episode 1', description: 'Desc 1' }
    ],
    characters: [
      { id: 'char-1', name: 'John Doe', full_name: 'Johnathan Doe', role: 'MAIN' }
    ],
    locations: [
      { id: 'loc-1', name: 'Mansion', type: 'INT' }
    ]
  };

  it('should detect no conflict on empty database', async () => {
    const conflict = await importService.checkConflict(mockScenarioData);
    expect(conflict).toBeNull();
  });

  it('should detect ID conflict if same ID exists', async () => {
    // Insert existing scenario
    await dbExecute(`
      INSERT INTO scenarios (id, title, description, status)
      VALUES ('scen-test-123', 'Another Title', 'Desc', 'DRAFT')
    `);

    const conflict = await importService.checkConflict(mockScenarioData);
    expect(conflict).not.toBeNull();
    expect(conflict?.type).toBe('ID_CONFLICT');
    expect(conflict?.existing.title).toBe('Another Title');
  });

  it('should detect TITLE conflict if same title exists', async () => {
    // Insert existing scenario with different ID but same title
    await dbExecute(`
      INSERT INTO scenarios (id, title, description, status)
      VALUES ('scen-other-id', 'Original Title', 'Desc', 'DRAFT')
    `);

    const conflict = await importService.checkConflict(mockScenarioData);
    expect(conflict).not.toBeNull();
    expect(conflict?.type).toBe('TITLE_CONFLICT');
    expect(conflict?.existing.id).toBe('scen-other-id');
  });

  it('should import in COPY mode (renaming title and IDs)', async () => {
    // Insert existing scenario
    await dbExecute(`
      INSERT INTO scenarios (id, title, description, status)
      VALUES ('scen-test-123', 'Original Title', 'Desc', 'DRAFT')
    `);

    // Import with COPY mode
    await importService.execute(mockScenarioData, { mode: 'COPY' });

    // Verify there are two scenarios in the database now
    const scenarios = await dbSelect('SELECT id, title FROM scenarios');
    expect(scenarios.length).toBe(2);

    // One has a generated ID (not scen-test-123) and modified title
    const copied = scenarios.find((s: any) => s.id !== 'scen-test-123');
    expect(copied).not.toBeUndefined();
    expect(copied?.title).toContain('Original Title');
  });

  it('should import in OVERWRITE mode (deleting existing and replacing)', async () => {
    // Insert existing scenario and related character
    await dbExecute(`
      INSERT INTO scenarios (id, title, description, status)
      VALUES ('scen-test-123', 'Original Title', 'Desc', 'DRAFT')
    `);
    await dbExecute(`
      INSERT INTO characters (id, scenario_id, name)
      VALUES ('char-old', 'scen-test-123', 'Old Character')
    `);

    // Import with OVERWRITE mode
    await importService.execute(mockScenarioData, {
      mode: 'OVERWRITE',
      conflictScenarioId: 'scen-test-123'
    });

    // Verify scenario still exists with its original ID
    const scenarios = await dbSelect('SELECT id, title, description FROM scenarios');
    expect(scenarios.length).toBe(1);
    expect(scenarios[0].id).toBe('scen-test-123');
    expect(scenarios[0].description).toBe('Original description'); // Overwritten

    // Verify old character was deleted, and new character exists
    const characters = await dbSelect('SELECT id, name FROM characters');
    expect(characters.length).toBe(1);
    expect(characters[0].id).toBe('char-1');
    expect(characters[0].name).toBe('John Doe');
  });

  it('should import in MERGE mode (updating matching, inserting new)', async () => {
    // Insert existing scenario and character
    await dbExecute(`
      INSERT INTO scenarios (id, title, description, status)
      VALUES ('scen-test-123', 'Original Title', 'Old description', 'DRAFT')
    `);
    await dbExecute(`
      INSERT INTO characters (id, scenario_id, name, full_name)
      VALUES ('char-1', 'scen-test-123', 'John Doe', 'Old Full Name')
    `);

    // Import with MERGE mode
    await importService.execute(mockScenarioData, {
      mode: 'MERGE',
      conflictScenarioId: 'scen-test-123'
    });

    // Verify scenario title was merged/updated
    const scenarios = await dbSelect('SELECT id, title, description FROM scenarios');
    expect(scenarios.length).toBe(1);
    expect(scenarios[0].description).toBe('Original description'); // Updated

    // Verify character was updated (full_name updated)
    const characters = await dbSelect('SELECT id, name, full_name FROM characters');
    expect(characters.length).toBe(1);
    expect(characters[0].id).toBe('char-1');
    expect(characters[0].full_name).toBe('Johnathan Doe'); // Merged/Updated
  });
});

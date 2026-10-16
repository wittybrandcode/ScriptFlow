import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import { ScenarioRepository } from '../ScenarioRepository';
import type { IScenario } from '@scriptflow/core';
import { dbExecute } from '../client';

describe('ScenarioRepository', () => {
  let repo: ScenarioRepository;

  beforeAll(async () => {
    await setupTestDatabase();
    repo = new ScenarioRepository();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean up scenarios before each test
    await dbExecute('DELETE FROM scenarios');
  });

  it('should create a new scenario', async () => {
    const newScenario: IScenario = {
      id: 'scen-1',
      title: 'Test Scenario',
      description: 'A scenario for testing',
      status: 'DRAFT'
    };

    await repo.insert(newScenario);

    const retrieved = await repo.findById('scen-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Test Scenario');
    expect(retrieved?.status).toBe('DRAFT');
  });

  it('should update an existing scenario', async () => {
    const newScenario: IScenario = {
      id: 'scen-2',
      title: 'Original Title'
    };
    await repo.insert(newScenario);

    await repo.update('scen-2', { title: 'Updated Title' });

    const retrieved = await repo.findById('scen-2');
    expect(retrieved?.title).toBe('Updated Title');
  });

  it('should logic-delete a scenario', async () => {
    const newScenario: IScenario = {
      id: 'scen-3',
      title: 'To be deleted'
    };
    await repo.insert(newScenario);

    await repo.softDelete('scen-3');

    // Should not appear in active records
    const activeScenarios = await repo.findAllActive();
    expect(activeScenarios.length).toBe(0);

    // But should still exist in the database with deleted_at set
    const retrieved = await repo.findById('scen-3');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.deleted_at).not.toBeNull();
  });

  it('should get stats for a scenario', async () => {
    const newScenario: IScenario = { id: 'scen-4', title: 'Stats Test' };
    await repo.insert(newScenario);

    // Insert fake related data
    await dbExecute(`INSERT INTO scenes (id, scenario_id, scene_number, title) VALUES ('scene-1', 'scen-4', 1, 'Scene 1')`);
    await dbExecute(`INSERT INTO scenes (id, scenario_id, scene_number, title) VALUES ('scene-2', 'scen-4', 2, 'Scene 2')`);
    await dbExecute(`INSERT INTO characters (id, scenario_id, name) VALUES ('char-1', 'scen-4', 'John')`);

    const stats = await repo.getStats('scen-4');
    expect(stats.sceneCount).toBe(2);
    expect(stats.characterCount).toBe(1);
    expect(stats.locationCount).toBe(0);
    expect(stats.totalScenes).toBe(2);
    expect(stats.totalCharacters).toBe(1);
    expect(stats.totalLocations).toBe(0);
    expect(stats.totalRealLocations).toBe(0);
    expect(stats.scenes).toBe(2);
    expect(stats.characters).toBe(1);
    expect(stats.locations).toBe(0);
  });
});

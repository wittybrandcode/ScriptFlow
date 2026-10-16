import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import { SceneRepository } from '../SceneRepository';
import type { IScene } from '@scriptflow/core';
import { dbExecute } from '../client';

describe('SceneRepository', () => {
  let repo: SceneRepository;

  beforeAll(async () => {
    await setupTestDatabase();
    repo = new SceneRepository();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    await dbExecute('DELETE FROM scenes');
    await dbExecute('DELETE FROM scenarios');
    await dbExecute(`INSERT INTO scenarios (id, title) VALUES ('scen-scene-test', 'Test Scenario')`);
  });

  it('should create a scene', async () => {
    const newScene: IScene = {
      id: 'scene-1',
      scenario_id: 'scen-scene-test',
      scene_number: 1,
      title: 'Opening Scene',
      location_type: 'EXT'
    };

    await repo.insert(newScene);

    const retrieved = await repo.findById('scene-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Opening Scene');
  });

  it('should update scene order', async () => {
    await repo.insert({ id: 'scene-2', scenario_id: 'scen-scene-test', scene_number: 1 });
    await repo.insert({ id: 'scene-3', scenario_id: 'scen-scene-test', scene_number: 2 });

    const scenesBefore = await repo.getByScenarioId('scen-scene-test');
    expect(scenesBefore[0].scene_number).toBe(1);

    await repo.update('scene-2', { scene_number: 3 });

    const scenesAfter = await repo.getByScenarioId('scen-scene-test');
    expect(scenesAfter.find(s => s.id === 'scene-2')?.scene_number).toBe(3);
  });
});

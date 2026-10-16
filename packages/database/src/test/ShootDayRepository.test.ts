import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import { ShootDayRepository } from '../ShootDayRepository';
import { SceneRepository } from '../SceneRepository';
import type { IShootDay, IScene } from '@scriptflow/core';
import { dbExecute } from '../client';

describe('ShootDayRepository', () => {
  let repo: ShootDayRepository;
  let sceneRepo: SceneRepository;

  beforeAll(async () => {
    await setupTestDatabase();
    repo = new ShootDayRepository();
    sceneRepo = new SceneRepository();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    await dbExecute('DELETE FROM scenes');
    await dbExecute('DELETE FROM shoot_days');
    await dbExecute('DELETE FROM scenarios');
    await dbExecute(`INSERT INTO scenarios (id, title) VALUES ('scen-shoot-test', 'Test Scenario')`);
  });

  it('should create and retrieve a shoot day', async () => {
    const day: IShootDay = {
      id: 'day-1',
      scenario_id: 'scen-shoot-test',
      shoot_date: '2026-06-15',
      start_time: '08:00',
      end_time: '18:00',
      notes: 'Test notes'
    };
    await repo.insert(day);

    const retrieved = await repo.findById('day-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.shoot_date).toBe('2026-06-15');
  });

  it('should manage timeline data and scene assignments', async () => {
    const day: IShootDay = {
      id: 'day-2',
      scenario_id: 'scen-shoot-test',
      shoot_date: '2026-06-16',
      start_time: '09:00',
      end_time: '17:00'
    };
    await repo.insert(day);

    // Insert scheduled scene and unscheduled scene
    const scene1: IScene = {
      id: 'scene-101',
      scenario_id: 'scen-shoot-test',
      scene_number: 1,
      title: 'Scheduled Scene',
      shoot_day_id: 'day-2'
    };
    const scene2: IScene = {
      id: 'scene-102',
      scenario_id: 'scen-shoot-test',
      scene_number: 2,
      title: 'Unscheduled Scene'
    };
    await sceneRepo.insert(scene1);
    await sceneRepo.insert(scene2);

    // Fetch timeline data
    const timeline = await repo.getTimelineData('scen-shoot-test');
    expect(timeline.shootDays.length).toBe(1);
    expect(timeline.shootDays[0].scenes.length).toBe(1);
    expect(timeline.shootDays[0].scenes[0].id).toBe('scene-101');
    expect(timeline.unscheduledScenes.length).toBe(1);
    expect(timeline.unscheduledScenes[0].id).toBe('scene-102');

    // Assign scene2 to day-2
    await repo.assignScene('scene-102', 'day-2');
    const timelineAfterAssign = await repo.getTimelineData('scen-shoot-test');
    expect(timelineAfterAssign.shootDays[0].scenes.length).toBe(2);
    expect(timelineAfterAssign.unscheduledScenes.length).toBe(0);

    // Unassign scene1
    await repo.assignScene('scene-101', null);
    const timelineAfterUnassign = await repo.getTimelineData('scen-shoot-test');
    expect(timelineAfterUnassign.shootDays[0].scenes.length).toBe(1);
    expect(timelineAfterUnassign.unscheduledScenes.length).toBe(1);

    // Delete day-2 with unassign
    await repo.deleteWithUnassign('day-2');
    const timelineAfterDelete = await repo.getTimelineData('scen-shoot-test');
    expect(timelineAfterDelete.shootDays.length).toBe(0);
    // Both scenes should be unscheduled now
    expect(timelineAfterDelete.unscheduledScenes.length).toBe(2);
  });
});

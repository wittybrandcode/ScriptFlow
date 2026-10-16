import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../../../test/setup';
import { dbExecute, dbSelect } from '@scriptflow/database';
import { ManageTimeline } from '../ManageTimeline';

describe('ManageTimeline Service', () => {
  let timelineService: ManageTimeline;

  beforeAll(async () => {
    await setupTestDatabase();
    timelineService = new ManageTimeline();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean up
    await dbExecute('DELETE FROM scenes');
    await dbExecute('DELETE FROM shoot_days');
    await dbExecute('DELETE FROM scenarios');

    // Seed Data
    await dbExecute(`
      INSERT INTO scenarios (id, title, status)
      VALUES ('scen-1', 'Test Scenario', 'DRAFT')
    `);

    await dbExecute(`
      INSERT INTO shoot_days (id, scenario_id, shoot_date)
      VALUES ('day-1', 'scen-1', '2026-07-01')
    `);

    await dbExecute(`
      INSERT INTO scenes (id, scenario_id, scene_number, title, shoot_day_id)
      VALUES 
      ('scn-1', 'scen-1', 1, 'Scene 1', 'day-1'),
      ('scn-2', 'scen-1', 2, 'Scene 2', NULL),
      ('scn-3', 'scen-1', 3, 'Scene 3', NULL)
    `);
  });

  it('should get timeline data correctly separated', async () => {
    const data = await timelineService.getTimelineData('scen-1');
    expect(data.shootDays.length).toBe(1);
    expect(data.shootDays[0].id).toBe('day-1');
    expect(data.shootDays[0].scenes.length).toBe(1);
    expect(data.shootDays[0].scenes[0].id).toBe('scn-1');

    expect(data.unscheduledScenes.length).toBe(2);
    expect(data.unscheduledScenes[0].id).toBe('scn-2');
    expect(data.unscheduledScenes[1].id).toBe('scn-3');
  });

  it('should assign a scene to a shoot day', async () => {
    await timelineService.assignScene('scn-2', 'day-1');
    
    const data = await timelineService.getTimelineData('scen-1');
    expect(data.shootDays[0].scenes.length).toBe(2);
    expect(data.unscheduledScenes.length).toBe(1);
  });

  it('should unassign a scene when destDayId is null', async () => {
    await timelineService.assignScene('scn-1', null);
    
    const data = await timelineService.getTimelineData('scen-1');
    expect(data.shootDays[0].scenes.length).toBe(0);
    expect(data.unscheduledScenes.length).toBe(3);
  });

  it('should delete a shoot day and unassign all its scenes', async () => {
    // First let's assign scn-2 to day-1 as well
    await timelineService.assignScene('scn-2', 'day-1');

    await timelineService.deleteWithUnassign('day-1');

    const data = await timelineService.getTimelineData('scen-1');
    expect(data.shootDays.length).toBe(0);
    expect(data.unscheduledScenes.length).toBe(3); // scn-1, scn-2, scn-3 are all unassigned now
  });
});

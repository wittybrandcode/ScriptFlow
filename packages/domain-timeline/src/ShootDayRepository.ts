import { BaseRepository } from '@scriptflow/database';
import { IShootDay, ProjectID } from '@scriptflow/core';
import { dbSelect, dbExecute } from '@scriptflow/database';

export class ShootDayRepository extends BaseRepository<IShootDay> {
  protected readonly tableName = 'shoot_days';

  async getByScenarioId(scenarioId: ProjectID): Promise<IShootDay[]> {
    return this.findAllBy('scenario_id', scenarioId);
  }

  /**
   * Get shoot days with their assigned scenes.
   */
  async getTimelineData(scenarioId: ProjectID): Promise<{ shootDays: any[]; unscheduledScenes: any[] }> {
    const days = await dbSelect<IShootDay>(
      'SELECT * FROM shoot_days WHERE scenario_id = $1 ORDER BY shoot_date ASC',
      [scenarioId]
    );

    const shootDays = [];
    for (const day of days) {
      const dayScenes = await dbSelect(
        'SELECT * FROM scenes WHERE shoot_day_id = $1 AND deleted_at IS NULL ORDER BY scene_number ASC',
        [day.id]
      );
      shootDays.push({ ...day, scenes: dayScenes });
    }

    const unscheduledScenes = await dbSelect(
      'SELECT * FROM scenes WHERE scenario_id = $1 AND shoot_day_id IS NULL AND deleted_at IS NULL ORDER BY scene_number ASC',
      [scenarioId]
    );

    return { shootDays, unscheduledScenes };
  }

  /**
   * Assign a scene to a shoot day (or unassign if destDayId is null).
   */
  async assignScene(sceneId: string, destDayId: string | null): Promise<void> {
    if (destDayId) {
      await dbExecute('UPDATE scenes SET shoot_day_id = $1 WHERE id = $2', [destDayId, sceneId]);
    } else {
      await dbExecute('UPDATE scenes SET shoot_day_id = NULL WHERE id = $1', [sceneId]);
    }
  }

  /**
   * Unassign all scenes from a shoot day, then delete the day.
   */
  async deleteWithUnassign(dayId: string): Promise<void> {
    await dbExecute('UPDATE scenes SET shoot_day_id = NULL WHERE shoot_day_id = $1', [dayId]);
    await this.delete(dayId);
  }
}

import { BaseRepository } from './BaseRepository.js';
import type { IShootDay } from '@scriptflow/core';
import { dbSelect, dbExecute } from './client.js';

export class ShootDayRepository extends BaseRepository<IShootDay> {
  protected readonly tableName = 'shoot_days';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<IShootDay[]> {
    return this.findAllBy('scenario_id', scenarioId, tx);
  }

  async getTimelineData(scenarioId: string): Promise<{ shootDays: any[]; unscheduledScenes: any[] }> {
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

  async assignScene(sceneId: string, destDayId: string | null): Promise<void> {
    if (destDayId) {
      await dbExecute('UPDATE scenes SET shoot_day_id = $1 WHERE id = $2', [destDayId, sceneId]);
    } else {
      await dbExecute('UPDATE scenes SET shoot_day_id = NULL WHERE id = $1', [sceneId]);
    }
  }

  async deleteWithUnassign(dayId: string): Promise<void> {
    await dbExecute('UPDATE scenes SET shoot_day_id = NULL WHERE shoot_day_id = $1', [dayId]);
    await this.delete(dayId);
  }
}

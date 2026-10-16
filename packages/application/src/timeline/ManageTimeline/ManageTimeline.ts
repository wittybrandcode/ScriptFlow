import { dbSelect, dbExecute, withTransaction } from '@scriptflow/database';

export class ManageTimeline {
  /**
   * Generates timeline data (shoot days + unscheduled scenes)
   */
  public async getTimelineData(scenarioId: string): Promise<{ shootDays: any[]; unscheduledScenes: any[] }> {
    const days = await dbSelect<any>(
      'SELECT * FROM shoot_days WHERE scenario_id = $1 ORDER BY shoot_date ASC',
      [scenarioId]
    );

    const allScenes = await dbSelect<any>(
      'SELECT * FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL ORDER BY COALESCE(shoot_order, scene_number) ASC, scene_number ASC',
      [scenarioId]
    );

    const scenesByDay: Record<string, any[]> = {};
    const unscheduledScenes = [];
    
    for (const scene of allScenes) {
      if (scene.shoot_day_id) {
        if (!scenesByDay[scene.shoot_day_id]) scenesByDay[scene.shoot_day_id] = [];
        scenesByDay[scene.shoot_day_id].push(scene);
      } else {
        unscheduledScenes.push(scene);
      }
    }

    const shootDays = days.map(day => ({
      ...day,
      scenes: scenesByDay[day.id] || []
    }));

    return { shootDays, unscheduledScenes };
  }

  /**
   * Assigns a scene to a shoot day
   */
  public async assignScene(sceneId: string, destDayId: string | null, shootOrder?: number | null): Promise<void> {
    if (destDayId) {
      if (shootOrder !== undefined && shootOrder !== null) {
        await dbExecute('UPDATE scenes SET shoot_day_id = $1, shoot_order = $2 WHERE id = $3', [destDayId, shootOrder, sceneId]);
      } else {
        await dbExecute('UPDATE scenes SET shoot_day_id = $1 WHERE id = $2', [destDayId, sceneId]);
      }
    } else {
      await dbExecute('UPDATE scenes SET shoot_day_id = NULL, shoot_order = NULL WHERE id = $1', [sceneId]);
    }
  }

  /**
   * Deletes a shoot day and unassigns all its scenes
   */
  public async deleteWithUnassign(dayId: string): Promise<void> {
    await withTransaction(async (tx) => {
      await tx.execute('UPDATE scenes SET shoot_day_id = NULL WHERE shoot_day_id = $1', [dayId]);
      await tx.execute('DELETE FROM shoot_days WHERE id = $1', [dayId]);
    });
  }
}

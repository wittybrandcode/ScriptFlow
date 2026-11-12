import { BaseRepository } from './BaseRepository.js';
import { generateId, type IScene } from '@scriptflow/core';
import { dbExecute, dbSelect, withTransaction, TransactionContext } from './client.js';

export class SceneRepository extends BaseRepository<IScene> {
  protected readonly tableName = 'scenes';
  protected readonly allowedColumns = [
    'id', 'scenario_id', 'episode_id', 'location_id', 'shoot_day_id', 'scene_number', 'title', 
    'location_type', 'location_name', 'time_of_day', 'exact_time', 'weather', 'description', 
    'page_count', 'estimated_duration', 'color', 'revision_color', 'continuity', 'time_shift', 
    'director_notes', 'extras_note', 'present_characters', 'notes', 'status', 
    'shoot_order', 'planned_shoot_date', 'source_scene_id', 'clone_type', 
    'version', 'page_eighths', 'created_at', 'deleted_at'
  ];

  async getByScenarioId(scenarioId: string, tx?: TransactionContext): Promise<IScene[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'scene_number ASC, created_at ASC', tx);
  }

  async getByEpisodeId(episodeId: string, tx?: TransactionContext): Promise<IScene[]> {
    return this.findActiveBy('episode_id', episodeId, 'scene_number ASC, created_at ASC', tx);
  }

  async getReminders(sceneId: string, tx?: TransactionContext) {
    const query = 'SELECT * FROM scene_reminders WHERE scene_id = $1 ORDER BY created_at DESC';
    return tx ? tx.select(query, [sceneId]) : dbSelect(query, [sceneId]);
  }

  async getAllReminders(scenarioId: string, tx?: TransactionContext) {
    const query = `
      SELECT r.*, s.scene_number, s.title as scene_title 
      FROM scene_reminders r 
      JOIN scenes s ON r.scene_id = s.id 
      WHERE s.scenario_id = $1 AND s.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `;
    return tx ? tx.select(query, [scenarioId]) : dbSelect(query, [scenarioId]);
  }

  async addReminder(sceneId: string, content: string, tx?: TransactionContext) {
    const id = generateId('rem');
    const insertQuery = 'INSERT INTO scene_reminders (id, scene_id, content) VALUES ($1, $2, $3)';
    const selectQuery = 'SELECT * FROM scene_reminders WHERE id = $1';
    if (tx) {
      await tx.execute(insertQuery, [id, sceneId, content]);
      const rows = await tx.select(selectQuery, [id]);
      return rows[0];
    } else {
      await dbExecute(insertQuery, [id, sceneId, content]);
      const rows = await dbSelect(selectQuery, [id]);
      return rows[0];
    }
  }

  async updateReminder(id: string, isCompleted: boolean, content: string, tx?: TransactionContext) {
    const query = 'UPDATE scene_reminders SET is_completed = $1, content = $2 WHERE id = $3';
    if (tx) {
      await tx.execute(query, [isCompleted ? 1 : 0, content, id]);
    } else {
      await dbExecute(query, [isCompleted ? 1 : 0, content, id]);
    }
  }

  async deleteReminder(id: string, tx?: TransactionContext) {
    const query = 'DELETE FROM scene_reminders WHERE id = $1';
    if (tx) {
      await tx.execute(query, [id]);
    } else {
      await dbExecute(query, [id]);
    }
  }

  async reorderScenes(sceneIds: string[], tx?: TransactionContext) {
    const runReorder = async (context: TransactionContext) => {
      for (let i = 0; i < sceneIds.length; i++) {
        await context.execute('UPDATE scenes SET scene_number = $1 WHERE id = $2', [i + 1, sceneIds[i]]);
      }
    };

    if (tx) {
      await runReorder(tx);
    } else {
      await withTransaction(runReorder);
    }
  }
}

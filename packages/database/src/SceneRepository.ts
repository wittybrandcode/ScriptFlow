import { BaseRepository } from './BaseRepository.js';
import type { IScene } from '@scriptflow/core';
import { dbExecute, dbSelect, withTransaction } from './client.js';

export class SceneRepository extends BaseRepository<IScene> {
  protected readonly tableName = 'scenes';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<IScene[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'created_at DESC', tx);
  }

  async getByEpisodeId(episodeId: string): Promise<IScene[]> {
    return this.findActiveBy('episode_id', episodeId);
  }

  async ensureRemindersTable() {
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS scene_reminders (
        id TEXT PRIMARY KEY,
        scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getReminders(sceneId: string) {
    await this.ensureRemindersTable();
    return await dbSelect('SELECT * FROM scene_reminders WHERE scene_id = $1 ORDER BY created_at DESC', [sceneId]);
  }

  async getAllReminders(scenarioId: string) {
    await this.ensureRemindersTable();
    return await dbSelect(`
      SELECT r.*, s.scene_number, s.title as scene_title 
      FROM scene_reminders r 
      JOIN scenes s ON r.scene_id = s.id 
      WHERE s.scenario_id = $1 AND s.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `, [scenarioId]);
  }

  async addReminder(sceneId: string, content: string) {
    await this.ensureRemindersTable();
    const id = `rmd_${Math.random().toString(36).substr(2, 9)}`;
    await dbExecute('INSERT INTO scene_reminders (id, scene_id, content) VALUES ($1, $2, $3)', [id, sceneId, content]);
    const rows = await dbSelect('SELECT * FROM scene_reminders WHERE id = $1', [id]);
    return rows[0];
  }

  async updateReminder(id: string, isCompleted: boolean, content: string) {
    await this.ensureRemindersTable();
    await dbExecute('UPDATE scene_reminders SET is_completed = $1, content = $2 WHERE id = $3', [isCompleted ? 1 : 0, content, id]);
  }

  async deleteReminder(id: string) {
    await this.ensureRemindersTable();
    await dbExecute('DELETE FROM scene_reminders WHERE id = $1', [id]);
  }

  async reorderScenes(sceneIds: string[]) {
    await withTransaction(async (tx) => {
      for (let i = 0; i < sceneIds.length; i++) {
        await tx.execute('UPDATE scenes SET scene_number = $1 WHERE id = $2', [i + 1, sceneIds[i]]);
      }
    });
  }
}

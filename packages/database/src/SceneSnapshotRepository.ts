import { BaseRepository } from './BaseRepository';
import { dbExecute, dbSelect } from './client';

export interface SceneSnapshot {
  id?: number;
  scene_id: number;
  snapshot_json: string;
  trigger?: string;
  created_at?: string;
}

export class SceneSnapshotRepository extends BaseRepository<SceneSnapshot> {
  constructor() {
    super('scene_snapshots');
  }

  /**
   * Creates a new snapshot for a given scene.
   * Also automatically prunes older snapshots, keeping only the most recent `limit`.
   */
  async createSnapshot(sceneId: number, blocks: any[], trigger: string = 'auto', limit: number = 20): Promise<SceneSnapshot> {
    const snapshotJson = JSON.stringify(blocks);
    const snapshot = await this.insert({
      scene_id: sceneId,
      snapshot_json: snapshotJson,
      trigger
    });

    // Prune old snapshots
    await this.pruneOldSnapshots(sceneId, limit);

    return snapshot;
  }

  /**
   * Get all snapshots for a specific scene, ordered by creation time descending (newest first).
   */
  async getBySceneId(sceneId: number): Promise<SceneSnapshot[]> {
    const query = `
      SELECT * FROM scene_snapshots 
      WHERE scene_id = $1 
      ORDER BY created_at DESC
    `;
    return await dbSelect<SceneSnapshot>(query, [sceneId]);
  }

  /**
   * Deletes snapshots for a given scene, keeping only the most recent `limit`.
   */
  async pruneOldSnapshots(sceneId: number, limit: number): Promise<void> {
    const query = `
      DELETE FROM scene_snapshots 
      WHERE scene_id = $1 
      AND id NOT IN (
        SELECT id FROM scene_snapshots 
        WHERE scene_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      )
    `;
    await dbExecute(query, [sceneId, limit]);
  }
}

export const sceneSnapshotRepository = new SceneSnapshotRepository();

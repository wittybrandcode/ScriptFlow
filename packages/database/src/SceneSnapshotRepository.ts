import { BaseRepository } from './BaseRepository.js';
import { dbExecute, dbSelect } from './client.js';

export interface SceneSnapshot {
  id: string;
  scene_id: string;
  snapshot_json: string;
  trigger?: string;
  created_at?: string;
}

export class SceneSnapshotRepository extends BaseRepository<SceneSnapshot> {
  protected readonly tableName = 'scene_snapshots';

  /**
   * Creates a new snapshot for a given scene.
   * Also automatically prunes older snapshots, keeping only the most recent `limit`.
   */
  async createSnapshot(sceneId: string | number, blocks: any[], trigger: string = 'auto', limit: number = 20): Promise<SceneSnapshot> {
    const sId = String(sceneId);
    const snapshotJson = JSON.stringify(blocks);
    const newSnapshot: SceneSnapshot = {
      id: `snp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      scene_id: sId,
      snapshot_json: snapshotJson,
      trigger
    };

    await this.insert(newSnapshot);

    // Prune old snapshots
    await this.pruneOldSnapshots(sId, limit);

    return newSnapshot;
  }

  /**
   * Get all snapshots for a specific scene, ordered by creation time descending (newest first).
   */
  async getBySceneId(sceneId: string | number): Promise<SceneSnapshot[]> {
    const sId = String(sceneId);
    const query = `
      SELECT * FROM scene_snapshots 
      WHERE scene_id = $1 
      ORDER BY created_at DESC
    `;
    return await dbSelect<SceneSnapshot>(query, [sId]);
  }

  /**
   * Deletes snapshots for a given scene, keeping only the most recent `limit`.
   */
  async pruneOldSnapshots(sceneId: string | number, limit: number): Promise<void> {
    const sId = String(sceneId);
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
    await dbExecute(query, [sId, limit]);
  }
}

export const sceneSnapshotRepository = new SceneSnapshotRepository();


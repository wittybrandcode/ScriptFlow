import { BaseRepository } from './BaseRepository.js';
import type { IScriptBlock } from '@scriptflow/core';
import { dbSelect, dbExecute, withTransaction } from './client.js';

export class ScriptBlockRepository extends BaseRepository<IScriptBlock> {
  protected readonly tableName = 'script_blocks';

  async getBySceneId(sceneId: string): Promise<IScriptBlock[]> {
    return this.findAllBy('scene_id', sceneId);
  }

  async getSceneBlocks(sceneId: string) {
    return await dbSelect(`
      SELECT b.*, c.name as character_name
      FROM script_blocks b
      LEFT JOIN characters c ON b.character_id = c.id
      WHERE b.scene_id = $1
      ORDER BY b.sort_order
    `, [sceneId]);
  }

  async getBlocksForScenes(sceneIds: string[]) {
    if (!sceneIds || sceneIds.length === 0) return [];
    
    // SQLite has a limit of 999 bind variables per query. We chunk by 500 to be safe.
    const CHUNK_SIZE = 500;
    const allResults = [];
    
    for (let i = 0; i < sceneIds.length; i += CHUNK_SIZE) {
      const chunk = sceneIds.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map((_, index) => `$${index + 1}`).join(',');
      
      const chunkResults = await dbSelect(`
        SELECT b.*, c.name as character_name
        FROM script_blocks b
        LEFT JOIN characters c ON b.character_id = c.id
        WHERE b.scene_id IN (${placeholders})
        ORDER BY b.scene_id, b.sort_order
      `, chunk);
      
      allResults.push(...(chunkResults as any[]));
    }
    
    return allResults;
  }

  async reorderBlocks(blockIds: string[]) {
    // Execute all order updates inside a single atomic transaction 
    // to prevent queue flooding and massive micro-transactions.
    await withTransaction(async (tx) => {
      for (let i = 0; i < blockIds.length; i++) {
        await tx.execute('UPDATE script_blocks SET sort_order = $1 WHERE id = $2', [i * 65536, blockIds[i]]);
      }
    });
  }

  /**
   * Checks if sort_order gaps between consecutive blocks in a scene drop below threshold (< 1.0).
   * Automatically re-gaps the blocks if collision risk is detected.
   */
  async checkAndRegap(sceneId: string): Promise<void> {
    const blocks = await dbSelect<{ id: string; sort_order: number }>(`
      SELECT id, sort_order FROM script_blocks WHERE scene_id = $1 ORDER BY sort_order
    `, [sceneId]);

    if (blocks.length < 2) return;

    let needsRegap = false;
    for (let i = 1; i < blocks.length; i++) {
      const gap = (blocks[i].sort_order || 0) - (blocks[i - 1].sort_order || 0);
      if (gap < 1.0) {
        needsRegap = true;
        break;
      }
    }

    if (needsRegap) {
      console.log(`[ScriptBlockRepository] Re-gapping sort_order for scene ${sceneId}`);
      await this.reorderBlocks(blocks.map(b => b.id));
    }
  }
}

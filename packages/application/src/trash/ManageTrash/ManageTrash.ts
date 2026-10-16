import { withTransaction } from '@scriptflow/database';
import { ScenarioRepository } from '@scriptflow/database';

export class ManageTrash {
  private withTransactionFn: typeof withTransaction;
  private scenarioRepoFactory: () => ScenarioRepository;

  constructor(
    withTransactionFn: typeof withTransaction = withTransaction,
    scenarioRepoFactory: () => ScenarioRepository = () => new ScenarioRepository()
  ) {
    this.withTransactionFn = withTransactionFn;
    this.scenarioRepoFactory = scenarioRepoFactory;
  }

  /**
   * Restores an item from the trash
   */
  public async restoreItem(type: string, id: string): Promise<boolean> {
    let tableName = '';
    switch(type) {
      case 'scenario': tableName = 'scenarios'; break;
      case 'scene': tableName = 'scenes'; break;
      case 'location': tableName = 'locations'; break;
      case 'character': tableName = 'characters'; break;
      case 'crew': tableName = 'crew'; break;
      default: throw new Error('Unknown type');
    }
    
    return await this.withTransactionFn(async (tx) => {
      await tx.execute(`UPDATE ${tableName} SET deleted_at = NULL WHERE id = $1`, [id]);
      return true;
    });
  }

  /**
   * Permanently deletes an item and cascades deletions
   */
  public async purgeItem(type: string, id: string): Promise<boolean> {
    return await this.withTransactionFn(async (tx) => {
      if (type === 'scenario') {
        const repo = this.scenarioRepoFactory();
        await repo.hardDeleteScenario(id, tx);
        return true;
      }
      
      if (type === 'scene') {
        await tx.execute('DELETE FROM script_blocks WHERE scene_id = $1', [id]);
        await tx.execute('DELETE FROM scene_characters WHERE scene_id = $1', [id]);
        await tx.execute('DELETE FROM production_tasks WHERE scene_id = $1', [id]);
        await tx.execute('DELETE FROM crew_assignments WHERE scene_id = $1', [id]);
        await tx.execute('DELETE FROM scenes WHERE id = $1', [id]);
        return true;
      }

      if (type === 'location') {
        await tx.execute('DELETE FROM location_images WHERE location_id = $1', [id]);
        await tx.execute('DELETE FROM locations WHERE id = $1', [id]);
        return true;
      }
      
      if (type === 'character') {
        await tx.execute('DELETE FROM scene_characters WHERE character_id = $1', [id]);
        await tx.execute('DELETE FROM character_relationships WHERE character_id = $1 OR partner_id = $1', [id]);
        await tx.execute('UPDATE script_blocks SET character_id = NULL WHERE character_id = $1', [id]);
        await tx.execute('DELETE FROM characters WHERE id = $1', [id]);
        return true;
      }
      
      if (type === 'crew') {
        await tx.execute('DELETE FROM crew_assignments WHERE crew_id = $1', [id]);
        await tx.execute('DELETE FROM production_tasks WHERE crew_id = $1', [id]);
        await tx.execute('DELETE FROM crew WHERE id = $1', [id]);
        return true;
      }

      throw new Error('Unknown type');
    });
  }
}

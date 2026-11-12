import { dbSelect, withTransaction, TransactionContext } from './client.js';

export interface ITrashItem {
  type: 'scenario' | 'scene' | 'location' | 'character' | 'crew';
  id: string;
  name: string;
  scenario_title: string | null;
  deleted_at: string;
}

export class TrashRepository {
  async getTrashItems(): Promise<ITrashItem[]> {
    const queries = [
      `SELECT 'scenario' as type, id, title as name, NULL as scenario_title, deleted_at FROM scenarios WHERE deleted_at IS NOT NULL`,
      `SELECT 'scene' as type, s.id, s.title as name, sc.title as scenario_title, s.deleted_at FROM scenes s LEFT JOIN scenarios sc ON s.scenario_id = sc.id WHERE s.deleted_at IS NOT NULL`,
      `SELECT 'location' as type, l.id, l.name as name, sc.title as scenario_title, l.deleted_at FROM locations l LEFT JOIN scenarios sc ON l.scenario_id = sc.id WHERE l.deleted_at IS NOT NULL`,
      `SELECT 'character' as type, c.id, c.name as name, sc.title as scenario_title, c.deleted_at FROM characters c LEFT JOIN scenarios sc ON c.scenario_id = sc.id WHERE c.deleted_at IS NOT NULL`,
      `SELECT 'crew' as type, cr.id, cr.name as name, sc.title as scenario_title, cr.deleted_at FROM crew cr LEFT JOIN scenarios sc ON cr.scenario_id = sc.id WHERE cr.deleted_at IS NOT NULL`
    ];

    const allItems: ITrashItem[] = [];
    for (const query of queries) {
      try {
        const rows = await dbSelect<ITrashItem>(query);
        allItems.push(...rows);
      } catch (e) {
        console.warn('Query failed for trash fetch:', query, e);
      }
    }

    return allItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
  }

  async restoreItem(type: string, id: string, tx?: TransactionContext): Promise<boolean> {
    let tableName = '';
    switch(type) {
      case 'scenario': tableName = 'scenarios'; break;
      case 'scene': tableName = 'scenes'; break;
      case 'location': tableName = 'locations'; break;
      case 'character': tableName = 'characters'; break;
      case 'crew': tableName = 'crew'; break;
      default: throw new Error(`Unknown type: ${type}`);
    }
    
    const runRestore = async (context: TransactionContext) => {
      await context.execute(`UPDATE ${tableName} SET deleted_at = NULL WHERE id = $1`, [id]);
      return true;
    };

    if (tx) {
      return runRestore(tx);
    } else {
      return withTransaction(runRestore);
    }
  }

  async purgeItem(type: string, id: string, tx?: TransactionContext): Promise<boolean> {
    const runPurge = async (context: TransactionContext) => {
      if (type === 'scenario') {
        const { ScenarioRepository } = await import('./ScenarioRepository.js');
        const repo = new ScenarioRepository();
        await repo.hardDeleteScenario(id, context);
        return true;
      }
      
      if (type === 'scene') {
        await context.execute('DELETE FROM script_blocks WHERE scene_id = $1', [id]);
        await context.execute('DELETE FROM scene_characters WHERE scene_id = $1', [id]);
        await context.execute('DELETE FROM scene_snapshots WHERE scene_id = $1', [id]);
        await context.execute('DELETE FROM scene_reminders WHERE scene_id = $1', [id]);
        await context.execute('DELETE FROM production_tasks WHERE scene_id = $1', [id]);
        await context.execute('DELETE FROM crew_assignments WHERE scene_id = $1', [id]);
        await context.execute('DELETE FROM page_numbering WHERE item_id = $1', [id]);
        await context.execute('DELETE FROM scenes WHERE id = $1', [id]);
        return true;
      }

      if (type === 'location') {
        await context.execute('DELETE FROM location_documents WHERE location_id = $1', [id]);
        await context.execute('DELETE FROM location_images WHERE location_id = $1', [id]);
        await context.execute('UPDATE scenes SET location_id = NULL WHERE location_id = $1', [id]);
        await context.execute('DELETE FROM locations WHERE id = $1', [id]);
        return true;
      }
      
      if (type === 'character') {
        await context.execute('UPDATE characters SET father_id = NULL WHERE father_id = $1', [id]);
        await context.execute('UPDATE characters SET mother_id = NULL WHERE mother_id = $1', [id]);
        await context.execute('DELETE FROM scene_characters WHERE character_id = $1', [id]);
        await context.execute('DELETE FROM character_relationships WHERE character_id = $1 OR partner_id = $1', [id]);
        await context.execute('UPDATE script_blocks SET character_id = NULL WHERE character_id = $1', [id]);
        await context.execute('DELETE FROM characters WHERE id = $1', [id]);
        return true;
      }
      
      if (type === 'crew') {
        await context.execute('UPDATE characters SET actor_id = NULL WHERE actor_id = $1', [id]);
        await context.execute('DELETE FROM crew_day_assignments WHERE crew_id = $1', [id]);
        await context.execute('DELETE FROM crew_assignments WHERE crew_id = $1', [id]);
        await context.execute('DELETE FROM production_tasks WHERE crew_id = $1', [id]);
        await context.execute('DELETE FROM crew WHERE id = $1', [id]);
        return true;
      }

      throw new Error(`Unknown type: ${type}`);
    };

    if (tx) {
      return runPurge(tx);
    } else {
      return withTransaction(runPurge);
    }
  }
}

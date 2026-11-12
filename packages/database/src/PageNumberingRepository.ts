import { BaseRepository } from './BaseRepository.js';
import type { IPageNumbering } from '@scriptflow/core';
import { dbSelect, withTransaction, TransactionContext } from './client.js';

export class PageNumberingRepository extends BaseRepository<IPageNumbering> {
  protected readonly tableName = 'page_numbering';
  protected readonly allowedColumns = ['id', 'scenario_id', 'item_id', 'item_type', 'page_count', 'start_page', 'sort_order'];

  async getByScenarioId(scenarioId: string, tx?: TransactionContext): Promise<IPageNumbering[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE scenario_id = $1 ORDER BY sort_order ASC`;
    return tx ? tx.select<IPageNumbering>(query, [scenarioId]) : dbSelect<IPageNumbering>(query, [scenarioId]);
  }

  async savePageNumbering(scenarioId: string, records: IPageNumbering[], tx?: TransactionContext): Promise<void> {
    if (!scenarioId) return;

    const runSave = async (context: TransactionContext) => {
      await context.execute(`DELETE FROM ${this.tableName} WHERE scenario_id = $1`, [scenarioId]);
      if (!records || records.length === 0) return;

      // Deduplicate records to avoid UNIQUE constraint violations on (scenario_id, item_type, item_id)
      const seen = new Set<string>();
      const uniqueRecords: IPageNumbering[] = [];
      for (const rec of records) {
        const key = `${rec.scenario_id}__${rec.item_type}__${rec.item_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueRecords.push(rec);
        }
      }

      const CHUNK_SIZE = 50;
      for (let i = 0; i < uniqueRecords.length; i += CHUNK_SIZE) {
        const chunk = uniqueRecords.slice(i, i + CHUNK_SIZE);
        const values: any[] = [];
        const rowPlaceholders: string[] = [];
        chunk.forEach((rec, rIdx) => {
          const offset = rIdx * 7;
          rowPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
          values.push(rec.id, rec.scenario_id, rec.item_id, rec.item_type, rec.page_count, rec.start_page, rec.sort_order);
        });
        await context.execute(
          `INSERT OR REPLACE INTO ${this.tableName} (id, scenario_id, item_id, item_type, page_count, start_page, sort_order) VALUES ${rowPlaceholders.join(', ')}`,
          values
        );
      }
    };

    if (tx) {
      await runSave(tx);
    } else {
      await withTransaction(runSave);
    }
  }
}

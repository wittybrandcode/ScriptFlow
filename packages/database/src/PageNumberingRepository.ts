import { BaseRepository } from './BaseRepository.js';
import type { IPageNumbering } from '@scriptflow/core';
import { dbSelect, withTransaction } from './client.js';

export class PageNumberingRepository extends BaseRepository<IPageNumbering> {
  protected readonly tableName = 'page_numbering';
  protected readonly allowedColumns = ['id', 'scenario_id', 'item_id', 'item_type', 'page_count', 'start_page', 'sort_order'];

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<IPageNumbering[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE scenario_id = $1 ORDER BY sort_order ASC`;
    return tx ? await tx.select<IPageNumbering>(query, [scenarioId]) : await dbSelect<IPageNumbering>(query, [scenarioId]);
  }

  async savePageNumbering(scenarioId: string, records: IPageNumbering[]): Promise<void> {
    if (!scenarioId) return;
    const { dbExecute } = await import('./client.js');
    await dbExecute(`DELETE FROM ${this.tableName} WHERE scenario_id = $1`, [scenarioId]);
    if (!records || records.length === 0) return;

    // Batch insert in chunks of 50 to avoid SQLite bind variable limits and transaction overhead
    const CHUNK_SIZE = 50;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const values: any[] = [];
      const rowPlaceholders: string[] = [];
      chunk.forEach((rec, rIdx) => {
        const offset = rIdx * 7;
        rowPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        values.push(rec.id, rec.scenario_id, rec.item_id, rec.item_type, rec.page_count, rec.start_page, rec.sort_order);
      });
      await dbExecute(
        `INSERT INTO ${this.tableName} (id, scenario_id, item_id, item_type, page_count, start_page, sort_order) VALUES ${rowPlaceholders.join(', ')}`,
        values
      );
    }
  }
}

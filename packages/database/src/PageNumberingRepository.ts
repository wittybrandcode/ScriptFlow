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
    await withTransaction(async (tx) => {
      // 1. Delete all old page numbering records for this scenario
      await tx.execute(`DELETE FROM ${this.tableName} WHERE scenario_id = $1`, [scenarioId]);
      
      // 2. Insert new records one by one
      for (const record of records) {
        await this.insert(record, tx);
      }
    });
  }
}

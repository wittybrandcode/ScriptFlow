import { BaseRepository } from './BaseRepository.js';

export interface ITone {
  id: string;
  scenario_id: string;
  name: string;
  color: string;
  deleted_at: string | null;
}

export class ToneRepository extends BaseRepository<ITone> {
  protected readonly tableName = 'tones';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<ITone[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'created_at DESC', tx);
  }

  async findByName(name: string): Promise<ITone | null> {
    const results = await this.findAllBy('name', name);
    return results.length > 0 ? results[0] : null;
  }

  override async findAll(orderBy: string = 'name ASC'): Promise<ITone[]> {
    return super.findAll(orderBy);
  }
}

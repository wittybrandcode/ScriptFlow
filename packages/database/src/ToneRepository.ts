import { BaseRepository } from './BaseRepository.js';

export interface ITone {
  id: string;
  scenario_id?: string | null;
  name: string;
  color?: string;
  created_at?: string;
  deleted_at?: string | null;
}

export class ToneRepository extends BaseRepository<ITone> {
  protected readonly tableName = 'tones';
  protected readonly allowedColumns = ['id', 'scenario_id', 'name', 'color', 'created_at', 'deleted_at'];

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<ITone[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'created_at DESC', tx);
  }

  async findByName(name: string, scenarioId?: string): Promise<ITone | null> {
    if (scenarioId) {
      const results = await this.findActiveBy('scenario_id', scenarioId);
      return results.find(t => t.name === name) || null;
    }
    const results = await this.findAllBy('name', name);
    return results.length > 0 ? results[0] : null;
  }

  override async findAll(orderBy: string = 'name ASC'): Promise<ITone[]> {
    return super.findAll(orderBy);
  }
}

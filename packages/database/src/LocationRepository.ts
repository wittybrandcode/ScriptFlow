import { BaseRepository } from './BaseRepository.js';
import type { ILocation } from '@scriptflow/core';
import type { TransactionContext } from './client.js';

export class LocationRepository extends BaseRepository<ILocation> {
  protected readonly tableName = 'locations';
  
  protected readonly allowedColumns = [
    'id', 'scenario_id', 'parent_location_id', 'name', 'type', 
    'address', 'description', 'image', 'status', 'map_url', 
    'latitude', 'longitude', 'contact_name', 'contact_phone', 
    'permit_status', 'cost_per_day', 'cost_currency', 
    'technical_notes', 'created_at', 'deleted_at'
  ];

  private normalizeInput(data: Partial<ILocation>): Partial<ILocation> & Record<string, any> {
    const copy: Record<string, any> = { ...data };
    if ('location_type' in copy && !('type' in copy)) {
      copy.type = copy.location_type;
    }
    if ('image_url' in copy && !('image' in copy)) {
      copy.image = copy.image_url;
    }
    delete copy.location_type;
    delete copy.image_url;
    delete copy.updated_at;
    return copy as Partial<ILocation>;
  }

  private normalizeOutput(loc: any): ILocation {
    if (!loc) return loc;
    return {
      ...loc,
      location_type: loc.type || loc.location_type || 'INT',
      type: loc.type || loc.location_type || 'INT',
      image_url: loc.image || loc.image_url || '',
      image: loc.image || loc.image_url || ''
    };
  }

  override async findById(id: string, tx?: TransactionContext): Promise<ILocation | null> {
    const loc = await super.findById(id, tx);
    return loc ? this.normalizeOutput(loc) : null;
  }

  override async findAllBy(column: string, value: any, tx?: TransactionContext): Promise<ILocation[]> {
    const results = await super.findAllBy(column, value, tx);
    return results.map(r => this.normalizeOutput(r));
  }

  override async findActiveBy(column: string, value: any, orderBy: string = 'created_at DESC', tx?: TransactionContext): Promise<ILocation[]> {
    const results = await super.findActiveBy(column, value, orderBy, tx);
    return results.map(r => this.normalizeOutput(r));
  }

  override async findAllActive(tx?: TransactionContext): Promise<ILocation[]> {
    const results = await super.findAllActive(tx);
    return results.map(r => this.normalizeOutput(r));
  }

  override async findAll(orderBy: string = 'created_at DESC', tx?: TransactionContext): Promise<ILocation[]> {
    const results = await super.findAll(orderBy, tx);
    return results.map(r => this.normalizeOutput(r));
  }

  override async insert(record: Partial<ILocation> & { id: string }, tx?: TransactionContext): Promise<void> {
    const normalized = this.normalizeInput(record) as Partial<ILocation> & { id: string };
    return super.insert(normalized, tx);
  }

  override async update(id: string, fields: Partial<ILocation>, tx?: TransactionContext): Promise<void> {
    const normalized = this.normalizeInput(fields);
    return super.update(id, normalized, tx);
  }

  async getByScenarioId(scenarioId: string, tx?: TransactionContext): Promise<ILocation[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'created_at DESC', tx);
  }
}

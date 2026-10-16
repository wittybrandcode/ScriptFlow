import { BaseRepository } from './BaseRepository.js';
import type { ILocation } from '@scriptflow/core';

export class LocationRepository extends BaseRepository<ILocation> {
  protected readonly tableName = 'locations';
  
  // تفعيل الجدار الأمني لمنع حقول الواجهة الوهمية (مثل images) من تدمير الاستعلامات
  protected readonly allowedColumns = [
    'id', 'scenario_id', 'parent_location_id', 'name', 'type', 
    'address', 'description', 'image', 'status', 'map_url', 
    'latitude', 'longitude', 'contact_name', 'contact_phone', 
    'permit_status', 'cost_per_day', 'cost_currency', 
    'technical_notes', 'created_at', 'updated_at', 'deleted_at'
  ];

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<ILocation[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'created_at DESC', tx);
  }
}

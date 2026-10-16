import { BaseRepository } from './BaseRepository.js';

export interface LocationImage {
  id: string;
  location_id: string;
  image_url: string;
  is_primary?: number;
  sort_order?: number;
}

export class LocationImageRepository extends BaseRepository<LocationImage> {
  protected readonly tableName = 'location_images';

  async getByLocationId(locationId: string): Promise<LocationImage[]> {
    return this.findAllBy('location_id', locationId);
  }

  async getByScenarioId(scenarioId: string): Promise<LocationImage[]> {
    const { dbSelect } = await import('./client.js');
    return await dbSelect(`
      SELECT li.* FROM location_images li
      JOIN locations l ON li.location_id = l.id
      WHERE l.scenario_id = $1
    `, [scenarioId]);
  }
}

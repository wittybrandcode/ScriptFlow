import { BaseRepository } from '@scriptflow/database';
import { ICharacter, ProjectID } from '@scriptflow/core';

export class CharacterRepository extends BaseRepository<ICharacter> {
  protected readonly tableName = 'characters';

  protected readonly allowedColumns = [
    'id', 'scenario_id', 'actor_id', 'name', 'full_name', 'description',
    'color', 'age', 'role', 'gender', 'status', 'backstory', 'psychology',
    'physical_traits', 'arc', 'relationships', 'reference_images',
    'actor_name', 'actor_photo', 'phone', 'email', 'actor_bio',
    'father_id', 'mother_id', 'dramatic_pos_x', 'dramatic_pos_y',
    'birth_date', 'death_date', 'is_deceased', 'deleted_at'
  ];

  async getByScenarioId(scenarioId: ProjectID): Promise<ICharacter[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'name ASC');
  }
}

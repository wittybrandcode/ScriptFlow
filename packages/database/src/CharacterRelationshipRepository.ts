import { BaseRepository } from './BaseRepository.js';

export interface CharacterRelationship {
  id: string;
  scenario_id: string;
  character_id: string;
  partner_id: string;
  relationship_type: string;
  relationship_category: string;
  created_at?: string;
  updated_at?: string;
}

export class CharacterRelationshipRepository extends BaseRepository<CharacterRelationship> {
  protected readonly tableName = 'character_relationships';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<CharacterRelationship[]> {
    return this.findAllBy('scenario_id', scenarioId, tx);
  }

  async getByScenarioIdAndCategory(scenarioId: string, category?: string, tx?: import('./client.js').TransactionContext): Promise<CharacterRelationship[]> {
    if (!category) {
      return this.getByScenarioId(scenarioId, tx);
    }
    const { dbSelect } = await import('./client.js');
    const query = `SELECT * FROM ${this.tableName} WHERE scenario_id = $1 AND relationship_category = $2`;
    return tx ? await tx.select<CharacterRelationship>(query, [scenarioId, category]) : await dbSelect<CharacterRelationship>(query, [scenarioId, category]);
  }
}

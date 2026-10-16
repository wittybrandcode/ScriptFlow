import { BaseRepository } from './BaseRepository.js';
import type { ICharacter } from '@scriptflow/core';

export class CharacterRepository extends BaseRepository<ICharacter> {
  protected readonly tableName = 'characters';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<ICharacter[]> {
    return this.findActiveBy('scenario_id', scenarioId, 'name ASC', tx);
  }

  async getCharacterStats(scenarioId: string) {
    const { dbSelect } = await import('./client.js');
    
    const totalRes = await dbSelect<{count: number}>("SELECT COUNT(*) as count FROM script_blocks WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL) AND type IN ('DIALOGUE', 'PARENTHETICAL')", [scenarioId]);
    const totalDialogues = totalRes[0]?.count || 0;

    const stats = await dbSelect(`
      SELECT 
        c.id as character_id,
        COUNT(CASE WHEN b.type IN ('DIALOGUE', 'PARENTHETICAL') THEN 1 END) as dialogue_count,
        COUNT(DISTINCT b.scene_id) as scene_count
      FROM characters c
      LEFT JOIN script_blocks b ON c.id = b.character_id
      WHERE c.scenario_id = $1 AND c.deleted_at IS NULL
      GROUP BY c.id
    `, [scenarioId]);

    const map: Record<string, { dialogueCount: number, wordCount: number, sceneCount: number, appearancePercent: number }> = {};
    if (stats && stats.length > 0) {
      stats.forEach((stat: any) => {
        const percent = totalDialogues > 0 ? Math.round((stat.dialogue_count / totalDialogues) * 100) : 0;
        map[stat.character_id] = {
          dialogueCount: stat.dialogue_count || 0,
          wordCount: 0,
          sceneCount: stat.scene_count || 0,
          appearancePercent: percent
        };
      });
    }
    return map;
  }

  async assignActorToCharacters(actorId: string, scenarioId: string, characterIds: string[]) {
    const { withTransaction } = await import('./client.js');
    await withTransaction(async (tx) => {
      await tx.execute('UPDATE characters SET actor_id = NULL WHERE actor_id = $1 AND scenario_id = $2', [actorId, scenarioId]);
      for (const charId of characterIds) {
        await tx.execute('UPDATE characters SET actor_id = $1 WHERE id = $2 AND scenario_id = $3', [actorId, charId, scenarioId]);
      }
    });
  }

  async updateRPGData(characterId: string, rpgData: { traits: string[], isDisqualified: boolean, titles: string[], combatClass: string }) {
    const character = await this.findById(characterId);
    const currentMetadata = character?.metadata ? JSON.parse(character.metadata) : {};
    
    const updatedMetadata = {
      ...currentMetadata,
      rpg: rpgData
    };

    return await this.update(characterId, {
      metadata: JSON.stringify(updatedMetadata)
    });
  }
}

import { BaseRepository } from './BaseRepository.js';
import type { IEpisode } from '@scriptflow/core';
import { dbSelect, TransactionContext } from './client.js';

export class EpisodeRepository extends BaseRepository<IEpisode> {
  protected readonly tableName = 'episodes';
  protected readonly allowedColumns = [
    'id', 'scenario_id', 'episode_number', 'title', 'description', 'status', 'created_at'
  ];

  async getByScenarioId(scenarioId: string, tx?: TransactionContext): Promise<IEpisode[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE scenario_id = $1 ORDER BY episode_number ASC`;
    return tx ? tx.select<IEpisode>(query, [scenarioId]) : dbSelect<IEpisode>(query, [scenarioId]);
  }

  async getStats(scenarioId: string, tx?: TransactionContext): Promise<any> {
    const select = tx ? tx.select.bind(tx) : dbSelect;
    
    const episodes = await select<any>('SELECT * FROM episodes WHERE scenario_id = $1 ORDER BY episode_number ASC', [scenarioId]);
    const scenes = await select<any>('SELECT id, episode_id, estimated_duration FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL', [scenarioId]);
    
    const totalEpisodes = episodes.length;
    const totalScenes = scenes.length;
    const assignedScenes = scenes.filter(s => s.episode_id != null).length;
    const unassignedScenes = totalScenes - assignedScenes;
    const totalDuration = scenes.reduce((acc, s) => acc + (s.estimated_duration || 0), 0);
    
    const completedEpisodes = episodes.filter(e => e.status === 'COMPLETED').length;
    const completionRate = totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0;
    
    const blocks = await select<any>("SELECT scene_id, character_id, type FROM script_blocks WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL) AND type IN ('DIALOGUE', 'PARENTHETICAL')", [scenarioId]);
    
    const perEpisode = episodes.map(ep => {
      const epScenes = scenes.filter(s => s.episode_id === ep.id);
      const epSceneIds = epScenes.map(s => s.id);
      const epDuration = epScenes.reduce((acc, s) => acc + (s.estimated_duration || 0), 0);
      
      const epBlocks = blocks.filter(b => epSceneIds.includes(b.scene_id));
      const dialogueCount = epBlocks.length;
      const uniqueCharacters = new Set(epBlocks.map(b => b.character_id).filter(id => id)).size;
      
      return {
        id: ep.id,
        episode_number: ep.episode_number,
        title: ep.title,
        status: ep.status,
        scene_count: epScenes.length,
        total_duration: epDuration,
        dialogue_count: dialogueCount,
        unique_characters: uniqueCharacters
      };
    });
    
    const statusBreakdown = [
      { status: 'DRAFT', count: episodes.filter(e => (!e.status || e.status === 'DRAFT')).length },
      { status: 'IN_PROGRESS', count: episodes.filter(e => e.status === 'IN_PROGRESS').length },
      { status: 'COMPLETED', count: completedEpisodes }
    ];
    
    return {
      totalEpisodes,
      totalScenes,
      assignedScenes,
      unassignedScenes,
      totalDuration,
      completionRate,
      statusBreakdown,
      perEpisode
    };
  }
}

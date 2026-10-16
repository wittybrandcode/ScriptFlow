import { BaseRepository } from './BaseRepository.js';
import type { IEpisode } from '@scriptflow/core';

export class EpisodeRepository extends BaseRepository<IEpisode> {
  protected readonly tableName = 'episodes';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<IEpisode[]> {
    return this.findAllBy('scenario_id', scenarioId, tx);
  }

  async getStats(scenarioId: string): Promise<any> {
    const { dbSelect } = await import('./client.js');
    
    const episodes = await dbSelect<any>('SELECT * FROM episodes WHERE scenario_id = $1', [scenarioId]);
    const scenes = await dbSelect<any>('SELECT id, episode_id, estimated_duration FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL', [scenarioId]);
    
    const totalEpisodes = episodes.length;
    const totalScenes = scenes.length;
    const assignedScenes = scenes.filter(s => s.episode_id != null).length;
    const unassignedScenes = totalScenes - assignedScenes;
    const totalDuration = scenes.reduce((acc, s) => acc + (s.estimated_duration || 0), 0);
    
    const completedEpisodes = episodes.filter(e => e.status === 'COMPLETED').length;
    const completionRate = totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0;
    
    const blocks = await dbSelect<any>("SELECT scene_id, character_id, type FROM script_blocks WHERE scene_id IN (SELECT id FROM scenes WHERE scenario_id = $1 AND deleted_at IS NULL) AND type IN ('DIALOGUE', 'PARENTHETICAL')", [scenarioId]);
    
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
      avgScenesPerEpisode: totalEpisodes > 0 ? Math.round(assignedScenes / totalEpisodes) : 0,
      avgDurationPerEpisode: totalEpisodes > 0 ? Math.round(totalDuration / totalEpisodes) : 0,
      completionRate,
      perEpisode,
      statusBreakdown
    };
  }
}

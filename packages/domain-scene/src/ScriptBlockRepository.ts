import { BaseRepository } from '@scriptflow/database';
import { IScriptBlock } from '@scriptflow/core';

export class ScriptBlockRepository extends BaseRepository<IScriptBlock> {
  protected readonly tableName = 'script_blocks';

  async getBySceneId(sceneId: string): Promise<IScriptBlock[]> {
    return this.findAllBy('scene_id', sceneId);
  }
}

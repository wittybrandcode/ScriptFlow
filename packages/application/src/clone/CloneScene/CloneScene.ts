import { Outcome, DomainError, ErrorCode, generateId } from '@scriptflow/core';
import { SceneRepository, ScriptBlockRepository, withTransaction } from '@scriptflow/database';

export type CloneType = 'FLASHBACK' | 'FLASHFORWARD' | 'RECALL' | 'DUPLICATE' | 'ALTERNATE';

export interface CloneSceneRequest {
  originalSceneId: string;
  targetEpisodeId: string | null;
  cloneType: CloneType;
}

export class CloneScene {
  constructor(
    private sceneRepo: SceneRepository,
    private blockRepo: ScriptBlockRepository
  ) {}

  public async execute(request: CloneSceneRequest): Promise<Outcome<any>> {
    try {
      return await withTransaction(async (tx) => {
        const original = await this.sceneRepo.findById(request.originalSceneId, tx);
        
        if (!original) {
          return Outcome.fail(new DomainError({
            code: ErrorCode.VALIDATION,
            message: `Scene with ID ${request.originalSceneId} not found.`
          }));
        }

        const newSceneId = generateId('scn');
        const { created_at: _ca, deleted_at: _da, ...restOriginal } = original as any;
        const clonedData = {
          ...restOriginal,
          id: newSceneId,
          title: `${original.title || ''} (${request.cloneType})`,
          episode_id: request.targetEpisodeId || null,
          shoot_day_id: null,
          planned_shoot_date: '',
          shoot_order: null,
          source_scene_id: request.originalSceneId,
          clone_type: request.cloneType,
          status: 'DRAFT',
        };

        await this.sceneRepo.insert(clonedData, tx);

        const blocks = await this.blockRepo.getSceneBlocks(request.originalSceneId);
        
        for (const block of blocks) {
          const { character_name: _cn, ...cleanBlock } = block as any;
          const blockData = {
            ...cleanBlock,
            id: generateId('blk'),
            scene_id: newSceneId,
          };
          await this.blockRepo.insert(blockData, tx);
        }

        return Outcome.ok(clonedData);
      });
    } catch (e) {
      return Outcome.fail(new DomainError({
        code: ErrorCode.INTEGRITY,
        message: 'Failed to clone scene due to an infrastructure or integrity error.',
        cause: e
      }));
    }
  }
}

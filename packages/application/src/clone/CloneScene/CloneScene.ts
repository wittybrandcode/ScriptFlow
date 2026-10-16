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
        const clonedData = {
          ...original,
          id: newSceneId,
          title: `${original.title || ''} (${request.cloneType})`,
          episode_id: request.targetEpisodeId || null,
          source_scene_id: request.originalSceneId,
          clone_type: request.cloneType,
          status: 'DRAFT',
        };

        await this.sceneRepo.insert(clonedData as any, tx);

        const blocks = await this.blockRepo.getSceneBlocks(request.originalSceneId);
        
        for (const block of blocks) {
          const blockData = {
            ...(block as any),
            id: generateId('blk'),
            scene_id: newSceneId,
          };
          await this.blockRepo.insert(blockData as any, tx);
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

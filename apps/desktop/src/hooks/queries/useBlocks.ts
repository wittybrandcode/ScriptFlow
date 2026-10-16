import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScriptBlockRepository } from '@scriptflow/database';
import { generateId } from '@scriptflow/core';

const blockRepo = new ScriptBlockRepository();

export const blockApi = {
  getSceneBlocks: (sceneId: string) => blockRepo.getSceneBlocks(sceneId),
  getBlocksForScenes: (sceneIds: string[]) => blockRepo.getBlocksForScenes(sceneIds),
  getBySceneId: (sceneId: string) => blockRepo.getSceneBlocks(sceneId),
  insert: (record: any) => blockRepo.insert(record),
  update: (id: string, record: any) => blockRepo.update(id, record),
  delete: (id: string) => blockRepo.delete(id),
};

export const blockKeys = {
  all: ['blocks'] as const,
  byScene: (sceneId: string) => ['blocks', 'scene', sceneId] as const,
};

export function useBlocksQuery(sceneId: string | null) {
  return useQuery({
    queryKey: blockKeys.byScene(sceneId as string),
    queryFn: () => blockRepo.getSceneBlocks(sceneId as string),
    enabled: !!sceneId,
    staleTime: 5 * 60 * 1000, // 5 minutes fresh data
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
}

export function useCreateBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sceneId, data }: { sceneId: string; data: Record<string, any> }) => {
      const record = {
        ...data,
        id: data.id || generateId('blk'),
        scene_id: sceneId,
        type: data.type || 'ACTION',
        content: data.content || '',
        sort_order: data.sort_order || 0.0,
      };
      await blockRepo.insert(record as any);
      return record;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byScene(variables.sceneId) });
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
    },
  });
}

export function useUpdateBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      await blockRepo.update(id, data as any);
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
    },
  });
}

export function useDeleteBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await blockRepo.delete(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
    },
  });
}

export function useReorderBlocksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockIds: string[]) => {
      await blockRepo.reorderBlocks(blockIds);
      return blockIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
    },
  });
}

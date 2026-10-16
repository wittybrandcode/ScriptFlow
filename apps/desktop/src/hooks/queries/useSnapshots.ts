import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sceneSnapshotRepository } from '@scriptflow/database';

export const snapshotApi = sceneSnapshotRepository;

export function useSceneSnapshotsQuery(sceneId: number) {
  return useQuery({
    queryKey: ['scene_snapshots', sceneId],
    queryFn: () => snapshotApi.getBySceneId(sceneId),
    enabled: !!sceneId,
  });
}

export function useCreateSnapshotMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sceneId, blocks, trigger }: { sceneId: number, blocks: any[], trigger?: string }) => {
      return await snapshotApi.createSnapshot(sceneId, blocks, trigger);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scene_snapshots', variables.sceneId] });
    },
  });
}

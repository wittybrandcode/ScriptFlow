import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrashRepository } from '@scriptflow/database';
import { ManageTrash } from '@scriptflow/application';

const trashRepo = new TrashRepository();
const manageTrash = new ManageTrash();

export const trashKeys = {
  all: ['trash'] as const,
};

export function useTrashQuery() {
  return useQuery({
    queryKey: trashKeys.all,
    queryFn: () => trashRepo.getTrashItems(),
  });
}

export function useRestoreItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      await manageTrash.restoreItem(type, id);
      return { type, id };
    },
    onSuccess: ({ type }) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      // Invalidate specific domain queries so they refresh
      if (type === 'scenario') queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      if (type === 'scene') queryClient.invalidateQueries({ queryKey: ['scenes'] });
      if (type === 'location') queryClient.invalidateQueries({ queryKey: ['locations'] });
      if (type === 'character') queryClient.invalidateQueries({ queryKey: ['characters'] });
      if (type === 'crew') queryClient.invalidateQueries({ queryKey: ['crew'] });
    },
  });
}

export function usePurgeItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      await manageTrash.purgeItem(type, id);
      return { type, id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    },
  });
}

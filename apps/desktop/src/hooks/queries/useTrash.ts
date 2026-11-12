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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['crew'] });
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

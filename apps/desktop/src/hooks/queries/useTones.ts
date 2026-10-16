import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToneRepository } from '@scriptflow/database';
import { generateId } from '@scriptflow/core';

const toneRepo = new ToneRepository();

export const toneKeys = {
  all: ['tones'] as const,
};

/**
 * Fetch all tones (global, not per-scenario).
 */
export function useTonesQuery() {
  return useQuery({
    queryKey: toneKeys.all,
    queryFn: () => toneRepo.findAll(),
  });
}

/**
 * Create a new tone. Checks for duplicate names.
 */
export function useCreateToneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const existing = await toneRepo.findByName(name);
      if (existing) {
        throw new Error('هذه النبرة موجودة بالفعل');
      }
      const tone = { id: generateId('ton'), name };
      await toneRepo.insert(tone);
      return tone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toneKeys.all });
    },
  });
}

/**
 * Delete a tone (hard delete).
 */
export function useDeleteToneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (toneId: string) => {
      await toneRepo.delete(toneId);
      return toneId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toneKeys.all });
    },
  });
}

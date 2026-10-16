import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CharacterRepository } from '@scriptflow/database';
import { GenerateStatistics } from '@scriptflow/application';
import { generateId } from '@scriptflow/core';
import { resolveMediaUrl, processAndSaveMedia, unresolveMediaUrl } from '../../services/mediaStorage';
import { queryKeys } from './index';

const characterRepo = new CharacterRepository();
const generateStats = new GenerateStatistics();

export const characterKeys = {
  all: ['characters'] as const,
  byScenario: (scenarioId: string) => queryKeys.characters(scenarioId),
  detail: (id: string) => ['characters', 'detail', id] as const,
  stats: (scenarioId: string) => queryKeys.characterStats(scenarioId),
};

export function useCharacterStatsQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterStats(scenarioId as string),
    queryFn: async () => generateStats.executeCharacterStats(scenarioId as string),
    enabled: !!scenarioId,
  });
}

/**
 * Fetch all characters for a scenario.
 */
export function useCharactersQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: queryKeys.characters(scenarioId as string),
    queryFn: async () => {
      const list = await characterRepo.getByScenarioId(scenarioId as any);
      return list.map(c => ({
        ...c,
        actor_photo: resolveMediaUrl(c.actor_photo),
      }));
    },
    enabled: !!scenarioId,
  });
}

/**
 * Fetch a single character by ID.
 */
export function useCharacterDetailQuery(characterId: string | null) {
  return useQuery({
    queryKey: characterKeys.detail(characterId as string),
    queryFn: async () => {
      const c = await characterRepo.findById(characterId as string);
      if (!c) return null;
      return {
        ...c,
        actor_photo: resolveMediaUrl(c.actor_photo),
      };
    },
    enabled: !!characterId,
  });
}

/**
 * Create a new character.
 */
export function useCreateCharacterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const cleanData: any = { ...data, id: data.id || generateId('chr') };
      if (cleanData.scenario_id && cleanData.actor_photo) {
        cleanData.actor_photo = unresolveMediaUrl(cleanData.actor_photo, cleanData.scenario_id);
        await processAndSaveMedia(cleanData.scenario_id, cleanData, [
          { field: 'actor_photo', prefix: 'actor' }
        ]);
      }
      await characterRepo.insert(cleanData as any);
      return cleanData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
  });
}

/**
 * Update an existing character.
 */
export function useUpdateCharacterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const cleanData: any = { ...data };
      let scenarioId = cleanData.scenario_id;
      if (!scenarioId) {
        const existing: any = await characterRepo.findById(id);
        if (existing) scenarioId = existing.scenario_id;
      }
      if (scenarioId && cleanData.actor_photo) {
        cleanData.actor_photo = unresolveMediaUrl(cleanData.actor_photo, scenarioId);
        await processAndSaveMedia(scenarioId, cleanData, [
          { field: 'actor_photo', prefix: 'actor' }
        ]);
      }
      await characterRepo.update(id, cleanData as any);
      return { id, data: cleanData };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(variables.id) });
    },
  });
}

/**
 * Soft delete a character.
 */
export function useDeleteCharacterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (characterId: string) => {
      await characterRepo.softDelete(characterId);
      return characterId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
  });
}
/**
 * Assign actor to characters.
 */
export function useAssignActorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actorId, scenarioId, characterIds }: { actorId: string; scenarioId: string; characterIds: string[] }) => {
      await characterRepo.assignActorToCharacters(actorId, scenarioId, characterIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
  });
}
import { CharacterRelationshipRepository } from '@scriptflow/database';
const charRelRepo = new CharacterRelationshipRepository();
export const charRelApi = {
  getByScenarioId: (id: string) => charRelRepo.getByScenarioId(id)
};
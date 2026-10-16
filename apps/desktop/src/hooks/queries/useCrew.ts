import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CrewRepository } from '@scriptflow/database';
import { ManageCrew } from '@scriptflow/application';
import { generateId } from '@scriptflow/core';
import { resolveMediaUrl, processAndSaveMedia, unresolveMediaUrl } from '../../services/mediaStorage';

const crewRepo = new CrewRepository();
const manageCrew = new ManageCrew();

export const crewKeys = {
  all: ['crew'] as const,
  byScenario: (scenarioId: string) => ['crew', 'scenario', scenarioId] as const,
  assignments: (scenarioId: string) => ['crew', 'assignments', scenarioId] as const,
  detail: (id: string) => ['crew', 'detail', id] as const,
};

/**
 * Fetch all crew members for a scenario.
 */
export function useCrewQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: crewKeys.byScenario(scenarioId as string),
    queryFn: async () => {
      const list = await crewRepo.getByScenarioId(scenarioId as any);
      return list.map(c => ({
        ...c,
        image_url: resolveMediaUrl(c.image_url),
      }));
    },
    enabled: !!scenarioId,
  });
}

/**
 * Fetch crew assignments for a scenario.
 */
export function useCrewAssignmentsQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: crewKeys.assignments(scenarioId as string),
    queryFn: () => crewRepo.getAssignments(scenarioId as any),
    enabled: !!scenarioId,
  });
}

/**
 * Create a new crew member.
 */
export function useCreateCrewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const cleanData: any = { ...data, id: data.id || generateId('crw') };
      if (cleanData.scenario_id && cleanData.image_url) {
        cleanData.image_url = unresolveMediaUrl(cleanData.image_url, cleanData.scenario_id);
        await processAndSaveMedia(cleanData.scenario_id, cleanData, [
          { field: 'image_url', prefix: 'crew' }
        ]);
      }
      await crewRepo.insert(cleanData as any);
      return cleanData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.all });
    },
  });
}

/**
 * Atomic save of crew member + character assignments.
 */
export function useSaveCrewMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ crewData, assignedCharacters, scenarioId }: { crewData: any, assignedCharacters?: string[], scenarioId: string }) => {
      const { ManageCrew } = await import('@scriptflow/application');
      const manager = new ManageCrew();
      
      // Process media if needed
      if (crewData.image_url) {
        crewData.image_url = unresolveMediaUrl(crewData.image_url, scenarioId);
        await processAndSaveMedia(scenarioId, crewData, [
          { field: 'image_url', prefix: 'crew' }
        ]);
      }

      return await manager.saveCrewMemberWithActorAssignments(crewData, assignedCharacters, scenarioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.all });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

/**
 * Bulk create new crew members.
 */
export function useBulkCreateCrewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<Record<string, any>>) => {
      const records = items.map(data => ({
        ...data,
        id: data.id || generateId('crw'),
      }));
      await crewRepo.bulkInsert(records as any[]);
      return records;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.all });
    },
  });
}

/**
 * Update an existing crew member.
 */
export function useUpdateCrewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const cleanData: any = { ...data };
      let scenarioId = cleanData.scenario_id;
      if (!scenarioId) {
        const existing: any = await crewRepo.findById(id);
        if (existing) scenarioId = existing.scenario_id;
      }
      if (scenarioId && cleanData.image_url) {
        cleanData.image_url = unresolveMediaUrl(cleanData.image_url, scenarioId);
        await processAndSaveMedia(scenarioId, cleanData, [
          { field: 'image_url', prefix: 'crew' }
        ]);
      }
      await crewRepo.update(id, cleanData as any);
      return { id, data: cleanData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.all });
    },
  });
}

/**
 * Soft delete a crew member.
 */
export function useDeleteCrewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crewId: string) => {
      await crewRepo.softDelete(crewId);
      return crewId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.all });
    },
  });
}



/**
 * Sync crew assignments.
 */
export function useSyncCrewAssignmentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ crewId, scenarioId, assignments }: { crewId: string; scenarioId: string; assignments: any[] }) => {
      await manageCrew.syncAssignments(crewId, scenarioId as any, assignments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.all });
    },
  });
}

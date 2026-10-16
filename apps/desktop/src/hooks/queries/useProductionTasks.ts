import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductionTaskRepository, ProductionTask } from '@scriptflow/database';

const repo = new ProductionTaskRepository();

export function useProductionTasksQuery(scenarioId?: string) {
  return useQuery({
    queryKey: ['production_tasks', scenarioId],
    queryFn: async () => {
      if (!scenarioId) return [];
      return repo.getByScenarioId(scenarioId);
    },
    enabled: !!scenarioId,
  });
}

export function useCreateProductionTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductionTask> & { id: string }) => repo.insert(data),
    onSuccess: (_, variables) => {
      if (variables.scenario_id) {
        queryClient.invalidateQueries({ queryKey: ['production_tasks', variables.scenario_id] });
      }
    },
  });
}

export function useUpdateProductionTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductionTask> }) => repo.update(id, data),
    onSuccess: (_, variables) => {
      if (variables.data.scenario_id) {
        queryClient.invalidateQueries({ queryKey: ['production_tasks', variables.data.scenario_id] });
      }
    },
  });
}

export function useDeleteProductionTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => {
      // Invalidate all tasks queries since we don't know the scenarioId here
      queryClient.invalidateQueries({ queryKey: ['production_tasks'] });
    },
  });
}

export function useSceneTasksQuery(scenarioId?: string, sceneId?: string) {
  return useQuery({
    queryKey: ['scene_tasks', scenarioId, sceneId],
    queryFn: async () => {
      if (!scenarioId || !sceneId) return [];
      return repo.getBySceneIdWithCrew(scenarioId, sceneId);
    },
    enabled: !!scenarioId && !!sceneId,
  });
}

export function useCreateSceneTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { scenario_id: string; scene_id: string; department: string; title: string; crew_id: string | null }) => 
      repo.createForScene(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scene_tasks', variables.scenario_id, variables.scene_id] });
      queryClient.invalidateQueries({ queryKey: ['production_tasks', variables.scenario_id] });
    },
  });
}

export function useUpdateSceneTaskStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE'; scenarioId: string; sceneId: string }) => 
      repo.updateStatus(taskId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scene_tasks', variables.scenarioId, variables.sceneId] });
      queryClient.invalidateQueries({ queryKey: ['production_tasks', variables.scenarioId] });
    },
  });
}

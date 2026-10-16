import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageNumberingRepository } from '@scriptflow/database';
import type { IPageNumbering } from '@scriptflow/core';

const pageNumberingRepo = new PageNumberingRepository();

export const pageNumberingKeys = {
  all: ['pageNumbering'] as const,
  byScenario: (scenarioId: string) => ['pageNumbering', 'scenario', scenarioId] as const,
};

export function usePageNumberingQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: pageNumberingKeys.byScenario(scenarioId as string),
    queryFn: () => pageNumberingRepo.getByScenarioId(scenarioId as string),
    enabled: !!scenarioId,
  });
}

export function useSavePageNumberingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scenarioId, records }: { scenarioId: string; records: IPageNumbering[] }) => {
      await pageNumberingRepo.savePageNumbering(scenarioId, records);
      return { scenarioId, records };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pageNumberingKeys.byScenario(variables.scenarioId) });
    },
  });
}

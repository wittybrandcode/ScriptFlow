import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes (default for React Query)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

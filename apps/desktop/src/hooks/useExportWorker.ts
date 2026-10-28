import { useState, useCallback } from 'react';
import { ExportWorker, PaginationResult, SingleScenePaginationResult } from '../workers/ExportWorker';

/**
 * useExportWorker
 * 
 * Provides a clean interface for pagination and export calculation algorithms.
 */
export function useExportWorker() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);   // 0-100
  const [result, setResult] = useState<PaginationResult | null>(null);
  const [error, setError] = useState<any>(null);

  /**
   * Precalculates pagination without heavy memory duplication.
   */
  const precalculate = useCallback(async (scenes: any[], characters: any[] = []): Promise<PaginationResult | null> => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const workerResult = await ExportWorker.precalculatePagination(scenes, characters);

      setProgress(100);
      setResult(workerResult);
      return workerResult;
    } catch (err: any) {
      console.error('[useExportWorker] Precalculation failed:', err);
      setError(err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const paginateSingleScene = useCallback(async (blocks: any[], characters: any[] = []): Promise<SingleScenePaginationResult> => {
    try {
      const result = await ExportWorker.paginateSingleScene(blocks, characters);
      return result;
    } catch (err: any) {
      console.error('[useExportWorker] paginateSingleScene failed:', err);
      return { success: false, pages: [], totalPages: 0, error: String(err?.message || err) };
    }
  }, []);

  return {
    precalculate,
    paginateSingleScene,
    isProcessing,
    progress,
    result,
    error
  };
}

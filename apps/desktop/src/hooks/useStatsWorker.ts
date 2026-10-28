import { useState, useCallback } from 'react';
import { StatsWorker, StatsPayload, StatsResult } from '../workers/StatsWorker';

/**
 * useStatsWorker
 * 
 * Provides an interface for global screenplay analytics calculation.
 */
export function useStatsWorker() {
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [error, setError] = useState<any>(null);

  /**
   * Calculates global script statistics.
   */
  const calculate = useCallback(async (payload: StatsPayload): Promise<StatsResult | null> => {
    setIsCalculating(true);
    setError(null);

    try {
      const result = await StatsWorker.calculateGlobalStats(payload);
      setStats(result);
      return result;
    } catch (err: any) {
      console.error('[useStatsWorker] Calculation failed:', err);
      setError(err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return {
    calculate,
    isCalculating,
    stats,
    error
  };
}

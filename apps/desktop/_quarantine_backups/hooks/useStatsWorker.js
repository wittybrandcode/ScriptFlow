import { useState, useCallback } from 'react';
import { StatsWorker } from '../workers/StatsWorker';

/**
 * useStatsWorker
 * 
 * يوفر واجهة نظيفة لاستخدام خوارزمية الإحصائيات الشاملة.
 * تم نقلها للعمل المباشر على المعالج الرئيسي (Main Thread) 
 * كبديل للعمال الوهميين لإنهاء تجميد الواجهة بسبب (structuredClone).
 * 
 * الاستخدام:
 *   const { calculate, isCalculating, stats } = useStatsWorker();
 *   await calculate({ scenes, characters, locations, blocks });
 */
export function useStatsWorker() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  /**
   * يرسل بيانات السيناريو للحساب الفوري.
   * @param {{ scenes: Array, characters: Array, locations: Array, blocks: Array }} payload
   */
  const calculate = useCallback(async (payload) => {
    setIsCalculating(true);
    setError(null);

    try {
      // Zero-Copy Processing: التخلص من عملية الاستنساخ المدمرة (structuredClone)
      // نمرر المراجع الأصلية (Original References) مباشرة لأن الخوارزمية للقراءة فقط.
      const result = await StatsWorker.calculateGlobalStats(payload);
      
      setStats(result);
      return result;
    } catch (err) {
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

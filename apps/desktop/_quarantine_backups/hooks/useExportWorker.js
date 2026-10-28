import { useState, useCallback } from 'react';
import { ExportWorker } from '../workers/ExportWorker';

/**
 * useExportWorker
 * 
 * يوفر واجهة نظيفة لاستخدام خوارزمية التصدير والتقطيع.
 * تم نقلها للعمل المباشر على المعالج الرئيسي (Main Thread)
 * كبديل للعمال الوهميين لإنهاء تجميد الواجهة بسبب (structuredClone).
 * 
 * الاستخدام:
 *   const { precalculate, isProcessing, progress, result } = useExportWorker();
 *   await precalculate(scenes, characters);
 */
export function useExportWorker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);   // 0-100
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * يحسب التقطيع مسبقاً دون استنساخ مدمر للذاكرة.
   */
  const precalculate = useCallback(async (scenes, characters) => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      // Zero-Copy Processing: التخلص من عملية الاستنساخ المدمرة (structuredClone)
      const workerResult = await ExportWorker.precalculatePagination(scenes, characters);

      setProgress(100);
      setResult(workerResult);
      return workerResult;
    } catch (err) {
      console.error('[useExportWorker] Precalculation failed:', err);
      setError(err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const paginateSingleScene = useCallback(async (blocks, characters) => {
    try {
      const result = await ExportWorker.paginateSingleScene(blocks, characters);
      return result;
    } catch (err) {
      console.error('[useExportWorker] paginateSingleScene failed:', err);
      return { success: false, pages: [], totalPages: 0, error: String(err) };
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

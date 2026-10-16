import { describe, it, expect, vi } from 'vitest';
import { workerFactory } from '../workers/WorkerFactory';
import * as Comlink from 'comlink';

// Mocking the browser Web Worker API and Comlink wrap for Vitest environment
global.Worker = vi.fn().mockImplementation(function() {
  this.postMessage = vi.fn();
  this.terminate = vi.fn();
  return this;
});

vi.mock('comlink', () => ({
  wrap: vi.fn().mockReturnValue({
    precalculatePagination: vi.fn().mockResolvedValue({ totalEstimatedPages: 45 }),
    calculateGlobalStats: vi.fn().mockResolvedValue({ success: true, executionTimeMs: 12 }),
    [Symbol.for('Comlink.releaseProxy')]: vi.fn(),
  }),
  releaseProxy: Symbol.for('Comlink.releaseProxy'),
}));

describe('WorkerFactory & Web Workers Architecture', () => {

  it('1. Should instantiate ExportWorker and wrap it with Comlink', async () => {
    const exportWorker = workerFactory.getExportWorker();
    
    expect(global.Worker).toHaveBeenCalled();
    expect(Comlink.wrap).toHaveBeenCalled();
    
    const result = await exportWorker.precalculatePagination([], []);
    expect(result.totalEstimatedPages).toBe(45);
  });

  it('2. Should instantiate StatsWorker and compute analytics', async () => {
    const statsWorker = workerFactory.getStatsWorker();
    
    expect(statsWorker).toBeDefined();
    
    const result = await statsWorker.calculateGlobalStats({});
    expect(result.success).toBe(true);
    expect(result.executionTimeMs).toBe(12);
  });

  it('3. Should reuse existing workers to save memory (Singleton pattern)', () => {
    // Calling it again should not trigger a new Worker instantiation
    const worker1 = workerFactory.getStatsWorker();
    const worker2 = workerFactory.getStatsWorker();
    
    expect(worker1).toBe(worker2); // Reference equality
  });

});

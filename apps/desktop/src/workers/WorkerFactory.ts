import * as Comlink from 'comlink';
import type { IExportWorker } from './ExportWorker';
import type { IStatsWorker } from './StatsWorker';

class WorkerFactory {
  private workers: {
    export?: Comlink.Remote<IExportWorker>;
    stats?: Comlink.Remote<IStatsWorker>;
    [key: string]: any;
  } = {};

  private rawWorkers: {
    export?: Worker;
    stats?: Worker;
    [key: string]: Worker | undefined;
  } = {};

  getExportWorker(): Comlink.Remote<IExportWorker> {
    if (!this.workers.export) {
      const rawWorker = new Worker(new URL('./ExportWorker.ts', import.meta.url), { type: 'module' });
      this.rawWorkers.export = rawWorker;
      this.workers.export = Comlink.wrap<IExportWorker>(rawWorker);
    }
    return this.workers.export;
  }

  getStatsWorker(): Comlink.Remote<IStatsWorker> {
    if (!this.workers.stats) {
      const rawWorker = new Worker(new URL('./StatsWorker.ts', import.meta.url), { type: 'module' });
      this.rawWorkers.stats = rawWorker;
      this.workers.stats = Comlink.wrap<IStatsWorker>(rawWorker);
    }
    return this.workers.stats;
  }

  terminateAll(): void {
    Object.values(this.workers).forEach(w => {
      try {
        if (w && w[Comlink.releaseProxy]) {
          w[Comlink.releaseProxy]();
        }
      } catch (err) {
        console.warn('Failed to release proxy', err);
      }
    });
    Object.values(this.rawWorkers).forEach(rw => {
      try {
        rw?.terminate();
      } catch (err) {
        console.warn('Failed to terminate raw worker', err);
      }
    });
    this.workers = {};
    this.rawWorkers = {};
  }
}

export const workerFactory = new WorkerFactory();

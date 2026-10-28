import * as Comlink from 'comlink';
import type { IExportWorker } from './ExportWorker';
import type { IStatsWorker } from './StatsWorker';

class WorkerFactory {
  private workers: {
    export?: Comlink.Remote<IExportWorker>;
    stats?: Comlink.Remote<IStatsWorker>;
    [key: string]: any;
  } = {};

  getExportWorker(): Comlink.Remote<IExportWorker> {
    if (!this.workers.export) {
      const worker = new Worker(new URL('./ExportWorker.ts', import.meta.url), { type: 'module' });
      this.workers.export = Comlink.wrap<IExportWorker>(worker);
    }
    return this.workers.export;
  }

  getStatsWorker(): Comlink.Remote<IStatsWorker> {
    if (!this.workers.stats) {
      const worker = new Worker(new URL('./StatsWorker.ts', import.meta.url), { type: 'module' });
      this.workers.stats = Comlink.wrap<IStatsWorker>(worker);
    }
    return this.workers.stats;
  }

  terminateAll(): void {
    Object.values(this.workers).forEach(w => {
      if (w && w[Comlink.releaseProxy]) {
        w[Comlink.releaseProxy]();
      }
    });
    this.workers = {};
  }
}

export const workerFactory = new WorkerFactory();

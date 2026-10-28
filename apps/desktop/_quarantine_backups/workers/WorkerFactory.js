import * as Comlink from 'comlink';

class WorkerFactory {
  constructor() {
    this.workers = {};
  }

  getExportWorker() {
    if (!this.workers.export) {
      const worker = new Worker(new URL('./ExportWorker.js', import.meta.url), { type: 'module' });
      this.workers.export = Comlink.wrap(worker);
    }
    return this.workers.export;
  }

  getStatsWorker() {
    if (!this.workers.stats) {
      const worker = new Worker(new URL('./StatsWorker.js', import.meta.url), { type: 'module' });
      this.workers.stats = Comlink.wrap(worker);
    }
    return this.workers.stats;
  }

  terminateAll() {
    Object.values(this.workers).forEach(w => {
      if (w && w[Comlink.releaseProxy]) {
        w[Comlink.releaseProxy]();
      }
    });
    this.workers = {};
  }
}

export const workerFactory = new WorkerFactory();

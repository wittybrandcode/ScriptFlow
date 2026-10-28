interface QueueTask<T = any> {
  promiseFactory: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export default class PromiseQueue {
  private concurrency: number;
  private running: number;
  private queue: QueueTask[];

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add<T = any>(promiseFactory: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        promiseFactory,
        resolve,
        reject
      });
      this.next();
    });
  }

  private next(): void {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift();
    if (!task) return;

    const { promiseFactory, resolve, reject } = task;

    promiseFactory()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.next();
      });
  }
}

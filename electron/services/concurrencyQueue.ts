/**
 * A minimal concurrency-limited task runner. Avoids pulling in an external
 * dependency (e.g. p-limit) for something this small, per the "no
 * unnecessary libraries" requirement.
 */
export class ConcurrencyQueue {
  private maxConcurrent: number;
  private running = 0;
  private queue: Array<() => void> = [];
  private cancelled = false;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }

  setConcurrency(n: number) {
    this.maxConcurrent = Math.max(1, n);
    this.drain();
  }

  cancel() {
    this.cancelled = true;
    this.queue = [];
  }

  isCancelled() {
    return this.cancelled;
  }

  reset() {
    this.cancelled = false;
    this.running = 0;
    this.queue = [];
  }

  async run<T>(task: () => Promise<T>): Promise<T | undefined> {
    if (this.cancelled) return undefined;
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
      if (this.cancelled) return undefined;
    }
    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      this.drain();
    }
  }

  private drain() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

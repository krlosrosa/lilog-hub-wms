import type { Clock, Timer, TimerHandle } from '../ports/Clock.js';
import type { ConnectivityAdapter } from '../network/ConnectivityAdapter.js';
import type { OperationQueue } from '../queue/OperationQueue.js';

export interface SyncSchedulerDeps {
  clock: Clock;
  timer: Timer;
  connectivity: ConnectivityAdapter;
  queue: OperationQueue;
  debounceMs: number;
  onTrigger: () => Promise<void>;
}

export class SyncScheduler {
  private debounceHandle: TimerHandle | null = null;
  private retryHandle: TimerHandle | null = null;
  private running = false;
  private dirty = false;
  private unsubscribeConnectivity: (() => void) | null = null;
  private started = false;

  constructor(private readonly deps: SyncSchedulerDeps) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    this.unsubscribeConnectivity = this.deps.connectivity.subscribe((online) => {
      if (online) {
        this.scheduleTrigger(0);
      }
    });
  }

  stop(): void {
    this.started = false;
    this.debounceHandle?.cancel();
    this.retryHandle?.cancel();
    this.unsubscribeConnectivity?.();
    this.unsubscribeConnectivity = null;
  }

  notifyEnqueued(): void {
    this.scheduleTrigger(this.deps.debounceMs);
  }

  scheduleTrigger(delayMs: number): void {
    if (!this.started) return;
    this.debounceHandle?.cancel();
    this.debounceHandle = this.deps.timer.setTimeout(() => {
      void this.run();
    }, delayMs);
  }

  scheduleRetry(nextAttemptAt: number): void {
    const delayMs = Math.max(0, nextAttemptAt - this.deps.clock.now());
    this.retryHandle?.cancel();
    this.retryHandle = this.deps.timer.setTimeout(() => {
      this.scheduleTrigger(0);
    }, delayMs);
  }

  async run(): Promise<void> {
    if (this.running) {
      this.dirty = true;
      return;
    }

    this.running = true;
    try {
      do {
        this.dirty = false;
        await this.deps.onTrigger();
      } while (this.dirty);
    } finally {
      this.running = false;
    }
  }
}

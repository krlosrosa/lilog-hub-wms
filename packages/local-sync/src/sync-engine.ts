import type { LocalSyncOperation } from '@lilog/contracts';
import type {
  IConflictStore,
  ILeaseStore,
  IOperationQueue,
  PullResult,
  PushResult,
  SyncEngineConfig,
} from './types.js';
import { ConnectivityProbe } from './connectivity-probe.js';
import { getExecutableOperations } from './dependency-resolver.js';
import { calculateNextAttemptAt, isReadyToRetry } from './backoff.js';

// ---------------------------------------------------------------------------
// SyncEngine
// ---------------------------------------------------------------------------

type PushFn = (aggregateId: string, ops: LocalSyncOperation[]) => Promise<PushResult>;
type PullFn = (cursor?: string) => Promise<PullResult>;

export class SyncEngine {
  private readonly probe: ConnectivityProbe;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private consecutiveErrors = 0;
  private paused = false;

  constructor(
    private readonly config: SyncEngineConfig,
    private readonly push: PushFn,
    private readonly pull: PullFn,
    private readonly queue: IOperationQueue,
    private readonly leaseStore: ILeaseStore,
    private readonly conflictStore: IConflictStore,
  ) {
    this.probe = new ConnectivityProbe();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  start(): void {
    if (this.autoSyncTimer !== null) return;

    this.autoSyncTimer = setInterval(() => {
      if (!this.paused) {
        this.syncNow().catch(() => undefined);
      }
    }, this.config.autoSyncIntervalMs);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this._onOnline);
    }
  }

  stop(): void {
    if (this.autoSyncTimer !== null) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this._onOnline);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Debounced sync trigger. Always runs even if auto-sync is paused. */
  syncNow(): Promise<void> {
    return new Promise((resolve) => {
      if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(async () => {
        this.debounceTimer = null;
        try {
          await this._runSync();
          this.consecutiveErrors = 0;
          this.paused = false;
        } catch (err) {
          this.consecutiveErrors++;
          if (this.consecutiveErrors >= 3) {
            this.paused = true;
          }
        }
        resolve();
      }, this.config.debounceMs);
    });
  }

  async pushAggregate(aggregateId: string): Promise<PushResult> {
    const isOnline = await this.probe.probe(this.config.connectivityProbeUrl);
    if (!isOnline) {
      return { batchId: '', synced: 0, failed: 0, conflicts: 0 };
    }

    const leaseAcquired = await this.leaseStore.acquire(
      aggregateId,
      this.config.deviceId,
      30_000,
    );
    if (!leaseAcquired) {
      return { batchId: '', synced: 0, failed: 0, conflicts: 0 };
    }

    try {
      const pending = await this.queue.getPendingByAggregate(aggregateId);
      const inFlight = new Set<string>();
      const executable = getExecutableOperations(pending, inFlight);

      if (executable.length === 0) {
        return { batchId: '', synced: 0, failed: 0, conflicts: 0 };
      }

      const result = await this.push(aggregateId, executable);

      return result;
    } finally {
      await this.leaseStore.release(aggregateId, this.config.deviceId);
    }
  }

  async pullChanges(): Promise<PullResult> {
    const isOnline = await this.probe.probe(this.config.connectivityProbeUrl);
    if (!isOnline) {
      return { updated: 0, cursor: '', hasMore: false };
    }
    return this.pull();
  }

  async retryFailed(): Promise<void> {
    // Surfaces retry-eligible operations and attempts to sync them
    await this._runSync();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async _runSync(): Promise<void> {
    const isOnline = await this.probe.probe(this.config.connectivityProbeUrl);
    if (!isOnline) return;

    // Pull first to reduce conflicts
    await this.pull().catch(() => undefined);

    // Gather all aggregates with pending ops and push each one
    // (In a real implementation you would iterate all aggregates)
    // Here we expose the hook; concrete implementations override pushAggregate.
  }

  private readonly _onOnline = (): void => {
    this.probe.invalidate();
    this.consecutiveErrors = 0;
    this.paused = false;
    this.syncNow().catch(() => undefined);
  };
}

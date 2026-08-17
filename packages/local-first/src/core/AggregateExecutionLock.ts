import type { LockLease, LockPort } from '../ports/LockPort.js';

export class InMemoryLockPort implements LockPort {
  private leases = new Map<string, LockLease>();

  async acquire(aggregateId: string, ownerId: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.leases.get(aggregateId);
    if (existing && existing.expiresAt > now && existing.ownerId !== ownerId) {
      return false;
    }
    this.leases.set(aggregateId, {
      aggregateId,
      ownerId,
      acquiredAt: now,
      expiresAt: now + ttlMs,
    });
    return true;
  }

  async release(aggregateId: string, ownerId: string): Promise<void> {
    const lease = this.leases.get(aggregateId);
    if (lease?.ownerId === ownerId) {
      this.leases.delete(aggregateId);
    }
  }

  async heartbeat(aggregateId: string, ownerId: string, ttlMs: number): Promise<boolean> {
    const lease = this.leases.get(aggregateId);
    if (!lease || lease.ownerId !== ownerId) return false;
    lease.expiresAt = Date.now() + ttlMs;
    this.leases.set(aggregateId, lease);
    return true;
  }

  async releaseStaleLeases(now: number): Promise<number> {
    let released = 0;
    for (const [aggregateId, lease] of this.leases.entries()) {
      if (lease.expiresAt <= now) {
        this.leases.delete(aggregateId);
        released++;
      }
    }
    return released;
  }

  async isHeld(aggregateId: string): Promise<boolean> {
    const lease = this.leases.get(aggregateId);
    return lease !== undefined && lease.expiresAt > Date.now();
  }
}

export class AggregateExecutionLock {
  constructor(
    private readonly lockPort: LockPort,
    private readonly ownerId: string,
    private readonly ttlMs = 30_000,
  ) {}

  async acquire(aggregateId: string): Promise<boolean> {
    return this.lockPort.acquire(aggregateId, this.ownerId, this.ttlMs);
  }

  async release(aggregateId: string): Promise<void> {
    await this.lockPort.release(aggregateId, this.ownerId);
  }

  async heartbeat(aggregateId: string): Promise<boolean> {
    return this.lockPort.heartbeat(aggregateId, this.ownerId, this.ttlMs);
  }

  async releaseStaleLeases(now: number): Promise<number> {
    return this.lockPort.releaseStaleLeases(now);
  }
}

export class ParallelismSemaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly maxParallel: number) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.maxParallel) {
      this.active++;
      return () => this.release();
    }

    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    this.active++;
    return () => this.release();
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    next?.();
  }
}

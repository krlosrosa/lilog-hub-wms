export interface LockLease {
  aggregateId: string;
  ownerId: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface LockPort {
  acquire(aggregateId: string, ownerId: string, ttlMs: number): Promise<boolean>;
  release(aggregateId: string, ownerId: string): Promise<void>;
  heartbeat(aggregateId: string, ownerId: string, ttlMs: number): Promise<boolean>;
  releaseStaleLeases(now: number): Promise<number>;
  isHeld(aggregateId: string): Promise<boolean>;
}

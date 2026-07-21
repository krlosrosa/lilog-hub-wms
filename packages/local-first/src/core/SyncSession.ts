import type { SyncSessionRecord } from '../types/index.js';
import type { Clock } from '../ports/Clock.js';
import type { IdGenerator } from '../ports/IdGenerator.js';
import type { MetricsPort } from '../ports/MetricsPort.js';

export class SyncSession {
  readonly sessionId: string;
  readonly startedAt: number;
  status: SyncSessionRecord['status'] = 'running';
  operationsProcessed = 0;
  operationsSucceeded = 0;
  operationsFailed = 0;
  retries = 0;
  bytesSent = 0;
  bytesReceived = 0;
  batches = 0;
  conflicts = 0;
  finishedAt?: number;

  constructor(
    sessionId: string,
    startedAt: number,
  ) {
    this.sessionId = sessionId;
    this.startedAt = startedAt;
  }

  complete(now: number): SyncSessionRecord {
    this.status = 'completed';
    this.finishedAt = now;
    return this.toRecord(now);
  }

  abort(now: number): SyncSessionRecord {
    this.status = 'aborted';
    this.finishedAt = now;
    return this.toRecord(now);
  }

  toRecord(now: number): SyncSessionRecord {
    return {
      sessionId: this.sessionId,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      status: this.status,
      operationsProcessed: this.operationsProcessed,
      operationsSucceeded: this.operationsSucceeded,
      operationsFailed: this.operationsFailed,
      retries: this.retries,
      durationMs: (this.finishedAt ?? now) - this.startedAt,
      bytesSent: this.bytesSent,
      bytesReceived: this.bytesReceived,
      batches: this.batches,
      conflicts: this.conflicts,
    };
  }
}

export class SyncSessionFactory {
  constructor(
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  create(): SyncSession {
    return new SyncSession(this.idGenerator.generate(), this.clock.now());
  }
}

export function recordSessionMetrics(session: SyncSession, metrics: MetricsPort): void {
  metrics.increment('sync.session.completed', 1, { status: session.status });
  metrics.histogram('sync.session.duration_ms', session.toRecord(Date.now()).durationMs ?? 0);
  metrics.histogram('sync.session.bytes_sent', session.bytesSent);
  metrics.histogram('sync.session.bytes_received', session.bytesReceived);
}

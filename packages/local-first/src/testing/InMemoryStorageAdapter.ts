import type { Operation } from '../operations/Operation.js';
import type { OperationQuery, SessionQuery, SyncSessionRecord } from '../types/index.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';
import { cloneValue } from './clone.js';

export class InMemoryStorageAdapter implements StorageAdapter {
  private operations = new Map<string, Operation>();
  private sessions = new Map<string, SyncSessionRecord>();

  async saveOperation(operation: Operation): Promise<void> {
    this.operations.set(operation.id, cloneValue(operation));
  }

  async updateOperation(id: string, patch: Partial<Operation>): Promise<void> {
    const current = this.operations.get(id);
    if (!current) return;
    this.operations.set(id, { ...current, ...patch });
  }

  async deleteOperation(id: string): Promise<void> {
    this.operations.delete(id);
  }

  async findOperation(id: string): Promise<Operation | undefined> {
    const op = this.operations.get(id);
    return op ? cloneValue(op) : undefined;
  }

  async findOperations(query: OperationQuery): Promise<Operation[]> {
    let values = [...this.operations.values()];
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      values = values.filter((op) => statuses.includes(op.status));
    }
    if (query.aggregateId) {
      values = values.filter((op) => op.aggregateId === query.aggregateId);
    }
    if (query.readyBefore !== undefined) {
      values = values.filter(
        (op) => op.nextAttemptAt === undefined || op.nextAttemptAt <= query.readyBefore!,
      );
    }
    values.sort((a, b) => a.sequence - b.sequence);
    const offset = query.offset ?? 0;
    const limit = query.limit ?? values.length;
    return cloneValue(values.slice(offset, offset + limit));
  }

  async countOperations(query: OperationQuery): Promise<number> {
    return (await this.findOperations({ ...query, offset: 0, limit: Number.MAX_SAFE_INTEGER }))
      .length;
  }

  async saveSession(session: SyncSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, cloneValue(session));
  }

  async updateSession(sessionId: string, patch: Partial<SyncSessionRecord>): Promise<void> {
    const current = this.sessions.get(sessionId);
    if (!current) return;
    this.sessions.set(sessionId, { ...current, ...patch });
  }

  async findSession(sessionId: string): Promise<SyncSessionRecord | undefined> {
    const session = this.sessions.get(sessionId);
    return session ? cloneValue(session) : undefined;
  }

  async findSessions(query: SessionQuery): Promise<SyncSessionRecord[]> {
    let values = [...this.sessions.values()];
    if (query.status) {
      values = values.filter((session) => session.status === query.status);
    }
    const offset = query.offset ?? 0;
    const limit = query.limit ?? values.length;
    return cloneValue(values.slice(offset, offset + limit));
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

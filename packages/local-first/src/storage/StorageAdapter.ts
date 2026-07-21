import type { Operation } from '../operations/Operation.js';
import type { OperationQuery } from '../types/index.js';
import type { SyncSessionRecord } from '../types/index.js';

export interface StorageAdapter {
  saveOperation(operation: Operation): Promise<void>;
  updateOperation(id: string, patch: Partial<Operation>): Promise<void>;
  deleteOperation(id: string): Promise<void>;
  findOperation(id: string): Promise<Operation | undefined>;
  findOperations(query: OperationQuery): Promise<Operation[]>;
  countOperations(query: OperationQuery): Promise<number>;
  saveSession(session: SyncSessionRecord): Promise<void>;
  updateSession(sessionId: string, patch: Partial<SyncSessionRecord>): Promise<void>;
  findSession(sessionId: string): Promise<SyncSessionRecord | undefined>;
  findSessions(query: import('../types/index.js').SessionQuery): Promise<SyncSessionRecord[]>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

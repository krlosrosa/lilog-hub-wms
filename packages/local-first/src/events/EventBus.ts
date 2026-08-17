import type { Operation } from '../operations/Operation.js';
import type { BatchDescriptor } from '../types/index.js';
import type { SyncSessionRecord } from '../types/index.js';

export type SyncEventMap = {
  OperationStarted: { operation: Operation; sessionId: string };
  OperationCompleted: { operation: Operation; sessionId: string };
  OperationFailed: { operation: Operation; sessionId: string; error: string };
  RetryScheduled: { operation: Operation; nextAttemptAt: number; sessionId: string };
  SyncStarted: { sessionId: string };
  SyncFinished: { session: SyncSessionRecord };
  PushStarted: { sessionId: string };
  PushFinished: { sessionId: string; batches: number };
  PullStarted: { sessionId: string; scope: string };
  PullFinished: { sessionId: string; scope: string; bytesReceived: number };
  BatchBuilt: { batch: BatchDescriptor; sessionId: string };
  ConflictDetected: { operation: Operation; sessionId: string };
  UploadStarted: { operationId: string; sessionId: string };
  UploadFinished: { operationId: string; sessionId: string; bytesSent: number };
  SessionOpened: { session: SyncSessionRecord };
  SessionClosed: { session: SyncSessionRecord };
};

export type SyncEventName = keyof SyncEventMap;

export type SyncEventHandler<K extends SyncEventName> = (
  payload: SyncEventMap[K],
) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<SyncEventName, Set<SyncEventHandler<SyncEventName>>>();

  on<K extends SyncEventName>(event: K, handler: SyncEventHandler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as SyncEventHandler<SyncEventName>);
    this.handlers.set(event, set);
    return () => set.delete(handler as SyncEventHandler<SyncEventName>);
  }

  async emit<K extends SyncEventName>(event: K, payload: SyncEventMap[K]): Promise<void> {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        await handler(payload);
      } catch {
        // Subscribers must not break the engine
      }
    }
  }
}

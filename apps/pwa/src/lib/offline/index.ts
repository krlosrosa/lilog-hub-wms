export { db } from './db';
export type { OutboxEntry, OutboxStatus, PhotoEntry, SyncMeta } from './db';
export * from './outbox';
export * from './photo-store';
export {
  flushOutbox,
  syncNow,
  hasPendingSyncWork,
  registerOnlineSyncListener,
  getIsFlushing,
  subscribeSyncFlushing,
  triggerAutoSyncIfPending,
} from './sync-engine';
export { fetchDemands, fetchDevolucaoDemands, fetchInventoryDemands } from './api-client';

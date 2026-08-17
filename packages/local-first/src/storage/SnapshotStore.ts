import type { SnapshotRecord } from '../types/index.js';

export interface SnapshotStore {
  get(scope: string): Promise<SnapshotRecord | undefined>;
  set(record: SnapshotRecord): Promise<void>;
  delete(scope: string): Promise<void>;
}

import type { SnapshotRecord } from '../types/index.js';
import type { SnapshotStore } from '../storage/SnapshotStore.js';
import { cloneValue } from './clone.js';

export class InMemorySnapshotStore implements SnapshotStore {
  private snapshots = new Map<string, SnapshotRecord>();

  async get(scope: string): Promise<SnapshotRecord | undefined> {
    return this.snapshots.get(scope);
  }

  async set(record: SnapshotRecord): Promise<void> {
    this.snapshots.set(record.scope, cloneValue(record));
  }

  async delete(scope: string): Promise<void> {
    this.snapshots.delete(scope);
  }
}

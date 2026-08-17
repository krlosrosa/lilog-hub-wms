import type { SyncCheckpoint } from '../types/index.js';

export interface CheckpointRepository {
  get(scope: string): Promise<SyncCheckpoint | undefined>;
  set(scope: string, checkpoint: SyncCheckpoint): Promise<void>;
  delete(scope: string): Promise<void>;
}

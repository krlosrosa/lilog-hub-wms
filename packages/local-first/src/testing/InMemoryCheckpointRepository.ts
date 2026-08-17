import type { SyncCheckpoint } from '../types/index.js';
import type { CheckpointRepository } from '../storage/CheckpointRepository.js';
import { cloneValue } from './clone.js';

export class InMemoryCheckpointRepository implements CheckpointRepository {
  private checkpoints = new Map<string, SyncCheckpoint>();

  async get(scope: string): Promise<SyncCheckpoint | undefined> {
    return this.checkpoints.get(scope);
  }

  async set(scope: string, checkpoint: SyncCheckpoint): Promise<void> {
    this.checkpoints.set(scope, cloneValue(checkpoint));
  }

  async delete(scope: string): Promise<void> {
    this.checkpoints.delete(scope);
  }
}

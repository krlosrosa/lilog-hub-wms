import type { Transaction } from 'dexie';
import type { RecebimentoV2DB } from '../db.js';
import type { DamageRecord } from '../schema.js';

export class DamageRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async getDamages(demandId: string): Promise<DamageRecord[]> {
    return this.db.damages
      .where('demandId')
      .equals(demandId)
      .filter((r) => !r.deletedAt)
      .toArray();
  }

  async upsertDamage(record: DamageRecord, tx?: Transaction): Promise<void> {
    const table = tx ? tx.table<DamageRecord, string>('damages') : this.db.damages;
    await table.put(record);
  }

  async softDeleteDamage(id: string, tx?: Transaction): Promise<void> {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const table = tx ? tx.table<DamageRecord, string>('damages') : this.db.damages;
    await table.update(id, { deletedAt: now, syncStatus: 'pending', updatedAt: nowMs });
  }

  async getDirty(demandId: string): Promise<DamageRecord[]> {
    return this.db.damages
      .where('demandId')
      .equals(demandId)
      .filter((r) => r.syncStatus !== 'synced')
      .toArray();
  }

  async markSynced(id: string): Promise<void> {
    await this.db.damages.update(id, {
      syncStatus: 'synced',
      updatedAt: Date.now(),
    });
  }
}

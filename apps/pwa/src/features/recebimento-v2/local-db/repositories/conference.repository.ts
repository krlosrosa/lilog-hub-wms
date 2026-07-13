import type { Transaction } from 'dexie';
import type { RecebimentoV2DB } from '../db.js';
import type { ConferenceRecord } from '../schema.js';

export class ConferenceRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async getConferences(demandId: string): Promise<ConferenceRecord[]> {
    return this.db.conferences
      .where('demandId')
      .equals(demandId)
      .filter((r) => !r.deletedAt)
      .toArray();
  }

  async getConferencesBySku(demandId: string, sku: string): Promise<ConferenceRecord[]> {
    return this.db.conferences
      .where('demandId')
      .equals(demandId)
      .filter((r) => r.sku === sku && !r.deletedAt)
      .toArray();
  }

  async upsertConference(record: ConferenceRecord, tx?: Transaction): Promise<void> {
    const table = tx ? tx.table<ConferenceRecord, string>('conferences') : this.db.conferences;
    await table.put(record);
  }

  async softDeleteConferencesBySku(
    demandId: string,
    sku: string,
    tx?: Transaction,
  ): Promise<void> {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const table = tx ? tx.table<ConferenceRecord, string>('conferences') : this.db.conferences;

    const toDelete = await this.db.conferences
      .where('demandId')
      .equals(demandId)
      .filter((r) => r.sku === sku && !r.deletedAt)
      .toArray();

    for (const record of toDelete) {
      await table.update(record.id, { deletedAt: now, syncStatus: 'pending', updatedAt: nowMs });
    }
  }

  async markAllSynced(demandId: string): Promise<void> {
    const now = Date.now();
    await this.db.conferences
      .where('demandId')
      .equals(demandId)
      .filter((r) => r.syncStatus !== 'synced')
      .modify({ syncStatus: 'synced', updatedAt: now });
  }

  async getDirty(demandId: string): Promise<ConferenceRecord[]> {
    return this.db.conferences
      .where('demandId')
      .equals(demandId)
      .filter((r) => r.syncStatus !== 'synced')
      .toArray();
  }
}

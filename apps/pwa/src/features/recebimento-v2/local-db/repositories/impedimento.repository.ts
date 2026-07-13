import type { Transaction } from 'dexie';

import type { RecebimentoV2DB } from '../db.js';
import type { ImpedimentoRecord } from '../schema.js';

export class ImpedimentoRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async getImpedimento(demandId: string): Promise<ImpedimentoRecord | undefined> {
    return this.db.impedimentos
      .where('demandId')
      .equals(demandId)
      .first();
  }

  async upsertImpedimento(record: ImpedimentoRecord, tx?: Transaction): Promise<void> {
    const table = tx
      ? tx.table<ImpedimentoRecord, string>('impedimentos')
      : this.db.impedimentos;
    await table.put(record);
  }

  async getDirty(demandId: string): Promise<ImpedimentoRecord[]> {
    return this.db.impedimentos
      .where('demandId')
      .equals(demandId)
      .filter((record) => record.syncStatus !== 'synced')
      .toArray();
  }

  async markSynced(id: string): Promise<void> {
    await this.db.impedimentos.update(id, {
      syncStatus: 'synced',
      updatedAt: Date.now(),
    });
  }
}

import type { Transaction } from 'dexie';
import type { RecebimentoV2DB } from '../db.js';
import type { TemperatureRecord } from '../schema.js';

export class TemperatureRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async getTemperature(demandId: string, etapa: string): Promise<TemperatureRecord | undefined> {
    return this.db.temperatures.get(`${demandId}::${etapa}`);
  }

  async listTemperatures(demandId: string): Promise<TemperatureRecord[]> {
    return this.db.temperatures.where('demandId').equals(demandId).toArray();
  }

  async upsertTemperature(record: TemperatureRecord, tx?: Transaction): Promise<void> {
    const table = tx ? tx.table<TemperatureRecord, string>('temperatures') : this.db.temperatures;
    await table.put(record);
  }

  async getDirty(demandId: string): Promise<TemperatureRecord[]> {
    return this.db.temperatures
      .where('demandId')
      .equals(demandId)
      .filter((r) => r.syncStatus !== 'synced')
      .toArray();
  }

  async markSynced(demandId: string, etapa: string): Promise<void> {
    await this.db.temperatures.update(`${demandId}::${etapa}`, {
      syncStatus: 'synced',
      updatedAt: Date.now(),
    });
  }
}

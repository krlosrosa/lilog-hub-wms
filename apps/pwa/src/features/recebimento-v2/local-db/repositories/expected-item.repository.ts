import type { RecebimentoV2DB } from '../db.js';
import type { ExpectedItemRecord } from '../schema.js';

export class ExpectedItemRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async getItem(demandId: string, produtoId: string): Promise<ExpectedItemRecord | undefined> {
    return this.db.expectedItems.get(`${demandId}::${produtoId}`);
  }

  async listItems(demandId: string): Promise<ExpectedItemRecord[]> {
    return this.db.expectedItems.where('demandId').equals(demandId).toArray();
  }

  async upsertItem(record: ExpectedItemRecord): Promise<void> {
    await this.db.expectedItems.put(record);
  }

  async bulkUpsert(records: ExpectedItemRecord[]): Promise<void> {
    await this.db.expectedItems.bulkPut(records);
  }

  async deleteItemsByDemand(demandId: string): Promise<void> {
    await this.db.expectedItems.where('demandId').equals(demandId).delete();
  }
}

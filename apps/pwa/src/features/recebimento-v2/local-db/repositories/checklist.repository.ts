import type { Transaction } from 'dexie';
import type { RecebimentoV2DB } from '../db.js';
import type { ChecklistRecord, ChecklistTemplateRecord } from '../schema.js';

export class ChecklistRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async getChecklist(demandId: string): Promise<ChecklistRecord | undefined> {
    return this.db.checklists.get(demandId);
  }

  async upsertChecklist(record: ChecklistRecord, tx?: Transaction): Promise<void> {
    const table = tx ? tx.table<ChecklistRecord, string>('checklists') : this.db.checklists;
    await table.put(record);
  }

  async getTemplate(unidadeId: string): Promise<ChecklistTemplateRecord | undefined> {
    return this.db.checklistTemplates.get(unidadeId);
  }

  async upsertTemplate(record: ChecklistTemplateRecord): Promise<void> {
    await this.db.checklistTemplates.put(record);
  }

  async getDirty(): Promise<ChecklistRecord[]> {
    return this.db.checklists
      .filter((r) => r.syncStatus !== 'synced')
      .toArray();
  }

  async markSynced(demandId: string): Promise<void> {
    await this.db.checklists.update(demandId, {
      syncStatus: 'synced',
      updatedAt: Date.now(),
    });
  }
}

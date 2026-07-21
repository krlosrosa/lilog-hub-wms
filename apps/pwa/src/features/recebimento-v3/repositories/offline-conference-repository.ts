import { recebimentoV2Db, ensureRecebimentoV2DbReady } from '@/features/recebimento-v2/local-db/db';
import type {
  ChecklistRecord,
  ConferenceRecord,
  DamageRecord,
  ExpectedItemRecord,
  ImpedimentoRecord,
  MediaRecord,
  ProcessRecord,
  TemperatureRecord,
} from '@/features/recebimento-v2/local-db/schema';

export type OfflineConferenceSnapshot = {
  process: ProcessRecord | undefined;
  checklist: ChecklistRecord | undefined;
  conferences: ConferenceRecord[];
  damages: DamageRecord[];
  temperatures: TemperatureRecord[];
  impedimentos: ImpedimentoRecord[];
  expectedItems: ExpectedItemRecord[];
  media: MediaRecord[];
};

export class OfflineConferenceRepository {
  async ensureReady(): Promise<void> {
    await ensureRecebimentoV2DbReady();
  }

  async saveConference(record: ConferenceRecord): Promise<void> {
    await this.ensureReady();
    await recebimentoV2Db.conferences.put(record);
  }

  async removeConference(conferenceId: string): Promise<void> {
    await this.ensureReady();
    const current = await recebimentoV2Db.conferences.get(conferenceId);
    if (!current) {
      return;
    }
    if (!current.serverItemId && !current.serverPesagemId) {
      await recebimentoV2Db.conferences.delete(conferenceId);
      return;
    }
    const now = new Date().toISOString();
    await recebimentoV2Db.conferences.update(conferenceId, {
      deletedAt: now,
      syncStatus: 'pending',
      updatedAt: Date.now(),
    });
  }

  async saveChecklist(record: ChecklistRecord): Promise<void> {
    await this.ensureReady();
    await recebimentoV2Db.checklists.put(record);
  }

  async saveDamage(record: DamageRecord): Promise<void> {
    await this.ensureReady();
    await recebimentoV2Db.damages.put(record);
  }

  async removeDamage(damageId: string): Promise<void> {
    await this.ensureReady();
    const current = await recebimentoV2Db.damages.get(damageId);
    if (!current) {
      return;
    }
    if (!current.serverAvariaId) {
      await recebimentoV2Db.damages.delete(damageId);
      return;
    }
    const now = new Date().toISOString();
    await recebimentoV2Db.damages.update(damageId, {
      deletedAt: now,
      syncStatus: 'pending',
      updatedAt: Date.now(),
    });
  }

  async saveTemperature(record: TemperatureRecord): Promise<void> {
    await this.ensureReady();
    await recebimentoV2Db.temperatures.put(record);
  }

  async saveMedia(record: MediaRecord): Promise<void> {
    await this.ensureReady();
    await recebimentoV2Db.media.put(record);
  }

  async updateProcess(demandId: string, patch: Partial<ProcessRecord>): Promise<void> {
    await this.ensureReady();
    await recebimentoV2Db.processes.update(demandId, {
      ...patch,
      updatedAt: Date.now(),
    });
  }

  async getFullSnapshot(demandId: string): Promise<OfflineConferenceSnapshot> {
    await this.ensureReady();

    const [
      process,
      checklist,
      allConferences,
      allDamages,
      temperatures,
      impedimentos,
      expectedItems,
      media,
    ] = await Promise.all([
      recebimentoV2Db.processes.get(demandId),
      recebimentoV2Db.checklists.get(demandId),
      recebimentoV2Db.conferences.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.damages.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.temperatures.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.impedimentos.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.expectedItems.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.media.where('processId').equals(demandId).toArray(),
    ]);

    return {
      process,
      checklist,
      conferences: allConferences.filter((item) => !item.deletedAt),
      damages: allDamages.filter((item) => !item.deletedAt),
      temperatures,
      impedimentos,
      expectedItems,
      media: media.filter((item) => item.status !== 'uploaded'),
    };
  }

  async deleteAll(demandId: string): Promise<void> {
    await this.ensureReady();

    await recebimentoV2Db.transaction(
      'rw',
      [
        recebimentoV2Db.processes,
        recebimentoV2Db.conferences,
        recebimentoV2Db.checklists,
        recebimentoV2Db.damages,
        recebimentoV2Db.temperatures,
        recebimentoV2Db.impedimentos,
        recebimentoV2Db.media,
        recebimentoV2Db.expectedItems,
      ],
      async () => {
        await recebimentoV2Db.conferences.where('demandId').equals(demandId).delete();
        await recebimentoV2Db.checklists.delete(demandId);
        await recebimentoV2Db.damages.where('demandId').equals(demandId).delete();
        await recebimentoV2Db.temperatures.where('demandId').equals(demandId).delete();
        await recebimentoV2Db.impedimentos.where('demandId').equals(demandId).delete();
        await recebimentoV2Db.media.where('processId').equals(demandId).delete();
        await recebimentoV2Db.processes.delete(demandId);
      },
    );
  }
}

export const offlineConferenceRepository = new OfflineConferenceRepository();

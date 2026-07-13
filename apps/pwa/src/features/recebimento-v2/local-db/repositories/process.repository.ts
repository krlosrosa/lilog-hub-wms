import type { RecebimentoV2DB } from '../db.js';
import type { DownloadProgress, ProcessRecord, ProcessStatus } from '../schema.js';

export class ProcessRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async getProcess(demandId: string): Promise<ProcessRecord | undefined> {
    return this.db.processes.get(demandId);
  }

  async upsertProcess(record: ProcessRecord): Promise<void> {
    await this.db.processes.put(record);
  }

  async listProcesses(unidadeId: string): Promise<ProcessRecord[]> {
    return this.db.processes.where('unidadeId').equals(unidadeId).toArray();
  }

  async updateStatus(demandId: string, status: ProcessStatus): Promise<void> {
    await this.db.processes.update(demandId, { status, updatedAt: Date.now() });
  }

  async updateDownloadProgress(demandId: string, progress: DownloadProgress): Promise<void> {
    await this.db.processes.update(demandId, {
      downloadProgress: progress,
      updatedAt: Date.now(),
    });
  }

  async setReadyOffline(
    demandId: string,
    packageVersion: string,
    serverRevision: number,
  ): Promise<void> {
    await this.db.processes.update(demandId, {
      status: 'ready',
      packageVersion,
      serverRevision,
      downloadProgress: { completedSteps: [], totalSteps: 7, currentStep: 'done' },
      downloadedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

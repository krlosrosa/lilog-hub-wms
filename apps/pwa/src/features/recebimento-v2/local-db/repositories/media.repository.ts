import type { RecebimentoV2DB } from '../db.js';
import type { MediaRecord } from '../schema.js';

export class MediaRepository {
  constructor(private readonly db: RecebimentoV2DB) {}

  async getMedia(id: string): Promise<MediaRecord | undefined> {
    return this.db.media.get(id);
  }

  async listByOwner(ownerType: MediaRecord['ownerType'], ownerId: string): Promise<MediaRecord[]> {
    return this.db.media
      .where('ownerType')
      .equals(ownerType)
      .filter((r) => r.ownerId === ownerId)
      .toArray();
  }

  async listPendingUpload(processId: string): Promise<MediaRecord[]> {
    return this.db.media
      .where('processId')
      .equals(processId)
      .filter((r) => r.status === 'local' || r.status === 'error')
      .toArray();
  }

  async saveMedia(record: MediaRecord): Promise<void> {
    await this.db.media.put(record);
  }

  async updateStatus(
    id: string,
    status: MediaRecord['status'],
    remoteUrl?: string,
  ): Promise<void> {
    await this.db.media.update(id, {
      status,
      ...(remoteUrl !== undefined ? { remoteUrl, uploadedAt: new Date().toISOString() } : {}),
    });
  }

  async deleteMedia(id: string): Promise<void> {
    await this.db.media.delete(id);
  }
}

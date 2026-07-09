export const SYNC_EXPORT_VERSION = 1 as const;

export type SyncExportScope = 'errors' | 'all';

export interface SyncExportPhotoRef {
  photoId: number;
  outboxId: number;
  filename: string;
  mimeType: string;
  relatedId: string;
}

export interface SyncExportEntry {
  outboxId: number;
  label: string;
  endpoint: string;
  method: string;
  payload: unknown;
  photoIds: number[];
  photoRefs: SyncExportPhotoRef[];
  errorMessage?: string;
  retries: number;
  createdAt: number;
  status: 'error' | 'pending' | 'syncing';
}

export interface SyncExportPackage {
  version: typeof SYNC_EXPORT_VERSION;
  exportId: string;
  exportedAt: string;
  scope: SyncExportScope;
  unidadeId?: string;
  entries: SyncExportEntry[];
}

export interface SyncExportQrChunk {
  v: typeof SYNC_EXPORT_VERSION;
  exportId: string;
  exportedAt: string;
  scope: SyncExportScope;
  unidadeId?: string;
  i: number;
  n: number;
  entries: SyncExportEntry[];
}

export type ImportOfflineRecebimentoResponse = {
  demandId: string;
  recebimentoId: string;
  exportId: string;
  appliedCount: number;
  skippedCount: number;
  errors: Array<{ label: string; message: string }>;
};

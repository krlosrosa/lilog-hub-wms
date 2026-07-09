export const SYNC_EXPORT_VERSION = 1;

/**
 * Limite conservador para leitura confiável em câmeras de notebook/webcam.
 * Payload já vai compactado (KLS2: + LZ); manter margem para ECC nível M.
 */
export const MAX_QR_PAYLOAD_CHARS = 1200;

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

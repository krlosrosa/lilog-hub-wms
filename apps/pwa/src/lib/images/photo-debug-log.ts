import { db } from '@/lib/offline/db';
import { getPhoto } from '@/lib/offline/photo-store';

import { pushPhotoDebugEntry } from './photo-debug-store';

const LOG_PREFIX = '[PhotoDebug]';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function serializeDetail(detail: Record<string, unknown>): string {
  try {
    return JSON.stringify(detail, null, 2);
  } catch {
    return String(detail);
  }
}

export function logPhotoDebug(
  event: string,
  detail: Record<string, unknown> = {},
  summary?: string,
): void {
  const payload = {
    at: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ...detail,
  };

  console.warn(LOG_PREFIX, event, payload);

  pushPhotoDebugEntry({
    event,
    summary: summary ?? event,
    detail: serializeDetail(payload),
  });
}

async function canDecodeBlob(blob: Blob): Promise<{
  ok: boolean;
  method: 'createImageBitmap' | 'image-element' | 'unavailable';
  error?: string;
  width?: number;
  height?: number;
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      const result = {
        ok: true,
        method: 'createImageBitmap' as const,
        width: bitmap.width,
        height: bitmap.height,
      };
      bitmap.close();
      return result;
    } catch (error) {
      logPhotoDebug(
        'blob-decode-createImageBitmap-failed',
        {
          error: error instanceof Error ? error.message : String(error),
          blobSize: blob.size,
          blobType: blob.type,
        },
        `Falha ao decodificar imagem (${formatBytes(blob.size)})`,
      );
    }
  }

  if (typeof Image === 'undefined') {
    return { ok: false, method: 'unavailable', error: 'Image API indisponível' };
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        ok: true,
        method: 'image-element',
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        ok: false,
        method: 'image-element',
        error: 'Image element onerror',
      });
    };

    image.src = url;
  });
}

export async function inspectStoredPhoto(photoId: number) {
  const photo = await getPhoto(db, photoId);
  if (!photo) {
    return { found: false as const, photoId };
  }

  const decode = await canDecodeBlob(photo.blob);

  return {
    found: true as const,
    photoId,
    relatedId: photo.relatedId,
    mimeType: photo.mimeType,
    blobType: photo.blob.type,
    blobSize: photo.blob.size,
    blobSizeLabel: formatBytes(photo.blob.size),
    createdAt: photo.createdAt,
    uploadedUrl: photo.uploadedUrl ?? null,
    decode,
    mimeMismatch:
      photo.mimeType !== photo.blob.type &&
      photo.blob.type !== '' &&
      photo.mimeType !== '',
  };
}

function buildPreviewFailedSummary(params: {
  photoId: number;
  stored: Awaited<ReturnType<typeof inspectStoredPhoto>>;
  objectUrlStatus: {
    fetchOk: boolean;
    fetchedSize?: number;
    fetchedType?: string;
    error?: string;
  };
}): string {
  const { photoId, stored, objectUrlStatus } = params;

  if (!stored.found) {
    return `Foto #${photoId} não encontrada no armazenamento local do aparelho.`;
  }

  const parts = [
    `Preview falhou na foto #${photoId}`,
    `Tamanho: ${stored.blobSizeLabel}`,
    `Mime salvo: ${stored.mimeType || 'vazio'}`,
    `Mime blob: ${stored.blobType || 'vazio'}`,
    stored.mimeMismatch ? 'Mime divergente' : null,
    stored.decode.ok
      ? `Decodifica: sim (${stored.decode.width}x${stored.decode.height})`
      : `Decodifica: não (${stored.decode.error ?? 'erro'})`,
    objectUrlStatus.fetchOk
      ? `Blob URL: ok (${formatBytes(objectUrlStatus.fetchedSize ?? 0)})`
      : `Blob URL: falhou (${objectUrlStatus.error ?? 'erro'})`,
  ].filter(Boolean);

  return parts.join(' · ');
}

export async function logPhotoPreviewLoadFailed(params: {
  context: string;
  photoId: number;
  previewUrl: string;
  mimeType?: string;
}): Promise<string> {
  const stored = await inspectStoredPhoto(params.photoId);

  let objectUrlStatus: {
    fetchOk: boolean;
    fetchedSize?: number;
    fetchedType?: string;
    error?: string;
  };

  try {
    const response = await fetch(params.previewUrl);
    const fetchedBlob = await response.blob();
    objectUrlStatus = {
      fetchOk: response.ok,
      fetchedSize: fetchedBlob.size,
      fetchedType: fetchedBlob.type,
    };
  } catch (error) {
    objectUrlStatus = {
      fetchOk: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const summary = buildPreviewFailedSummary({
    photoId: params.photoId,
    stored,
    objectUrlStatus,
  });

  logPhotoDebug(
    'preview-load-failed',
    {
      context: params.context,
      photoId: params.photoId,
      previewUrlPrefix: params.previewUrl.slice(0, 32),
      previewUrlKind: params.previewUrl.startsWith('blob:') ? 'blob' : 'other',
      mimeType: params.mimeType,
      stored,
      objectUrlStatus,
    },
    summary,
  );

  return summary;
}

export function logPhotoBlobSummary(
  label: string,
  blob: Blob,
  mimeType: string,
  extra: Record<string, unknown> = {},
): void {
  const summary = `${label}: ${formatBytes(blob.size)} · ${mimeType}`;
  logPhotoDebug(
    label,
    {
      mimeType,
      blobType: blob.type,
      blobSize: blob.size,
      blobSizeLabel: formatBytes(blob.size),
      mimeMismatch:
        mimeType !== blob.type && blob.type !== '' && mimeType !== '',
      ...extra,
    },
    summary,
  );
}

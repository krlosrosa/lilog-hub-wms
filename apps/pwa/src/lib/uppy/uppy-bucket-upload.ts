import type { MediaRecord, MediaUploadErrorStep } from '@/features/recebimento-v2/local-db/schema';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import { buildImageUploadName } from '@/lib/images/image-mime';
import { ApiClientError, isApiConfigured, request } from '@/lib/offline/api-client';
import { UploadError } from '@/lib/offline/document-upload';

export interface UppyBucketUploadOptions {
  entidadeTipo: string;
  entidadeId: string;
  nome: (record: MediaRecord) => string;
  sessionLabel?: string;
  concurrency?: number;
}

export interface UppyBucketUploadResult {
  uploaded: number;
  failed: number;
  skipped: number;
}

type UploadUrlResponse = {
  uploadUrl: string;
  chave: string;
  expiresIn: number;
};

type DocumentoResponse = {
  id: string;
  chave: string;
};

type BucketUploadMeta = {
  mediaId: string;
  nome: string;
  mimeType: string;
  tamanho: number;
  entidadeTipo: string;
  entidadeId: string;
  chave: string;
};

type UploadAttempt = 'ready' | 'failed' | 'skipped';

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    const statusSuffix = err.status != null ? ` (${err.status})` : '';
    return `${err.message}${statusSuffix}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function resolveErrorStep(err: unknown): MediaUploadErrorStep {
  if (err instanceof UploadError) {
    return err.step;
  }
  return 'unknown';
}

async function markMediaError(
  mediaId: string,
  errorMessage: string,
  errorStep: MediaUploadErrorStep,
): Promise<void> {
  await recebimentoV2Db.media.update(mediaId, {
    status: 'error',
    errorMessage,
    errorStep,
  });
}

async function prepareRecordForUpload(
  record: MediaRecord,
): Promise<{ record: MediaRecord; attempt: UploadAttempt } | null> {
  const media = await recebimentoV2Db.media.get(record.id);
  if (!media || media.status === 'uploaded') {
    return { record: media ?? record, attempt: 'skipped' };
  }

  if (!media.blob) {
    const errorMessage = 'Blob não encontrado no armazenamento local';
    await markMediaError(media.id, errorMessage, 'unknown');
    return { record: media, attempt: 'failed' };
  }

  return { record: media, attempt: 'ready' };
}

async function confirmUploadedDocument(meta: BucketUploadMeta): Promise<string> {
  if (!isApiConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return `mock://documentos/${meta.mediaId}`;
  }

  const documento = await request<DocumentoResponse>('/documentos/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chave: meta.chave,
      nome: meta.nome,
      mimeType: meta.mimeType,
      tamanho: meta.tamanho,
      entidadeTipo: meta.entidadeTipo,
      entidadeId: meta.entidadeId,
    }),
  });

  return documento.chave;
}

async function requestUploadUrl(meta: BucketUploadMeta): Promise<UploadUrlResponse> {
  try {
    const response = await request<UploadUrlResponse>('/documentos/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: meta.nome,
        mimeType: meta.mimeType,
        tamanho: meta.tamanho,
        entidadeTipo: meta.entidadeTipo,
        entidadeId: meta.entidadeId,
      }),
    });

    meta.chave = response.chave;
    return response;
  } catch (err) {
    const message = getErrorMessage(err);
    await markMediaError(meta.mediaId, message, 'upload-url');
    throw new UploadError('upload-url', message, err);
  }
}

async function uploadRecordMock(
  record: MediaRecord,
  options: UppyBucketUploadOptions,
): Promise<boolean> {
  const mimeType = record.mimeType || 'image/webp';
  const nome = buildImageUploadName(
    options.nome(record).replace(/\.[^.]+$/, ''),
    mimeType,
  );

  await recebimentoV2Db.media.update(record.id, { status: 'uploading' });

  try {
    const remoteUrl = await confirmUploadedDocument({
      mediaId: record.id,
      nome,
      mimeType,
      tamanho: record.blob.size,
      entidadeTipo: options.entidadeTipo,
      entidadeId: options.entidadeId,
      chave: `mock/${record.id}`,
    });

    await recebimentoV2Db.media.update(record.id, {
      status: 'uploaded',
      remoteUrl,
      uploadedAt: new Date().toISOString(),
      blob: undefined as unknown as Blob,
      errorMessage: undefined,
      errorStep: undefined,
    });

    return true;
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    const errorStep = resolveErrorStep(err);
    await markMediaError(record.id, errorMessage, errorStep);
    return false;
  }
}

async function uploadRecordWithProxy(
  record: MediaRecord,
  options: UppyBucketUploadOptions,
): Promise<boolean> {
  const mimeType = record.mimeType || 'image/webp';
  const nome = buildImageUploadName(
    options.nome(record).replace(/\.[^.]+$/, ''),
    mimeType,
  );

  const meta: BucketUploadMeta = {
    mediaId: record.id,
    nome,
    mimeType,
    tamanho: record.blob.size,
    entidadeTipo: options.entidadeTipo,
    entidadeId: options.entidadeId,
    chave: '',
  };

  await recebimentoV2Db.media.update(record.id, { status: 'uploading' });

  try {
    const uploadParams = await requestUploadUrl(meta);
    const uploadResponse = await fetch(uploadParams.uploadUrl, {
      method: 'PUT',
      body: record.blob,
      headers: { 'Content-Type': mimeType },
    });

    if (!uploadResponse.ok) {
      throw new UploadError(
        'upload',
        `Falha no upload (${uploadResponse.status})`,
      );
    }

    const remoteUrl = await confirmUploadedDocument(meta);
    await recebimentoV2Db.media.update(record.id, {
      status: 'uploaded',
      remoteUrl,
      uploadedAt: new Date().toISOString(),
      blob: undefined as unknown as Blob,
      errorMessage: undefined,
      errorStep: undefined,
    });

    return true;
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    const errorStep = resolveErrorStep(err);
    await markMediaError(record.id, errorMessage, errorStep);
    return false;
  }
}

async function processInBatches(
  records: MediaRecord[],
  batchSize: number,
  worker: (record: MediaRecord) => Promise<boolean>,
): Promise<{ uploaded: number; failed: number }> {
  let uploaded = 0;
  let failed = 0;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map((record) => worker(record)));
    for (const ok of batchResults) {
      if (ok) {
        uploaded += 1;
      } else {
        failed += 1;
      }
    }
  }

  return { uploaded, failed };
}

/**
 * Uploads Dexie media blobs using API proxy PUT (no S3 CORS dependency).
 * Keeps MediaRecord as source of truth and clears local blobs after confirm.
 */
export async function uppyBucketUpload(
  records: MediaRecord[],
  options: UppyBucketUploadOptions,
): Promise<UppyBucketUploadResult> {
  const result: UppyBucketUploadResult = {
    uploaded: 0,
    failed: 0,
    skipped: 0,
  };

  if (records.length === 0) {
    return result;
  }

  const preparedRecords: MediaRecord[] = [];
  for (const record of records) {
    const prepared = await prepareRecordForUpload(record);
    if (!prepared) continue;

    if (prepared.attempt === 'skipped') {
      result.skipped += 1;
      continue;
    }
    if (prepared.attempt === 'failed') {
      result.failed += 1;
      continue;
    }

    preparedRecords.push(prepared.record);
  }

  if (preparedRecords.length === 0) {
    return result;
  }

  const concurrency = Math.max(1, options.concurrency ?? 3);

  if (!isApiConfigured()) {
    const mockResult = await processInBatches(
      preparedRecords,
      concurrency,
      (record) => uploadRecordMock(record, options),
    );
    result.uploaded += mockResult.uploaded;
    result.failed += mockResult.failed;
    return result;
  }

  const proxyResult = await processInBatches(
    preparedRecords,
    concurrency,
    (record) => uploadRecordWithProxy(record, options),
  );
  result.uploaded += proxyResult.uploaded;
  result.failed += proxyResult.failed;
  return result;
}

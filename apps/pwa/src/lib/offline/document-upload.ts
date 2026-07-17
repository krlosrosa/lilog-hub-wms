import { buildImageUploadName } from '@/lib/images/image-mime';

import type { PhotoEntry } from './db';
import { ApiClientError, isApiConfigured, request } from './api-client';

export type UploadDocumentOptions = {
  nome: string;
  entidadeTipo?: string;
  entidadeId?: string;
};

export type UploadStep = 'upload-url' | 'put-blob' | 'confirm';

export class UploadError extends Error {
  readonly step: UploadStep;

  constructor(step: UploadStep, message: string, cause?: unknown) {
    super(message);
    this.name = 'UploadError';
    this.step = step;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
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

function logUploadFailure(
  step: UploadStep,
  context: Record<string, unknown>,
  err: unknown,
): UploadError {
  const message = getErrorMessage(err);
  console.error(`[UPLOAD] step=${step}`, { ...context, error: message, err });
  return new UploadError(step, message, err);
}

export async function uploadDocumentToBucket(
  photo: PhotoEntry,
  options: UploadDocumentOptions,
): Promise<string> {
  if (!isApiConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return `mock://documentos/${photo.id ?? Date.now()}`;
  }

  const mimeType = photo.mimeType || 'image/webp';
  const tamanho = photo.blob.size;
  const nome = buildImageUploadName(
    options.nome.replace(/\.[^.]+$/, ''),
    mimeType,
  );

  const uploadContext = {
    nome,
    mimeType,
    tamanho,
    entidadeTipo: options.entidadeTipo,
    entidadeId: options.entidadeId,
  };

  let uploadUrl: string;
  let chave: string;

  try {
    const response = await request<UploadUrlResponse>('/documentos/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        mimeType,
        tamanho,
        entidadeTipo: options.entidadeTipo,
        entidadeId: options.entidadeId,
      }),
    });
    uploadUrl = response.uploadUrl;
    chave = response.chave;
  } catch (err) {
    throw logUploadFailure('upload-url', uploadContext, err);
  }

  let putResponse: Response;
  try {
    putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: photo.blob,
      headers: { 'Content-Type': mimeType },
      credentials: 'include',
    });
  } catch (err) {
    throw logUploadFailure('put-blob', { ...uploadContext, uploadUrl, chave }, err);
  }

  if (!putResponse.ok) {
    const bodyText = await putResponse.text().catch(() => '');
    console.error('[UPLOAD] step=put-blob', {
      ...uploadContext,
      uploadUrl,
      chave,
      status: putResponse.status,
      statusText: putResponse.statusText,
      body: bodyText.slice(0, 500),
      blobSize: tamanho,
    });
    throw new UploadError(
      'put-blob',
      `Falha ao enviar arquivo para o storage (${putResponse.status})`,
    );
  }

  try {
    const documento = await request<DocumentoResponse>('/documentos/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chave,
        nome,
        mimeType,
        tamanho,
        entidadeTipo: options.entidadeTipo,
        entidadeId: options.entidadeId,
      }),
    });

    return documento.chave;
  } catch (err) {
    throw logUploadFailure('confirm', { ...uploadContext, chave }, err);
  }
}

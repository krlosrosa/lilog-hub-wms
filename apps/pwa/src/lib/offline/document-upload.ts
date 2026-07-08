import { buildImageUploadName } from '@/lib/images/image-mime';

import type { PhotoEntry } from './db';
import { isApiConfigured, request } from './api-client';

export type UploadDocumentOptions = {
  nome: string;
  entidadeTipo?: string;
  entidadeId?: string;
};

type UploadUrlResponse = {
  uploadUrl: string;
  chave: string;
  expiresIn: number;
};

type DocumentoResponse = {
  id: string;
  chave: string;
};

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

  const { uploadUrl, chave } = await request<UploadUrlResponse>(
    '/documentos/upload-url',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        mimeType,
        tamanho,
        entidadeTipo: options.entidadeTipo,
        entidadeId: options.entidadeId,
      }),
    },
  );

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: photo.blob,
    headers: { 'Content-Type': mimeType },
    credentials: 'include',
  });

  if (!putResponse.ok) {
    throw new Error(`Falha ao enviar arquivo para o storage (${putResponse.status})`);
  }

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
}

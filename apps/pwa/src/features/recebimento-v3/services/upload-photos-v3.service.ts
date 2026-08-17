import type { MediaRecord } from '@/features/recebimento-v2/local-db/schema';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import { buildImageUploadName } from '@/lib/images/image-mime';
import { ApiClientError, isApiConfigured, request } from '@/lib/offline/api-client';

export type V3PhotoUploadTipo = 'checklist' | 'avaria';

export type V3PhotoUploadItem = {
  mediaId: string;
  tipo: V3PhotoUploadTipo;
  record: MediaRecord;
};

export type V3PhotoUploadProgress = {
  uploaded: number;
  total: number;
  failed: number;
};

type SolicitarUploadResponse = {
  urls: Array<{
    clientMediaId: string;
    uploadUrl: string;
    chave: string;
    entidadeTipo: string;
    nome: string;
    expiresIn: number;
  }>;
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

async function markMediaError(mediaId: string, errorMessage: string): Promise<void> {
  await recebimentoV2Db.media.update(mediaId, {
    status: 'error',
    errorMessage,
    errorStep: 'upload',
  });
}

async function confirmUploadedDocument(params: {
  chave: string;
  nome: string;
  mimeType: string;
  tamanho: number;
  entidadeTipo: string;
  entidadeId: string;
}): Promise<string> {
  if (!isApiConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return `mock://documentos/${params.chave}`;
  }

  const documento = await request<DocumentoResponse>('/documentos/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return documento.chave;
}

async function uploadSinglePhoto(
  recebimentoId: string,
  item: V3PhotoUploadItem,
  urlTask: SolicitarUploadResponse['urls'][number],
): Promise<boolean> {
  const media = await recebimentoV2Db.media.get(item.mediaId);
  if (!media?.blob) {
    await markMediaError(item.mediaId, 'Blob não encontrado no armazenamento local');
    return false;
  }

  const mimeType = media.mimeType || 'image/webp';
  const tamanho = media.blob.size;

  await recebimentoV2Db.media.update(item.mediaId, { status: 'uploading' });

  try {
    const uploadResponse = await fetch(urlTask.uploadUrl, {
      method: 'PUT',
      body: media.blob,
      headers: { 'Content-Type': mimeType },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Falha no upload (${uploadResponse.status})`);
    }

    const remoteUrl = await confirmUploadedDocument({
      chave: urlTask.chave,
      nome: urlTask.nome,
      mimeType,
      tamanho,
      entidadeTipo: urlTask.entidadeTipo,
      entidadeId: recebimentoId,
    });

    await recebimentoV2Db.media.update(item.mediaId, {
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
    await markMediaError(item.mediaId, errorMessage);
    return false;
  }
}

/**
 * Upload de fotos V3 offline via fetch + presigned URL (sem Uppy).
 */
export async function uploadPhotosV3(params: {
  recebimentoId: string;
  items: V3PhotoUploadItem[];
  onProgress?: (progress: V3PhotoUploadProgress) => void;
}): Promise<{ uploaded: number; failed: number }> {
  const { recebimentoId, items, onProgress } = params;

  if (items.length === 0) {
    return { uploaded: 0, failed: 0 };
  }

  const prepared: V3PhotoUploadItem[] = [];
  let skipped = 0;

  for (const item of items) {
    const media = await recebimentoV2Db.media.get(item.mediaId);
    if (!media || media.status === 'uploaded') {
      skipped += 1;
      continue;
    }
    if (!media.blob) {
      await markMediaError(item.mediaId, 'Blob não encontrado no armazenamento local');
      skipped += 1;
      continue;
    }
    prepared.push({ ...item, record: media });
  }

  if (prepared.length === 0) {
    return { uploaded: 0, failed: skipped };
  }

  let urlTasks: SolicitarUploadResponse['urls'] = [];

  if (isApiConfigured()) {
    const response = await request<SolicitarUploadResponse>(
      '/recebimento/v3/fotos/solicitar-upload',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recebimentoId,
          fotos: prepared.map((item) => ({
            clientMediaId: item.mediaId,
            tipo: item.tipo,
            mimeType: item.record.mimeType || 'image/webp',
            tamanho: item.record.blob.size,
          })),
        }),
      },
    );
    urlTasks = response.urls;
  } else {
    urlTasks = prepared.map((item) => ({
      clientMediaId: item.mediaId,
      uploadUrl: `mock://upload/${item.mediaId}`,
      chave: `mock/${item.mediaId}`,
      entidadeTipo: item.tipo === 'checklist' ? 'checklist_recebimento' : 'recebimento_avaria',
      nome: buildImageUploadName(item.mediaId, item.record.mimeType || 'image/webp'),
      expiresIn: 900,
    }));
  }

  const urlByMediaId = new Map(urlTasks.map((task) => [task.clientMediaId, task]));

  let uploaded = 0;
  let failed = skipped;

  const total = prepared.length;
  onProgress?.({ uploaded: 0, total, failed });

  const results = await Promise.all(
    prepared.map(async (item) => {
      const task = urlByMediaId.get(item.mediaId);
      if (!task) {
        await markMediaError(item.mediaId, 'URL de upload não retornada pelo servidor');
        return false;
      }

      if (!isApiConfigured()) {
        await recebimentoV2Db.media.update(item.mediaId, {
          status: 'uploaded',
          remoteUrl: task.chave,
          uploadedAt: new Date().toISOString(),
          blob: undefined as unknown as Blob,
        });
        return true;
      }

      return uploadSinglePhoto(recebimentoId, item, task);
    }),
  );

  for (const success of results) {
    if (success) {
      uploaded += 1;
    } else {
      failed += 1;
    }
    onProgress?.({ uploaded, total, failed });
  }

  return { uploaded, failed };
}

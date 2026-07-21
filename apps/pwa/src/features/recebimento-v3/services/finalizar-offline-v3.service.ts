import { mapAvariaV2SyncPayload } from '@/features/recebimento-v2/lib/map-avaria-v2-sync-payload';
import { normalizeParametrosConferenciaV2 } from '@/features/recebimento-v2/lib/parametros-conferencia';
import {
  resolveProdutoIdForSkuV2,
  resolveProductForSkuV2,
} from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import { request } from '@/lib/offline/api-client';

import { clearStoredMode } from '../hooks/use-mode-v3';
import { offlineConferenceRepository } from '../repositories/offline-conference-repository';
import {
  mapConferenceForV3Payload,
  writeFinalizarEncerrarOpV3,
} from './conference-write.helpers';
import type { FinalizationProgress, FinalizationStep } from '../types/conference-mode';
import { assertNetworkOnline, isBrowserOnline } from '../lib/network';
import {
  uploadPhotosV3,
  type V3PhotoUploadItem,
} from './upload-photos-v3.service';

export type FinalizeV3Payload = {
  demandId: string;
  unidadeId?: string;
  exportId: string;
  checklist?: Record<string, unknown>;
  conferencias: Array<Record<string, unknown>>;
  avarias: Array<Record<string, unknown>>;
  temperaturas: Array<{ etapa: string; temperatura: number }>;
  impedimento?: Record<string, unknown>;
  encerramento: {
    quantidadePaletes: number;
    teveSobreposicaoCarga: boolean;
    dock?: string;
  };
  photoCount: number;
};

export type FinalizeV3Response = {
  recebimentoId: string;
  exportId: string;
};

const STEP_LABELS: Record<FinalizationStep, string> = {
  validate_connection: 'Verificando conexão',
  build_payload: 'Preparando dados',
  submit_conference: 'Enviando conferência',
  upload_photos: 'Enviando fotos',
  cleanup: 'Concluindo',
};

function emitProgress(
  onProgress: ((progress: FinalizationProgress) => void) | undefined,
  step: FinalizationStep,
  extra?: Partial<FinalizationProgress>,
): void {
  onProgress?.({ step, label: STEP_LABELS[step], ...extra });
}

async function buildFinalizePayload(
  demandId: string,
  quantidadePaletes: number,
  teveSobreposicaoCarga: boolean,
  dock?: string,
): Promise<FinalizeV3Payload> {
  const snapshot = await offlineConferenceRepository.getFullSnapshot(demandId);
  const unitConfig = snapshot.process?.unidadeId
    ? await recebimentoV2Db.unitConfigs.get(snapshot.process.unidadeId)
    : undefined;
  const parametros = normalizeParametrosConferenciaV2(unitConfig?.config);

  const conferencias: Array<Record<string, unknown>> = [];
  for (const conference of snapshot.conferences) {
    const mapped = await mapConferenceForV3Payload(
      demandId,
      conference,
      parametros,
      parametros.loteModo,
    );
    if (mapped) {
      conferencias.push({
        clientConferenceId: conference.id,
        ...mapped,
        conferidoAt: conference.conferidoAt,
      });
    }
  }

  const avarias: Array<Record<string, unknown>> = [];
  for (const damage of snapshot.damages) {
    const product = damage.sku ? await resolveProductForSkuV2(demandId, damage.sku) : null;
    const produtoId = damage.sku
      ? await resolveProdutoIdForSkuV2(demandId, damage.sku, product)
      : undefined;
    avarias.push({
      clientDamageId: damage.id,
      ...mapAvariaV2SyncPayload(damage, produtoId),
      registradoAt: damage.registradoAt,
    });
  }

  const checklist = snapshot.checklist
    ? {
        clientChecklistId: snapshot.checklist.id,
        dockId: snapshot.checklist.dockId ?? snapshot.checklist.dock,
        dock: snapshot.checklist.dock,
        lacre: snapshot.checklist.lacre,
        tempBau: snapshot.checklist.tempBau,
        conditions: snapshot.checklist.conditions,
        observacoes: snapshot.checklist.observacoes,
        responsavelId: snapshot.checklist.responsavelId,
        photoMediaIds: snapshot.checklist.photoMediaIds,
        photoCount: Object.values(snapshot.checklist.photoMediaIds ?? {})
          .flat()
          .filter(Boolean).length,
      }
    : undefined;

  return {
    demandId,
    unidadeId: snapshot.process?.unidadeId,
    exportId: crypto.randomUUID(),
    checklist,
    conferencias,
    avarias,
    temperaturas: snapshot.temperatures.map((item) => ({
      etapa: item.etapa,
      temperatura: item.temperatura,
    })),
    encerramento: {
      quantidadePaletes,
      teveSobreposicaoCarga,
      dock,
    },
    photoCount: snapshot.media.length,
  };
}

function collectPhotoUploadItems(demandId: string): Promise<V3PhotoUploadItem[]> {
  return offlineConferenceRepository.getFullSnapshot(demandId).then((snapshot) => {
    const mediaById = new Map(snapshot.media.map((item) => [item.id, item]));
    const items: V3PhotoUploadItem[] = [];
    const seen = new Set<string>();

    const pushItem = (mediaId: string | undefined, tipo: V3PhotoUploadItem['tipo']) => {
      if (!mediaId || seen.has(mediaId)) return;
      const record = mediaById.get(mediaId);
      if (!record || record.status === 'uploaded') return;
      seen.add(mediaId);
      items.push({ mediaId, tipo, record });
    };

    const checklistMedia = snapshot.checklist?.photoMediaIds;
    if (checklistMedia) {
      for (const mediaId of [
        ...(checklistMedia.lacre ?? []),
        ...(checklistMedia.bauFechado ?? []),
        ...(checklistMedia.bauAberto ?? []),
        ...(checklistMedia.extras ?? []),
      ]) {
        pushItem(mediaId, 'checklist');
      }
    }

    for (const damage of snapshot.damages) {
      for (const mediaId of damage.mediaIds ?? []) {
        pushItem(mediaId, 'avaria');
      }
    }

    for (const media of snapshot.media) {
      if (media.ownerType === 'checklist') {
        pushItem(media.id, 'checklist');
      } else if (media.ownerType === 'avaria') {
        pushItem(media.id, 'avaria');
      }
    }

    return items;
  });
}

async function uploadOfflinePhotos(
  demandId: string,
  recebimentoId: string,
  onProgress?: (progress: FinalizationProgress) => void,
): Promise<void> {
  const items = await collectPhotoUploadItems(demandId);
  if (items.length === 0) return;

  const result = await uploadPhotosV3({
    recebimentoId,
    items,
    onProgress: (photoProgress) => {
      emitProgress(onProgress, 'upload_photos', {
        label: `Enviando fotos (${photoProgress.uploaded}/${photoProgress.total})`,
        photoProgress,
      });
    },
  });

  if (result.failed > 0) {
    throw new Error(
      `Falha ao enviar ${result.failed} foto(s). Verifique a conexão e tente novamente.`,
    );
  }
}

export async function finalizarOfflineV3(params: {
  demandId: string;
  quantidadePaletes: number;
  teveSobreposicaoCarga: boolean;
  dock?: string;
  onProgress?: (progress: FinalizationProgress) => void;
}): Promise<{ recebimentoId: string }> {
  const { demandId, quantidadePaletes, teveSobreposicaoCarga, dock, onProgress } = params;

  emitProgress(onProgress, 'validate_connection');
  if (!isBrowserOnline()) {
    throw new Error('É necessário conexão com a internet para enviar a conferência ao servidor.');
  }
  assertNetworkOnline();

  emitProgress(onProgress, 'build_payload');
  const payload = await buildFinalizePayload(
    demandId,
    quantidadePaletes,
    teveSobreposicaoCarga,
    dock,
  );

  emitProgress(onProgress, 'submit_conference');
  const response = await request<FinalizeV3Response>('/recebimento/v3/conferencia/finalizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (payload.photoCount > 0) {
    emitProgress(onProgress, 'upload_photos', { label: 'Enviando fotos' });
    await uploadOfflinePhotos(demandId, response.recebimentoId, onProgress);
  }

  emitProgress(onProgress, 'cleanup');
  await offlineConferenceRepository.deleteAll(demandId);
  clearStoredMode(demandId);

  return { recebimentoId: response.recebimentoId };
}

export async function finalizarOnlineV3(params: {
  demandId: string;
  quantidadePaletes: number;
  teveSobreposicaoCarga: boolean;
  dock?: string;
}): Promise<{ recebimentoId?: string }> {
  assertNetworkOnline('É necessário conexão com a internet para finalizar a conferência.');
  await writeFinalizarEncerrarOpV3(params);
  const { pushDemandPatchFromLocal } = await import(
    '@/features/recebimento-v2/services/push-demand-patch.service'
  );
  const { processPhotoQueue } = await import(
    '@/features/recebimento-v2/services/photo-upload-queue.service'
  );
  await pushDemandPatchFromLocal(params.demandId);
  await processPhotoQueue(params.demandId);

  const process = await recebimentoV2Db.processes.get(params.demandId);
  clearStoredMode(params.demandId);

  return { recebimentoId: process?.recebimentoId };
}

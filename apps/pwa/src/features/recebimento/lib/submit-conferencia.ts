import { isApiConfigured } from '@/lib/offline/api-client';
import { loadAvariasForDemand } from '@/lib/offline/avaria-cache';
import { getChecklistDraft } from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import { clearRecebimentoDemandAfterSync } from '@/lib/offline/demand-cache';
import { getPhotosByRelated } from '@/lib/offline/photo-store';
import { produtoToMeta } from '@/lib/offline/produto-cache';
import { sortRecebimentoOutboxEntries } from '@/lib/offline/sync-export';
import { createShortId } from '@/lib/random-id';

import {
  ensureConferenciaContext,
  getConferenciaContextStore,
} from './conferencia-context-store';
import type { ConferenciaItemMeta, MappedConferenciaContext } from './map-conferencia-itens';
import { mapConferirPayloadFromLote } from './map-conferir-payload';
import { importOfflineRecebimento } from './recebimento-api';
import { listRecebimentoConferenciaRascunhos } from './recebimento-conferencia-rascunho';
import {
  getCachedParametrosRecebimentoConferencia,
  loadCachedConfigFromDb,
} from './recebimento-config';
import {
  buildRecebimentoEndpoint,
  withRecebimentoDemandPayload,
} from './recebimento-sync';
import { uploadAvariaPhotos } from './upload-avaria-photos';
import { uploadChecklistPhotos } from './upload-checklist-photos';
import {
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  type ParametrosRecebimentoConferencia,
} from '../types/recebimento.schema';
import type { RecebimentoConferenciaRascunhoEntry as RascunhoEntry } from './recebimento-conferencia-rascunho';

export type SubmitConferenciaStatus = 'success' | 'partial' | 'error' | 'skipped';

export interface SubmitConferenciaResult {
  status: SubmitConferenciaStatus;
  message?: string;
}

type ImportEntry = {
  label: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: unknown;
  createdAt: number;
};

const inFlight = new Set<string>();
const inFlightListeners = new Set<() => void>();

function notifyInFlightListeners() {
  for (const listener of inFlightListeners) {
    listener();
  }
}

export function getHasSubmitConferenciaInFlight(): boolean {
  return inFlight.size > 0;
}

export function subscribeSubmitConferenciaInFlight(listener: () => void): () => void {
  inFlightListeners.add(listener);
  return () => {
    inFlightListeners.delete(listener);
  };
}

/**
 * Envia toda a conferência (checklist, itens, avarias e encerramento) de uma
 * demanda em um único lote para o backend. Roda em segundo plano ao finalizar
 * ou ao reenviar pelo painel de sincronização. Nada é sincronizado durante a
 * sessão de conferência — tudo fica local até este ponto.
 */
export async function submitConferenciaBackground(
  demandId: string,
): Promise<SubmitConferenciaResult> {
  if (!isApiConfigured() || !navigator.onLine) {
    return { status: 'skipped', message: 'Sem conexão para enviar agora.' };
  }

  if (inFlight.has(demandId)) {
    return { status: 'skipped', message: 'Envio já em andamento.' };
  }

  inFlight.add(demandId);
  notifyInFlightListeners();
  try {
    return await runSubmit(demandId);
  } finally {
    inFlight.delete(demandId);
    notifyInFlightListeners();
  }
}

function resolveMetaFromContext(
  context: MappedConferenciaContext | null,
  rascunho: RascunhoEntry,
): ConferenciaItemMeta | null {
  if (!context) return null;

  const bySku = context.itemMetaBySku[rascunho.sku.toLowerCase()];
  if (bySku) return bySku;

  for (const meta of Object.values(context.itemMetaBySku)) {
    if (meta.produtoId === rascunho.produtoId) {
      return meta;
    }
  }

  return null;
}

async function resolveMetaForRascunho(
  demandId: string,
  context: MappedConferenciaContext | null,
  rascunho: RascunhoEntry,
  parametros: ParametrosRecebimentoConferencia,
): Promise<ConferenciaItemMeta | null> {
  const fromContext = resolveMetaFromContext(context, rascunho);
  if (fromContext) return fromContext;

  const entry = await db.demandProdutos.get(demandId);
  const produto = entry?.produtos.find(
    (item) =>
      item.sku.toLowerCase() === rascunho.sku.toLowerCase() ||
      item.produtoId === rascunho.produtoId,
  );

  if (produto) {
    return produtoToMeta(
      produto,
      parametros.solicitarPesoPvar,
      parametros.exigirEtiquetaPesoVariavel,
    );
  }

  return null;
}

async function runSubmit(demandId: string): Promise<SubmitConferenciaResult> {
  const cachedDemand = await db.demands.get(demandId);
  const context =
    (await ensureConferenciaContext(demandId)) ??
    getConferenciaContextStore(demandId);

  const recebimentoId =
    context?.recebimentoId ?? cachedDemand?.recebimentoId ?? null;
  const unidadeId = context?.unidadeId ?? cachedDemand?.unidadeId ?? undefined;

  const parametros: ParametrosRecebimentoConferencia = unidadeId
    ? (await loadCachedConfigFromDb(unidadeId)) ??
      getCachedParametrosRecebimentoConferencia(unidadeId)
    : DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA;

  const controlaPalete =
    parametros.controlaPalete || (context?.exigePaleteConferencia ?? false);

  const entries: ImportEntry[] = [];
  let clock = Date.now();
  const nextTs = () => clock++;

  const checklistLabel = `Checklist ${demandId}`;
  const draft = await getChecklistDraft(demandId);
  const checklistSlots = draft?.photoSlots ?? [];
  const checklistPhotoCount = checklistSlots.reduce(
    (total, slot) => total + slot.photoIds.length,
    0,
  );

  if (draft) {
    entries.push({
      label: checklistLabel,
      endpoint: buildRecebimentoEndpoint(recebimentoId, '/checklist'),
      method: 'PUT',
      payload: withRecebimentoDemandPayload(demandId, {
        docaId: draft.dockId,
        responsavelId: draft.responsavelId ?? undefined,
        lacre: draft.form.lacre || undefined,
        tempBau: draft.form.tempBau,
        tempProduto: draft.form.tempProd,
        conditions: draft.form.conditions,
        observacoes: draft.form.observacoes || undefined,
        photoCount: checklistPhotoCount,
      }),
      createdAt: nextTs(),
    });
  }

  const rascunhos = await listRecebimentoConferenciaRascunhos(demandId);
  for (const rascunho of rascunhos) {
    if (!rascunho.lotes.length) continue;

    const meta = await resolveMetaForRascunho(
      demandId,
      context,
      rascunho,
      parametros,
    );
    if (!meta) continue;

    entries.push({
      label: `Atualizar conferência ${meta.sku}`,
      endpoint: buildRecebimentoEndpoint(recebimentoId, `/itens/${meta.produtoId}`),
      method: 'DELETE',
      payload: withRecebimentoDemandPayload(demandId, {}),
      createdAt: nextTs(),
    });

    for (const lote of rascunho.lotes) {
      const payload = mapConferirPayloadFromLote(
        lote,
        meta,
        parametros.loteModo,
        lote.idPalete || undefined,
        controlaPalete,
      );
      const loteLabel = lote.lote || lote.validade || 'sem lote';

      entries.push({
        label: `Conferir ${meta.sku} (${loteLabel})`,
        endpoint: buildRecebimentoEndpoint(recebimentoId, '/itens'),
        method: 'POST',
        payload: withRecebimentoDemandPayload(demandId, payload),
        createdAt: nextTs(),
      });
    }
  }

  const avarias = await loadAvariasForDemand(demandId, recebimentoId);
  const avariaUploads: Array<{ label: string; photoIds: number[] }> = [];

  entries.push({
    label: `Limpar avarias ${demandId}`,
    endpoint: buildRecebimentoEndpoint(recebimentoId, '/avarias'),
    method: 'DELETE',
    payload: withRecebimentoDemandPayload(demandId, {}),
    createdAt: nextTs(),
  });

  for (const avaria of avarias) {
    const photos = await getPhotosByRelated(db, `avaria-queued-${avaria.id}`);
    const photoIds = photos
      .map((photo) => photo.id)
      .filter((id): id is number => id != null);
    const label = `Avaria ${demandId} ${avaria.id}`;
    avariaUploads.push({ label, photoIds });

    entries.push({
      label,
      endpoint: buildRecebimentoEndpoint(recebimentoId, '/avarias'),
      method: 'POST',
      payload: withRecebimentoDemandPayload(demandId, {
        produtoId: avaria.produtoId,
        lote: avaria.lote,
        tipo: avaria.tipo,
        natureza: avaria.natureza,
        causa: avaria.causa,
        quantidadeCaixas: avaria.quantidadeCaixa,
        quantidadeUnidades: avaria.quantidadeUnidade,
        photoCount: photoIds.length || avaria.photoCount,
        replicarParaTodos: avaria.replicado,
        skusAlvo: avaria.skusAfetados,
      }),
      createdAt: nextTs(),
    });
  }

  entries.push({
    label: `Encerrar conferência ${demandId}`,
    endpoint: buildRecebimentoEndpoint(recebimentoId, '/encerrar'),
    method: 'PUT',
    payload: withRecebimentoDemandPayload(demandId, {}),
    createdAt: nextTs(),
  });

  const sorted = sortRecebimentoOutboxEntries(entries);

  let result;
  try {
    result = await importOfflineRecebimento(demandId, {
      exportId: createShortId(12),
      unidadeId,
      entries: sorted.map((entry) => ({
        label: entry.label,
        endpoint: entry.endpoint,
        method: entry.method,
        payload: entry.payload,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Falha ao enviar a conferência.',
    };
  }

  const failedLabels = new Set(result.errors.map((item) => item.label));

  if (result.recebimentoId) {
    if (
      checklistPhotoCount > 0 &&
      !failedLabels.has(checklistLabel)
    ) {
      try {
        await uploadChecklistPhotos(result.recebimentoId, checklistSlots);
      } catch {
        // Não bloqueia o envio se o upload das fotos do checklist falhar.
      }
    }

    for (const upload of avariaUploads) {
      if (upload.photoIds.length === 0 || failedLabels.has(upload.label)) {
        continue;
      }
      try {
        await uploadAvariaPhotos(result.recebimentoId, upload.photoIds);
      } catch {
        // Não bloqueia o envio se o upload das fotos de avaria falhar.
      }
    }
  }

  if (result.errors.length === 0) {
    await clearRecebimentoDemandAfterSync(demandId, cachedDemand?.routeId);
    return { status: 'success' };
  }

  return {
    status: 'partial',
    message: result.errors[0]?.message ?? 'Alguns itens não foram enviados.',
  };
}

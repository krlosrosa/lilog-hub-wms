import { loadAvariasForDemand } from '@/lib/offline/avaria-cache';
import { getChecklistDraft } from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import { getPhoto, getPhotosByRelated } from '@/lib/offline/photo-store';
import { produtoToMeta } from '@/lib/offline/produto-cache';
import { buildPhotoFilename } from '@/lib/offline/sync-export/filename';
import {
  sortRecebimentoOutboxEntries,
  SYNC_EXPORT_VERSION,
  type SyncExportEntry,
  type SyncExportPackage,
  type SyncExportPhotoRef,
} from '@/lib/offline/sync-export';
import { createShortId } from '@/lib/random-id';

import {
  ensureConferenciaContext,
  getConferenciaContextStore,
} from './conferencia-context-store';
import type { ConferenciaItemMeta, MappedConferenciaContext } from './map-conferencia-itens';
import { mapConferirPayloadFromLote } from './map-conferir-payload';
import {
  listRecebimentoConferenciaRascunhos,
  type RecebimentoConferenciaRascunhoEntry as RascunhoEntry,
} from './recebimento-conferencia-rascunho';
import {
  getCachedParametrosRecebimentoConferencia,
  loadCachedConfigFromDb,
} from './recebimento-config';
import {
  buildRecebimentoEndpoint,
  withRecebimentoDemandPayload,
} from './recebimento-sync';
import {
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  type ParametrosRecebimentoConferencia,
} from '../types/recebimento.schema';

type ImportEntry = {
  label: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: unknown;
  createdAt: number;
  photoIds: number[];
};

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

async function buildPhotoRefs(
  exportId: string,
  outboxId: number,
  photoIds: number[],
): Promise<SyncExportPhotoRef[]> {
  const photoRefs: SyncExportPhotoRef[] = [];

  for (const photoId of photoIds) {
    const photo = await getPhoto(db, photoId);
    if (!photo) continue;

    photoRefs.push({
      photoId,
      outboxId,
      filename: buildPhotoFilename(exportId, outboxId, photoId, photo.mimeType),
      mimeType: photo.mimeType,
      relatedId: photo.relatedId,
    });
  }

  return photoRefs;
}

async function buildImportEntries(demandId: string): Promise<{
  entries: ImportEntry[];
  unidadeId?: string;
}> {
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

  const draft = await getChecklistDraft(demandId);
  const checklistPhotoIds =
    draft?.photoSlots.flatMap((slot) => slot.photoIds) ?? [];

  if (draft) {
    entries.push({
      label: `Checklist ${demandId}`,
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
        photoCount: checklistPhotoIds.length,
      }),
      createdAt: nextTs(),
      photoIds: checklistPhotoIds,
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
      photoIds: [],
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
        photoIds: [],
      });
    }
  }

  const avarias = await loadAvariasForDemand(demandId, recebimentoId);

  entries.push({
    label: `Limpar avarias ${demandId}`,
    endpoint: buildRecebimentoEndpoint(recebimentoId, '/avarias'),
    method: 'DELETE',
    payload: withRecebimentoDemandPayload(demandId, {}),
    createdAt: nextTs(),
    photoIds: [],
  });

  for (const avaria of avarias) {
    const photos = await getPhotosByRelated(db, `avaria-queued-${avaria.id}`);
    const photoIds = photos
      .map((photo) => photo.id)
      .filter((id): id is number => id != null);

    entries.push({
      label: `Avaria ${demandId} ${avaria.id}`,
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
      photoIds,
    });
  }

  entries.push({
    label: `Encerrar conferência ${demandId}`,
    endpoint: buildRecebimentoEndpoint(recebimentoId, '/encerrar'),
    method: 'PUT',
    payload: withRecebimentoDemandPayload(demandId, {}),
    createdAt: nextTs(),
    photoIds: [],
  });

  return {
    entries: sortRecebimentoOutboxEntries(entries),
    unidadeId,
  };
}

/**
 * Monta um pacote de exportação offline (QR) com checklist, itens, avarias e
 * encerramento de uma demanda — mesmo formato usado pela outbox e pelo portal web.
 */
export async function buildConferenciaExportPackage(
  demandId: string,
): Promise<SyncExportPackage> {
  const exportId = createShortId(8);
  const { entries, unidadeId } = await buildImportEntries(demandId);
  const exportEntries: SyncExportEntry[] = [];

  for (const [index, entry] of entries.entries()) {
    const outboxId = index + 1;
    const photoRefs = await buildPhotoRefs(exportId, outboxId, entry.photoIds);

    exportEntries.push({
      outboxId,
      label: entry.label,
      endpoint: entry.endpoint,
      method: entry.method,
      payload: entry.payload,
      photoIds: entry.photoIds,
      photoRefs,
      retries: 0,
      createdAt: entry.createdAt,
      status: 'error',
    });
  }

  return {
    version: SYNC_EXPORT_VERSION,
    exportId,
    exportedAt: new Date().toISOString(),
    scope: 'errors',
    unidadeId,
    entries: exportEntries,
  };
}

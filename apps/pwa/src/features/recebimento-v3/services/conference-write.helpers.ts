import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import type { LoteModo, ParametrosRecebimentoConferencia } from '@/features/recebimento/types/recebimento.schema';
import { buildChecklistSyncPayload, normalizeTempBau } from '@/features/recebimento-v2/lib/checklist-sync-payload';
import { mapConferenciaV2SyncPayload } from '@/features/recebimento-v2/lib/map-conferencia-v2-sync-payload';
import {
  calcConferenceQuantityInUnidades,
  CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG,
  isResolvableCatalogProduct,
  normalizeSkuParam,
  resolveProdutoConferenciaV2,
  resolveProdutoIdForSkuV2,
  resolveProductForSkuV2,
  resolveUnidadesPorCaixa,
} from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';
import { resolveProductForConferenciaV2 } from '@/features/recebimento-v2/services/enrich-product-catalog.service';
import { resolveConferenceQuantidadePar } from '@/features/recebimento-v2/lib/conferencia-quantidade';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import type {
  ChecklistPhotoMediaIds,
  ChecklistRecord,
  ConferenceRecord,
  DamageRecord,
  SyncOperationRecord,
  TemperatureRecord,
} from '@/features/recebimento-v2/local-db/schema';
import type { ChecklistFormV2 } from '@/features/recebimento-v2/types/recebimento-v2.schema';
import type { ConferirItemV2Input } from '@/features/recebimento-v2/hooks/use-conferencia-v2';
import type { RegistrarAvariaInput } from '@/features/recebimento-v2/hooks/use-avaria-v2';
import type { ChecklistPhotoIds } from '@/features/recebimento-v2/hooks/use-checklist-v2';
import type { TemperaturaEtapaV2 } from '@/features/recebimento-v2/hooks/use-temperatura-produto-v2';
import { deleteConferenceRecord } from '@/features/recebimento-v2/services/conference-sync.actions';
import { removeAddedItemV2 } from '@/features/recebimento-v2/services/remove-added-item-v2.service';
import { getActivePaleteCodigo, PALETE_OBRIGATORIO_MSG } from '@/features/recebimento-v2/services/palete-session-v2.service';
import { removeDamageRecordLocally } from '@/features/recebimento-v2/services/damage-removal.helpers';

import { offlineConferenceRepository } from '../repositories/offline-conference-repository';

function matchesSkuTarget(sku: string, targets: Set<string>): boolean {
  return targets.has(normalizeSkuParam(sku).toUpperCase());
}

async function createAvariaRecord(params: {
  demandId: string;
  input: RegistrarAvariaInput;
  sku?: string;
  lote?: string;
  quantidadeCaixa: number;
  quantidadeUnidade: number;
  replicarParaTodos?: boolean;
  skusAlvo?: string[];
}): Promise<DamageRecord> {
  const { demandId, input, sku, lote, quantidadeCaixa, quantidadeUnidade, replicarParaTodos, skusAlvo } =
    params;
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const id = crypto.randomUUID();
  const qty =
    quantidadeCaixa + quantidadeUnidade > 0
      ? quantidadeCaixa + quantidadeUnidade
      : (input.quantity ?? 0);

  return {
    id,
    demandId,
    sku,
    description: input.description ?? `Avaria SKU ${sku ?? '—'}`,
    quantity: qty,
    motivo: input.motivo ?? input.tipo,
    tipo: input.tipo,
    natureza: input.natureza,
    causa: input.causa,
    lote,
    quantidadeCaixa,
    quantidadeUnidade,
    mediaIds: input.mediaIds,
    registradoAt: now,
    syncStatus: 'pending',
    replicarParaTodos,
    skusAlvo,
    updatedAt: nowMs,
  };
}

export async function writeConferirItemV3(input: ConferirItemV2Input): Promise<string> {
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const id = crypto.randomUUID();

  const process = await recebimentoV2Db.processes.get(input.demandId);
  const resolvedProduct = await resolveProductForConferenciaV2(
    input.demandId,
    input.sku,
    process?.unidadeId,
  );

  if (!isResolvableCatalogProduct(resolvedProduct)) {
    throw new Error(CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG);
  }

  const expectedItems = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(input.demandId)
    .toArray();
  const expectedItem = expectedItems.find(
    (item) =>
      normalizeSkuParam(item.sku).toUpperCase() === normalizeSkuParam(input.sku).toUpperCase(),
  );
  const produtoConfig = resolveProdutoConferenciaV2(resolvedProduct, input.parametros);
  const unidadesPorCaixa = resolveUnidadesPorCaixa(
    expectedItem?.unidadesPorCaixa,
    resolvedProduct.unidadesPorCaixa,
  );

  const needsUnitizador = input.parametros.controlaPalete || produtoConfig.pesoVariavel;
  const activePalete = needsUnitizador ? await getActivePaleteCodigo(input.demandId) : null;
  const unitizadorCodigo = needsUnitizador
    ? input.unitizadorCodigo?.trim() || activePalete || undefined
    : undefined;

  if (needsUnitizador && !unitizadorCodigo) {
    throw new Error(PALETE_OBRIGATORIO_MSG);
  }

  const recebidaCaixa = produtoConfig.pesoVariavel ? 1 : input.recebidaCaixa;
  const recebidaUnidade = produtoConfig.pesoVariavel ? 0 : input.recebidaUnidade;
  const quantity = calcConferenceQuantityInUnidades({
    recebidaCaixa,
    recebidaUnidade,
    unidadesPorCaixa,
    pesoVariavel: produtoConfig.pesoVariavel,
  });

  const record: ConferenceRecord = {
    id,
    demandId: input.demandId,
    sku: resolvedProduct.sku,
    lote: input.lote,
    fabricacao: input.fabricacao,
    validade: input.validade,
    quantity,
    recebidaCaixa,
    recebidaUnidade,
    peso: input.peso,
    etiquetaCodigo: input.etiquetaCodigo?.trim() || undefined,
    unitizadorCodigo,
    isPvarBox: produtoConfig.pesoVariavel,
    conferidoAt: now,
    syncStatus: 'pending',
    updatedAt: nowMs,
  };

  await offlineConferenceRepository.saveConference(record);
  await offlineConferenceRepository.updateProcess(input.demandId, { status: 'working' });

  return id;
}

export async function writeRemoveConferenceV3(conferenceId: string, offlineOnly: boolean): Promise<void> {
  if (offlineOnly) {
    await offlineConferenceRepository.removeConference(conferenceId);
    return;
  }
  await deleteConferenceRecord(conferenceId);
}

export async function writeRemoveAddedItemV3(demandId: string, sku: string): Promise<void> {
  await removeAddedItemV2(demandId, sku);
}

export async function writeRegistrarAvariaV3(
  demandId: string,
  input: RegistrarAvariaInput,
): Promise<string> {
  if (input.replicarParaTodos && input.skusAlvo && input.skusAlvo.length > 0) {
    const skusAlvo = [...new Set(input.skusAlvo.map((sku) => normalizeSkuParam(sku)).filter(Boolean))];
    const skuTargets = new Set(skusAlvo.map((sku) => sku.toUpperCase()));
    const conferences =
      input.conferencesForReplication ??
      (await recebimentoV2Db.conferences.where('demandId').equals(demandId).toArray());
    const targets = conferences.filter((conference) => matchesSkuTarget(conference.sku, skuTargets));

    if (targets.length === 0) {
      throw new Error('Não há itens conferidos para replicar avaria');
    }

    const quantidadeModo = input.quantidadeModo ?? 'ambos';
    const records: DamageRecord[] = [];

    for (const conference of targets) {
      const sku = normalizeSkuParam(conference.sku);
      const product = await resolveProductForSkuV2(demandId, sku);
      const unidadesPorCaixa = product ? resolveUnidadesPorCaixa(product) : 1;
      const quantidade = resolveConferenceQuantidadePar(conference, quantidadeModo, unidadesPorCaixa);

      if (quantidade.caixa <= 0 && quantidade.unidade <= 0) continue;

      records.push(
        await createAvariaRecord({
          demandId,
          input,
          sku,
          lote: conference.lote?.trim() || undefined,
          quantidadeCaixa: quantidade.caixa,
          quantidadeUnidade: quantidade.unidade,
          replicarParaTodos: true,
          skusAlvo,
        }),
      );
    }

    if (records.length === 0) {
      throw new Error('Não há quantidade conferida para replicar avaria');
    }

    for (const record of records) {
      await offlineConferenceRepository.saveDamage(record);
    }

    return records[0]!.id;
  }

  const record = await createAvariaRecord({
    demandId,
    input,
    sku: input.sku?.trim() || undefined,
    lote: input.lote,
    quantidadeCaixa: input.quantidadeCaixa ?? 0,
    quantidadeUnidade: input.quantidadeUnidade ?? 0,
  });

  await offlineConferenceRepository.saveDamage(record);
  return record.id;
}

export async function writeRemoveAvariaV3(
  demandId: string,
  damageId: string,
  offlineOnly: boolean,
): Promise<void> {
  const damage = await recebimentoV2Db.damages.get(damageId);
  if (!damage) return;

  if (offlineOnly || !damage.serverAvariaId) {
    if (damage.deletedAt) return;
    if (!damage.serverAvariaId) {
      await recebimentoV2Db.damages.delete(damageId);
      return;
    }
    await offlineConferenceRepository.removeDamage(damageId);
    return;
  }

  await removeDamageRecordLocally(demandId, damage);
}

export async function writeSalvarChecklistV3(params: {
  demandId: string;
  form: ChecklistFormV2;
  dockId: string;
  dockLabel: string;
  photoIds: ChecklistPhotoIds;
  responsavelId?: number;
}): Promise<void> {
  const { demandId, form, dockId, dockLabel, photoIds, responsavelId } = params;
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const existing = await recebimentoV2Db.checklists.get(demandId);
  const recordId = existing?.id ?? crypto.randomUUID();

  const photoMediaIds: ChecklistPhotoMediaIds = {
    lacre: photoIds.lacre,
    bauFechado: photoIds.bauFechado,
    bauAberto: photoIds.bauAberto,
    extras: photoIds.extras,
  };

  const record: ChecklistRecord = {
    demandId,
    id: recordId,
    dockId,
    dock: dockLabel || dockId,
    lacre: form.lacre,
    tempBau: normalizeTempBau(form.tempBau),
    conditions: form.conditions,
    observacoes: form.observacoes,
    responsavelId,
    photoMediaIds,
    savedAt: now,
    syncStatus: 'pending',
    updatedAt: nowMs,
  };

  await offlineConferenceRepository.saveChecklist(record);
  await offlineConferenceRepository.updateProcess(demandId, {
    status: 'working',
    dock: dockLabel || dockId,
  });
}

export async function writeRegistrarTemperaturaV3(
  demandId: string,
  entries: Array<{ etapa: TemperaturaEtapaV2; temperatura: number }>,
): Promise<void> {
  const nowMs = Date.now();

  for (const entry of entries) {
    const record: TemperatureRecord = {
      id: `${demandId}::${entry.etapa}`,
      demandId,
      etapa: entry.etapa,
      temperatura: entry.temperatura,
      syncStatus: 'pending',
      updatedAt: nowMs,
    };
    await offlineConferenceRepository.saveTemperature(record);
  }
}

export async function writeFinalizarEncerrarOpV3(params: {
  demandId: string;
  dock: string;
  quantidadePaletes: number;
  teveSobreposicaoCarga: boolean;
}): Promise<void> {
  const { demandId, dock, quantidadePaletes, teveSobreposicaoCarga } = params;
  const nowMs = Date.now();
  const opId = crypto.randomUUID();

  const syncOp: SyncOperationRecord = {
    id: opId,
    aggregateId: demandId,
    module: 'conference',
    opType: RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR,
    sequence: nowMs,
    dependsOn: [],
    idempotencyKey: opId,
    payload: {
      demandId,
      encerradoAt: new Date().toISOString(),
      dock,
      quantidadePaletes,
      teveSobreposicaoCarga,
    },
    attachmentIds: [],
    status: 'pending',
    attempts: 0,
    createdAt: nowMs,
    updatedAt: nowMs,
  };

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.syncOperations, recebimentoV2Db.processes, recebimentoV2Db.checklists],
    async () => {
      await recebimentoV2Db.syncOperations.put(syncOp);
      await recebimentoV2Db.processes.update(demandId, {
        status: 'completed',
        pendingFinalizationSync: true,
        updatedAt: nowMs,
      });
      const checklist = await recebimentoV2Db.checklists.get(demandId);
      if (checklist) {
        await recebimentoV2Db.checklists.update(demandId, {
          pendingFinalizationSync: true,
          localFinalizationAttempted: true,
          finalizacaoPayload: {
            quantidadePaletes,
            teveSobreposicaoCarga,
          },
          updatedAt: nowMs,
        });
      }
    },
  );
}

export function buildChecklistPayloadForV3(
  demandId: string,
  checklist: ChecklistRecord,
  dockId: string,
  form: ChecklistFormV2,
  responsavelId?: number,
) {
  return buildChecklistSyncPayload({
    demandId,
    dockId,
    form,
    photoMediaIds: checklist.photoMediaIds,
    responsavelId,
  });
}

export async function mapConferenceForV3Payload(
  demandId: string,
  record: ConferenceRecord,
  parametros: ParametrosRecebimentoConferencia,
  loteModo: LoteModo,
) {
  const product = await resolveProductForSkuV2(demandId, record.sku);
  if (!product) return null;

  const produtoId = await resolveProdutoIdForSkuV2(demandId, record.sku, product);
  const produtoConfig = resolveProdutoConferenciaV2(product, parametros);

  return mapConferenciaV2SyncPayload(
    record,
    {
      produtoId,
      unidadesPorCaixa: resolveUnidadesPorCaixa(product.unidadesPorCaixa),
      pesoVariavel: produtoConfig.pesoVariavel,
      controlaLote: produtoConfig.controlaLote,
      controlaValidade: produtoConfig.controlaValidade,
      quantidadeModo: parametros.quantidadeModo,
      controlaPalete: parametros.controlaPalete,
    },
    loteModo,
  );
}

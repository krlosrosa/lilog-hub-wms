import {
  RECEBIMENTO_V2_OP_TYPES,
  type DemandPatchBody,
  type DemandPatchRequest,
  type DemandPatchResult,
} from '@lilog/contracts';

import { countChecklistPhotoMediaIds } from '../lib/checklist-sync-payload';
import { mapAvariaV2SyncPayload } from '../lib/map-avaria-v2-sync-payload';
import { mapConferenciaV2SyncPayload } from '../lib/map-conferencia-v2-sync-payload';
import { normalizeParametrosConferenciaV2 } from '../lib/parametros-conferencia';
import {
  resolveProductCatalogFlags,
  resolveProductForSkuV2,
  resolveProdutoConferenciaV2,
  resolveProdutoIdForSkuV2,
  resolveUnidadesPorCaixa,
} from '../lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db, ensureRecebimentoV2DbReady } from '../local-db/db';
import type { DamageRecord, SyncConflictRecord } from '../local-db/schema';
import { pushDemandPatch } from '../api/pwa-sync-api';

import { markLegacySyncOpsForAppliedPatch } from './mark-sync-ops-for-patch.service';

function isDirtySyncStatus(status: string): boolean {
  return status === 'pending' || status === 'retry' || status === 'syncing';
}

function hasSectionConflict(
  result: DemandPatchResult,
  section: string,
  clientId?: string,
): boolean {
  return (result.conflicts ?? []).some(
    (conflict) =>
      conflict.section === section &&
      (clientId == null || conflict.clientId === clientId),
  );
}

async function resolveChecklistDockId(demandId: string): Promise<string> {
  const checklistOp = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT &&
        (op.status === 'pending' || op.status === 'retry'),
    )
    .first();

  const payload = checklistOp?.payload as { dockId?: string } | undefined;
  if (payload?.dockId?.trim()) {
    return payload.dockId.trim();
  }

  return '';
}

export async function buildDemandPatch(demandId: string): Promise<DemandPatchRequest | null> {
  await ensureRecebimentoV2DbReady();

  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process) {
    return null;
  }

  const patch: DemandPatchBody = {};
  const unitConfig = process.unidadeId
    ? await recebimentoV2Db.unitConfigs.get(process.unidadeId)
    : undefined;
  const parametros = normalizeParametrosConferenciaV2(unitConfig?.config);

  const checklist = await recebimentoV2Db.checklists.get(demandId);
  if (checklist && isDirtySyncStatus(checklist.syncStatus)) {
    const checklistOp = await recebimentoV2Db.syncOperations
      .where('aggregateId')
      .equals(demandId)
      .and((op) => op.opType === RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT)
      .first();

    const opPayload = checklistOp?.payload as
      | { dockId?: string; responsavelId?: number }
      | undefined;

    patch.checklist = {
      clientChecklistId: checklist.id,
      dockId: (await resolveChecklistDockId(demandId)) || checklist.dock,
      dock: checklist.dock,
      lacre: checklist.lacre,
      tempBau: checklist.tempBau,
      conditions: checklist.conditions,
      observacoes: checklist.observacoes,
      photoCount: countChecklistPhotoMediaIds(checklist.photoMediaIds),
      photoMediaIds: checklist.photoMediaIds,
      responsavelId: checklist.responsavelId ?? opPayload?.responsavelId,
    };
  }

  const dirtyConferences = await recebimentoV2Db.conferences
    .where('demandId')
    .equals(demandId)
    .filter((record) => isDirtySyncStatus(record.syncStatus))
    .toArray();

  if (dirtyConferences.length > 0) {
    patch.conferencias = [];

    for (const record of dirtyConferences) {
      if (record.deletedAt) {
        patch.conferencias.push({
          clientConferenceId: record.id,
          conferidoAt: record.conferidoAt,
          serverItemId: record.serverItemId,
          serverPesagemId: record.serverPesagemId,
          deletedAt: record.deletedAt,
        });
        continue;
      }

      const product = await resolveProductForSkuV2(demandId, record.sku);
      if (!product) {
        continue;
      }

      const produtoId = await resolveProdutoIdForSkuV2(demandId, record.sku, product);
      const produtoConfig = resolveProdutoConferenciaV2(product, parametros);
      const flags = resolveProductCatalogFlags(product);
      const syncPayload = mapConferenciaV2SyncPayload(
        record,
        {
          produtoId,
          unidadesPorCaixa: resolveUnidadesPorCaixa(
            product.unidadesPorCaixa,
            record.recebidaCaixa != null ? product.unidadesPorCaixa : undefined,
          ),
          pesoVariavel: flags.pesoVariavel,
          controlaLote: flags.controlaLote,
          controlaValidade: flags.controlaValidade,
          quantidadeModo: parametros.quantidadeModo,
          controlaPalete: parametros.controlaPalete,
        },
        parametros.loteModo,
      );

      patch.conferencias.push({
        clientConferenceId: record.id,
        produtoId: syncPayload.produtoId,
        sku: record.sku,
        quantidadeRecebida: syncPayload.quantidadeRecebida,
        unidadeMedida: syncPayload.unidadeMedida,
        loteRecebido: syncPayload.loteRecebido,
        validade: syncPayload.validade,
        pesoRecebido: syncPayload.pesoRecebido,
        etiquetaCodigo: syncPayload.etiquetaCodigo,
        unitizadorCodigo: syncPayload.unitizadorCodigo,
        isPvarBox: record.isPvarBox,
        conferidoAt: record.conferidoAt,
        serverItemId: record.serverItemId,
        serverPesagemId: record.serverPesagemId,
      });
    }
  }

  const dirtyDamages = await recebimentoV2Db.damages
    .where('demandId')
    .equals(demandId)
    .filter((record) => isDirtySyncStatus(record.syncStatus))
    .toArray();

  if (dirtyDamages.length > 0) {
    patch.avarias = [];

    for (const record of dirtyDamages) {
      if (record.deletedAt) {
        patch.avarias.push({
          clientDamageId: record.id,
          tipo: record.tipo ?? record.motivo ?? 'outro',
          natureza: record.natureza ?? 'outro',
          causa: record.causa ?? 'outro',
          quantidadeCaixas: record.quantidadeCaixa ?? 0,
          quantidadeUnidades: record.quantidadeUnidade ?? 0,
          serverAvariaId: record.serverAvariaId,
          deletedAt: record.deletedAt,
        });
        continue;
      }

      const product = record.sku
        ? await resolveProductForSkuV2(demandId, record.sku)
        : null;
      const produtoId = record.sku
        ? await resolveProdutoIdForSkuV2(demandId, record.sku, product)
        : undefined;

      const syncPayload = mapAvariaV2SyncPayload(record, produtoId);

      patch.avarias.push({
        clientDamageId: record.id,
        produtoId: syncPayload.produtoId,
        sku: record.sku,
        tipo: syncPayload.tipo,
        natureza: syncPayload.natureza,
        causa: syncPayload.causa,
        quantidadeCaixas: syncPayload.quantidadeCaixas,
        quantidadeUnidades: syncPayload.quantidadeUnidades,
        lote: syncPayload.lote,
        photoCount: syncPayload.photoCount,
        mediaIds: syncPayload.mediaIds,
        replicarParaTodos: record.replicarParaTodos,
        skusAlvo: syncPayload.skusAlvo,
        serverAvariaId: record.serverAvariaId,
      });
    }
  }

  const dirtyTemperatures = await recebimentoV2Db.temperatures
    .where('demandId')
    .equals(demandId)
    .filter((record) => isDirtySyncStatus(record.syncStatus))
    .toArray();

  if (dirtyTemperatures.length > 0) {
    patch.temperaturas = dirtyTemperatures.map((record) => ({
      etapa: record.etapa as 'inicio' | 'meio' | 'fim',
      temperatura: record.temperatura,
    }));
  }

  const impedimento = await recebimentoV2Db.impedimentos
    .where('demandId')
    .equals(demandId)
    .first();

  if (impedimento && isDirtySyncStatus(impedimento.syncStatus)) {
    patch.impedimento = {
      clientImpedimentoId: impedimento.id,
      tipo: impedimento.tipo,
      descricao: impedimento.descricao,
      photoCount: impedimento.mediaIds?.length ?? 0,
      mediaIds: impedimento.mediaIds,
    };
  }

  const retomarOp = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_RETOMAR &&
        (op.status === 'pending' || op.status === 'retry'),
    )
    .first();

  if (retomarOp) {
    patch.impedimento = {
      clientImpedimentoId: impedimento?.id ?? crypto.randomUUID(),
      tipo: impedimento?.tipo ?? 'outro',
      descricao: impedimento?.descricao ?? 'Retomar conferência',
      photoCount: impedimento?.mediaIds?.length ?? 1,
      retomar: true,
    };
  }

  const encerrarOp = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR &&
        (op.status === 'pending' || op.status === 'retry'),
    )
    .first();

  if (encerrarOp || process.pendingFinalizationSync) {
    const payload = encerrarOp?.payload as
      | { quantidadePaletes?: number; teveSobreposicaoCarga?: boolean }
      | undefined;

    patch.encerramento = {
      encerrar: true,
      quantidadePaletes: payload?.quantidadePaletes,
      teveSobreposicaoCarga: payload?.teveSobreposicaoCarga,
    };
  }

  const hasPatchContent = Object.keys(patch).length > 0;
  if (!hasPatchContent) {
    return null;
  }

  return {
    baseRevision: process.serverRevision,
    patch,
  };
}

export async function applyPatchResult(
  demandId: string,
  request: DemandPatchRequest,
  result: DemandPatchResult,
): Promise<void> {
  const now = Date.now();

  await recebimentoV2Db.transaction(
    'rw',
    [
      recebimentoV2Db.processes,
      recebimentoV2Db.checklists,
      recebimentoV2Db.conferences,
      recebimentoV2Db.damages,
      recebimentoV2Db.temperatures,
      recebimentoV2Db.impedimentos,
      recebimentoV2Db.demands,
      recebimentoV2Db.syncOperations,
      recebimentoV2Db.syncConflicts,
    ],
    async () => {
      if (result.applied.checklist && request.patch.checklist) {
        if (!hasSectionConflict(result, 'checklist', request.patch.checklist.clientChecklistId)) {
          await recebimentoV2Db.checklists.update(demandId, {
            syncStatus: 'synced',
            updatedAt: now,
          });
        }
      }

      if (request.patch.conferencias?.length) {
        for (const item of request.patch.conferencias) {
          if (hasSectionConflict(result, 'conferencias', item.clientConferenceId)) {
            continue;
          }

          await recebimentoV2Db.conferences.update(item.clientConferenceId, {
            syncStatus: 'synced',
            updatedAt: now,
          });
        }
      }

      if (request.patch.avarias?.length) {
        for (const item of request.patch.avarias) {
          if (hasSectionConflict(result, 'avarias', item.clientDamageId)) {
            continue;
          }

          const damageUpdate: Partial<DamageRecord> = {
            syncStatus: 'synced',
            updatedAt: now,
          };

          if (item.serverAvariaId) {
            damageUpdate.serverAvariaId = item.serverAvariaId;
          } else {
            const existing = await recebimentoV2Db.damages.get(item.clientDamageId);
            if (existing?.serverAvariaId) {
              damageUpdate.serverAvariaId = existing.serverAvariaId;
            }
          }

          await recebimentoV2Db.damages.update(item.clientDamageId, damageUpdate);
        }
      }

      if (request.patch.temperaturas?.length && result.applied.temperaturas) {
        for (const item of request.patch.temperaturas) {
          if (hasSectionConflict(result, 'temperaturas', item.etapa)) {
            continue;
          }

          await recebimentoV2Db.temperatures.update(`${demandId}::${item.etapa}`, {
            syncStatus: 'synced',
            updatedAt: now,
          });
        }
      }

      if (result.applied.impedimento && request.patch.impedimento) {
        if (
          !hasSectionConflict(result, 'impedimento', request.patch.impedimento.clientImpedimentoId)
        ) {
          await recebimentoV2Db.impedimentos.update(
            request.patch.impedimento.clientImpedimentoId,
            {
              syncStatus: 'synced',
              updatedAt: now,
            },
          );
        }
      }

      if (result.applied.encerrado) {
        await recebimentoV2Db.syncOperations
          .where('aggregateId')
          .equals(demandId)
          .and((op) => op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR)
          .modify((op) => {
            op.status = 'synced';
            op.updatedAt = now;
          });
      }

      if (request.patch.impedimento?.retomar) {
        await recebimentoV2Db.syncOperations
          .where('aggregateId')
          .equals(demandId)
          .and((op) => op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_RETOMAR)
          .modify((op) => {
            op.status = 'synced';
            op.updatedAt = now;
          });
      }

      await markLegacySyncOpsForAppliedPatch(demandId, request, result, now);

      const remainingPendingOps = await recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(demandId)
        .filter((op) => op.status === 'pending' || op.status === 'retry')
        .count();

      const hasConflicts = (result.conflicts?.length ?? 0) > 0;
      const nextStatus = hasConflicts
        ? 'conflict'
        : remainingPendingOps > 0
          ? 'pendingSync'
          : result.applied.encerrado
            ? 'completed'
            : 'working';

      await recebimentoV2Db.processes.update(demandId, {
        serverRevision: result.serverRevision,
        lastSyncedAt: now,
        updatedAt: now,
        status: nextStatus,
        pendingFinalizationSync: result.applied.encerrado ? false : undefined,
        ...(result.resourceId ? { recebimentoId: result.resourceId } : {}),
      });

      if (result.applied.impedimento && request.patch.impedimento && !request.patch.impedimento.retomar) {
        await recebimentoV2Db.demands.update(demandId, {
          situacao: 'impedido',
          status: 'impedido',
          updatedAt: now,
        });
      }

      if (request.patch.impedimento?.retomar && result.applied.impedimento) {
        await recebimentoV2Db.demands.update(demandId, {
          situacao: 'em_conferencia',
          status: 'em_conferencia',
          updatedAt: now,
        });
      }

      if (hasConflicts) {
        const conflict: SyncConflictRecord = {
          id: crypto.randomUUID(),
          aggregateId: demandId,
          batchId: crypto.randomUUID(),
          serverRevision: result.serverRevision,
          localRevision: request.baseRevision,
          sections: [...new Set((result.conflicts ?? []).map((item) => item.section))],
          serverSnapshot: undefined,
          resolved: false,
          createdAt: now,
        };
        await recebimentoV2Db.syncConflicts.put(conflict);
      }
    },
  );
}

export async function pushDemandPatchFromLocal(demandId: string): Promise<DemandPatchResult | null> {
  const request = await buildDemandPatch(demandId);
  if (!request) {
    return null;
  }

  const result = await pushDemandPatch(demandId, request);
  await applyPatchResult(demandId, request, result);
  return result;
}

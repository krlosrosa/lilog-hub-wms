import { RECEBIMENTO_V2_OP_TYPES, type SyncBatchRequest, type SyncBatchResult } from '@lilog/contracts';

import { toBaseUnits } from '@/features/recebimento/lib/resolve-recebimento-divergencia';

import { filterSyncableOperations } from './palete-session-v2.service';
import { isOpAutoSyncable, nextRetryAttemptAt } from '../lib/sync-retry-policy';
import { debugRecebimentoV2, errorRecebimentoV2 } from '../lib/sync-debug';
import { reconcileRemoteSituacao } from '../lib/reconcile-remote-situacao';
import { isRevisionConflictError } from '../lib/sync-revision-conflict';
import { fetchPackage, fetchSnapshot, pushBatch } from '../api/sync-api';
import {
  buildSkuByProdutoIdMap,
  mapServerAvariaToRecord,
  mapServerConferenciaToRecord,
  mapServerTemperaturaToRecord,
  resolveSnapshotAvarias,
  resolveSnapshotConferences,
  resolveSnapshotTemperaturas,
} from '../lib/map-snapshot-v2';
import {
  mapServerChecklistToRecord,
  resolveDockLabel,
  resolveSnapshotChecklist,
} from '../lib/map-server-checklist-v2';
import { recebimentoV2Db, ensureRecebimentoV2DbReady } from '../local-db/db';

import { reconcileOrphanedPendingSyncOps } from './mark-sync-ops-for-patch.service';
import {
  filterServerDamagesAgainstPendingDeletes,
  splitDamagesForPullMerge,
} from './damage-removal.helpers';
import { deriveLifecycleFromStatus } from '../lib/sync-operation-lifecycle';
import type {
  ExpectedItemRecord,
  ProcessRecord,
  SyncConflictRecord,
  SyncOperationRecord,
  SyncOperationStatus,
} from '../local-db/schema';
import type { RecebimentoPackage } from '../types/recebimento-v2.schema';
import {
  collectChecklistPhotoIds,
  countPendingPhotoUploads,
  recoverStuckSyncState,
  resolveRecebimentoIdForDemand,
  stampAvariaMediaTargets,
  stampChecklistMediaTargets,
  stampImpedimentoMediaTargets,
} from './sync-photo.helpers';
import { processPhotoQueue, triggerPhotoQueue } from './photo-upload-queue.service';

export interface PushResult {
  accepted: number;
  rejected: number;
  conflicts: number;
  newRevision: number;
  photosUploaded: number;
  photosFailed: number;
  photosPending: number;
}

export type PullDemandOptions = {
  /** Apaga dados locais e substitui pelo snapshot do servidor, descartando ops pendentes. */
  force?: boolean;
};

export type PushDemandOptions = {
  /** Bypass retry backoff and max-attempt limits for user-initiated sync. */
  manual?: boolean;
};

const PULL_DISCARD_OP_STATUSES = new Set<SyncOperationStatus>(['pending', 'syncing', 'retry']);

export async function countPullOverwriteRisk(demandId: string): Promise<number> {
  await ensureRecebimentoV2DbReady();

  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .toArray();

  return ops.filter((op) => PULL_DISCARD_OP_STATUSES.has(op.status)).length;
}

function isSuccessfulConferenceOp(
  op: SyncOperationRecord,
  opResult: SyncBatchResult['operations'][number],
): boolean {
  return (
    (op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR ||
      op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE ||
      op.opType === RECEBIMENTO_V2_OP_TYPES.PESAGEM_REMOVE) &&
    (opResult.status === 'applied' || opResult.status === 'skipped')
  );
}

function isSuccessfulAvariaOp(
  op: SyncOperationRecord,
  opResult: SyncBatchResult['operations'][number],
): boolean {
  return (
    op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR &&
    (opResult.status === 'applied' || opResult.status === 'skipped')
  );
}

function isSuccessfulTemperaturaOp(
  op: SyncOperationRecord,
  opResult: SyncBatchResult['operations'][number],
): boolean {
  return (
    op.opType === RECEBIMENTO_V2_OP_TYPES.TEMPERATURA_UPSERT &&
    (opResult.status === 'applied' || opResult.status === 'skipped')
  );
}

function isSuccessfulImpedimentoOp(
  op: SyncOperationRecord,
  opResult: SyncBatchResult['operations'][number],
): boolean {
  return (
    op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER &&
    (opResult.status === 'applied' || opResult.status === 'skipped')
  );
}

async function applyImpedimentoSyncResults(
  pendingOps: SyncOperationRecord[],
  result: SyncBatchResult,
  demandId: string,
  now: number,
): Promise<boolean> {
  let applied = false;

  for (const opResult of result.operations) {
    if (opResult.status !== 'applied' && opResult.status !== 'skipped') {
      continue;
    }

    const op = pendingOps.find((item) => item.id === opResult.opId);
    if (!op || op.opType !== RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER) {
      continue;
    }

    applied = true;

    const payload = op.payload as { impedimentoId?: string; mediaIds?: string[] };
    if (!payload.impedimentoId) {
      continue;
    }

    await recebimentoV2Db.impedimentos.update(payload.impedimentoId, {
      ...(opResult.serverId ? { serverImpedimentoId: opResult.serverId } : {}),
      syncStatus: 'synced',
      updatedAt: now,
    }).catch(() => undefined);

    const impedimento = await recebimentoV2Db.impedimentos.get(payload.impedimentoId);
    const mediaIds = payload.mediaIds ?? impedimento?.mediaIds ?? [];
    if (mediaIds.length > 0) {
      await stampImpedimentoMediaTargets(mediaIds, demandId);
    }
  }

  if (applied) {
    const demand = await recebimentoV2Db.demands.get(demandId);
    if (demand?.situacao !== 'em_conferencia' && demand?.situacao !== 'conferido') {
      await recebimentoV2Db.demands.update(demandId, {
        situacao: 'impedido',
        status: 'impedido',
        updatedAt: now,
      }).catch(() => undefined);
    }
  }

  return applied;
}

async function applyDamageSyncResults(
  pendingOps: SyncOperationRecord[],
  result: SyncBatchResult,
  now: number,
): Promise<void> {
  for (const opResult of result.operations) {
    if (opResult.status !== 'applied' && opResult.status !== 'skipped') {
      continue;
    }

    const op = pendingOps.find((item) => item.id === opResult.opId);
    if (!op) {
      continue;
    }

    if (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR) {
      const payload = op.payload as { damageId?: string; mediaIds?: string[] };
      if (payload.damageId) {
        await recebimentoV2Db.damages.update(payload.damageId, {
          ...(opResult.serverId ? { serverAvariaId: opResult.serverId } : {}),
          syncStatus: 'synced',
          updatedAt: now,
        }).catch(() => undefined);

        if (opResult.serverId) {
          const existingOp = await recebimentoV2Db.syncOperations.get(opResult.opId);
          const existingPayload = (existingOp?.payload ?? op.payload) as Record<string, unknown>;
          await recebimentoV2Db.syncOperations.update(opResult.opId, {
            payload: {
              ...existingPayload,
              serverAvariaId: opResult.serverId,
            },
            updatedAt: now,
          }).catch(() => undefined);

          const damage = await recebimentoV2Db.damages.get(payload.damageId);
          const mediaIds = payload.mediaIds ?? damage?.mediaIds ?? op.attachmentIds ?? [];
          if (mediaIds.length > 0) {
            await stampAvariaMediaTargets(mediaIds, opResult.serverId);
          }
        }
      }
      continue;
    }

    if (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER) {
      const payload = op.payload as { damageId?: string };
      if (payload.damageId) {
        await recebimentoV2Db.damages.update(payload.damageId, {
          syncStatus: 'synced',
          updatedAt: now,
        }).catch(() => undefined);
      }
      continue;
    }

    if (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_CLEAR) {
      const damages = await recebimentoV2Db.damages
        .where('demandId')
        .equals(op.aggregateId)
        .toArray();

      for (const damage of damages) {
        if (damage.deletedAt) {
          await recebimentoV2Db.damages.update(damage.id, {
            syncStatus: 'synced',
            updatedAt: now,
          }).catch(() => undefined);
        }
      }
    }
  }
}

async function applyTemperatureSyncResults(
  pendingOps: SyncOperationRecord[],
  result: SyncBatchResult,
  now: number,
): Promise<void> {
  for (const opResult of result.operations) {
    if (opResult.status !== 'applied' && opResult.status !== 'skipped') {
      continue;
    }

    const op = pendingOps.find((item) => item.id === opResult.opId);
    if (!op || !isSuccessfulTemperaturaOp(op, opResult)) {
      continue;
    }

    const payload = op.payload as { id?: string; demandId?: string; etapa?: string };
    const recordId =
      payload.id ??
      (payload.demandId && payload.etapa
        ? `${payload.demandId}::${payload.etapa}`
        : undefined);

    if (!recordId) {
      continue;
    }

    await recebimentoV2Db.temperatures.update(recordId, {
      syncStatus: 'synced',
      updatedAt: now,
    }).catch(() => undefined);
  }
}

async function applyConferenceSyncResults(
  pendingOps: SyncOperationRecord[],
  result: SyncBatchResult,
  now: number,
): Promise<void> {
  for (const opResult of result.operations) {
    if (opResult.status !== 'applied' && opResult.status !== 'skipped') {
      continue;
    }

    const op = pendingOps.find((item) => item.id === opResult.opId);
    if (!op || !isSuccessfulConferenceOp(op, opResult)) {
      continue;
    }

    const payload = op.payload as { conferenceId?: string };
    const conferenceId = payload.conferenceId;
    if (!conferenceId) {
      continue;
    }

    if (op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR && opResult.serverId) {
      const existingOp = await recebimentoV2Db.syncOperations.get(opResult.opId);
      const existingPayload = (existingOp?.payload ?? op.payload) as Record<string, unknown>;

      await recebimentoV2Db.conferences.update(conferenceId, {
        serverItemId: opResult.serverId,
        ...(opResult.serverPesagemId ? { serverPesagemId: opResult.serverPesagemId } : {}),
        syncStatus: 'synced',
        updatedAt: now,
      });
      await recebimentoV2Db.syncOperations.update(opResult.opId, {
        payload: {
          ...existingPayload,
          serverItemId: opResult.serverId,
          ...(opResult.serverPesagemId ? { serverPesagemId: opResult.serverPesagemId } : {}),
        },
        updatedAt: now,
      });
      continue;
    }

    if (
      op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE ||
      op.opType === RECEBIMENTO_V2_OP_TYPES.PESAGEM_REMOVE
    ) {
      await recebimentoV2Db.conferences.update(conferenceId, {
        syncStatus: 'synced',
        updatedAt: now,
      }).catch(() => undefined);
    }
  }
}

/**
 * Checks if the local base revision is behind the server.
 * Returns true if a conflict exists (server has newer revision).
 */
export async function checkRevisionConflict(
  demandId: string,
  baseRevision: number,
): Promise<boolean> {
  try {
    const snapshot = await fetchSnapshot(demandId);
    return snapshot.revision > baseRevision;
  } catch {
    return false;
  }
}

/**
 * Builds a SyncBatchRequest from pending local operations.
 */
function buildBatchRequest(
  ops: SyncOperationRecord[],
  process: { id: string; unidadeId: string; serverRevision: number },
): SyncBatchRequest {
  return {
    protocolVersion: 2,
    adapter: 'recebimento-v2',
    batchId: crypto.randomUUID(),
    unidadeId: process.unidadeId,
    aggregateType: 'recebimento',
    aggregateId: process.id,
    baseRevision: process.serverRevision,
    operations: ops.map((op) => ({
      opId: op.id,
      type: op.opType,
      sequence: op.sequence,
      dependsOn: op.dependsOn,
      idempotencyKey: op.idempotencyKey,
      payload: op.payload,
      attachments: [],
      createdAt: op.createdAt,
    })),
  };
}

function isSuccessfulChecklistOp(
  op: SyncOperationRecord,
  opResult: SyncBatchResult['operations'][number],
): boolean {
  return (
    op.opType === RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT &&
    (opResult.status === 'applied' || opResult.status === 'skipped')
  );
}

function isSuccessfulEncerrarOp(
  op: SyncOperationRecord,
  opResult: SyncBatchResult['operations'][number],
): boolean {
  return (
    op.opType === RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR &&
    (opResult.status === 'applied' || opResult.status === 'skipped')
  );
}

async function resolveRecebimentoId(
  demandId: string,
  result: SyncBatchResult,
  pendingOps: SyncOperationRecord[],
): Promise<string | null> {
  if (result.resourceId) {
    return resolveRecebimentoIdForDemand(demandId, result.resourceId);
  }

  for (const opResult of result.operations) {
    if (!opResult.serverId) continue;

    const op = pendingOps.find((item) => item.id === opResult.opId);
    if (op?.opType === RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT) {
      return resolveRecebimentoIdForDemand(demandId, opResult.serverId);
    }
  }

  return resolveRecebimentoIdForDemand(demandId);
}

async function countRemainingPendingPhotos(demandId: string): Promise<number> {
  const photoCounts = await countPendingPhotoUploads(demandId);
  return photoCounts.pending + photoCounts.uploading + photoCounts.error;
}

async function handleRevisionConflict(
  demandId: string,
  stuckOpIds: string[],
  previousStatus: string,
): Promise<void> {
  const now = Date.now();

  await recebimentoV2Db.processes.update(demandId, {
    status: previousStatus === 'syncing' ? 'working' : previousStatus,
    pendingFinalizationSync: false,
    updatedAt: now,
  });

  await pullDemand(demandId, { force: false });

  const snapshot = await fetchSnapshot(demandId);
  const appliedByConferenceId = new Map<string, Record<string, unknown>>();

  for (const entry of resolveSnapshotConferences(snapshot)) {
    const clientConferenceId =
      typeof entry.clientConferenceId === 'string' && entry.clientConferenceId.trim()
        ? entry.clientConferenceId.trim()
        : undefined;

    if (clientConferenceId) {
      appliedByConferenceId.set(clientConferenceId, entry);
    }
  }

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.syncOperations, recebimentoV2Db.conferences],
    async () => {
      for (const opId of stuckOpIds) {
        const op = await recebimentoV2Db.syncOperations.get(opId);
        if (!op) {
          continue;
        }

        const payload = op.payload as { conferenceId?: string };
        const conferenceId = payload.conferenceId;
        const serverEntry =
          conferenceId && appliedByConferenceId.has(conferenceId)
            ? appliedByConferenceId.get(conferenceId)
            : undefined;

        if (serverEntry) {
          const recebimentoItemId =
            typeof serverEntry.recebimentoItemId === 'string'
              ? serverEntry.recebimentoItemId
              : typeof serverEntry.id === 'string'
                ? serverEntry.id
                : undefined;
          const pesagemId =
            typeof serverEntry.pesagemId === 'string' ? serverEntry.pesagemId : undefined;

          if (conferenceId) {
            await recebimentoV2Db.conferences
              .update(conferenceId, {
                syncStatus: 'synced',
                ...(recebimentoItemId ? { serverItemId: recebimentoItemId } : {}),
                ...(pesagemId ? { serverPesagemId: pesagemId } : {}),
                updatedAt: now,
              })
              .catch(() => undefined);
          }

          await recebimentoV2Db.syncOperations.update(opId, {
            status: 'synced',
            lifecycleStatus: deriveLifecycleFromStatus('synced'),
            errorMessage: undefined,
            nextAttemptAt: undefined,
            payload: {
              ...(op.payload as Record<string, unknown>),
              ...(recebimentoItemId ? { serverItemId: recebimentoItemId } : {}),
              ...(pesagemId ? { serverPesagemId: pesagemId } : {}),
            },
            updatedAt: now,
          });
          continue;
        }

        await recebimentoV2Db.syncOperations.update(opId, {
          status: 'pending',
          lifecycleStatus: deriveLifecycleFromStatus('pending'),
          attempts: 0,
          errorMessage: undefined,
          nextAttemptAt: undefined,
          updatedAt: now,
        });
      }
    },
  );
}

/**
 * Pushes all pending sync operations for a demand to the server.
 */
export async function pushDemand(
  demandId: string,
  options?: PushDemandOptions,
): Promise<PushResult> {
  await recoverStuckSyncState(demandId);

  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process) throw new Error(`Processo ${demandId} não encontrado`);

  // Get all pending operations for this demand
  const pendingOps = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and((op) => op.status === 'pending' || op.status === 'retry')
    .sortBy('createdAt') as SyncOperationRecord[];

  const retryEligibleOps = options?.manual
    ? pendingOps
    : pendingOps.filter((op) => isOpAutoSyncable(op));

  const syncableOps = await filterSyncableOperations(demandId, retryEligibleOps);

  if (syncableOps.length === 0) {
    let photosUploaded = 0;
    let photosFailed = 0;

    try {
      const photoResult = await processPhotoQueue(demandId);
      photosUploaded = photoResult.uploaded;
      photosFailed = photoResult.failed;
    } catch (err) {
      console.error('[PHOTO UPLOAD] Falha ao enviar fotos pendentes', { demandId, err });
    }

    return {
      accepted: 0,
      rejected: 0,
      conflicts: 0,
      newRevision: process.serverRevision,
      photosUploaded,
      photosFailed,
      photosPending: await countRemainingPendingPhotos(demandId),
    };
  }

  const previousStatus = process.status;

  await recebimentoV2Db.processes.update(demandId, {
    status: 'syncing',
    updatedAt: Date.now(),
  });

  const opIds = syncableOps.map((op) => op.id);

  // Mark syncable ops as 'syncing'
  await recebimentoV2Db.syncOperations
    .where('id')
    .anyOf(opIds)
    .modify((op: SyncOperationRecord) => {
      op.status = 'syncing';
      op.lifecycleStatus = deriveLifecycleFromStatus('syncing');
      op.updatedAt = Date.now();
    });

  const batch = buildBatchRequest(syncableOps, process);

  let result: SyncBatchResult;
  try {
    result = await pushBatch(batch);
    debugRecebimentoV2('sync', 'pushDemand result', {
      demandId,
      batchId: result.batchId,
      appliedCount: result.appliedCount,
      errorCount: result.errorCount,
      operations: result.operations.map((op) => ({
        opId: op.opId,
        status: op.status,
        message: op.message,
        serverId: 'serverId' in op ? op.serverId : undefined,
      })),
    });
  } catch (err) {
    errorRecebimentoV2('sync', 'pushBatch failed', { demandId, err });

    if (isRevisionConflictError(err)) {
      await handleRevisionConflict(demandId, opIds, previousStatus);
      const { repairSyncOperations } = await import('./repair-sync-operations.service');
      await repairSyncOperations(demandId).catch(() => undefined);
      const { resetAutoSyncBackoff, triggerAutoSyncIfPending } = await import(
        './auto-sync-v2.service'
      );
      resetAutoSyncBackoff(demandId);
      triggerAutoSyncIfPending(demandId);

      const updatedProcess = await recebimentoV2Db.processes.get(demandId);
      return {
        accepted: 0,
        rejected: 0,
        conflicts: 0,
        newRevision: updatedProcess?.serverRevision ?? process.serverRevision,
        photosUploaded: 0,
        photosFailed: 0,
        photosPending: await countRemainingPendingPhotos(demandId),
      };
    }

    // Revert to retry on network error
    await recebimentoV2Db.transaction(
      'rw',
      [recebimentoV2Db.syncOperations, recebimentoV2Db.processes],
      async () => {
        await recebimentoV2Db.syncOperations
          .where('id')
          .anyOf(opIds)
          .modify((op: SyncOperationRecord) => {
            const nextAttempts = (op.attempts ?? 0) + 1;
            op.status = 'retry';
            op.lifecycleStatus = deriveLifecycleFromStatus('retry');
            op.attempts = nextAttempts;
            op.errorMessage =
              err instanceof Error ? err.message : 'Falha ao enviar — erro desconhecido';
            op.nextAttemptAt = nextRetryAttemptAt(nextAttempts);
            op.updatedAt = Date.now();
          });

        await recebimentoV2Db.processes.update(demandId, {
          status: previousStatus === 'syncing' ? 'working' : previousStatus,
          pendingFinalizationSync: false,
          updatedAt: Date.now(),
        });
      },
    );
    throw err;
  }

  const now = Date.now();
  let conflictCount = 0;

  try {
    await recebimentoV2Db.transaction(
      'rw',
      [
        recebimentoV2Db.syncOperations,
        recebimentoV2Db.syncConflicts,
        recebimentoV2Db.processes,
        recebimentoV2Db.checklists,
        recebimentoV2Db.conferences,
        recebimentoV2Db.damages,
        recebimentoV2Db.impedimentos,
        recebimentoV2Db.demands,
        recebimentoV2Db.media,
      ],
      async () => {
        let rejectedCount = 0;
        let retryCount = 0;

        for (const opResult of result.operations) {
          switch (opResult.status) {
            case 'applied':
            case 'skipped':
              await recebimentoV2Db.syncOperations.update(opResult.opId, {
                status: 'synced',
                lifecycleStatus: deriveLifecycleFromStatus('synced'),
                updatedAt: now,
              });
              break;

            case 'conflict': {
              conflictCount++;
              await recebimentoV2Db.syncOperations.update(opResult.opId, {
                status: 'conflict',
                lifecycleStatus: deriveLifecycleFromStatus('conflict'),
                errorMessage: opResult.message,
                updatedAt: now,
              });

              const conflict: SyncConflictRecord = {
                id: crypto.randomUUID(),
                aggregateId: demandId,
                batchId: result.batchId,
                serverRevision: result.serverRevision,
                localRevision: process.serverRevision,
                sections: ['operations'],
                serverSnapshot: undefined,
                resolved: false,
                createdAt: now,
              };
              await recebimentoV2Db.syncConflicts.put(conflict);
              break;
            }

            case 'rejected':
              rejectedCount += 1;
              await recebimentoV2Db.syncOperations.update(opResult.opId, {
                status: 'rejected',
                lifecycleStatus: deriveLifecycleFromStatus('rejected'),
                errorMessage: opResult.message,
                updatedAt: now,
              });
              break;

            case 'retryable': {
              retryCount += 1;
              const currentOp = await recebimentoV2Db.syncOperations.get(opResult.opId);
              const nextAttempts = (currentOp?.attempts ?? 0) + 1;
              await recebimentoV2Db.syncOperations.update(opResult.opId, {
                status: 'retry',
                lifecycleStatus: deriveLifecycleFromStatus('retry'),
                errorMessage: opResult.message,
                attempts: nextAttempts,
                nextAttemptAt: nextRetryAttemptAt(nextAttempts),
                updatedAt: now,
              });
              break;
            }
          }
        }

        const impedimentoApplied = await applyImpedimentoSyncResults(
          syncableOps,
          result,
          demandId,
          now,
        );

        const remainingPendingOps = await recebimentoV2Db.syncOperations
          .where('aggregateId')
          .equals(demandId)
          .filter((op) => op.status === 'pending' || op.status === 'retry')
          .count();

        const hasSuccessfulEncerrarOp = result.operations.some((opResult) => {
          const op = syncableOps.find((item) => item.id === opResult.opId);
          return op != null && isSuccessfulEncerrarOp(op, opResult);
        });

        const nextProcessStatus =
          conflictCount > 0
            ? 'conflict'
            : remainingPendingOps > 0 || rejectedCount > 0 || retryCount > 0
              ? 'pendingSync'
              : hasSuccessfulEncerrarOp
                ? 'completed'
                : impedimentoApplied
                  ? 'pendingSync'
                  : 'working';

        await recebimentoV2Db.processes.update(demandId, {
          serverRevision: result.serverRevision,
          lastSyncedAt: now,
          updatedAt: now,
          status: nextProcessStatus,
          pendingFinalizationSync: false,
          ...(result.resourceId ? { recebimentoId: result.resourceId } : {}),
        });

        const hasSuccessfulChecklistOp = result.operations.some((opResult) => {
          const op = syncableOps.find((item) => item.id === opResult.opId);
          return op != null && isSuccessfulChecklistOp(op, opResult);
        });

        if (hasSuccessfulChecklistOp) {
          await recebimentoV2Db.checklists.update(demandId, {
            syncStatus: 'synced',
            updatedAt: now,
          });

          const recebimentoId = await resolveRecebimentoId(demandId, result, syncableOps);
          if (recebimentoId) {
            const checklist = await recebimentoV2Db.checklists.get(demandId);
            await stampChecklistMediaTargets(
              collectChecklistPhotoIds(checklist?.photoMediaIds),
              recebimentoId,
            );
          }
        }

        await applyConferenceSyncResults(syncableOps, result, now);
        await applyDamageSyncResults(syncableOps, result, now);
        await applyTemperatureSyncResults(syncableOps, result, now);
      },
    );
  } catch (err) {
    await recebimentoV2Db.transaction(
      'rw',
      [recebimentoV2Db.syncOperations, recebimentoV2Db.processes],
      async () => {
        await recebimentoV2Db.syncOperations
          .where('id')
          .anyOf(opIds)
          .modify((op: SyncOperationRecord) => {
            op.status = 'pending';
            op.lifecycleStatus = deriveLifecycleFromStatus('pending');
            op.updatedAt = now;
          });

        await recebimentoV2Db.processes.update(demandId, {
          status: previousStatus === 'syncing' ? 'working' : previousStatus,
          pendingFinalizationSync: false,
          updatedAt: now,
        });
      },
    );
    throw err;
  }

  let photosUploaded = 0;
  let photosFailed = 0;

  try {
    await resolveRecebimentoId(demandId, result, syncableOps);
    const photoResult = await processPhotoQueue(demandId);
    photosUploaded = photoResult.uploaded;
    photosFailed = photoResult.failed;
    triggerPhotoQueue(demandId);
  } catch (err) {
    console.error('[PHOTO UPLOAD] Falha ao enviar fotos após sync', { demandId, err });
  }

  const { repairSyncOperations } = await import('./repair-sync-operations.service');
  await repairSyncOperations(demandId).catch(() => undefined);

  return {
    accepted: result.appliedCount,
    rejected: result.errorCount,
    conflicts: conflictCount,
    newRevision: result.serverRevision,
    photosUploaded,
    photosFailed,
    photosPending: await countRemainingPendingPhotos(demandId),
  };
}

/**
 * Pulls the latest snapshot for a demand and applies changes to local DB,
 * without overwriting locally-dirty (pending sync) records.
 */
async function buildSkuLookupForDemand(
  demandId: string,
  serverItems: Array<Record<string, unknown>>,
): Promise<Map<string, string>> {
  const expectedItems = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(demandId)
    .toArray();

  const produtoIds = new Set(expectedItems.map((item) => item.produtoId));
  for (const item of serverItems) {
    if (item.produtoId) {
      produtoIds.add(String(item.produtoId));
    }
  }

  const products =
    produtoIds.size > 0
      ? await recebimentoV2Db.products.bulkGet([...produtoIds])
      : [];

  return buildSkuByProdutoIdMap(
    expectedItems,
    products.filter((product): product is NonNullable<typeof product> =>
      Boolean(product && product.deletedAt === null),
    ),
  );
}

async function buildExpectedItemsFromPackage(
  demandId: string,
  pkg: RecebimentoPackage,
  now: number,
): Promise<ExpectedItemRecord[]> {
  const detalheProdutos = new Map(
    (pkg.detalhe?.produtos ?? []).map((produto) => [
      produto.produtoId,
      { sku: produto.sku, descricao: produto.descricao },
    ]),
  );

  const produtoIds = pkg.preRecebimento?.itens?.map((item) => item.produtoId) ?? [];
  const catalogProducts =
    produtoIds.length > 0 ? await recebimentoV2Db.products.bulkGet(produtoIds) : [];
  const catalogByProdutoId = new Map(
    catalogProducts
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product && product.deletedAt === null),
      )
      .map((product) => [product.produtoId, product]),
  );

  return (pkg.preRecebimento?.itens ?? []).map((item) => {
    const fromDetalhe = detalheProdutos.get(item.produtoId);
    const fromCatalog = catalogByProdutoId.get(item.produtoId);
    const sku =
      item.sku?.trim() ||
      fromDetalhe?.sku ||
      fromCatalog?.sku ||
      item.produtoId;
    const descricao =
      item.descricao?.trim() ||
      fromDetalhe?.descricao ||
      fromCatalog?.description ||
      '';
    const unidadesPorCaixa =
      item.unidadesPorCaixa ?? fromCatalog?.unidadesPorCaixa ?? 1;

    return {
      id: `${demandId}::${item.produtoId}`,
      demandId,
      produtoId: item.produtoId,
      sku,
      descricao,
      quantidadeEsperada: toBaseUnits(
        item.quantidadeEsperada,
        item.unidadeMedida,
        unidadesPorCaixa,
      ),
      unidadeMedida: 'UN',
      unidadesPorCaixa,
      updatedAt: now,
    };
  });
}

export async function pullDemand(
  demandId: string,
  options?: PullDemandOptions,
): Promise<void> {
  await ensureRecebimentoV2DbReady();

  const force = options?.force === true;
  const now = Date.now();
  const [snapshot, forcePackage] = await Promise.all([
    fetchSnapshot(demandId),
    force ? fetchPackage(demandId).catch(() => null) : Promise.resolve(null),
  ]);
  const forceExpectedItems =
    force && forcePackage
      ? await buildExpectedItemsFromPackage(demandId, forcePackage, now)
      : null;
  const snapshotConferences = resolveSnapshotConferences(snapshot);
  const snapshotAvarias = resolveSnapshotAvarias(snapshot);
  const snapshotTemperaturas = resolveSnapshotTemperaturas(snapshot);
  const snapshotChecklist = resolveSnapshotChecklist(snapshot);
  const skuByProdutoId = await buildSkuLookupForDemand(demandId, [
    ...snapshotConferences,
    ...snapshotAvarias,
  ]);
  const process = await recebimentoV2Db.processes.get(demandId);
  const demand = await recebimentoV2Db.demands.get(demandId).catch(() => undefined);
  const unidadeId = process?.unidadeId ?? demand?.unidadeId ?? '';

  let checklistDock = '';
  if (snapshotChecklist) {
    const docaId =
      typeof snapshotChecklist.docaId === 'string' ? snapshotChecklist.docaId : null;
    checklistDock = await resolveDockLabel(unidadeId, docaId);
  }

  const dirtyOps = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .and((op: SyncOperationRecord) => PULL_DISCARD_OP_STATUSES.has(op.status))
    .toArray() as SyncOperationRecord[];

  const hasDirtyOps = dirtyOps.length > 0;
  const shouldApplySnapshot = force || !hasDirtyOps;

  const transactionTables = [
    recebimentoV2Db.expectedItems,
    recebimentoV2Db.conferences,
    recebimentoV2Db.damages,
    recebimentoV2Db.checklists,
    recebimentoV2Db.temperatures,
    recebimentoV2Db.processes,
    recebimentoV2Db.demands,
    ...(force ? [recebimentoV2Db.syncOperations] : []),
  ];

  await recebimentoV2Db.transaction('rw', transactionTables, async () => {
    if (force && dirtyOps.length > 0) {
      await recebimentoV2Db.syncOperations
        .where('id')
        .anyOf(dirtyOps.map((op) => op.id))
        .modify((op: SyncOperationRecord) => {
          op.status = 'rejected';
          op.errorMessage = 'Descartado por atualização forçada do servidor';
          op.updatedAt = now;
        });
    }

    if (forceExpectedItems !== null) {
      await recebimentoV2Db.expectedItems.where('demandId').equals(demandId).delete();
      if (forceExpectedItems.length > 0) {
        await recebimentoV2Db.expectedItems.bulkPut(forceExpectedItems);
      }
    } else if ((snapshot.expectedItems?.length ?? 0) > 0) {
      await recebimentoV2Db.expectedItems.where('demandId').equals(demandId).delete();
      await recebimentoV2Db.expectedItems.bulkPut(
        snapshot.expectedItems!.map((item) => ({ ...item, updatedAt: item.updatedAt ?? now })),
      );
    }

    if (shouldApplySnapshot) {
      await recebimentoV2Db.conferences.where('demandId').equals(demandId).delete();
      if (snapshotConferences.length > 0) {
        await recebimentoV2Db.conferences.bulkPut(
          snapshotConferences.map((item) =>
            mapServerConferenciaToRecord(item, demandId, now, 'ambos', skuByProdutoId),
          ),
        );
      }

      const existingDamages = await recebimentoV2Db.damages
        .where('demandId')
        .equals(demandId)
        .toArray();
      const { pendingDeletes, pendingDeleteServerIds } =
        splitDamagesForPullMerge(existingDamages);

      await recebimentoV2Db.damages.where('demandId').equals(demandId).delete();

      const snapshotDamages = snapshotAvarias.map((item) =>
        mapServerAvariaToRecord(item, demandId, now, skuByProdutoId),
      );
      const damagesToRestore = filterServerDamagesAgainstPendingDeletes(
        snapshotDamages,
        pendingDeleteServerIds,
      );

      if (damagesToRestore.length > 0) {
        await recebimentoV2Db.damages.bulkPut(damagesToRestore);
      }

      if (pendingDeletes.length > 0) {
        await recebimentoV2Db.damages.bulkPut(pendingDeletes);
      }

      if (snapshotChecklist) {
        await recebimentoV2Db.checklists.put(
          mapServerChecklistToRecord(snapshotChecklist, demandId, checklistDock, now),
        );
      } else if ((snapshot.checklists?.length ?? 0) > 0) {
        for (const checklist of snapshot.checklists!) {
          await recebimentoV2Db.checklists.put(
            { syncStatus: 'synced', updatedAt: now, ...checklist } as never,
          );
        }
      } else if (force) {
        await recebimentoV2Db.checklists.delete(demandId);
      } else if (process?.dock?.trim()) {
        const existingChecklist = await recebimentoV2Db.checklists.get(demandId);
        if (
          (!existingChecklist || existingChecklist.syncStatus === 'synced') &&
          !existingChecklist?.dock?.trim()
        ) {
          await recebimentoV2Db.checklists.put({
            demandId,
            id: existingChecklist?.id ?? crypto.randomUUID(),
            dock: process.dock.trim(),
            lacre: existingChecklist?.lacre ?? '',
            tempBau: existingChecklist?.tempBau,
            conditions: existingChecklist?.conditions ?? {},
            observacoes: existingChecklist?.observacoes,
            savedAt: existingChecklist?.savedAt ?? new Date(now).toISOString(),
            syncStatus: existingChecklist?.syncStatus ?? 'synced',
            updatedAt: now,
          });
        }
      }

      await recebimentoV2Db.temperatures.where('demandId').equals(demandId).delete();
      const temperaturasToApply =
        snapshotTemperaturas.length > 0
          ? snapshotTemperaturas
          : force && forcePackage?.temperaturas?.length
            ? forcePackage.temperaturas
            : [];
      if (temperaturasToApply.length > 0) {
        await recebimentoV2Db.temperatures.bulkPut(
          temperaturasToApply.map((item) =>
            mapServerTemperaturaToRecord(item, demandId, now),
          ),
        );
      }
    }

    const processUpdate: Partial<ProcessRecord> = {
      lastPullAt: now,
      updatedAt: now,
      ...(force ? { status: 'working' as const } : {}),
    };
    if (shouldApplySnapshot) {
      processUpdate.serverRevision = snapshot.revision;
    }

    await recebimentoV2Db.processes.update(demandId, processUpdate);

    if (snapshot.situacao && demand) {
      await reconcileRemoteSituacao(demandId, snapshot.situacao, {
        recebimentoId: snapshotChecklist?.recebimentoId ?? process?.recebimentoId,
      });
    } else if (snapshot.situacao && !demand) {
      await recebimentoV2Db.demands.put({
        id: demandId,
        unidadeId,
        routeId: demandId,
        fornecedorCodigo: '',
        fornecedorNome: '',
        status: snapshot.situacao,
        situacao: snapshot.situacao,
        dataPrevisaoEntrega: '',
        dataCriacao: '',
        serverRevision: snapshot.revision,
        updatedAt: now,
      }).catch(() => undefined);
    }
  });

  await reconcileOrphanedPendingSyncOps(demandId);
}

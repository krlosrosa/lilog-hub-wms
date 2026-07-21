import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { getRecebimentoByPreRecebimento } from '@/features/recebimento/lib/recebimento-api';

import type { ChecklistPhotoMediaIds, DamageRecord, SyncOperationRecord } from '../local-db/schema';
import { recebimentoV2Db } from '../local-db/db';

export type AvariaPhotoUploadTarget = {
  serverAvariaId: string;
  mediaIds: string[];
};

type AvariaSyncPayload = {
  damageId?: string;
  serverAvariaId?: string;
  mediaIds?: string[];
};

async function listSyncedAvariaOpsForDemand(
  demandId: string,
): Promise<SyncOperationRecord[]> {
  return recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .filter(
      (op) =>
        op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR &&
        (op.status === 'synced' || op.status === 'syncing'),
    )
    .toArray();
}

function findSyncedAvariaOpForDamage(
  ops: SyncOperationRecord[],
  damage: DamageRecord,
): SyncOperationRecord | undefined {
  return ops.find((op) => {
    const payload = op.payload as AvariaSyncPayload;
    if (payload.damageId && payload.damageId === damage.id) {
      return true;
    }

    const serverAvariaId = damage.serverAvariaId ?? damage.id;
    return Boolean(payload.serverAvariaId && payload.serverAvariaId === serverAvariaId);
  });
}

export async function resolveServerAvariaIdForDamage(
  damage: DamageRecord,
  syncedOps?: SyncOperationRecord[],
): Promise<string | null> {
  if (damage.serverAvariaId) {
    return damage.serverAvariaId;
  }

  const ops = syncedOps ?? (await listSyncedAvariaOpsForDemand(damage.demandId));
  const matchedOp = findSyncedAvariaOpForDamage(ops, damage);
  const payload = matchedOp?.payload as AvariaSyncPayload | undefined;

  return payload?.serverAvariaId ?? null;
}

export async function resolveMediaIdsForDamage(
  damage: DamageRecord,
  syncedOps?: SyncOperationRecord[],
): Promise<string[]> {
  if (damage.mediaIds?.length) {
    return damage.mediaIds;
  }

  const ops = syncedOps ?? (await listSyncedAvariaOpsForDemand(damage.demandId));
  const matchedOp = findSyncedAvariaOpForDamage(ops, damage);

  if (matchedOp) {
    const payload = matchedOp.payload as AvariaSyncPayload;
    if (payload.mediaIds?.length) {
      return payload.mediaIds;
    }
    if (matchedOp.attachmentIds.length > 0) {
      return matchedOp.attachmentIds;
    }
  }

  return [];
}

export async function collectAvariaPhotoUploadTargets(
  demandId: string,
): Promise<AvariaPhotoUploadTarget[]> {
  const [damages, syncedOps] = await Promise.all([
    recebimentoV2Db.damages
      .where('demandId')
      .equals(demandId)
      .and((damage) => !damage.deletedAt)
      .toArray(),
    listSyncedAvariaOpsForDemand(demandId),
  ]);

  const targets: AvariaPhotoUploadTarget[] = [];

  for (const damage of damages) {
    const [serverAvariaId, mediaIds] = await Promise.all([
      resolveServerAvariaIdForDamage(damage, syncedOps),
      resolveMediaIdsForDamage(damage, syncedOps),
    ]);

    if (!serverAvariaId || mediaIds.length === 0) {
      continue;
    }

    targets.push({ serverAvariaId, mediaIds });
  }

  return targets;
}

export async function persistRecebimentoId(
  demandId: string,
  recebimentoId: string,
): Promise<void> {
  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process || process.recebimentoId === recebimentoId) {
    return;
  }

  await recebimentoV2Db.processes.update(demandId, {
    recebimentoId,
    updatedAt: Date.now(),
  });
}

export async function resolveRecebimentoIdForDemand(
  demandId: string,
  hint?: string | null,
): Promise<string | null> {
  if (hint) {
    await persistRecebimentoId(demandId, hint);
    return hint;
  }

  const process = await recebimentoV2Db.processes.get(demandId);
  if (process?.recebimentoId) {
    return process.recebimentoId;
  }

  const recebimento = await getRecebimentoByPreRecebimento(demandId);
  if (!recebimento?.id) {
    return null;
  }

  await persistRecebimentoId(demandId, recebimento.id);
  return recebimento.id;
}

export function collectChecklistPhotoIds(
  photoMediaIds: ChecklistPhotoMediaIds | undefined,
): string[] {
  if (!photoMediaIds) return [];
  return [
    ...(photoMediaIds.lacre ?? []),
    ...(photoMediaIds.bauFechado ?? []),
    ...(photoMediaIds.bauAberto ?? []),
    ...(photoMediaIds.extras ?? []),
  ];
}

export async function collectAvariaPhotoIds(demandId: string): Promise<string[]> {
  const damages = await recebimentoV2Db.damages
    .where('demandId')
    .equals(demandId)
    .and((damage) => !damage.deletedAt)
    .toArray();

  return [...new Set(damages.flatMap((damage) => damage.mediaIds ?? []))];
}

export const AVARIA_TARGET_ENTITY_TYPE = 'recebimento_avaria';
export const CHECKLIST_TARGET_ENTITY_TYPE = 'checklist_recebimento';
export const IMPEDIMENTO_TARGET_ENTITY_TYPE = 'impedimento_recebimento';

export async function stampAvariaMediaTargets(
  mediaIds: string[],
  serverAvariaId: string,
): Promise<void> {
  if (mediaIds.length === 0) {
    return;
  }

  await recebimentoV2Db.media
    .where('id')
    .anyOf(mediaIds)
    .modify({
      targetEntityId: serverAvariaId,
      targetEntityType: AVARIA_TARGET_ENTITY_TYPE,
    });
}

export async function stampChecklistMediaTargets(
  mediaIds: string[],
  recebimentoId: string,
): Promise<void> {
  if (mediaIds.length === 0) {
    return;
  }

  await recebimentoV2Db.media
    .where('id')
    .anyOf(mediaIds)
    .modify({
      targetEntityId: recebimentoId,
      targetEntityType: CHECKLIST_TARGET_ENTITY_TYPE,
    });
}

export async function stampImpedimentoMediaTargets(
  mediaIds: string[],
  demandId: string,
): Promise<void> {
  if (mediaIds.length === 0) {
    return;
  }

  await recebimentoV2Db.media
    .where('id')
    .anyOf(mediaIds)
    .modify({
      targetEntityId: demandId,
      targetEntityType: IMPEDIMENTO_TARGET_ENTITY_TYPE,
    });
}

/**
 * Resolves server entity IDs from domain state and stamps pending media for upload.
 */
export async function resolveAndStampAllPhotoTargets(demandId: string): Promise<void> {
  const [avariaTargets, recebimentoId, checklist, impedimento] = await Promise.all([
    collectAvariaPhotoUploadTargets(demandId),
    resolveRecebimentoIdForDemand(demandId),
    recebimentoV2Db.checklists.get(demandId),
    recebimentoV2Db.impedimentos.where('demandId').equals(demandId).first(),
  ]);

  await Promise.all(
    avariaTargets.map(({ serverAvariaId, mediaIds }) =>
      stampAvariaMediaTargets(mediaIds, serverAvariaId),
    ),
  );

  if (recebimentoId) {
    const checklistPhotoIds = collectChecklistPhotoIds(checklist?.photoMediaIds);
    await stampChecklistMediaTargets(checklistPhotoIds, recebimentoId);
  }

  if (impedimento?.mediaIds?.length) {
    await stampImpedimentoMediaTargets(impedimento.mediaIds, demandId);
  }
}

/** Removes every local avaria media blob/record for a demand (used when clearing all avarias). */
export async function deleteAllAvariaMediaForDemand(demandId: string): Promise<number> {
  const media = await recebimentoV2Db.media
    .where('processId')
    .equals(demandId)
    .filter((item) => item.ownerType === 'avaria')
    .toArray();

  if (media.length === 0) {
    return 0;
  }

  await recebimentoV2Db.media.bulkDelete(media.map((item) => item.id));
  return media.length;
}

/**
 * Deletes avaria media not referenced by any active (non-deleted) damage —
 * covers orphan session photos and shared mediaIds after partial deletes.
 */
export async function deleteAvariaMediaUnreferencedByActiveDamages(
  demandId: string,
): Promise<number> {
  const activeDamages = await recebimentoV2Db.damages
    .where('demandId')
    .equals(demandId)
    .filter((damage) => !damage.deletedAt)
    .toArray();

  const referencedIds = new Set(
    activeDamages.flatMap((damage) => damage.mediaIds ?? []),
  );

  const media = await recebimentoV2Db.media
    .where('processId')
    .equals(demandId)
    .filter((item) => item.ownerType === 'avaria')
    .toArray();

  const orphanIds = media
    .filter((item) => !referencedIds.has(item.id))
    .map((item) => item.id);

  if (orphanIds.length === 0) {
    return 0;
  }

  await recebimentoV2Db.media.bulkDelete(orphanIds);
  return orphanIds.length;
}

export async function collectImpedimentoPhotoIds(demandId: string): Promise<string[]> {
  const impedimento = await recebimentoV2Db.impedimentos
    .where('demandId')
    .equals(demandId)
    .first();

  return impedimento?.mediaIds ?? [];
}

export async function collectAllPendingPhotoIds(demandId: string): Promise<string[]> {
  const checklist = await recebimentoV2Db.checklists.get(demandId);
  const checklistIds = collectChecklistPhotoIds(checklist?.photoMediaIds);
  const avariaIds = await collectAvariaPhotoIds(demandId);
  const impedimentoIds = await collectImpedimentoPhotoIds(demandId);
  return [...new Set([...checklistIds, ...avariaIds, ...impedimentoIds])];
}

export async function hasPendingPhotoUploads(demandId: string): Promise<boolean> {
  const ids = await collectAllPendingPhotoIds(demandId);
  if (ids.length === 0) return false;

  const records = await recebimentoV2Db.media.bulkGet(ids);
  return records.some((record) => record != null && record.status !== 'uploaded');
}

export async function countPendingPhotoUploads(demandId: string): Promise<{
  pending: number;
  uploading: number;
  error: number;
}> {
  const items = await listPendingPhotoUploads(demandId);
  let pending = 0;
  let uploading = 0;
  let error = 0;

  for (const item of items) {
    if (item.status === 'uploading') uploading += 1;
    else if (item.status === 'error') error += 1;
    else pending += 1;
  }

  return { pending, uploading, error };
}

export async function listPendingPhotoUploads(demandId: string): Promise<
  Array<{
    id: string;
    ownerType: string;
    ownerId: string;
    status: 'local' | 'uploading' | 'error';
    filename?: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    errorMessage?: string;
    errorStep?: string;
  }>
> {
  const ids = await collectAllPendingPhotoIds(demandId);
  if (ids.length === 0) {
    return [];
  }

  const records = await recebimentoV2Db.media.bulkGet(ids);
  const items: Array<{
    id: string;
    ownerType: string;
    ownerId: string;
    status: 'local' | 'uploading' | 'error';
    filename?: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    errorMessage?: string;
    errorStep?: string;
  }> = [];

  for (const record of records) {
    if (!record || record.status === 'uploaded') continue;

    items.push({
      id: record.id,
      ownerType: record.ownerType,
      ownerId: record.ownerId,
      status: record.status === 'uploading' ? 'uploading' : record.status === 'error' ? 'error' : 'local',
      filename: record.filename,
      mimeType: record.mimeType,
      sizeBytes: record.blob.size,
      createdAt: record.createdAt,
      errorMessage: record.errorMessage,
      errorStep: record.errorStep,
    });
  }

  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function filterPhotoIdList(
  ids: string[] | undefined,
  removeIds: Set<string>,
): string[] | undefined {
  if (!ids?.length) {
    return ids;
  }

  const filtered = ids.filter((id) => !removeIds.has(id));
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * Removes all non-uploaded photos for a demand from local storage and unlinks
 * them from damages, checklist, impedimento and pending sync operations.
 */
export async function dismissPendingPhotos(demandId: string): Promise<number> {
  const mediaRecords = await recebimentoV2Db.media
    .where('processId')
    .equals(demandId)
    .toArray();

  const removeIds = new Set(
    mediaRecords
      .filter((record) => record.status !== 'uploaded')
      .map((record) => record.id),
  );

  if (removeIds.size === 0) {
    return 0;
  }

  const now = Date.now();

  await recebimentoV2Db.transaction(
    'rw',
    [
      recebimentoV2Db.media,
      recebimentoV2Db.damages,
      recebimentoV2Db.impedimentos,
      recebimentoV2Db.checklists,
      recebimentoV2Db.syncOperations,
    ],
    async () => {
      const damages = await recebimentoV2Db.damages
        .where('demandId')
        .equals(demandId)
        .toArray();

      for (const damage of damages) {
        if (!damage.mediaIds?.some((id) => removeIds.has(id))) {
          continue;
        }

        const mediaIds = damage.mediaIds.filter((id) => !removeIds.has(id));
        await recebimentoV2Db.damages.update(damage.id, {
          mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
          updatedAt: now,
        });
      }

      const impedimento = await recebimentoV2Db.impedimentos
        .where('demandId')
        .equals(demandId)
        .first();

      if (impedimento?.mediaIds?.some((id) => removeIds.has(id))) {
        const mediaIds = impedimento.mediaIds.filter((id) => !removeIds.has(id));
        await recebimentoV2Db.impedimentos.update(impedimento.id, {
          mediaIds,
          updatedAt: now,
        });
      }

      const checklist = await recebimentoV2Db.checklists.get(demandId);
      if (checklist?.photoMediaIds) {
        await recebimentoV2Db.checklists.update(demandId, {
          photoMediaIds: {
            lacre: filterPhotoIdList(checklist.photoMediaIds.lacre, removeIds),
            bauFechado: filterPhotoIdList(checklist.photoMediaIds.bauFechado, removeIds),
            bauAberto: filterPhotoIdList(checklist.photoMediaIds.bauAberto, removeIds),
            extras: filterPhotoIdList(checklist.photoMediaIds.extras, removeIds),
          },
          updatedAt: now,
        });
      }

      const ops = await recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(demandId)
        .toArray();

      for (const op of ops) {
        const attachmentIds = op.attachmentIds.filter((id) => !removeIds.has(id));
        const payload = { ...(op.payload as Record<string, unknown>) };
        let changed = attachmentIds.length !== op.attachmentIds.length;

        if (Array.isArray(payload.mediaIds)) {
          const mediaIds = payload.mediaIds.filter((id) => !removeIds.has(String(id)));
          if (mediaIds.length !== payload.mediaIds.length) {
            payload.mediaIds = mediaIds;
            if (typeof payload.photoCount === 'number') {
              payload.photoCount = mediaIds.length;
            }
            changed = true;
          }
        }

        if (!changed) {
          continue;
        }

        await recebimentoV2Db.syncOperations.update(op.id, {
          attachmentIds,
          payload,
          updatedAt: now,
        });
      }

      await recebimentoV2Db.media.bulkDelete([...removeIds]);
    },
  );

  return removeIds.size;
}

export async function recoverStuckSyncState(demandId: string): Promise<void> {
  const now = Date.now();

  const stuckOps = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .filter((op) => op.status === 'syncing')
    .toArray();

  for (const op of stuckOps) {
    if (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR) {
      const payload = op.payload as { damageId?: string };
      const damage = payload.damageId
        ? await recebimentoV2Db.damages.get(payload.damageId)
        : undefined;

      if (damage?.serverAvariaId) {
        await recebimentoV2Db.syncOperations.update(op.id, {
          status: 'synced',
          updatedAt: now,
        });
        continue;
      }
    }

    if (op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR) {
      const payload = op.payload as { conferenceId?: string; pesoVariavel?: boolean };
      if (payload.pesoVariavel && payload.conferenceId) {
        const conference = await recebimentoV2Db.conferences.get(payload.conferenceId);
        if (conference?.serverPesagemId) {
          await recebimentoV2Db.syncOperations.update(op.id, {
            status: 'synced',
            updatedAt: now,
          });
          continue;
        }
      }
    }

    await recebimentoV2Db.syncOperations.update(op.id, {
      status: 'pending',
      updatedAt: now,
    });
  }

  const process = await recebimentoV2Db.processes.get(demandId);
  if (process?.status === 'syncing') {
    await recebimentoV2Db.processes.update(demandId, {
      status: 'working',
      updatedAt: now,
    });
  }

  const photoIds = await collectAllPendingPhotoIds(demandId);
  if (photoIds.length === 0) return;

  const records = await recebimentoV2Db.media.bulkGet(photoIds);
  for (const record of records) {
    if (record?.status === 'uploading' || record?.status === 'error') {
      await recebimentoV2Db.media.update(record.id, {
        status: 'local',
        errorMessage: undefined,
        errorStep: undefined,
      });
    }
  }
}

/**
 * Resets photos stuck in 'uploading' back to 'local' for a demand.
 * Called at the start of processPhotoQueue to recover from app crashes
 * or offline interruptions mid-upload.
 */
export async function recoverStuckUploadingPhotos(demandId: string): Promise<void> {
  const photoIds = await collectAllPendingPhotoIds(demandId);
  if (photoIds.length === 0) return;

  const records = await recebimentoV2Db.media.bulkGet(photoIds);
  for (const record of records) {
    if (record?.status === 'uploading') {
      await recebimentoV2Db.media.update(record.id, {
        status: 'local',
        errorMessage: undefined,
        errorStep: undefined,
      });
    }
  }
}

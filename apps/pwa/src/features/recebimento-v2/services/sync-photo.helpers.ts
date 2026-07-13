import { getRecebimentoByPreRecebimento } from '@/features/recebimento/lib/recebimento-api';

import type { ChecklistPhotoMediaIds } from '../local-db/schema';
import { recebimentoV2Db } from '../local-db/db';

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
  const media = await recebimentoV2Db.media
    .where('processId')
    .equals(demandId)
    .and((item) => item.ownerType === 'avaria')
    .toArray();

  return media.map((item) => item.id);
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
  const ids = await collectAllPendingPhotoIds(demandId);
  if (ids.length === 0) {
    return { pending: 0, uploading: 0, error: 0 };
  }

  const records = await recebimentoV2Db.media.bulkGet(ids);
  let pending = 0;
  let uploading = 0;
  let error = 0;

  for (const record of records) {
    if (!record || record.status === 'uploaded') continue;
    if (record.status === 'uploading') uploading += 1;
    else if (record.status === 'error') error += 1;
    else pending += 1;
  }

  return { pending, uploading, error };
}

export async function recoverStuckSyncState(demandId: string): Promise<void> {
  const now = Date.now();

  const stuckOps = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .filter((op) => op.status === 'syncing')
    .toArray();

  for (const op of stuckOps) {
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
    if (record?.status === 'uploading') {
      await recebimentoV2Db.media.update(record.id, { status: 'local' });
    }
  }
}

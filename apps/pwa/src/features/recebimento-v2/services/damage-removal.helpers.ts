import { recebimentoV2Db } from '../local-db/db';
import type { DamageRecord } from '../local-db/schema';

export function isDirtyDamageSyncStatus(status: DamageRecord['syncStatus']): boolean {
  return status === 'pending' || status === 'retry' || status === 'syncing';
}

export function splitDamagesForPullMerge(existing: DamageRecord[]): {
  pendingDeletes: DamageRecord[];
  pendingDeleteServerIds: Set<string>;
} {
  const pendingDeletes = existing.filter(
    (damage) => damage.deletedAt && isDirtyDamageSyncStatus(damage.syncStatus),
  );
  const pendingDeleteServerIds = new Set(
    pendingDeletes
      .map((damage) => damage.serverAvariaId)
      .filter((id): id is string => Boolean(id)),
  );

  return { pendingDeletes, pendingDeleteServerIds };
}

export function filterServerDamagesAgainstPendingDeletes<T extends { serverAvariaId?: string }>(
  records: T[],
  pendingDeleteServerIds: Set<string>,
): T[] {
  return records.filter(
    (record) => !record.serverAvariaId || !pendingDeleteServerIds.has(record.serverAvariaId),
  );
}

/**
 * Removes a damage locally. Server-backed rows become a pending delete; local-only rows are hard-deleted.
 * Returns whether the demand still has pending sync work for this removal.
 */
export async function removeDamageRecordLocally(
  demandId: string,
  damage: DamageRecord,
): Promise<boolean> {
  if (damage.deletedAt) {
    return false;
  }

  if (!damage.serverAvariaId) {
    await recebimentoV2Db.damages.delete(damage.id);
    return false;
  }

  const now = new Date().toISOString();
  const nowMs = Date.now();

  await recebimentoV2Db.damages.update(damage.id, {
    deletedAt: now,
    syncStatus: 'pending',
    updatedAt: nowMs,
  });

  return true;
}

export async function purgeSyncedSoftDeletedDamages(demandId: string): Promise<number> {
  const ghosts = await recebimentoV2Db.damages
    .where('demandId')
    .equals(demandId)
    .filter((damage) => Boolean(damage.deletedAt) && damage.syncStatus === 'synced')
    .toArray();

  if (ghosts.length === 0) {
    return 0;
  }

  await recebimentoV2Db.damages.bulkDelete(ghosts.map((damage) => damage.id));
  return ghosts.length;
}

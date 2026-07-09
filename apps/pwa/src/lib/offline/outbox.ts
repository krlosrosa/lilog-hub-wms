import type { AppDB, OutboxEntry, OutboxStatus } from './db';
import { deletePhotos } from './photo-store';

export type EnqueueInput = Omit<
  OutboxEntry,
  'id' | 'status' | 'retries' | 'createdAt' | 'errorMessage'
>;

export async function enqueue(
  database: AppDB,
  entry: EnqueueInput
): Promise<number> {
  return database.outbox.add({
    ...entry,
    photoIds: entry.photoIds ?? [],
    status: 'pending',
    retries: 0,
    createdAt: Date.now(),
  });
}

export async function markSyncing(database: AppDB, id: number): Promise<void> {
  await database.outbox.update(id, { status: 'syncing', errorMessage: undefined });
}

export async function markDone(database: AppDB, id: number): Promise<void> {
  await database.outbox.delete(id);
}

export async function markError(
  database: AppDB,
  id: number,
  message: string
): Promise<void> {
  const entry = await database.outbox.get(id);
  if (!entry) return;
  await database.outbox.update(id, {
    status: 'error',
    errorMessage: message,
    retries: entry.retries + 1,
  });
}

export async function markDiscarded(
  database: AppDB,
  id: number,
  message: string
): Promise<void> {
  await database.outbox.update(id, {
    status: 'discarded',
    errorMessage: message,
  });
}

export async function resetError(database: AppDB, id: number): Promise<void> {
  await database.outbox.update(id, {
    status: 'pending',
    errorMessage: undefined,
  });
}

export async function resetAllErrors(database: AppDB): Promise<void> {
  const errors = await getByStatus(database, 'error');
  await Promise.all(errors.map((e) => resetError(database, e.id!)));
}

export async function getByStatus(
  database: AppDB,
  status: OutboxStatus
): Promise<OutboxEntry[]> {
  return database.outbox.where('status').equals(status).sortBy('createdAt');
}

export async function getPendingEntries(database: AppDB): Promise<OutboxEntry[]> {
  const pending = await getByStatus(database, 'pending');
  const syncing = await getByStatus(database, 'syncing');
  return [...pending, ...syncing].sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeOutboxEntry(database: AppDB, id: number): Promise<boolean> {
  const entry = await database.outbox.get(id);
  if (!entry) {
    return false;
  }

  if (entry.status === 'syncing') {
    return false;
  }

  if (entry.photoIds.length > 0) {
    await deletePhotos(database, entry.photoIds);
  }

  await database.outbox.delete(id);
  return true;
}

export async function removeAllOutboxEntries(database: AppDB): Promise<number> {
  const entries = await database.outbox.toArray();
  const deletable = entries.filter((entry) => entry.status !== 'syncing');

  if (deletable.length === 0) {
    return 0;
  }

  const photoIds = deletable.flatMap((entry) => entry.photoIds ?? []);
  if (photoIds.length > 0) {
    await deletePhotos(database, photoIds);
  }

  await database.outbox.bulkDelete(
    deletable.map((entry) => entry.id!).filter((id) => id != null),
  );

  return deletable.length;
}

import type { AppDB } from './db';

const SYNC_META_ID = 'global';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getSyncMeta(database: AppDB) {
  const existing = await database.syncMeta.get(SYNC_META_ID);
  if (existing) {
    if (existing.todayDate !== todayKey()) {
      const updated = {
        ...existing,
        todayDate: todayKey(),
        todaySyncedCount: 0,
      };
      await database.syncMeta.put(updated);
      return updated;
    }
    return existing;
  }

  const initial = {
    id: SYNC_META_ID,
    lastSyncAt: null,
    todaySyncedCount: 0,
    todayDate: todayKey(),
  };
  await database.syncMeta.add(initial);
  return initial;
}

export async function recordSuccessfulSync(
  database: AppDB,
  count = 1
): Promise<void> {
  const meta = await getSyncMeta(database);
  await database.syncMeta.put({
    ...meta,
    lastSyncAt: Date.now(),
    todaySyncedCount: meta.todaySyncedCount + count,
    todayDate: todayKey(),
  });
}

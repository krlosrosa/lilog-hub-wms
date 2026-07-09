import type { AppDB } from './db';

const SYNC_META_ID = 'global';
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function catalogMetaId(unidadeId: string): string {
  return `catalog:${unidadeId}`;
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

export async function getCatalogSyncMeta(database: AppDB, unidadeId: string) {
  return database.syncMeta.get(catalogMetaId(unidadeId));
}

export async function recordCatalogSync(
  database: AppDB,
  unidadeId: string,
): Promise<void> {
  await database.syncMeta.put({
    id: catalogMetaId(unidadeId),
    lastSyncAt: Date.now(),
    todaySyncedCount: 0,
    todayDate: todayKey(),
  });
}

export async function invalidateCatalogSync(
  database: AppDB,
  unidadeId: string,
): Promise<void> {
  await database.syncMeta.put({
    id: catalogMetaId(unidadeId),
    lastSyncAt: null,
    todaySyncedCount: 0,
    todayDate: todayKey(),
  });
}

export async function isCatalogStale(
  database: AppDB,
  unidadeId: string,
): Promise<boolean> {
  const meta = await getCatalogSyncMeta(database, unidadeId);
  if (!meta?.lastSyncAt) return true;
  return Date.now() - meta.lastSyncAt > CATALOG_TTL_MS;
}

export { CATALOG_TTL_MS };

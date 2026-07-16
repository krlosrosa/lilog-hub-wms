import { formatBytes } from '@/lib/images/photo-debug-log';

import { ensureRecebimentoV2DbReady, recebimentoV2Db } from '../local-db/db';

export { formatBytes };

export interface StorageEstimateSnapshot {
  quota: number | null;
  usage: number | null;
  indexedDbUsage: number | null;
  cachesUsage: number | null;
  usagePercent: number | null;
}

export interface ServiceWorkerCacheSnapshot {
  name: string;
  entryCount: number;
  totalBytes: number;
}

export interface ServiceWorkerSnapshot {
  isSupported: boolean;
  isControlled: boolean;
  scriptUrl: string | null;
  registrationCount: number;
  scopes: string[];
  caches: ServiceWorkerCacheSnapshot[];
}

export interface IndexedDbTableSnapshot {
  key: string;
  label: string;
  totalCount: number;
  demandCount: number | null;
}

export interface IndexedDbTableGroupSnapshot {
  label: string;
  tables: IndexedDbTableSnapshot[];
}

export interface CacheManagerSnapshot {
  storage: StorageEstimateSnapshot | null;
  serviceWorker: ServiceWorkerSnapshot | null;
  indexedDb: {
    groups: IndexedDbTableGroupSnapshot[];
    totalRecords: number;
  } | null;
}

const INDEXED_DB_TABLE_GROUPS: Array<{
  label: string;
  tables: Array<{ key: keyof typeof recebimentoV2Db; label: string; demandScoped: boolean }>;
}> = [
  {
    label: 'Dados da demanda',
    tables: [
      { key: 'processes', label: 'Processos', demandScoped: true },
      { key: 'demands', label: 'Demandas', demandScoped: true },
      { key: 'expectedItems', label: 'Itens esperados', demandScoped: true },
      { key: 'conferences', label: 'Conferências', demandScoped: true },
      { key: 'damages', label: 'Avarias', demandScoped: true },
      { key: 'checklists', label: 'Checklists', demandScoped: true },
      { key: 'temperatures', label: 'Temperaturas', demandScoped: true },
      { key: 'impedimentos', label: 'Impedimentos', demandScoped: true },
    ],
  },
  {
    label: 'Catálogo',
    tables: [
      { key: 'products', label: 'Produtos', demandScoped: false },
      { key: 'docas', label: 'Docas', demandScoped: false },
      { key: 'unitConfigs', label: 'Configurações da unidade', demandScoped: false },
      { key: 'checklistTemplates', label: 'Templates de checklist', demandScoped: false },
    ],
  },
  {
    label: 'Sync e mídia',
    tables: [
      { key: 'syncOperations', label: 'Operações de sync', demandScoped: true },
      { key: 'syncBatches', label: 'Lotes de sync', demandScoped: true },
      { key: 'syncConflicts', label: 'Conflitos', demandScoped: true },
      { key: 'syncCursors', label: 'Cursores', demandScoped: false },
      { key: 'syncIdMappings', label: 'Mapeamentos de ID', demandScoped: true },
      { key: 'syncLeases', label: 'Leases', demandScoped: true },
      { key: 'syncMeta', label: 'Metadados de sync', demandScoped: false },
      { key: 'media', label: 'Mídias locais', demandScoped: true },
    ],
  },
];

async function estimateResponseSize(response: Response): Promise<number> {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const parsed = Number.parseInt(contentLength, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  try {
    const blob = await response.clone().blob();
    return blob.size;
  } catch {
    return 0;
  }
}

async function inspectServiceWorkerCache(cacheName: string): Promise<ServiceWorkerCacheSnapshot> {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  let totalBytes = 0;

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;
    totalBytes += await estimateResponseSize(response);
  }

  return {
    name: cacheName,
    entryCount: requests.length,
    totalBytes,
  };
}

async function countDemandScopedRecords(
  tableKey: keyof typeof recebimentoV2Db,
  demandId: string,
): Promise<number> {
  switch (tableKey) {
    case 'processes':
    case 'demands':
    case 'checklists':
      return (await recebimentoV2Db[tableKey].get(demandId)) ? 1 : 0;
    case 'expectedItems':
    case 'conferences':
    case 'temperatures':
    case 'damages':
    case 'impedimentos':
      return recebimentoV2Db[tableKey].where('demandId').equals(demandId).count();
    case 'media':
      return recebimentoV2Db.media.where('processId').equals(demandId).count();
    case 'syncOperations':
    case 'syncBatches':
    case 'syncConflicts':
    case 'syncIdMappings':
      return recebimentoV2Db[tableKey].where('aggregateId').equals(demandId).count();
    case 'syncLeases':
      return (await recebimentoV2Db.syncLeases.get(demandId)) ? 1 : 0;
    default:
      return 0;
  }
}

export async function readStorageEstimate(): Promise<StorageEstimateSnapshot> {
  if (!navigator.storage?.estimate) {
    return {
      quota: null,
      usage: null,
      indexedDbUsage: null,
      cachesUsage: null,
      usagePercent: null,
    };
  }

  const estimate = await navigator.storage.estimate();
  const usageDetails = estimate.usageDetails as
    | { indexedDB?: number; caches?: number }
    | undefined;

  const quota = estimate.quota ?? null;
  const usage = estimate.usage ?? null;

  return {
    quota,
    usage,
    indexedDbUsage: usageDetails?.indexedDB ?? null,
    cachesUsage: usageDetails?.caches ?? null,
    usagePercent: quota && usage != null ? Math.min(100, Math.round((usage / quota) * 100)) : null,
  };
}

export async function readServiceWorkerSnapshot(): Promise<ServiceWorkerSnapshot> {
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  if (!isSupported) {
    return {
      isSupported: false,
      isControlled: false,
      scriptUrl: null,
      registrationCount: 0,
      scopes: [],
      caches: [],
    };
  }

  const [registrations, cacheNames] = await Promise.all([
    navigator.serviceWorker.getRegistrations(),
    'caches' in window ? caches.keys() : Promise.resolve([] as string[]),
  ]);

  const cachesSnapshot = await Promise.all(cacheNames.map((name) => inspectServiceWorkerCache(name)));

  return {
    isSupported: true,
    isControlled: Boolean(navigator.serviceWorker.controller),
    scriptUrl: navigator.serviceWorker.controller?.scriptURL ?? null,
    registrationCount: registrations.length,
    scopes: registrations.map((registration) => registration.scope),
    caches: cachesSnapshot.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function readIndexedDbSnapshot(demandId: string): Promise<CacheManagerSnapshot['indexedDb']> {
  await ensureRecebimentoV2DbReady();

  const groups: IndexedDbTableGroupSnapshot[] = [];

  for (const group of INDEXED_DB_TABLE_GROUPS) {
    const tables: IndexedDbTableSnapshot[] = [];

    for (const table of group.tables) {
      const totalCount = await recebimentoV2Db[table.key].count();
      const demandCount = table.demandScoped
        ? await countDemandScopedRecords(table.key, demandId)
        : null;

      tables.push({
        key: table.key,
        label: table.label,
        totalCount,
        demandCount,
      });
    }

    groups.push({ label: group.label, tables });
  }

  const totalRecords = groups.reduce(
    (sum, group) => sum + group.tables.reduce((groupSum, table) => groupSum + table.totalCount, 0),
    0,
  );

  return { groups, totalRecords };
}

export async function readCacheManagerSnapshot(demandId: string): Promise<CacheManagerSnapshot> {
  const [storage, serviceWorker, indexedDb] = await Promise.all([
    readStorageEstimate(),
    readServiceWorkerSnapshot(),
    readIndexedDbSnapshot(demandId),
  ]);

  return { storage, serviceWorker, indexedDb };
}

export async function clearServiceWorkerCache(cacheName: string): Promise<void> {
  if (!('caches' in window)) return;
  await caches.delete(cacheName);
}

export async function clearAllServiceWorkerCaches(): Promise<void> {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

export async function clearDemandIndexedDbData(demandId: string): Promise<void> {
  await ensureRecebimentoV2DbReady();

  await recebimentoV2Db.transaction(
    'rw',
    [
      recebimentoV2Db.processes,
      recebimentoV2Db.demands,
      recebimentoV2Db.expectedItems,
      recebimentoV2Db.conferences,
      recebimentoV2Db.checklists,
      recebimentoV2Db.temperatures,
      recebimentoV2Db.damages,
      recebimentoV2Db.impedimentos,
      recebimentoV2Db.media,
      recebimentoV2Db.syncOperations,
      recebimentoV2Db.syncBatches,
      recebimentoV2Db.syncConflicts,
      recebimentoV2Db.syncIdMappings,
      recebimentoV2Db.syncLeases,
    ],
    async () => {
      await Promise.all([
        recebimentoV2Db.processes.delete(demandId),
        recebimentoV2Db.demands.delete(demandId),
        recebimentoV2Db.expectedItems.where('demandId').equals(demandId).delete(),
        recebimentoV2Db.conferences.where('demandId').equals(demandId).delete(),
        recebimentoV2Db.checklists.delete(demandId),
        recebimentoV2Db.temperatures.where('demandId').equals(demandId).delete(),
        recebimentoV2Db.damages.where('demandId').equals(demandId).delete(),
        recebimentoV2Db.impedimentos.where('demandId').equals(demandId).delete(),
        recebimentoV2Db.media.where('processId').equals(demandId).delete(),
        recebimentoV2Db.syncOperations.where('aggregateId').equals(demandId).delete(),
        recebimentoV2Db.syncBatches.where('aggregateId').equals(demandId).delete(),
        recebimentoV2Db.syncConflicts.where('aggregateId').equals(demandId).delete(),
        recebimentoV2Db.syncIdMappings.where('aggregateId').equals(demandId).delete(),
        recebimentoV2Db.syncLeases.delete(demandId),
      ]);
    },
  );
}

export async function clearFullIndexedDb(): Promise<void> {
  await recebimentoV2Db.delete();
  await ensureRecebimentoV2DbReady();
}

export function getStorageUsageTone(usagePercent: number | null): 'ok' | 'warn' | 'danger' {
  if (usagePercent == null) return 'ok';
  if (usagePercent >= 85) return 'danger';
  if (usagePercent >= 65) return 'warn';
  return 'ok';
}

export function formatServiceWorkerScriptLabel(scriptUrl: string | null): string {
  if (!scriptUrl) return 'Nenhum service worker ativo';
  try {
    const url = new URL(scriptUrl);
    return url.pathname.split('/').pop() ?? scriptUrl;
  } catch {
    return scriptUrl;
  }
}

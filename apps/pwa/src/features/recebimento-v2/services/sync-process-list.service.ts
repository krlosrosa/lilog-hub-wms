import { fetchProcesses } from '../api/sync-api.js';
import { deriveCapabilitiesFromProcessHeader } from '../lib/derive-process-capabilities.js';
import { reconcileRemoteSituacao } from '../lib/reconcile-remote-situacao.js';
import { recebimentoV2Db } from '../local-db/db.js';
import type { DemandRecord, ProcessRecord } from '../local-db/schema.js';
import type { ProcessHeaderItem } from '../types/recebimento-v2.schema.js';
import { hasPendingSyncWork } from './auto-sync-v2.service.js';
import { hasPendingPhotoUploads } from './sync-photo.helpers.js';

const PRESERVE_STATUSES = new Set<ProcessRecord['status']>([
  'downloading',
  'ready',
  'working',
  'pendingSync',
  'syncing',
  'completed',
  'conflict',
  'error',
]);

export type SyncProcessListResult = {
  items: ProcessHeaderItem[];
  removedCount: number;
};

function mapRemoteToProcess(
  item: ProcessHeaderItem,
  existing?: ProcessRecord,
): ProcessRecord {
  const now = Date.now();
  const updatedAt = Date.parse(item.updatedAt) || now;

  let status: ProcessRecord['status'] =
    existing?.status && PRESERVE_STATUSES.has(existing.status)
      ? existing.status
      : 'notDownloaded';

  if (item.situacao === 'em_conferencia' && status === 'completed') {
    status = 'working';
  }

  return {
    id: item.demandId,
    unidadeId: item.unidadeId,
    adapter: 'recebimento-v2',
    status,
    serverRevision: item.serverRevision,
    baseRevision: existing?.baseRevision ?? 0,
    flowVersion: 'v2',
    supplier: item.supplier ?? existing?.supplier,
    dock: item.dock ?? existing?.dock,
    arrival: item.arrival ?? existing?.arrival,
    placa: item.placa ?? existing?.placa,
    conferente: item.conferente ?? existing?.conferente,
    atribuidoAMim: item.atribuidoAMim === true,
    souApoio: item.souApoio === true,
    papelDoUsuario: item.papel ?? existing?.papelDoUsuario ?? null,
    apoioAlocacaoId: item.apoioAlocacaoId ?? existing?.apoioAlocacaoId,
    capabilities: deriveCapabilitiesFromProcessHeader({
      papel: item.papel ?? existing?.papelDoUsuario ?? null,
      souApoio: item.souApoio === true,
      atribuidoAMim: item.atribuidoAMim === true,
    }),
    downloadProgress: existing?.downloadProgress,
    downloadedAt: existing?.downloadedAt,
    lastSyncedAt: existing?.lastSyncedAt,
    lastPullAt: existing?.lastPullAt,
    errorMessage: existing?.errorMessage,
    packageVersion: existing?.packageVersion,
    recebimentoId: existing?.recebimentoId,
    activePaleteCodigo: existing?.activePaleteCodigo,
    createdAt: existing?.createdAt ?? now,
    updatedAt,
  };
}

function mapRemoteToDemand(item: ProcessHeaderItem): DemandRecord {
  const now = Date.now();
  return {
    id: item.demandId,
    unidadeId: item.unidadeId,
    routeId: item.demandId,
    fornecedorCodigo: '',
    fornecedorNome: item.supplier ?? '',
    status: item.situacao,
    situacao: item.situacao,
    dataPrevisaoEntrega: item.arrival ?? '',
    dataCriacao: '',
    serverRevision: item.serverRevision,
    updatedAt: now,
  };
}

async function shouldPreserveLocalProcess(process: ProcessRecord): Promise<boolean> {
  if (process.status === 'downloading') {
    return true;
  }

  const [hasPendingOps, hasPhotos] = await Promise.all([
    hasPendingSyncWork(process.id),
    hasPendingPhotoUploads(process.id),
  ]);

  return hasPendingOps || hasPhotos;
}

async function removeLocalProcessHeader(demandId: string): Promise<void> {
  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.processes, recebimentoV2Db.demands],
    async () => {
      await recebimentoV2Db.processes.delete(demandId);
      await recebimentoV2Db.demands.delete(demandId);
    },
  );
}

/**
 * Fetches active demand headers from the server and upserts them into the V2 Dexie store.
 * Removes local headers that are no longer on the server unless they still have offline work.
 */
export async function syncProcessList(unidadeId: string): Promise<SyncProcessListResult> {
  let cursor: string | undefined;
  let hasMore = true;
  const remoteIds = new Set<string>();
  const rawItems: ProcessHeaderItem[] = [];

  while (hasMore) {
    const page = await fetchProcesses(unidadeId, cursor);

    rawItems.push(...page.items);

    for (const item of page.items) {
      if (item.tombstone) {
        await removeLocalProcessHeader(item.demandId);
        continue;
      }

      remoteIds.add(item.demandId);
      const existing = await recebimentoV2Db.processes.get(item.demandId);
      const existingDemand = await recebimentoV2Db.demands.get(item.demandId);

      if (existingDemand) {
        await reconcileRemoteSituacao(item.demandId, item.situacao);
      }

      const demandAfterReconcile =
        (await recebimentoV2Db.demands.get(item.demandId)) ?? mapRemoteToDemand(item);
      const processAfterReconcile =
        (await recebimentoV2Db.processes.get(item.demandId)) ?? existing;

      await recebimentoV2Db.transaction(
        'rw',
        [recebimentoV2Db.processes, recebimentoV2Db.demands],
        async () => {
          await recebimentoV2Db.processes.put(
            mapRemoteToProcess(item, processAfterReconcile),
          );
          await recebimentoV2Db.demands.put(demandAfterReconcile);
        },
      );
    }

    cursor = page.nextCursor ?? undefined;
    hasMore = page.hasMore && Boolean(cursor);
  }

  const localProcesses = await recebimentoV2Db.processes
    .where('unidadeId')
    .equals(unidadeId)
    .toArray();

  let removedCount = 0;

  for (const local of localProcesses) {
    if (remoteIds.has(local.id)) {
      continue;
    }

    if (await shouldPreserveLocalProcess(local)) {
      continue;
    }

    await removeLocalProcessHeader(local.id);
    removedCount += 1;
  }

  return { items: rawItems, removedCount };
}

import { fetchSnapshot } from '../api/sync-api';
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
import { recebimentoV2Db } from '../local-db/db';
import type { SyncConflictRecord } from '../local-db/schema';

import { hasDirtyPatchWork, hasPendingSyncWork } from './auto-sync-v2.service';

export async function loadPendingSyncConflicts(demandId: string): Promise<SyncConflictRecord[]> {
  return recebimentoV2Db.syncConflicts
    .where('aggregateId')
    .equals(demandId)
    .filter((conflict) => !conflict.resolved)
    .toArray();
}

export async function countConflictSyncOperations(demandId: string): Promise<number> {
  return recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .filter((op) => op.status === 'conflict')
    .count();
}

async function refreshProcessStatusAfterConflictResolution(demandId: string): Promise<void> {
  const [hasDirty, hasPendingOps, process] = await Promise.all([
    hasDirtyPatchWork(demandId),
    hasPendingSyncWork(demandId),
    recebimentoV2Db.processes.get(demandId),
  ]);

  if (!process) {
    return;
  }

  const nextStatus = hasDirty || hasPendingOps ? 'pendingSync' : 'working';

  await recebimentoV2Db.processes.update(demandId, {
    status: nextStatus,
    updatedAt: Date.now(),
  });
}

export async function acceptServerConflict(
  demandId: string,
  conflictId: string,
): Promise<void> {
  const conflict = await recebimentoV2Db.syncConflicts.get(conflictId);
  if (!conflict) return;

  const snapshot = await fetchSnapshot(demandId);
  const now = Date.now();
  const snapshotConferences = resolveSnapshotConferences(snapshot);
  const snapshotAvarias = resolveSnapshotAvarias(snapshot);
  const snapshotTemperaturas = resolveSnapshotTemperaturas(snapshot);
  const snapshotChecklist = resolveSnapshotChecklist(snapshot);

  const expectedItems = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(demandId)
    .toArray();
  const produtoIds = new Set(expectedItems.map((item) => item.produtoId));
  for (const item of [...snapshotConferences, ...snapshotAvarias]) {
    if (item.produtoId) produtoIds.add(String(item.produtoId));
  }
  const products =
    produtoIds.size > 0 ? await recebimentoV2Db.products.bulkGet([...produtoIds]) : [];
  const skuByProdutoId = buildSkuByProdutoIdMap(
    expectedItems,
    products.filter((product): product is NonNullable<typeof product> =>
      Boolean(product && product.deletedAt === null),
    ),
  );
  const process = await recebimentoV2Db.processes.get(demandId);
  const demand = await recebimentoV2Db.demands.get(demandId).catch(() => undefined);
  const unidadeId = process?.unidadeId ?? demand?.unidadeId ?? '';

  let checklistDock = '';
  if (snapshotChecklist) {
    const docaId =
      typeof snapshotChecklist.docaId === 'string' ? snapshotChecklist.docaId : null;
    checklistDock = await resolveDockLabel(unidadeId, docaId);
  }

  await recebimentoV2Db.transaction(
    'rw',
    [
      recebimentoV2Db.syncConflicts,
      recebimentoV2Db.syncOperations,
      recebimentoV2Db.conferences,
      recebimentoV2Db.damages,
      recebimentoV2Db.checklists,
      recebimentoV2Db.temperatures,
      recebimentoV2Db.processes,
    ],
    async () => {
      await recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(demandId)
        .and((op) => op.status === 'pending' || op.status === 'retry')
        .modify({ status: 'rejected' });

      if (snapshotConferences.length > 0) {
        await recebimentoV2Db.conferences.where('demandId').equals(demandId).delete();
        await recebimentoV2Db.conferences.bulkPut(
          snapshotConferences.map((item) =>
            mapServerConferenciaToRecord(item, demandId, now, 'ambos', skuByProdutoId),
          ),
        );
      }

      if (snapshotAvarias.length > 0) {
        await recebimentoV2Db.damages.where('demandId').equals(demandId).delete();
        await recebimentoV2Db.damages.bulkPut(
          snapshotAvarias.map((item) =>
            mapServerAvariaToRecord(item, demandId, now, skuByProdutoId),
          ),
        );
      }

      if (snapshotChecklist) {
        await recebimentoV2Db.checklists.put(
          mapServerChecklistToRecord(snapshotChecklist, demandId, checklistDock, now),
        );
      }

      await recebimentoV2Db.temperatures.where('demandId').equals(demandId).delete();
      if (snapshotTemperaturas.length > 0) {
        await recebimentoV2Db.temperatures.bulkPut(
          snapshotTemperaturas.map((item) =>
            mapServerTemperaturaToRecord(item, demandId, now),
          ),
        );
      }

      await recebimentoV2Db.syncConflicts.update(conflictId, {
        resolved: true,
        resolvedAt: Date.now(),
      });

      const serverRevision =
        (snapshot as { revision?: number }).revision ?? conflict.serverRevision;
      await recebimentoV2Db.processes.update(demandId, {
        serverRevision,
        updatedAt: now,
      });
    },
  );

  await refreshProcessStatusAfterConflictResolution(demandId);
}

export async function keepLocalConflict(demandId: string, conflictId: string): Promise<void> {
  const conflict = await recebimentoV2Db.syncConflicts.get(conflictId);
  if (!conflict) return;

  const currentRevision = conflict.serverRevision;

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.syncConflicts, recebimentoV2Db.syncOperations, recebimentoV2Db.processes],
    async () => {
      await recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(demandId)
        .and((op) => op.status === 'conflict')
        .modify({ status: 'pending', attempts: 0 });

      await recebimentoV2Db.processes.update(demandId, {
        baseRevision: currentRevision,
        serverRevision: currentRevision,
        updatedAt: Date.now(),
      });

      await recebimentoV2Db.syncConflicts.update(conflictId, {
        resolved: true,
        resolvedAt: Date.now(),
      });
    },
  );

  await refreshProcessStatusAfterConflictResolution(demandId);
}

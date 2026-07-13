import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import { fetchSnapshot } from '../api/sync-api.js';
import {
  buildSkuByProdutoIdMap,
  mapServerAvariaToRecord,
  mapServerConferenciaToRecord,
  resolveSnapshotAvarias,
  resolveSnapshotConferences,
} from '../lib/map-snapshot-v2.js';
import {
  mapServerChecklistToRecord,
  resolveDockLabel,
  resolveSnapshotChecklist,
} from '../lib/map-server-checklist-v2.js';
import { recebimentoV2Db } from '../local-db/db.js';
import type { SyncConflictRecord } from '../local-db/schema.js';

export interface UseConflictV2Result {
  conflicts: SyncConflictRecord[];
  isLoading: boolean;
  getPendingConflicts: () => SyncConflictRecord[];
  acceptServer: (conflictId: string) => Promise<void>;
  keepLocal: (conflictId: string) => Promise<void>;
}

export function useConflictV2(demandId: string): UseConflictV2Result {
  const conflicts = useLiveQuery(
    () =>
      recebimentoV2Db.syncConflicts
        .where('aggregateId')
        .equals(demandId)
        .and((c) => !c.resolved)
        .toArray(),
    [demandId],
  );

  const getPendingConflicts = useCallback(
    () => (conflicts ?? []).filter((c) => !c.resolved),
    [conflicts],
  );

  const acceptServer = useCallback(
    async (conflictId: string): Promise<void> => {
      const conflict = await recebimentoV2Db.syncConflicts.get(conflictId);
      if (!conflict) return;

      const snapshot = await fetchSnapshot(demandId);
      const now = Date.now();
      const snapshotConferences = resolveSnapshotConferences(snapshot);
      const snapshotAvarias = resolveSnapshotAvarias(snapshot);
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
        produtoIds.size > 0
          ? await recebimentoV2Db.products.bulkGet([...produtoIds])
          : [];
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
          recebimentoV2Db.processes,
        ],
        async () => {
          // Archive local pending operations for this aggregate
          await recebimentoV2Db.syncOperations
            .where('aggregateId')
            .equals(demandId)
            .and((op) => op.status === 'pending' || op.status === 'retry')
            .modify({ status: 'rejected' });

          // Apply server snapshot to relevant stores
          if (snapshotConferences.length > 0) {
            await recebimentoV2Db.conferences
              .where('demandId')
              .equals(demandId)
              .delete();
            await recebimentoV2Db.conferences.bulkPut(
              snapshotConferences.map((item) =>
                mapServerConferenciaToRecord(item, demandId, now, 'ambos', skuByProdutoId),
              ),
            );
          }
          if (snapshotAvarias.length > 0) {
            await recebimentoV2Db.damages
              .where('demandId')
              .equals(demandId)
              .delete();
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

          // Mark conflict as resolved
          await recebimentoV2Db.syncConflicts.update(conflictId, {
            resolved: true,
            resolvedAt: Date.now(),
          });

          // Update process to latest server revision
          const serverRevision =
            (snapshot as { revision?: number }).revision ?? conflict.serverRevision;
          await recebimentoV2Db.processes.update(demandId, {
            serverRevision,
            updatedAt: Date.now(),
          });
        },
      );
    },
    [demandId],
  );

  const keepLocal = useCallback(
    async (conflictId: string): Promise<void> => {
      const conflict = await recebimentoV2Db.syncConflicts.get(conflictId);
      if (!conflict) return;

      const process = await recebimentoV2Db.processes.get(demandId);
      const currentRevision = conflict.serverRevision;

      await recebimentoV2Db.transaction(
        'rw',
        [recebimentoV2Db.syncConflicts, recebimentoV2Db.syncOperations, recebimentoV2Db.processes],
        async () => {
          // Reset conflicting operations to pending so they will retry against current revision
          await recebimentoV2Db.syncOperations
            .where('aggregateId')
            .equals(demandId)
            .and((op) => op.status === 'conflict')
            .modify({ status: 'pending', attempts: 0 });

          // Update process base revision to current server revision
          await recebimentoV2Db.processes.update(demandId, {
            baseRevision: currentRevision,
            serverRevision: currentRevision,
            updatedAt: Date.now(),
          });

          // Mark conflict as resolved
          await recebimentoV2Db.syncConflicts.update(conflictId, {
            resolved: true,
            resolvedAt: Date.now(),
          });
        },
      );
    },
    [demandId],
  );

  return {
    conflicts: conflicts ?? [],
    isLoading: conflicts === undefined,
    getPendingConflicts,
    acceptServer,
    keepLocal,
  };
}

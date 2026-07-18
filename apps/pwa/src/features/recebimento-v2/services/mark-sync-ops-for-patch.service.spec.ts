import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { ConferenceRecord, SyncOperationRecord } from '../local-db/schema';

import {
  markLegacySyncOpsForAppliedPatch,
  reconcileOrphanedPendingSyncOps,
} from './mark-sync-ops-for-patch.service';

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';
const CONFERENCE_ID = 'conf-orphan-1';

function makePendingConferirOp(
  overrides: Partial<SyncOperationRecord> = {},
): SyncOperationRecord {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    aggregateId: DEMAND_ID,
    module: 'conference',
    opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
    sequence: now,
    dependsOn: [],
    idempotencyKey: crypto.randomUUID(),
    payload: { conferenceId: CONFERENCE_ID },
    attachmentIds: [],
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSyncedConference(): ConferenceRecord {
  const now = Date.now();
  return {
    id: CONFERENCE_ID,
    demandId: DEMAND_ID,
    sku: '600598361',
    lote: '5001251010',
    quantity: 10,
    recebidaUnidade: 10,
    conferidoAt: new Date().toISOString(),
    syncStatus: 'synced',
    updatedAt: now,
  };
}

describe('mark-sync-ops-for-patch.service', () => {
  beforeEach(async () => {
    await Promise.all([
      recebimentoV2Db.syncOperations.clear(),
      recebimentoV2Db.conferences.clear(),
      recebimentoV2Db.processes.clear(),
    ]);

    await recebimentoV2Db.processes.put({
      id: DEMAND_ID,
      unidadeId: 'ITB',
      adapter: 'recebimento-v2',
      status: 'working',
      serverRevision: 1,
      baseRevision: 1,
      flowVersion: 'v2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it('reconcileOrphanedPendingSyncOps marks pending conferir op synced when conference is synced', async () => {
    const op = makePendingConferirOp();
    await recebimentoV2Db.syncOperations.put(op);
    await recebimentoV2Db.conferences.put(makeSyncedConference());

    const changed = await reconcileOrphanedPendingSyncOps(DEMAND_ID);

    expect(changed).toBe(1);
    const stored = await recebimentoV2Db.syncOperations.get(op.id);
    expect(stored?.status).toBe('synced');
  });

  it('markLegacySyncOpsForAppliedPatch marks conference ops after successful patch', async () => {
    const op = makePendingConferirOp();
    await recebimentoV2Db.syncOperations.put(op);
    await recebimentoV2Db.conferences.put({
      ...makeSyncedConference(),
      syncStatus: 'pending',
    });

    await markLegacySyncOpsForAppliedPatch(
      DEMAND_ID,
      {
        baseRevision: 1,
        patch: {
          conferencias: [
            {
              clientConferenceId: CONFERENCE_ID,
              produtoId: 'prod-1',
              quantidadeRecebida: 10,
              unidadeMedida: 'UN',
              conferidoAt: new Date().toISOString(),
            },
          ],
        },
      },
      {
        serverRevision: 2,
        applied: {
          conferencias: { accepted: 1, rejected: 0 },
        },
      },
      Date.now(),
    );

    const stored = await recebimentoV2Db.syncOperations.get(op.id);
    expect(stored?.status).toBe('synced');
  });
});

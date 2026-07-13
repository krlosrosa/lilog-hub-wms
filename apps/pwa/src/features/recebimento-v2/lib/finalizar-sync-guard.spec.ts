import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { ProcessRecord, SyncOperationRecord, TemperatureRecord } from '../local-db/schema';
import {
  assertCanFinalizeConferencia,
  clearStaleEncerrarOps,
  hasActiveEncerrarOp,
} from './finalizar-sync-guard';

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';

function makeProcess(overrides: Partial<ProcessRecord> = {}): ProcessRecord {
  const now = Date.now();
  return {
    id: DEMAND_ID,
    unidadeId: 'unit-001',
    adapter: 'recebimento-v2',
    status: 'working',
    serverRevision: 5,
    baseRevision: 5,
    flowVersion: 'v2',
    recebimentoId: 'recebimento-server-1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSyncOp(
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
    payload: {},
    attachmentIds: [],
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeEncerrarOp(
  overrides: Partial<SyncOperationRecord> = {},
): SyncOperationRecord {
  return makeSyncOp({
    module: 'conference',
    opType: RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR,
    payload: {
      demandId: DEMAND_ID,
      encerradoAt: new Date().toISOString(),
      dock: 'Doca 1',
      quantidadePaletes: 10,
    },
    ...overrides,
  });
}

async function seedTemperaturasCompletas(): Promise<void> {
  const now = Date.now();
  const records: TemperatureRecord[] = [
    { id: `${DEMAND_ID}::inicio`, demandId: DEMAND_ID, etapa: 'inicio', temperatura: -18, syncStatus: 'synced', updatedAt: now },
    { id: `${DEMAND_ID}::meio`, demandId: DEMAND_ID, etapa: 'meio', temperatura: -17.5, syncStatus: 'synced', updatedAt: now },
    { id: `${DEMAND_ID}::fim`, demandId: DEMAND_ID, etapa: 'fim', temperatura: -18.2, syncStatus: 'synced', updatedAt: now },
  ];
  await recebimentoV2Db.temperatures.bulkPut(records);
}

describe('finalizar-sync-guard', () => {
  beforeEach(async () => {
    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.temperatures.clear();
    await recebimentoV2Db.impedimentos.clear();

    await recebimentoV2Db.processes.put(makeProcess());
    await seedTemperaturasCompletas();
  });

  describe('assertCanFinalizeConferencia', () => {
    it('does not block when ops are pending or retry', async () => {
      await recebimentoV2Db.syncOperations.bulkPut([
        makeSyncOp({ status: 'pending' }),
        makeSyncOp({ status: 'retry', attempts: 1 }),
      ]);

      await expect(assertCanFinalizeConferencia(DEMAND_ID)).resolves.toBeUndefined();
    });

    it('blocks when ops are rejected', async () => {
      await recebimentoV2Db.syncOperations.put(
        makeSyncOp({ status: 'rejected', errorMessage: 'Invalid payload' }),
      );

      await expect(assertCanFinalizeConferencia(DEMAND_ID)).rejects.toThrow(
        'operações rejeitadas',
      );
    });

    it('blocks when ops are in conflict', async () => {
      await recebimentoV2Db.syncOperations.put(
        makeSyncOp({ status: 'conflict', errorMessage: 'Revision mismatch' }),
      );

      await expect(assertCanFinalizeConferencia(DEMAND_ID)).rejects.toThrow(
        'conflitos de sincronização',
      );
    });

    it('blocks when recebimentoId is missing', async () => {
      await recebimentoV2Db.processes.put(makeProcess({ recebimentoId: undefined }));

      await expect(assertCanFinalizeConferencia(DEMAND_ID)).rejects.toThrow(
        'conferência ainda não foi iniciada no servidor',
      );
    });

    it('blocks when temperaturas are incomplete', async () => {
      await recebimentoV2Db.temperatures.clear();
      await recebimentoV2Db.temperatures.put({
        id: `${DEMAND_ID}::inicio`,
        demandId: DEMAND_ID,
        etapa: 'inicio',
        temperatura: -18,
        syncStatus: 'synced',
        updatedAt: Date.now(),
      });

      await expect(assertCanFinalizeConferencia(DEMAND_ID)).rejects.toThrow(
        'temperaturas de início, meio e fim do baú',
      );
    });
  });

  describe('clearStaleEncerrarOps', () => {
    it('removes only rejected or conflict ENCERRAR ops', async () => {
      const rejected = makeEncerrarOp({ status: 'rejected', errorMessage: 'Falhou' });
      const conflict = makeEncerrarOp({ status: 'conflict', errorMessage: 'Conflito' });
      const pending = makeEncerrarOp({ status: 'pending' });
      const synced = makeEncerrarOp({ status: 'synced' });
      const otherRejected = makeSyncOp({ status: 'rejected' });

      await recebimentoV2Db.syncOperations.bulkPut([
        rejected,
        conflict,
        pending,
        synced,
        otherRejected,
      ]);

      await clearStaleEncerrarOps(DEMAND_ID);

      const remaining = await recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(DEMAND_ID)
        .toArray();

      expect(remaining.map((op) => op.id).sort()).toEqual(
        [pending.id, synced.id, otherRejected.id].sort(),
      );
    });
  });

  describe('hasActiveEncerrarOp', () => {
    it('returns true when ENCERRAR op is pending, retry or syncing', async () => {
      await recebimentoV2Db.syncOperations.put(makeEncerrarOp({ status: 'pending' }));
      expect(await hasActiveEncerrarOp(DEMAND_ID)).toBe(true);

      await recebimentoV2Db.syncOperations.clear();
      await recebimentoV2Db.syncOperations.put(makeEncerrarOp({ status: 'retry', attempts: 1 }));
      expect(await hasActiveEncerrarOp(DEMAND_ID)).toBe(true);

      await recebimentoV2Db.syncOperations.clear();
      await recebimentoV2Db.syncOperations.put(makeEncerrarOp({ status: 'syncing' }));
      expect(await hasActiveEncerrarOp(DEMAND_ID)).toBe(true);
    });

    it('returns false when no active ENCERRAR op exists', async () => {
      await recebimentoV2Db.syncOperations.put(makeEncerrarOp({ status: 'synced' }));
      expect(await hasActiveEncerrarOp(DEMAND_ID)).toBe(false);

      await recebimentoV2Db.syncOperations.clear();
      await recebimentoV2Db.syncOperations.put(makeSyncOp({ status: 'pending' }));
      expect(await hasActiveEncerrarOp(DEMAND_ID)).toBe(false);
    });
  });
});

import { beforeEach, describe, expect, it } from 'vitest';

import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import type { ConferenceRecord, DamageRecord } from '@/features/recebimento-v2/local-db/schema';

import { offlineConferenceRepository } from './offline-conference-repository';

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';

function makeConference(overrides: Partial<ConferenceRecord> = {}): ConferenceRecord {
  return {
    id: crypto.randomUUID(),
    demandId: DEMAND_ID,
    sku: '600598361',
    quantity: 1,
    conferidoAt: new Date().toISOString(),
    syncStatus: 'pending',
    updatedAt: Date.now(),
    ...overrides,
  };
}

function makeDamage(overrides: Partial<DamageRecord> = {}): DamageRecord {
  return {
    id: crypto.randomUUID(),
    demandId: DEMAND_ID,
    description: 'Avaria teste',
    quantity: 1,
    motivo: '1',
    tipo: '1',
    natureza: '1',
    causa: '1',
    registradoAt: new Date().toISOString(),
    syncStatus: 'pending',
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('offlineConferenceRepository remove semantics', () => {
  beforeEach(async () => {
    await recebimentoV2Db.conferences.clear();
    await recebimentoV2Db.damages.clear();
  });

  it('hard deletes conference that never reached server', async () => {
    const record = makeConference();
    await recebimentoV2Db.conferences.put(record);

    await offlineConferenceRepository.removeConference(record.id);

    const stored = await recebimentoV2Db.conferences.get(record.id);
    expect(stored).toBeUndefined();
  });

  it('marks conference as deleted + pending when server ids exist', async () => {
    const record = makeConference({
      syncStatus: 'synced',
      serverItemId: 'item-server-1',
    });
    await recebimentoV2Db.conferences.put(record);

    await offlineConferenceRepository.removeConference(record.id);

    const stored = await recebimentoV2Db.conferences.get(record.id);
    expect(stored?.deletedAt).toBeTruthy();
    expect(stored?.syncStatus).toBe('pending');
  });

  it('hard deletes damage that never reached server', async () => {
    const record = makeDamage();
    await recebimentoV2Db.damages.put(record);

    await offlineConferenceRepository.removeDamage(record.id);

    const stored = await recebimentoV2Db.damages.get(record.id);
    expect(stored).toBeUndefined();
  });

  it('marks damage as deleted + pending when serverAvariaId exists', async () => {
    const record = makeDamage({
      syncStatus: 'synced',
      serverAvariaId: 'avaria-server-1',
    });
    await recebimentoV2Db.damages.put(record);

    await offlineConferenceRepository.removeDamage(record.id);

    const stored = await recebimentoV2Db.damages.get(record.id);
    expect(stored?.deletedAt).toBeTruthy();
    expect(stored?.syncStatus).toBe('pending');
  });
});

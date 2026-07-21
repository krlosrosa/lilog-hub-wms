import { describe, expect, it } from 'vitest';

import {
  filterServerDamagesAgainstPendingDeletes,
  splitDamagesForPullMerge,
} from './damage-removal.helpers';
import type { DamageRecord } from '../local-db/schema';

function damage(partial: Partial<DamageRecord> & Pick<DamageRecord, 'id'>): DamageRecord {
  return {
    demandId: 'demand-1',
    description: 'test',
    quantity: 1,
    syncStatus: 'synced',
    updatedAt: Date.now(),
    ...partial,
  };
}

describe('splitDamagesForPullMerge', () => {
  it('keeps pending deletes and their server ids', () => {
    const existing = [
      damage({
        id: 'local-1',
        serverAvariaId: 'server-1',
        deletedAt: '2026-01-01T00:00:00.000Z',
        syncStatus: 'pending',
      }),
      damage({ id: 'active-1', serverAvariaId: 'server-2' }),
    ];

    const result = splitDamagesForPullMerge(existing);

    expect(result.pendingDeletes).toHaveLength(1);
    expect(result.pendingDeletes[0]?.id).toBe('local-1');
    expect(result.pendingDeleteServerIds).toEqual(new Set(['server-1']));
  });

  it('ignores synced soft deletes', () => {
    const existing = [
      damage({
        id: 'ghost-1',
        deletedAt: '2026-01-01T00:00:00.000Z',
        syncStatus: 'synced',
      }),
    ];

    const result = splitDamagesForPullMerge(existing);

    expect(result.pendingDeletes).toHaveLength(0);
    expect(result.pendingDeleteServerIds.size).toBe(0);
  });
});

describe('filterServerDamagesAgainstPendingDeletes', () => {
  it('drops snapshot rows blocked by pending delete', () => {
    const records = [
      damage({ id: 'server-1', serverAvariaId: 'server-1' }),
      damage({ id: 'server-2', serverAvariaId: 'server-2' }),
    ];

    const filtered = filterServerDamagesAgainstPendingDeletes(
      records,
      new Set(['server-1']),
    );

    expect(filtered.map((item) => item.serverAvariaId)).toEqual(['server-2']);
  });
});

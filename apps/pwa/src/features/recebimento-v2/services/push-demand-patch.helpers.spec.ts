import { describe, expect, it } from 'vitest';

import type { DemandPatchResult } from '@lilog/contracts';

function sortAvariaPatchItems<T extends { deletedAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.deletedAt && !b.deletedAt) return -1;
    if (!a.deletedAt && b.deletedAt) return 1;
    return 0;
  });
}

function partitionPatchConflicts(result: DemandPatchResult): {
  avariaConflictClientIds: Set<string>;
  nonAvariaConflicts: NonNullable<DemandPatchResult['conflicts']>;
  avariaConflicts: NonNullable<DemandPatchResult['conflicts']>;
} {
  const patchConflicts = result.conflicts ?? [];
  const avariaConflicts = patchConflicts.filter((conflict) => conflict.section === 'avarias');
  const nonAvariaConflicts = patchConflicts.filter((conflict) => conflict.section !== 'avarias');
  const avariaConflictClientIds = new Set(
    avariaConflicts
      .map((conflict) => conflict.clientId)
      .filter((clientId): clientId is string => Boolean(clientId)),
  );

  return { avariaConflictClientIds, nonAvariaConflicts, avariaConflicts };
}

describe('avaria patch helpers', () => {
  it('sortAvariaPatchItems puts deletes first', () => {
    const sorted = sortAvariaPatchItems([
      { clientDamageId: 'create-1' },
      { clientDamageId: 'delete-1', deletedAt: '2026-01-01T00:00:00.000Z' },
      { clientDamageId: 'create-2' },
    ]);

    expect(sorted.map((item) => item.clientDamageId)).toEqual([
      'delete-1',
      'create-1',
      'create-2',
    ]);
  });

  it('partitionPatchConflicts separates avaria conflicts', () => {
    const result: DemandPatchResult = {
      serverRevision: 2,
      applied: {},
      conflicts: [
        { section: 'avarias', clientId: 'damage-1', reason: 'Erro ao registrar avaria' },
        { section: 'checklist', clientId: 'checklist-1', reason: 'Checklist inválido' },
      ],
    };

    const partitioned = partitionPatchConflicts(result);

    expect(partitioned.avariaConflictClientIds).toEqual(new Set(['damage-1']));
    expect(partitioned.nonAvariaConflicts).toHaveLength(1);
    expect(partitioned.avariaConflicts).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';
import {
  cascadeDependencyFailure,
  getExecutableOperations,
  topologicalSort,
} from '../domain/DependencyResolver.js';
import { createOperation } from '../operations/Operation.js';

function makeOp(id: string, sequence: number, dependsOn: string[] = [], status = 'Pending' as const) {
  const op = createOperation(
    {
      aggregateId: 'agg',
      aggregateType: 'Test',
      operationType: 'test',
      payload: {},
      sequence,
      dependsOn,
    },
    id,
    sequence,
  );
  return { ...op, status };
}

describe('DependencyResolver', () => {
  it('orders operations topologically', () => {
    const sorted = topologicalSort([
      makeOp('c', 3, ['b']),
      makeOp('a', 1),
      makeOp('b', 2, ['a']),
    ]);
    expect(sorted.map((op) => op.id)).toEqual(['a', 'b', 'c']);
  });

  it('blocks operations until dependencies complete', () => {
    const pending = [makeOp('a', 1), makeOp('b', 2, ['a'])];
    const executable = getExecutableOperations(pending, new Set(), Date.now());
    expect(executable.map((op) => op.id)).toEqual(['a']);
  });

  it('cascades cancellation to dependents', () => {
    const pending = [makeOp('a', 1), makeOp('b', 2, ['a']), makeOp('c', 3, ['b'])];
    const cascaded = cascadeDependencyFailure(pending, 'a', Date.now());
    expect(cascaded.find((op) => op.id === 'b')?.status).toBe('Cancelled');
    expect(cascaded.find((op) => op.id === 'c')?.status).toBe('Cancelled');
  });
});

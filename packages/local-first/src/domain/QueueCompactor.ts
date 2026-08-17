import type { Operation } from '../operations/Operation.js';
import { detectOperationKind } from '../domain/DependencyResolver.js';

function mergePayloads(base: unknown, overlay: unknown): unknown {
  if (
    typeof base === 'object' &&
    base !== null &&
    typeof overlay === 'object' &&
    overlay !== null
  ) {
    return { ...(base as Record<string, unknown>), ...(overlay as Record<string, unknown>) };
  }
  return overlay;
}

function entityKey(op: Operation): string {
  const entityId = op.metadata.entityId ?? op.id;
  return `${op.aggregateId}::${entityId}::${op.transactionGroupId ?? ''}`;
}

function compactGroup(ops: Operation[]): Operation[] {
  const events = ops.filter((o) => o.compactionRule === 'event' || detectOperationKind(o.operationType) === 'upload');
  const states = ops.filter((o) => o.compactionRule === 'state' && detectOperationKind(o.operationType) !== 'upload');

  if (states.length === 0) return events;
  if (states.length === 1) return [...events, states[0]!];

  let current: Operation | null = states[0]!;
  let currentKind = detectOperationKind(current.operationType);

  for (let i = 1; i < states.length; i++) {
    const next = states[i]!;
    const nextKind = detectOperationKind(next.operationType);

    if (current === null) {
      current = next;
      currentKind = nextKind;
      continue;
    }

    if (currentKind === 'create' && nextKind === 'update') {
      current = {
        ...current,
        payload: mergePayloads(current.payload, next.payload),
        updatedAt: next.updatedAt,
        sequence: next.sequence,
      };
      currentKind = 'create';
    } else if (currentKind === 'update' && nextKind === 'update') {
      current = {
        ...current,
        payload: mergePayloads(current.payload, next.payload),
        sequence: next.sequence,
        updatedAt: next.updatedAt,
      };
      currentKind = 'update';
    } else if (currentKind === 'create' && nextKind === 'delete') {
      current = null;
      currentKind = null;
    } else if (currentKind === 'update' && nextKind === 'delete') {
      current = next;
      currentKind = 'delete';
    } else if (currentKind === 'delete' && nextKind === 'update') {
      return [...events, ...states];
    } else {
      current = next;
      currentKind = nextKind;
    }
  }

  const compactedStates = current !== null ? [current] : [];
  return [...events, ...compactedStates];
}

export interface CompactionResult {
  operations: Operation[];
  removedIds: string[];
}

export function compactOperations(operations: Operation[]): CompactionResult {
  const sorted = [...operations].sort((a, b) =>
    a.sequence !== b.sequence ? a.sequence - b.sequence : a.createdAt - b.createdAt,
  );

  const byEntity = new Map<string, Operation[]>();
  for (const op of sorted) {
    const key = entityKey(op);
    const group = byEntity.get(key) ?? [];
    group.push(op);
    byEntity.set(key, group);
  }

  const result: Operation[] = [];
  for (const group of byEntity.values()) {
    result.push(...compactGroup(group));
  }

  const keptIds = new Set(result.map((op) => op.id));
  const removedIds = sorted.filter((op) => !keptIds.has(op.id)).map((op) => op.id);

  const rewritten = rewriteDependencies(result, removedIds);

  return {
    operations: rewritten.sort((a, b) =>
      a.sequence !== b.sequence ? a.sequence - b.sequence : a.createdAt - b.createdAt,
    ),
    removedIds,
  };
}

export function rewriteDependencies(operations: Operation[], removedIds: string[]): Operation[] {
  if (removedIds.length === 0) return operations;
  const removed = new Set(removedIds);
  return operations.map((op) => ({
    ...op,
    dependsOn: op.dependsOn.filter((depId) => !removed.has(depId)),
  }));
}

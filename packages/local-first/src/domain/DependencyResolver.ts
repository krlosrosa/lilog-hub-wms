import type { Operation } from '../operations/Operation.js';
import type { OperationKind } from '../types/index.js';

export function detectOperationKind(operationType: string): OperationKind | null {
  const lower = operationType.toLowerCase();
  if (lower.includes('upload') || lower.includes('photo') || lower.includes('foto')) {
    return 'upload';
  }
  if (lower.includes('create') || lower.includes('insert') || lower.includes('add')) {
    return 'create';
  }
  if (lower.includes('delete') || lower.includes('remove')) {
    return 'delete';
  }
  if (lower.includes('update') || lower.includes('upsert') || lower.includes('patch')) {
    return 'update';
  }
  return 'event';
}

export function getExecutableOperations(
  pending: Operation[],
  inFlight: Set<string>,
  now: number,
): Operation[] {
  const pendingById = new Map(pending.map((op) => [op.id, op]));

  return pending.filter((op) => {
    if (inFlight.has(op.id)) return false;
    if (op.status === 'Running') return false;
    if (op.status !== 'Pending' && op.status !== 'Retrying') return false;
    if (op.nextAttemptAt !== undefined && op.nextAttemptAt > now) return false;

    for (const depId of op.dependsOn) {
      const dep = pendingById.get(depId);
      if (!dep) continue;
      if (dep.status === 'Failed' || dep.status === 'Cancelled') return false;
      if (
        dep.status === 'Pending' ||
        dep.status === 'Retrying' ||
        dep.status === 'WaitingDependency' ||
        dep.status === 'Running'
      ) {
        return false;
      }
    }

    return true;
  });
}

export function topologicalSort(operations: Operation[]): Operation[] {
  const byId = new Map(operations.map((op) => [op.id, op]));
  const visited = new Set<string>();
  const result: Operation[] = [];

  function visit(op: Operation): void {
    if (visited.has(op.id)) return;
    visited.add(op.id);

    const sortedDeps = op.dependsOn
      .map((depId) => byId.get(depId))
      .filter((dep): dep is Operation => dep !== undefined)
      .sort((a, b) => a.sequence - b.sequence);

    for (const dep of sortedDeps) {
      visit(dep);
    }

    result.push(op);
  }

  const sorted = [...operations].sort((a, b) => {
    if (a.aggregateId !== b.aggregateId) return a.aggregateId.localeCompare(b.aggregateId);
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.sequence - b.sequence;
  });

  for (const op of sorted) {
    visit(op);
  }

  return result;
}

export function cascadeDependencyFailure(
  operations: Operation[],
  failedOperationId: string,
  now: number,
): Operation[] {
  const byId = new Map(operations.map((op) => [op.id, op]));
  const cancelled = new Set<string>([failedOperationId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const op of operations) {
      if (cancelled.has(op.id)) continue;
      if (op.dependsOn.some((depId) => cancelled.has(depId))) {
        cancelled.add(op.id);
        changed = true;
      }
    }
  }

  return operations.map((op) => {
    if (!cancelled.has(op.id) || op.id === failedOperationId) return op;
    if (op.status === 'Completed' || op.status === 'Cancelled') return op;
    return {
      ...op,
      status: 'Cancelled' as const,
      updatedAt: now,
      lastError: `Cancelled due to dependency ${failedOperationId}`,
    };
  });
}

export function groupByTransactionGroup(operations: Operation[]): Map<string | undefined, Operation[]> {
  const groups = new Map<string | undefined, Operation[]>();
  for (const op of operations) {
    const key = op.transactionGroupId;
    const group = groups.get(key) ?? [];
    group.push(op);
    groups.set(key, group);
  }
  return groups;
}

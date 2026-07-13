import type { LocalSyncOperation } from '@lilog/contracts';

// ---------------------------------------------------------------------------
// Dependency graph & executable operation resolution
// ---------------------------------------------------------------------------

/**
 * Returns operations that are ready to be sent — all their dependsOn refs are
 * either already synced (not in the pending list) or explicitly in a terminal
 * state.  Operations whose dependencies are in 'conflict' or 'rejected' are
 * blocked.
 */
export function getExecutableOperations(
  pending: LocalSyncOperation[],
  inFlight: Set<string>,
): LocalSyncOperation[] {
  const pendingById = new Map<string, LocalSyncOperation>(pending.map((op) => [op.id, op]));

  return pending.filter((op) => {
    if (inFlight.has(op.id)) return false;
    if (op.status === 'syncing') return false;
    if (op.status !== 'pending' && op.status !== 'retry') return false;

    for (const depId of op.dependsOn) {
      const dep = pendingById.get(depId);
      if (!dep) continue; // not in pending list → already synced, OK

      if (dep.status === 'conflict' || dep.status === 'rejected') {
        return false; // blocked by terminal error
      }

      if (dep.status === 'pending' || dep.status === 'retry' || dep.status === 'blocked' || dep.status === 'syncing') {
        return false; // blocked while dep is in-flight or pending
      }
    }

    return true;
  });
}

/**
 * Topological sort respecting:
 * 1. dependsOn edges
 * 2. sequence within the same aggregate as a tiebreaker
 */
export function topologicalSort(operations: LocalSyncOperation[]): LocalSyncOperation[] {
  const byId = new Map<string, LocalSyncOperation>(operations.map((op) => [op.id, op]));
  const visited = new Set<string>();
  const result: LocalSyncOperation[] = [];

  function visit(op: LocalSyncOperation): void {
    if (visited.has(op.id)) return;
    visited.add(op.id);

    // Visit dependencies first
    const sortedDeps = op.dependsOn
      .map((depId) => byId.get(depId))
      .filter((dep): dep is LocalSyncOperation => dep !== undefined)
      .sort((a, b) => a.sequence - b.sequence);

    for (const dep of sortedDeps) {
      visit(dep);
    }

    result.push(op);
  }

  // Process in sequence order for stable output
  const sorted = [...operations].sort((a, b) => {
    if (a.aggregateId !== b.aggregateId) return a.aggregateId.localeCompare(b.aggregateId);
    return a.sequence - b.sequence;
  });

  for (const op of sorted) {
    visit(op);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Operation compaction
// ---------------------------------------------------------------------------

export type OperationCompactionRule = 'event' | 'state';

export interface CompactableOperation {
  id: string;
  opType: string;
  aggregateId: string;
  /** Sub-entity within the aggregate (e.g. produtoId for items) */
  entityId: string;
  compactionRule: OperationCompactionRule;
  payload: unknown;
  sequence: number;
  createdAt: number;
}

type CompactionKind = 'create' | 'update' | 'delete';

function detectKind(opType: string): CompactionKind | null {
  const lower = opType.toLowerCase();
  if (lower.includes('create') || lower.includes('insert') || lower.includes('conferir')) {
    return 'create';
  }
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('clear')) {
    return 'delete';
  }
  if (lower.includes('update') || lower.includes('upsert') || lower.includes('registrar')) {
    return 'update';
  }
  return null;
}

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

/**
 * Compacts a list of operations for the same aggregate.
 *
 * Rules (per entity within the same aggregate, applied in sequence order):
 * - CREATE + UPDATE → CREATE with merged payload
 * - UPDATE + UPDATE → single UPDATE
 * - CREATE + DELETE → remove both (never reached server)
 * - UPDATE + DELETE → single DELETE
 * - DELETE + UPDATE → kept as-is (invalid sequence, treated as events)
 * - Events (compactionRule === 'event') → never merged
 */
export function compactOperations(ops: CompactableOperation[]): CompactableOperation[] {
  // Sort by sequence, then createdAt
  const sorted = [...ops].sort((a, b) =>
    a.sequence !== b.sequence ? a.sequence - b.sequence : a.createdAt - b.createdAt,
  );

  // Group by entityId within aggregateId
  const byEntity = new Map<string, CompactableOperation[]>();
  const keyFor = (op: CompactableOperation) => `${op.aggregateId}::${op.entityId}`;

  for (const op of sorted) {
    const k = keyFor(op);
    const group = byEntity.get(k);
    if (!group) {
      byEntity.set(k, [op]);
    } else {
      group.push(op);
    }
  }

  const result: CompactableOperation[] = [];

  for (const group of byEntity.values()) {
    let compacted = compactGroup(group);
    result.push(...compacted);
  }

  // Restore original relative ordering by sequence then createdAt
  return result.sort((a, b) =>
    a.sequence !== b.sequence ? a.sequence - b.sequence : a.createdAt - b.createdAt,
  );
}

function compactGroup(ops: CompactableOperation[]): CompactableOperation[] {
  // Events are never compacted — pass them through unchanged
  const events = ops.filter((o) => o.compactionRule === 'event');
  const states = ops.filter((o) => o.compactionRule === 'state');

  if (states.length === 0) return events;
  if (states.length === 1) return [...events, ...states];

  // Reduce state operations
  let current: CompactableOperation | null = states[0]!;
  let currentKind = detectKind(current.opType);

  for (let i = 1; i < states.length; i++) {
    const next = states[i]!;
    const nextKind = detectKind(next.opType);

    if (current === null) {
      // previous pair cancelled out — start fresh
      current = next;
      currentKind = nextKind;
      continue;
    }

    if (currentKind === 'create' && nextKind === 'update') {
      // CREATE + UPDATE → CREATE with merged payload
      current = {
        ...current,
        payload: mergePayloads(current.payload, next.payload),
        updatedAt: next.createdAt,
        sequence: next.sequence,
      } as CompactableOperation & { updatedAt: number };
      currentKind = 'create';
    } else if (currentKind === 'update' && nextKind === 'update') {
      // UPDATE + UPDATE → single UPDATE (latest wins)
      current = {
        ...current,
        payload: mergePayloads(current.payload, next.payload),
        sequence: next.sequence,
        createdAt: next.createdAt,
      };
      currentKind = 'update';
    } else if (currentKind === 'create' && nextKind === 'delete') {
      // CREATE + DELETE → remove both
      current = null;
      currentKind = null;
    } else if (currentKind === 'update' && nextKind === 'delete') {
      // UPDATE + DELETE → single DELETE
      current = next;
      currentKind = 'delete';
    } else if (currentKind === 'delete' && nextKind === 'update') {
      // DELETE + UPDATE → invalid; treat both as events (keep unchanged)
      return [...events, ...states];
    } else {
      // All other combinations (DELETE+DELETE, etc.) keep next
      current = next;
      currentKind = nextKind;
    }
  }

  const compactedStates: CompactableOperation[] = current !== null ? [current] : [];
  return [...events, ...compactedStates];
}

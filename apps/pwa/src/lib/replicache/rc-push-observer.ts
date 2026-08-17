import type { RecebimentoReplicachePushObserver } from '@lilog/replicache-recebimento';

type MutationTrackStatus = 'syncing' | 'error';

type TrackedMutation = {
  id: string;
  demandId: string;
  mutationName: string;
  status: MutationTrackStatus;
  lastAttemptAt: number;
  lastError: string | null;
};

type PushMutation = {
  clientID?: unknown;
  id?: unknown;
  name?: unknown;
  args?: unknown;
};

type PushRequestLike = {
  mutations?: unknown;
};

const CONFERENCE_MUTATION_NAMES = new Set([
  'conferirItem',
  'removerConferencia',
  'adicionarItemManual',
  'removerExpectedItem',
  'recebimento/conferirItem',
  'recebimento/removerConferencia',
  'recebimento/adicionarItemManual',
  'recebimento/removerExpectedItem',
]);

const trackedMutations = new Map<string, TrackedMutation>();

export type RcReplicachePushDemandState = {
  demandId: string;
  syncingCount: number;
  errorCount: number;
  pendingCount: number;
  lastError: string | null;
};

export type RcReplicachePushStateSnapshot = {
  totalPending: number;
  totalSyncing: number;
  totalError: number;
  hasPending: boolean;
  hasSyncing: boolean;
  hasError: boolean;
  demands: RcReplicachePushDemandState[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function getPushMutations(requestBody: unknown): PushMutation[] {
  if (!isObject(requestBody)) {
    return [];
  }

  const maybeRequest = requestBody as PushRequestLike;
  if (!Array.isArray(maybeRequest.mutations)) {
    return [];
  }

  return maybeRequest.mutations.filter((item) => isObject(item)) as PushMutation[];
}

function resolveTrackedEntries(
  requestBody: unknown,
): Array<{ opId: string; demandId: string; mutationName: string }> {
  const mutations = getPushMutations(requestBody);
  const tracked: Array<{ opId: string; demandId: string; mutationName: string }> = [];

  for (const mutation of mutations) {
    const mutationName =
      typeof mutation.name === 'string' ? mutation.name : undefined;
    if (!mutationName || !CONFERENCE_MUTATION_NAMES.has(mutationName)) {
      continue;
    }

    const args = isObject(mutation.args) ? mutation.args : null;
    const demandId =
      args && typeof args.preRecebimentoId === 'string'
        ? args.preRecebimentoId
        : undefined;
    if (!demandId) {
      continue;
    }

    const clientId =
      typeof mutation.clientID === 'string' ? mutation.clientID : 'unknown-client';
    const mutationId =
      typeof mutation.id === 'number' && Number.isFinite(mutation.id)
        ? String(mutation.id)
        : 'unknown-id';
    const opId = `${clientId}:${mutationId}`;

    tracked.push({
      opId,
      demandId,
      mutationName,
    });
  }

  return tracked;
}

function markSyncing(requestBody: unknown): void {
  const entries = resolveTrackedEntries(requestBody);
  const now = Date.now();
  for (const entry of entries) {
    trackedMutations.set(entry.opId, {
      id: entry.opId,
      demandId: entry.demandId,
      mutationName: entry.mutationName,
      status: 'syncing',
      lastAttemptAt: now,
      lastError: null,
    });
  }
}

function markSuccess(requestBody: unknown): void {
  const entries = resolveTrackedEntries(requestBody);
  for (const entry of entries) {
    trackedMutations.delete(entry.opId);
  }
}

function markError(requestBody: unknown, errorMessage: string): void {
  const entries = resolveTrackedEntries(requestBody);
  const now = Date.now();
  for (const entry of entries) {
    trackedMutations.set(entry.opId, {
      id: entry.opId,
      demandId: entry.demandId,
      mutationName: entry.mutationName,
      status: 'error',
      lastAttemptAt: now,
      lastError: errorMessage || 'Erro no push do Replicache',
    });
  }
}

export function createRcReplicachePushObserver(): RecebimentoReplicachePushObserver {
  return {
    onPushStart(requestBody) {
      markSyncing(requestBody);
    },
    onPushSuccess(requestBody) {
      markSuccess(requestBody);
    },
    onPushError(requestBody, errorMessage) {
      markError(requestBody, errorMessage);
    },
  };
}

export function getRcReplicachePushStateSnapshot(): RcReplicachePushStateSnapshot {
  const demandMap = new Map<string, RcReplicachePushDemandState>();

  for (const mutation of trackedMutations.values()) {
    const current = demandMap.get(mutation.demandId) ?? {
      demandId: mutation.demandId,
      syncingCount: 0,
      errorCount: 0,
      pendingCount: 0,
      lastError: null,
    };

    current.pendingCount += 1;
    if (mutation.status === 'syncing') {
      current.syncingCount += 1;
    }
    if (mutation.status === 'error') {
      current.errorCount += 1;
      if (!current.lastError && mutation.lastError) {
        current.lastError = mutation.lastError;
      }
    }

    demandMap.set(mutation.demandId, current);
  }

  const demands = [...demandMap.values()].sort((a, b) => a.demandId.localeCompare(b.demandId));
  const totalPending = demands.reduce((sum, item) => sum + item.pendingCount, 0);
  const totalSyncing = demands.reduce((sum, item) => sum + item.syncingCount, 0);
  const totalError = demands.reduce((sum, item) => sum + item.errorCount, 0);

  return {
    totalPending,
    totalSyncing,
    totalError,
    hasPending: totalPending > 0,
    hasSyncing: totalSyncing > 0,
    hasError: totalError > 0,
    demands,
  };
}

import { getDemanda } from '@lilog/replicache-recebimento';
import type { RecebimentoReplicache } from '@lilog/replicache-recebimento';

import type { ChecklistRecord } from '@/features/recebimento-v2/local-db/schema';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import { hasPendingPhotoUploads } from '@/features/recebimento-v2/services/sync-photo.helpers';
import { getRcReplicachePushStateSnapshot } from '@/lib/replicache/rc-push-observer';

import {
  fetchRcServerDemandStatus,
  hasRcReplicacheServerMismatch,
  isRcServerDemandConferido,
  type RcServerDemandStatus,
} from './rc-server-sync-status';
import {
  getRcSyncRuntimeState,
  scheduleRcFinalizacaoSync,
  type PersistRcFinalizacaoParams,
} from '../services/sync-checklist-photos-rc.service';
import { getRcAvariaPhotoSyncState } from '../services/sync-avaria-photos-rc.service';
import { reconcileRcDemandWithServer } from '../services/rc-replicache-refresh.service';

export type RcSyncPendingDemandSummary = {
  demandId: string;
  checklistSyncStatus?: ChecklistRecord['syncStatus'];
  pendingFinalizationSync?: boolean;
  localFinalizationAttempted?: boolean;
  finalizationServerConfirmed?: boolean;
  needsFinalizationSync: boolean;
  hasPendingPhotos: boolean;
};

export type RcSyncDebugSnapshot = {
  at: string;
  online: boolean;
  replicache: {
    ready: boolean;
    hasInstance: boolean;
  };
  replicachePush: ReturnType<typeof getRcReplicachePushStateSnapshot>;
  runtime: ReturnType<typeof getRcSyncRuntimeState>;
  avariaRuntime: ReturnType<typeof getRcAvariaPhotoSyncState>;
  activeDemandId?: string;
  demand?: {
    preRecebimentoId: string;
    situacao: string;
    dock?: string;
  };
  server?: RcServerDemandStatus | null;
  replicacheVsServerMismatch: boolean;
  dexieChecklist?: {
    syncStatus: ChecklistRecord['syncStatus'];
    pendingFinalizationSync?: boolean;
    localFinalizationAttempted?: boolean;
    finalizationServerConfirmed?: boolean;
    finalizacaoPayload?: PersistRcFinalizacaoParams;
    hasPendingPhotos: boolean;
    needsFinalizationSync: boolean;
    isCompletedUi: boolean;
  };
  pendingDemands: RcSyncPendingDemandSummary[];
  summary: {
    pendingChecklistCount: number;
    pendingFinalizationCount: number;
    pendingConferenceCount: number;
    hasAnyPendingWork: boolean;
    overallStatus: 'offline' | 'syncing' | 'pending' | 'mismatch' | 'ok';
  };
};

function needsRcFinalizationSync(local: ChecklistRecord): boolean {
  if (local.pendingFinalizationSync) {
    return true;
  }

  return Boolean(
    local.localFinalizationAttempted &&
      !local.finalizationServerConfirmed &&
      local.finalizacaoPayload,
  );
}

function checklistHasPendingWork(local: ChecklistRecord): boolean {
  return (
    local.syncStatus === 'pending' ||
    local.syncStatus === 'error' ||
    needsRcFinalizationSync(local)
  );
}

function deriveUiCompleted(input: {
  replicacheSituacao: string | undefined;
  local: ChecklistRecord | undefined;
  serverStatus: RcServerDemandStatus | null | undefined;
}): boolean {
  const { replicacheSituacao, local, serverStatus } = input;

  if (
    hasRcReplicacheServerMismatch({
      replicacheSituacao,
      serverStatus,
    })
  ) {
    return false;
  }

  if (serverStatus && !serverStatus.error && !isRcServerDemandConferido(serverStatus)) {
    return false;
  }

  if (!local) {
    return replicacheSituacao === 'conferido' && isRcServerDemandConferido(serverStatus);
  }

  const hasLocalFinalizationAttempt = Boolean(
    local.localFinalizationAttempted ||
      local.pendingFinalizationSync ||
      local.finalizacaoPayload,
  );
  const needsFinalizationSync = needsRcFinalizationSync(local);
  const isServerFinalizationConfirmed = Boolean(local.finalizationServerConfirmed);

  return (
    replicacheSituacao === 'conferido' &&
    !needsFinalizationSync &&
    (!hasLocalFinalizationAttempt || isServerFinalizationConfirmed) &&
    (!serverStatus || serverStatus.error || isRcServerDemandConferido(serverStatus))
  );
}

async function repairStaleFinalizationFlags(
  demandId: string,
  local: ChecklistRecord,
  serverStatus: RcServerDemandStatus | null,
): Promise<ChecklistRecord> {
  if (!serverStatus || serverStatus.error || serverStatus.isConferido) {
    return local;
  }

  const shouldRepair =
    local.finalizationServerConfirmed ||
    (local.localFinalizationAttempted && !needsRcFinalizationSync(local));

  if (!shouldRepair) {
    return local;
  }

  await recebimentoV2Db.checklists.update(demandId, {
    finalizationServerConfirmed: false,
    pendingFinalizationSync: Boolean(local.finalizacaoPayload),
    localFinalizationAttempted: true,
    updatedAt: Date.now(),
  });

  if (local.finalizacaoPayload) {
    scheduleRcFinalizacaoSync(demandId);
  }

  return (await recebimentoV2Db.checklists.get(demandId)) ?? local;
}

async function buildPendingDemandSummary(
  checklist: ChecklistRecord,
): Promise<RcSyncPendingDemandSummary> {
  const hasPendingPhotos = await hasPendingPhotoUploads(checklist.demandId);

  return {
    demandId: checklist.demandId,
    checklistSyncStatus: checklist.syncStatus,
    pendingFinalizationSync: checklist.pendingFinalizationSync,
    localFinalizationAttempted: checklist.localFinalizationAttempted,
    finalizationServerConfirmed: checklist.finalizationServerConfirmed,
    needsFinalizationSync: needsRcFinalizationSync(checklist),
    hasPendingPhotos,
  };
}

export async function loadRcSyncDebugSnapshot(input: {
  demandId?: string;
  rep: RecebimentoReplicache | null;
  isReady: boolean;
}): Promise<RcSyncDebugSnapshot> {
  const replicachePush = getRcReplicachePushStateSnapshot();
  const runtime = getRcSyncRuntimeState();
  const avariaRuntime = getRcAvariaPhotoSyncState();
  const online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const checklists = await recebimentoV2Db.checklists.toArray();

  const pendingCandidates = checklists.filter((checklist) =>
    checklistHasPendingWork(checklist),
  );
  const pendingDemands = await Promise.all(
    pendingCandidates.map((checklist) => buildPendingDemandSummary(checklist)),
  );

  const pendingChecklistCount = pendingDemands.filter(
    (item) =>
      item.checklistSyncStatus === 'pending' ||
      item.checklistSyncStatus === 'error' ||
      item.hasPendingPhotos,
  ).length;
  const pendingFinalizationCount = pendingDemands.filter(
    (item) => item.needsFinalizationSync,
  ).length;

  const hasRuntimeActivity =
    replicachePush.hasSyncing ||
    runtime.checklistFlushInProgress ||
    runtime.finalizacaoFlushInProgress ||
    runtime.checklistFlushScheduled ||
    runtime.finalizacaoFlushScheduled ||
    avariaRuntime.flushInProgress ||
    avariaRuntime.flushScheduled;

  let demand: RcSyncDebugSnapshot['demand'];
  let dexieChecklist: RcSyncDebugSnapshot['dexieChecklist'];
  let server: RcSyncDebugSnapshot['server'];
  let replicacheVsServerMismatch = false;

  let localChecklist = input.demandId
    ? checklists.find((item) => item.demandId === input.demandId)
    : undefined;

  if (input.demandId && input.rep) {
    const demandView = await input.rep.query((tx) => getDemanda(tx, input.demandId!));
    if (demandView) {
      demand = {
        preRecebimentoId: demandView.preRecebimentoId,
        situacao: demandView.situacao,
        dock: demandView.dock,
      };
    }
  }

  if (input.demandId && online) {
    server = await fetchRcServerDemandStatus(input.demandId);
    replicacheVsServerMismatch = hasRcReplicacheServerMismatch({
      replicacheSituacao: demand?.situacao,
      serverStatus: server,
    });

    if (input.rep && replicacheVsServerMismatch) {
      await reconcileRcDemandWithServer(input.rep, input.demandId);
      try {
        await input.rep.push({ now: true });
      } catch {
        // noop ack best-effort
      }
      const demandView = await input.rep.query((tx) => getDemanda(tx, input.demandId!));
      if (demandView) {
        demand = {
          preRecebimentoId: demandView.preRecebimentoId,
          situacao: demandView.situacao,
          dock: demandView.dock,
        };
      }
      server = await fetchRcServerDemandStatus(input.demandId);
      replicacheVsServerMismatch = hasRcReplicacheServerMismatch({
        replicacheSituacao: demand?.situacao,
        serverStatus: server,
      });
    }

    if (localChecklist && server) {
      localChecklist = await repairStaleFinalizationFlags(
        input.demandId,
        localChecklist,
        server,
      );
    }
  }

  if (input.demandId && localChecklist) {
    const hasPendingPhotos = await hasPendingPhotoUploads(input.demandId);
    const needsFinalizationSync = needsRcFinalizationSync(localChecklist);

    dexieChecklist = {
      syncStatus: localChecklist.syncStatus,
      pendingFinalizationSync: localChecklist.pendingFinalizationSync,
      localFinalizationAttempted: localChecklist.localFinalizationAttempted,
      finalizationServerConfirmed: localChecklist.finalizationServerConfirmed,
      finalizacaoPayload: localChecklist.finalizacaoPayload,
      hasPendingPhotos,
      needsFinalizationSync,
      isCompletedUi: deriveUiCompleted({
        replicacheSituacao: demand?.situacao,
        local: localChecklist,
        serverStatus: server,
      }),
    };
  }

  const hasAnyPendingWork =
    pendingDemands.length > 0 ||
    replicachePush.hasPending ||
    runtime.pendingChecklistDemands.length > 0 ||
    runtime.pendingFinalizacaoDemands.length > 0 ||
    replicacheVsServerMismatch ||
    Boolean(dexieChecklist?.needsFinalizationSync) ||
    (demand?.situacao === 'conferido' &&
      server &&
      !server.error &&
      !isRcServerDemandConferido(server));

  let overallStatus: RcSyncDebugSnapshot['summary']['overallStatus'] = 'ok';
  if (!online) {
    overallStatus = 'offline';
  } else if (replicacheVsServerMismatch) {
    overallStatus = 'mismatch';
  } else if (hasRuntimeActivity) {
    overallStatus = 'syncing';
  } else if (hasAnyPendingWork) {
    overallStatus = 'pending';
  } else if (
    server &&
    !server.error &&
    demand?.situacao === 'conferido' &&
    !isRcServerDemandConferido(server)
  ) {
    overallStatus = 'mismatch';
  }

  return {
    at: new Date().toISOString(),
    online,
    replicache: {
      ready: input.isReady,
      hasInstance: Boolean(input.rep),
    },
    replicachePush,
    runtime,
    avariaRuntime,
    activeDemandId: input.demandId,
    demand,
    server: server ?? null,
    replicacheVsServerMismatch,
    dexieChecklist,
    pendingDemands,
    summary: {
      pendingChecklistCount,
      pendingFinalizationCount,
      pendingConferenceCount: replicachePush.totalPending,
      hasAnyPendingWork,
      overallStatus,
    },
  };
}

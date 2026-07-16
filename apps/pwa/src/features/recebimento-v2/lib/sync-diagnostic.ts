import type { ProcessStatus } from '@lilog/contracts';

import { recebimentoV2Db } from '../local-db/db';
import type {
  ConferenceRecord,
  DemandRecord,
  ProcessRecord,
  SyncOperationRecord,
} from '../local-db/schema';

const ISSUE_STATUSES = new Set<SyncOperationRecord['status']>([
  'retry',
  'rejected',
  'conflict',
  'blocked',
]);

export interface SyncOperationDiagnosticPayload {
  exportedAt: string;
  appVersion: string;
  operation: SyncOperationRecord | null;
  conferenceContext: ConferenceRecord | null;
  processContext: {
    status: ProcessStatus;
    serverRevision: number;
    autoSyncPaused?: boolean;
    lastSyncedAt?: number | null;
  } | null;
}

export interface SyncDemandDiagnosticPayload {
  exportedAt: string;
  appVersion: string;
  demandId: string;
  process: Pick<
    ProcessRecord,
    'status' | 'serverRevision' | 'autoSyncPaused' | 'lastSyncedAt' | 'lastPullAt'
  > | null;
  demand: Pick<DemandRecord, 'status' | 'situacao' | 'fornecedorNome'> | null;
  operations: SyncOperationRecord[];
}

function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION ?? 'unknown';
}

function extractConferenceId(payload: unknown): string | undefined {
  if (typeof payload === 'object' && payload !== null && 'conferenceId' in payload) {
    const id = (payload as { conferenceId?: unknown }).conferenceId;
    return typeof id === 'string' ? id : undefined;
  }

  return undefined;
}

export async function buildOperationDiagnostic(
  operationId: string,
  demandId: string,
): Promise<SyncOperationDiagnosticPayload> {
  const operation = await recebimentoV2Db.syncOperations.get(operationId);
  const conferenceId = operation ? extractConferenceId(operation.payload) : undefined;

  const [conference, process] = await Promise.all([
    conferenceId ? recebimentoV2Db.conferences.get(conferenceId) : null,
    recebimentoV2Db.processes.get(demandId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    appVersion: getAppVersion(),
    operation: operation ?? null,
    conferenceContext: conference ?? null,
    processContext: process
      ? {
          status: process.status,
          serverRevision: process.serverRevision,
          autoSyncPaused: process.autoSyncPaused,
          lastSyncedAt: process.lastSyncedAt ?? null,
        }
      : null,
  };
}

export async function buildDemandDiagnostic(
  demandId: string,
): Promise<SyncDemandDiagnosticPayload> {
  const [ops, process, demand] = await Promise.all([
    recebimentoV2Db.syncOperations
      .where('aggregateId')
      .equals(demandId)
      .filter((op) => ISSUE_STATUSES.has(op.status))
      .toArray(),
    recebimentoV2Db.processes.get(demandId),
    recebimentoV2Db.demands.get(demandId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    appVersion: getAppVersion(),
    demandId,
    process: process
      ? {
          status: process.status,
          serverRevision: process.serverRevision,
          autoSyncPaused: process.autoSyncPaused,
          lastSyncedAt: process.lastSyncedAt,
          lastPullAt: process.lastPullAt,
        }
      : null,
    demand: demand
      ? {
          status: demand.status,
          situacao: demand.situacao,
          fornecedorNome: demand.fornecedorNome,
        }
      : null,
    operations: ops,
  };
}

export function serializeDiagnostic(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}

export async function copyDiagnosticToClipboard(payload: unknown): Promise<void> {
  await navigator.clipboard.writeText(serializeDiagnostic(payload));
}

export async function shareDiagnostic(payload: unknown, title: string): Promise<boolean> {
  const text = serializeDiagnostic(payload);

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return false;
      }
    }
  }

  await copyDiagnosticToClipboard(payload);
  return false;
}

export function downloadDiagnosticJson(payload: unknown, filename: string): void {
  const blob = new Blob([serializeDiagnostic(payload)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

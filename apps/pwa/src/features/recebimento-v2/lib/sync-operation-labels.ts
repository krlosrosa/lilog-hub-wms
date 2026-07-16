import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import type { SyncOperationStatus } from '@lilog/contracts';

import type { ConferenceRecord, SyncOperationRecord } from '../local-db/schema';

export type SyncIssueStatus = 'rejected' | 'retry' | 'conflict' | 'blocked';

export interface SyncIssueOperation {
  id: string;
  opType: string;
  label: string;
  detail?: string;
  status: SyncIssueStatus;
  errorMessage?: string;
  createdAt: number;
}

export interface SyncQueueOperation {
  id: string;
  opType: string;
  label: string;
  detail?: string;
  status: SyncOperationStatus;
  errorMessage?: string;
  attempts: number;
  sequence: number;
  createdAt: number;
}

export interface PendingPhotoOperation {
  id: string;
  ownerType: 'checklist' | 'avaria' | 'impedimento' | 'documento';
  ownerId: string;
  status: 'local' | 'uploading' | 'error';
  filename?: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

const OP_TYPE_LABELS: Record<string, string> = {
  [RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT]: 'Checklist',
  [RECEBIMENTO_V2_OP_TYPES.TEMPERATURA_UPSERT]: 'Temperatura do produto',
  [RECEBIMENTO_V2_OP_TYPES.ITEM_REMOVE_BY_PRODUTO]: 'Remover conferência do produto',
  [RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR]: 'Conferir item',
  [RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE]: 'Remover lote',
  [RECEBIMENTO_V2_OP_TYPES.PALETE_REMOVE]: 'Remover palete',
  [RECEBIMENTO_V2_OP_TYPES.PESAGEM_REMOVE]: 'Remover pesagem',
  [RECEBIMENTO_V2_OP_TYPES.AVARIA_CLEAR]: 'Limpar avarias',
  [RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR]: 'Registrar avaria',
  [RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER]: 'Remover avaria',
  [RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER]: 'Suspender conferência (impedimento)',
  [RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_RETOMAR]: 'Retomar conferência',
  [RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR]: 'Encerrar conferência',
};

export function getSyncOpLabel(opType: string): string {
  return OP_TYPE_LABELS[opType] ?? opType;
}

function conferenceDetail(
  conferenceId: string | undefined,
  conferenceById: Map<string, ConferenceRecord>,
): string | undefined {
  if (!conferenceId) return undefined;

  const conference = conferenceById.get(conferenceId);
  if (!conference) return undefined;

  const parts = [conference.sku ? `SKU ${conference.sku}` : null];
  if (conference.lote) {
    parts.push(`Lote ${conference.lote}`);
  }

  return parts.filter(Boolean).join(' · ') || undefined;
}

export function getSyncOpDetail(
  op: SyncOperationRecord,
  conferenceById: Map<string, ConferenceRecord>,
): string | undefined {
  const payload = (op.payload ?? {}) as Record<string, unknown>;

  switch (op.opType) {
    case RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR:
    case RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE:
      return (
        conferenceDetail(payload.conferenceId as string | undefined, conferenceById) ??
        (payload.sku ? `SKU ${String(payload.sku)}` : undefined) ??
        (payload.lote ? `Lote ${String(payload.lote)}` : undefined) ??
        (payload.loteRecebido ? `Lote ${String(payload.loteRecebido)}` : undefined) ??
        (payload.itemId ? `Item ${String(payload.itemId)}` : undefined) ??
        (payload.produtoId ? `Produto ${String(payload.produtoId)}` : undefined)
      );

    case RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR:
      return payload.sku
        ? `SKU ${String(payload.sku)}`
        : payload.produtoId
          ? `Produto ${String(payload.produtoId)}`
          : undefined;

    case RECEBIMENTO_V2_OP_TYPES.TEMPERATURA_UPSERT:
      return payload.etapa ? `Etapa ${String(payload.etapa)}` : undefined;

    default:
      return undefined;
  }
}

const ISSUE_STATUSES = new Set<SyncIssueStatus>(['rejected', 'retry', 'conflict', 'blocked']);

export function buildSyncIssueOperations(
  ops: SyncOperationRecord[],
  conferenceById: Map<string, ConferenceRecord>,
): SyncIssueOperation[] {
  return ops
    .filter((op): op is SyncOperationRecord & { status: SyncIssueStatus } =>
      ISSUE_STATUSES.has(op.status as SyncIssueStatus),
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((op) => ({
      id: op.id,
      opType: op.opType,
      label: getSyncOpLabel(op.opType),
      detail: getSyncOpDetail(op, conferenceById),
      status: op.status,
      errorMessage: op.errorMessage,
      createdAt: op.createdAt,
    }));
}

const ACTIVE_QUEUE_STATUSES = new Set<SyncOperationStatus>([
  'pending',
  'blocked',
  'syncing',
  'retry',
  'conflict',
  'rejected',
]);

export function buildSyncQueueOperations(
  ops: SyncOperationRecord[],
  conferenceById: Map<string, ConferenceRecord>,
): SyncQueueOperation[] {
  return ops
    .filter((op) => ACTIVE_QUEUE_STATUSES.has(op.status))
    .sort((a, b) => a.sequence - b.sequence || a.createdAt - b.createdAt)
    .map((op) => ({
      id: op.id,
      opType: op.opType,
      label: getSyncOpLabel(op.opType),
      detail: getSyncOpDetail(op, conferenceById),
      status: op.status,
      errorMessage: op.errorMessage,
      attempts: op.attempts,
      sequence: op.sequence,
      createdAt: op.createdAt,
    }));
}

export function getSyncOperationStatusLabel(status: SyncOperationStatus): string {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'blocked':
      return 'Aguardando retomada';
    case 'syncing':
      return 'Enviando';
    case 'retry':
      return 'Aguardando nova tentativa';
    case 'conflict':
      return 'Conflito';
    case 'rejected':
      return 'Rejeitada';
    case 'synced':
      return 'Sincronizada';
    default:
      return status;
  }
}

export function getSyncIssueStatusLabel(status: SyncIssueStatus): string {
  return getSyncOperationStatusLabel(status);
}

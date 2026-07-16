import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Image,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { formatBytes } from '@/lib/images/photo-debug-log';

import type { UseSyncStatusV2Result } from '../hooks/use-sync-status-v2';
import { formatSyncIssueErrorMessage } from '../lib/sync-conferencia-bloqueada';
import {
  getSyncOperationStatusLabel,
  type PendingPhotoOperation,
  type SyncQueueOperation,
} from '../lib/sync-operation-labels';
import {
  hasVisibleSyncIssues,
  isAutoSyncPausedWithWork,
} from '../lib/sync-status-issues';
import { dismissSyncOperation } from '../services/repair-sync-operations.service';

interface SyncStatusV2Props {
  syncStatus: UseSyncStatusV2Result;
  onSync?: () => void;
  onPull?: () => void;
  onDismissPendingPhotos?: () => void | Promise<void>;
  onReabrir?: () => void;
  canReabrir?: boolean;
  isReabrindo?: boolean;
  reabrirHint?: string | null;
  isPulling?: boolean;
  pullDisabled?: boolean;
  className?: string;
}

const PHOTO_OWNER_LABELS: Record<PendingPhotoOperation['ownerType'], string> = {
  checklist: 'Checklist',
  avaria: 'Avaria',
  impedimento: 'Impedimento',
  documento: 'Documento',
};

function formatRelativeTime(value: number | string | null, fallback: string): string {
  if (!value) return fallback;
  const ts = typeof value === 'string' ? new Date(value).getTime() : value;
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Agora há pouco';
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h}h`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function getQueueItemTone(status: SyncQueueOperation['status']): string {
  switch (status) {
    case 'rejected':
    case 'conflict':
      return 'border-destructive/20 bg-destructive/5';
    case 'retry':
    case 'blocked':
      return 'border-warning/30 bg-warning/5';
    case 'syncing':
      return 'border-secondary/30 bg-secondary/8';
    default:
      return 'border-outline-variant/60 bg-surface/80';
  }
}

function getPhotoStatusLabel(status: PendingPhotoOperation['status']): string {
  switch (status) {
    case 'uploading':
      return 'Enviando';
    case 'error':
      return 'Erro no envio';
    default:
      return 'Pendente';
  }
}

function QueueOperationCard({ operation }: { operation: SyncQueueOperation }) {
  const isIssue = operation.status === 'rejected' || operation.status === 'conflict';

  return (
    <div className={cn('rounded-md border px-2.5 py-2', getQueueItemTone(operation.status))}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-label-sm font-medium text-on-surface">
            #{operation.sequence} · {operation.label}
            {operation.detail ? ` · ${operation.detail}` : ''}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {getSyncOperationStatusLabel(operation.status)}
            {operation.attempts > 0 ? ` · ${operation.attempts} tentativa(s)` : ''}
            {' · '}
            {formatRelativeTime(operation.createdAt, '—')}
          </p>
        </div>
      </div>
      {operation.errorMessage ? (
        <p className="mt-1 text-[11px] leading-relaxed text-destructive">
          {formatSyncIssueErrorMessage(operation.errorMessage)}
        </p>
      ) : null}
      {isIssue || operation.status === 'retry' || operation.status === 'blocked' ? (
        <button
          type="button"
          onClick={() => void dismissSyncOperation(operation.id)}
          className="mt-2 text-[11px] font-medium text-muted-foreground underline touch-manipulation"
        >
          Descartar
        </button>
      ) : null}
    </div>
  );
}

function PendingPhotoCard({ photo }: { photo: PendingPhotoOperation }) {
  return (
    <div
      className={cn(
        'rounded-md border px-2.5 py-2',
        photo.status === 'error'
          ? 'border-destructive/20 bg-destructive/5'
          : photo.status === 'uploading'
            ? 'border-secondary/30 bg-secondary/8'
            : 'border-outline-variant/60 bg-surface/80',
      )}
    >
      <div className="flex items-start gap-2">
        <Image className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-label-sm font-medium text-on-surface">
            {PHOTO_OWNER_LABELS[photo.ownerType] ?? photo.ownerType}
            {photo.filename ? ` · ${photo.filename}` : ''}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {getPhotoStatusLabel(photo.status)} · {formatBytes(photo.sizeBytes)} ·{' '}
            {formatRelativeTime(photo.createdAt, '—')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SyncStatusV2({
  syncStatus,
  onSync,
  onPull,
  onDismissPendingPhotos,
  onReabrir,
  canReabrir = false,
  isReabrindo = false,
  reabrirHint = null,
  isPulling = false,
  pullDisabled = false,
  className,
}: SyncStatusV2Props) {
  const {
    pendingCount,
    conflictCount,
    rejectedCount,
    retryCount,
    blockedCount,
    pendingPhotoCount,
    photoErrorCount,
    queueOperations,
    pendingPhotos,
    isSyncing,
    isAutoSyncPaused,
    lastSyncedAt,
    lastPullAt,
  } = syncStatus;

  const busy = isSyncing || isPulling || isReabrindo;
  const issueCounts = {
    pendingCount,
    pendingPhotoCount,
    conflictCount,
    rejectedCount,
    retryCount,
    blockedCount,
    photoErrorCount,
    isAutoSyncPaused,
  };
  const hasIssues = hasVisibleSyncIssues(issueCounts);
  const isClean =
    queueOperations.length === 0 && pendingPhotos.length === 0 && !hasIssues;
  const showRetryButton = isAutoSyncPausedWithWork(issueCounts);
  const totalQueueItems = queueOperations.length + pendingPhotos.length;

  const statusLabel = (() => {
    if (isPulling) return 'Atualizando do servidor...';
    if (isSyncing) return 'Sincronizando...';
    if (isAutoSyncPausedWithWork(issueCounts)) {
      return 'Sincronização pausada após 3 tentativas';
    }
    if (isClean) return 'Tudo sincronizado';
    if (hasIssues) return 'Fila com pendências que precisam de atenção';
    return `${totalQueueItems} item(ns) na fila`;
  })();

  const subtitle = onPull
    ? `Enviado: ${formatRelativeTime(lastSyncedAt, 'nunca')} · Baixado: ${formatRelativeTime(lastPullAt, 'nunca')}`
    : formatRelativeTime(lastSyncedAt, 'Nunca sincronizado');

  return (
    <div
      className={cn(
        'rounded-lg border',
        hasIssues
          ? 'border-destructive/30 bg-destructive/8'
          : isClean
            ? 'border-outline-variant bg-surface-container/50'
            : 'border-secondary/30 bg-secondary/8',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {busy ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-secondary" aria-hidden />
        ) : hasIssues ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
        ) : isClean ? (
          <CheckCircle className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
        ) : (
          <Clock className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-label-sm font-medium text-on-surface">{statusLabel}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {onPull && !busy && (
            <button
              type="button"
              onClick={onPull}
              disabled={pullDisabled}
              className="flex items-center gap-1 rounded-md border border-outline-variant bg-surface px-2.5 py-1.5 text-label-sm font-medium text-on-surface touch-manipulation transition-transform active:scale-95 disabled:opacity-50"
              aria-label="Atualizar do servidor"
              title="Baixar conferências, avarias e checklist do servidor"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Atualizar
            </button>
          )}

          {onSync && !busy && showRetryButton && (
            <button
              type="button"
              onClick={onSync}
              className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1.5 text-label-sm font-medium text-destructive-foreground touch-manipulation transition-transform active:scale-95"
              aria-label="Tentar sincronizar novamente"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Tentar novamente
            </button>
          )}

          {onSync && !busy && !showRetryButton && totalQueueItems > 0 && (
            <button
              type="button"
              onClick={onSync}
              className="flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-label-sm font-medium text-on-secondary touch-manipulation transition-transform active:scale-95"
              aria-label="Enviar alterações locais"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Enviar
            </button>
          )}
        </div>
      </div>

      {queueOperations.length > 0 ? (
        <div className="space-y-2 border-t border-outline-variant/60 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Operações ({queueOperations.length})
          </p>
          {queueOperations.map((operation) => (
            <QueueOperationCard key={operation.id} operation={operation} />
          ))}
        </div>
      ) : null}

      {pendingPhotos.length > 0 ? (
        <div className="space-y-2 border-t border-outline-variant/60 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Fotos ({pendingPhotos.length})
          </p>
          {pendingPhotos.map((photo) => (
            <PendingPhotoCard key={photo.id} photo={photo} />
          ))}
          {onDismissPendingPhotos ? (
            <>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {photoErrorCount > 0
                  ? 'Algumas fotos falharam no envio ou estão aguardando a sincronização das avarias.'
                  : 'Fotos locais ainda não enviadas ao servidor.'}{' '}
                Descarte-as aqui se não precisar mais das evidências.
              </p>
              <button
                type="button"
                onClick={() => void onDismissPendingPhotos()}
                disabled={busy}
                className="text-[11px] font-medium text-destructive underline touch-manipulation disabled:opacity-50"
              >
                Descartar todas as fotos pendentes
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {reabrirHint ? (
        <div className="border-t border-destructive/20 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-destructive">{reabrirHint}</p>
          {canReabrir && onReabrir ? (
            <button
              type="button"
              onClick={onReabrir}
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-label-sm font-medium text-on-secondary touch-manipulation transition-transform active:scale-95 disabled:opacity-50"
            >
              {isReabrindo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              )}
              Reabrir conferência
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

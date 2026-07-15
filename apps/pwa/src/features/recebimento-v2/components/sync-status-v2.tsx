import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

import type { UseSyncStatusV2Result } from '../hooks/use-sync-status-v2';
import { getSyncIssueStatusLabel } from '../lib/sync-operation-labels';
import { dismissSyncOperation } from '../services/repair-sync-operations.service';

interface SyncStatusV2Props {
  syncStatus: UseSyncStatusV2Result;
  onSync?: () => void;
  onPull?: () => void;
  isPulling?: boolean;
  pullDisabled?: boolean;
  className?: string;
}

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

export function SyncStatusV2({
  syncStatus,
  onSync,
  onPull,
  isPulling = false,
  pullDisabled = false,
  className,
}: SyncStatusV2Props) {
  const [issuesExpanded, setIssuesExpanded] = useState(true);
  const {
    pendingCount,
    conflictCount,
    rejectedCount,
    retryCount,
    blockedCount,
    pendingPhotoCount,
    photoErrorCount,
    issueOperations,
    isSyncing,
    isAutoSyncPaused,
    lastSyncedAt,
    lastPullAt,
  } = syncStatus;

  const busy = isSyncing || isPulling;
  const hasIssues =
    isAutoSyncPaused ||
    conflictCount > 0 ||
    rejectedCount > 0 ||
    retryCount > 0 ||
    blockedCount > 0 ||
    photoErrorCount > 0;
  const isClean = pendingCount === 0 && pendingPhotoCount === 0 && !hasIssues;
  const showRetryButton =
    isAutoSyncPaused && (retryCount > 0 || pendingCount > 0 || pendingPhotoCount > 0);

  const statusLabel = (() => {
    if (isPulling) return 'Atualizando do servidor...';
    if (isSyncing) return 'Sincronizando...';
    if (isAutoSyncPaused) return 'Sincronização pausada após 3 tentativas';
    if (hasIssues) {
      const parts: string[] = [];
      if (conflictCount > 0) parts.push(`${conflictCount} conflito(s)`);
      if (rejectedCount > 0) parts.push(`${rejectedCount} rejeitado(s)`);
      if (retryCount > 0) parts.push(`${retryCount} em retry`);
      if (blockedCount > 0) parts.push(`${blockedCount} aguardando retomada`);
      if (photoErrorCount > 0) parts.push(`${photoErrorCount} foto(s) com erro`);
      return parts.join(' · ');
    }
    if (isClean) return 'Tudo sincronizado';
    if (pendingCount > 0 && pendingPhotoCount > 0) {
      return `${pendingCount} operação(ões) · ${pendingPhotoCount} foto(s) pendente(s)`;
    }
    if (pendingPhotoCount > 0) return `${pendingPhotoCount} foto(s) pendente(s)`;
    return `${pendingCount} operação(ões) pendente(s)`;
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

        {issueOperations.length > 0 && (
          <button
            type="button"
            onClick={() => setIssuesExpanded((prev) => !prev)}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-destructive touch-manipulation"
            aria-expanded={issuesExpanded}
            aria-label={issuesExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
          >
            Detalhes
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', issuesExpanded && 'rotate-180')}
              aria-hidden
            />
          </button>
        )}

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

          {onSync && !busy && !showRetryButton && (pendingCount > 0 || pendingPhotoCount > 0) && (
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

      {issuesExpanded && issueOperations.length > 0 && (
        <div className="space-y-2 border-t border-destructive/20 px-3 py-2.5">
          {issueOperations.map((issue) => (
            <div
              key={issue.id}
              className="rounded-md border border-destructive/20 bg-surface/80 px-2.5 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-label-sm font-medium text-on-surface">
                    {issue.label}
                    {issue.detail ? ` · ${issue.detail}` : ''}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {getSyncIssueStatusLabel(issue.status)}
                  </p>
                </div>
              </div>
              {issue.errorMessage ? (
                <p className="mt-1 text-[11px] leading-relaxed text-destructive">
                  {issue.errorMessage}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void dismissSyncOperation(issue.id)}
                className="mt-2 text-[11px] font-medium text-muted-foreground underline touch-manipulation"
              >
                Descartar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

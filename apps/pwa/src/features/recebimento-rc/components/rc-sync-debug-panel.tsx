import { cn } from '@lilog/ui';
import { useRouterState } from '@tanstack/react-router';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CloudUpload,
  Copy,
  Download,
  Inbox,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { hapticLight } from '@/lib/haptics';
import { useReplicache } from '@/lib/replicache/hooks';

import {
  loadRcSyncDebugSnapshot,
  type RcSyncDebugSnapshot,
} from '../lib/rc-sync-debug';
import { syncRcDemandaCompleta } from '../services/rc-replicache-refresh.service';
import {
  discardRcAvariaPhotoQueueForDemand,
  flushPendingRcAvariaPhotoSync,
} from '../services/sync-avaria-photos-rc.service';
import {
  discardRcSyncQueueForDemand,
  flushPendingRcChecklistPhotoSync,
  flushPendingRcFinalizacaoSync,
  syncRcChecklistPhotos,
  syncRcFinalizacaoPendente,
} from '../services/sync-checklist-photos-rc.service';

const STATUS_LABEL: Record<
  RcSyncDebugSnapshot['summary']['overallStatus'],
  { label: string; dotClass: string }
> = {
  offline: { label: 'Offline', dotClass: 'bg-outline' },
  syncing: { label: 'Sincronizando', dotClass: 'bg-secondary animate-pulse' },
  pending: { label: 'Pendente', dotClass: 'bg-warning' },
  mismatch: { label: 'Divergente', dotClass: 'bg-error animate-pulse' },
  ok: { label: 'Em dia', dotClass: 'bg-tertiary' },
};

const REASON_CHIP: Record<string, { icon: typeof ClipboardCheck; className: string }> = {
  checklist: {
    icon: ClipboardCheck,
    className: 'bg-secondary-container text-on-secondary-container',
  },
  finalização: {
    icon: Zap,
    className: 'bg-tertiary-container text-on-tertiary-container',
  },
  'fotos checklist': {
    icon: Camera,
    className: 'bg-primary-container text-on-primary-container',
  },
  'fila checklist': {
    icon: ClipboardCheck,
    className: 'bg-secondary-container/80 text-on-secondary-container',
  },
  'fila finalização': {
    icon: Zap,
    className: 'bg-tertiary-container/80 text-on-tertiary-container',
  },
  'fotos avaria': {
    icon: AlertTriangle,
    className: 'bg-error-container text-on-error-container',
  },
  'conferência (replicache)': {
    icon: CloudUpload,
    className: 'bg-secondary-container text-on-secondary-container',
  },
  'conferência (erro push)': {
    icon: AlertTriangle,
    className: 'bg-error-container text-on-error-container',
  },
};

type RcSyncDebugPanelProps = {
  className?: string;
  defaultExpanded?: boolean;
  variant?: 'bar' | 'page';
};

type QueueItem = {
  demandId: string;
  reasons: string[];
};

const NON_DISCARDABLE_REASONS = new Set([
  'conferência (replicache)',
  'conferência (erro push)',
]);

function canDiscardQueueItem(item: QueueItem): boolean {
  return item.reasons.some((reason) => !NON_DISCARDABLE_REASONS.has(reason));
}

function shortId(id: string | undefined): string {
  if (!id) {
    return '—';
  }

  return id.length <= 10 ? id : `${id.slice(0, 8)}…`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
  return value != null && UUID_RE.test(value);
}

function StatusRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const valueClass =
    tone === 'success'
      ? 'text-tertiary'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'danger'
          ? 'text-error'
          : 'text-on-surface';

  return (
    <div className="flex items-center justify-between gap-2 text-label-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className={cn('font-medium tabular-nums', valueClass)}>{value}</span>
    </div>
  );
}

function useActiveRcDemandId(): string | undefined {
  return useRouterState({
    select: (state) => {
      const match = state.location.pathname.match(/\/recebimento-rc\/([^/]+)/);
      const id = match?.[1];
      if (!id || id === 'route' || !isUuid(id)) {
        return undefined;
      }
      return id;
    },
  });
}

function ReasonChip({ reason }: { reason: string }) {
  const meta = REASON_CHIP[reason] ?? {
    icon: Inbox,
    className: 'bg-surface-container text-on-surface-variant',
  };
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        meta.className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {reason}
    </span>
  );
}

function PageStatCard({
  label,
  value,
  highlight,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  icon: typeof Inbox;
}) {
  return (
    <article
      className={cn(
        'rounded-xl border p-3 shadow-sm',
        highlight
          ? 'border-warning/40 bg-warning-container/30'
          : 'border-outline-variant/60 bg-surface',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            highlight
              ? 'bg-warning/15 text-warning'
              : 'bg-surface-container text-on-surface-variant',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <p
          className={cn(
            'font-mono text-headline-sm font-bold tabular-nums leading-none',
            highlight ? 'text-warning' : 'text-on-surface',
          )}
        >
          {value}
        </p>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-wide text-on-surface-variant">{label}</p>
    </article>
  );
}

function PageQueueCard({
  item,
  disabled,
  canDiscard,
  onSync,
  onDiscard,
}: {
  item: QueueItem;
  disabled: boolean;
  canDiscard: boolean;
  onSync: () => void;
  onDiscard: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant/70 bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/50 bg-surface-container/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-on-surface-variant">Demanda</p>
          <p className="truncate font-mono text-label-md font-semibold text-on-surface">
            {shortId(item.demandId)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-warning-container px-2 py-0.5 text-[10px] font-semibold text-on-warning-container">
          {item.reasons.length} fila{item.reasons.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
        {item.reasons.map((reason) => (
          <ReasonChip key={reason} reason={reason} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/50 bg-surface-container/20 p-2.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onSync}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-secondary text-label-sm font-semibold text-on-secondary touch-manipulation active:scale-[0.98] disabled:opacity-50"
        >
          <Upload className="h-4 w-4" aria-hidden />
          Sync
        </button>
        <button
          type="button"
          disabled={disabled || !canDiscard}
          onClick={onDiscard}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-error/40 bg-error-container/20 text-label-sm font-semibold text-error touch-manipulation active:scale-[0.98] disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {canDiscard ? 'Excluir' : 'Gerenciado pelo Replicache'}
        </button>
      </div>
    </article>
  );
}

function PageActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  busy,
  primary,
  danger,
}: {
  label: string;
  icon: typeof RefreshCw;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => {
        hapticLight();
        onClick();
      }}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-label-sm font-semibold touch-manipulation active:scale-[0.98] disabled:opacity-50',
        primary && 'bg-secondary text-on-secondary shadow-sm',
        danger &&
          'border border-error/40 bg-error-container/20 text-error',
        !primary && !danger && 'border border-outline-variant/70 bg-surface text-on-surface',
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Icon className="h-4 w-4" aria-hidden />
      )}
      {label}
    </button>
  );
}

export function RcSyncDebugPanel({
  className,
  defaultExpanded = false,
  variant = 'bar',
}: RcSyncDebugPanelProps) {
  const isPage = variant === 'page';
  const { rep, isReady } = useReplicache();
  const activeDemandId = useActiveRcDemandId();
  const [expanded, setExpanded] = useState(defaultExpanded || isPage);
  const [snapshot, setSnapshot] = useState<RcSyncDebugSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await loadRcSyncDebugSnapshot({
        demandId: activeDemandId,
        rep,
        isReady,
      });
      setSnapshot(next);
    } finally {
      setIsLoading(false);
    }
  }, [activeDemandId, isReady, rep]);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [refresh]);

  const statusMeta = snapshot
    ? STATUS_LABEL[snapshot.summary.overallStatus]
    : STATUS_LABEL.pending;

  const mismatchHint = useMemo(() => {
    if (!snapshot?.demand || !snapshot.dexieChecklist) {
      return null;
    }

    if (
      snapshot.demand.situacao === 'conferido' &&
      !snapshot.dexieChecklist.isCompletedUi
    ) {
      return 'Replicache conferido, servidor ainda não confirmou';
    }

    if (
      snapshot.demand.situacao !== 'conferido' &&
      snapshot.dexieChecklist.localFinalizationAttempted
    ) {
      return 'Finalização local aguardando servidor';
    }

    return null;
  }, [snapshot]);

  const queueItems = useMemo<QueueItem[]>(() => {
    if (!snapshot) {
      return [];
    }

    const map = new Map<string, Set<string>>();
    const ensure = (demandId: string) => {
      const current = map.get(demandId) ?? new Set<string>();
      map.set(demandId, current);
      return current;
    };

    for (const item of snapshot.pendingDemands) {
      const reasons = ensure(item.demandId);
      if (
        item.checklistSyncStatus === 'pending' ||
        item.checklistSyncStatus === 'error'
      ) {
        reasons.add('checklist');
      }
      if (item.needsFinalizationSync) {
        reasons.add('finalização');
      }
      if (item.hasPendingPhotos) {
        reasons.add('fotos checklist');
      }
    }

    for (const demandId of snapshot.runtime.pendingChecklistDemands) {
      ensure(demandId).add('fila checklist');
    }
    for (const demandId of snapshot.runtime.pendingFinalizacaoDemands) {
      ensure(demandId).add('fila finalização');
    }
    for (const demandId of snapshot.avariaRuntime.pendingDemands) {
      ensure(demandId).add('fotos avaria');
    }
    for (const demand of snapshot.replicachePush.demands) {
      const reasons = ensure(demand.demandId);
      if (demand.errorCount > 0) {
        reasons.add('conferência (erro push)');
      } else if (demand.pendingCount > 0) {
        reasons.add('conferência (replicache)');
      }
    }

    return [...map.entries()]
      .map(([demandId, reasons]) => ({ demandId, reasons: [...reasons] }))
      .sort((a, b) => a.demandId.localeCompare(b.demandId));
  }, [snapshot]);

  async function runAction(
    label: string,
    action: () => Promise<void>,
    options?: { successMessage?: string },
  ) {
    hapticLight();
    setIsBusy(true);
    setLastAction(`${label}…`);
    try {
      await action();
      setLastAction(`${label} — ok`);
      toast.success(options?.successMessage ?? label);
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro';
      setLastAction(`${label} — erro`);
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCopy() {
    if (!snapshot) {
      return;
    }

    hapticLight();
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  }

  async function handleDiscardQueue(demandId: string) {
    if (
      !confirm(
        `Descartar filas da demanda ${shortId(demandId)}?\n\nIsso limpa checklist/finalização/fotos pendentes locais desta demanda.`,
      )
    ) {
      return;
    }

    await runAction(
      `Descartar fila ${shortId(demandId)}`,
      async () => {
        await discardRcSyncQueueForDemand(demandId, {
          clearChecklistSync: true,
          clearFinalizacaoSync: true,
          clearChecklistPhotos: true,
        });
        await discardRcAvariaPhotoQueueForDemand(demandId, {
          clearPersisted: true,
        });
      },
      { successMessage: `Fila descartada: ${shortId(demandId)}` },
    );
  }

  async function handleSyncDemand(demandId: string) {
    if (!rep) {
      return;
    }

    await runAction(
      `Sync ${shortId(demandId)}`,
      async () => {
        const result = await syncRcDemandaCompleta(rep, demandId);
        if (!result.ok) {
          throw new Error(result.message);
        }
      },
      { successMessage: `Demanda sincronizada: ${shortId(demandId)}` },
    );
  }

  const actionButtons = (
    <>
      <PageActionButton
        label="Atualizar"
        icon={RefreshCw}
        onClick={() => void refresh()}
        disabled={isBusy}
        busy={isLoading}
      />
      <PageActionButton
        label="Flush filas"
        icon={Zap}
        onClick={() =>
          void runAction('Flush filas', async () => {
            await flushPendingRcChecklistPhotoSync();
            await flushPendingRcFinalizacaoSync();
            await flushPendingRcAvariaPhotoSync();
          })
        }
        disabled={isBusy || !rep}
        busy={isBusy}
      />
      <PageActionButton
        label="Push"
        icon={Upload}
        onClick={() =>
          void runAction('Push', async () => {
            await rep!.push({ now: true });
          })
        }
        disabled={isBusy || !rep}
      />
      <PageActionButton
        label="Pull"
        icon={Download}
        onClick={() =>
          void runAction('Pull', async () => {
            await rep!.pull({ now: true });
          })
        }
        disabled={isBusy || !rep}
      />
      {activeDemandId && rep ? (
        <PageActionButton
          label="Sync demanda ativa"
          icon={CloudUpload}
          primary
          onClick={() =>
            void runAction('Sync demanda', async () => {
              await syncRcChecklistPhotos(rep, activeDemandId);
              await syncRcFinalizacaoPendente(rep, activeDemandId);
              await rep.push({ now: true });
              await rep.pull({ now: true });
            })
          }
          disabled={isBusy}
        />
      ) : null}
      <PageActionButton
        label={copied ? 'Copiado' : 'Copiar JSON'}
        icon={Copy}
        onClick={() => void handleCopy()}
        disabled={!snapshot}
      />
    </>
  );

  if (isPage) {
    return (
      <div className={cn('flex flex-col gap-5', className)}>
        <section className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-gradient-to-br from-primary-container/40 via-surface to-surface-container-low shadow-sm">
          <div className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn('h-3 w-3 shrink-0 rounded-full', statusMeta.dotClass)}
                  aria-hidden
                />
                <div>
                  <p className="text-title-sm font-semibold text-on-surface">{statusMeta.label}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {snapshot?.summary.hasAnyPendingWork
                      ? `${queueItems.length} demanda(s) com fila`
                      : 'Nenhuma pendência detectada'}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm font-semibold',
                  snapshot?.online
                    ? 'bg-success-container text-on-success-container'
                    : 'bg-error-container text-on-error-container',
                )}
              >
                {snapshot?.online ? (
                  <Wifi className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" aria-hidden />
                )}
                {snapshot?.online ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <PageStatCard
                label="Filas pendentes"
                value={queueItems.length}
                highlight={queueItems.length > 0}
                icon={Inbox}
              />
              <PageStatCard
                label="Replicache"
                value={snapshot?.replicache.ready ? 'Pronto' : 'Aguardando'}
                icon={CloudUpload}
              />
              <PageStatCard
                label="Conferências (Rep)"
                value={snapshot?.summary.pendingConferenceCount ?? 0}
                highlight={(snapshot?.summary.pendingConferenceCount ?? 0) > 0}
                icon={CloudUpload}
              />
              <PageStatCard
                label="Checklist"
                value={snapshot?.runtime.pendingChecklistDemands.length ?? 0}
                icon={ClipboardCheck}
              />
              <PageStatCard
                label="Avaria fotos"
                value={snapshot?.avariaRuntime.pendingDemands.length ?? 0}
                icon={Camera}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-title-sm font-semibold text-on-surface">Filas por demanda</h2>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" aria-hidden />
            ) : null}
          </div>

          {queueItems.length > 0 ? (
            <div className="grid gap-3">
              {queueItems.map((item) => (
                <PageQueueCard
                  key={item.demandId}
                  item={item}
                  disabled={isBusy || !rep}
                  canDiscard={canDiscardQueueItem(item)}
                  onSync={() => void handleSyncDemand(item.demandId)}
                  onDiscard={() => void handleDiscardQueue(item.demandId)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container/30 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-container/60">
                <CheckCircle2 className="h-7 w-7 text-on-success-container" aria-hidden />
              </div>
              <div>
                <p className="text-body-md font-semibold text-on-surface">Tudo sincronizado</p>
                <p className="mt-1 max-w-xs text-label-sm text-on-surface-variant">
                  Nenhuma fila local pendente. As alterações serão enviadas automaticamente quando
                  houver conexão.
                </p>
              </div>
            </div>
          )}
        </section>

        {activeDemandId ? (
          <section className="rounded-xl border border-outline-variant/70 bg-surface p-3 shadow-sm">
            <p className="mb-2 text-label-sm font-semibold text-on-surface">
              Demanda ativa · {shortId(activeDemandId)}
            </p>
            <div className="grid gap-1">
              <StatusRow
                label="Situação (Rep)"
                value={snapshot?.demand?.situacao ?? '—'}
                tone={snapshot?.demand?.situacao === 'conferido' ? 'success' : 'warning'}
              />
              <StatusRow
                label="UI concluída"
                value={snapshot?.dexieChecklist?.isCompletedUi ? 'Sim' : 'Não'}
                tone={snapshot?.dexieChecklist?.isCompletedUi ? 'success' : 'warning'}
              />
              <StatusRow
                label="Finalização pendente"
                value={snapshot?.dexieChecklist?.needsFinalizationSync ? 'Sim' : 'Não'}
                tone={snapshot?.dexieChecklist?.needsFinalizationSync ? 'warning' : 'neutral'}
              />
            </div>
            {mismatchHint ? (
              <p className="mt-2 rounded-lg bg-warning-container/40 px-2.5 py-1.5 text-label-sm text-on-warning-container">
                {mismatchHint}
              </p>
            ) : null}
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 text-title-sm font-semibold text-on-surface">Ações rápidas</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{actionButtons}</div>
          {lastAction ? (
            <p className="mt-2 text-label-sm text-on-surface-variant">Última ação: {lastAction}</p>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <section
      className={cn(
        'border-t border-outline-variant/80 bg-surface-container-low/95 backdrop-blur-md',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => {
          hapticLight();
          setExpanded((value) => !value);
        }}
        className="flex w-full items-center gap-2 px-margin-mobile py-2.5 text-left touch-manipulation"
      >
        <span
          className={cn('h-2.5 w-2.5 shrink-0 rounded-full', statusMeta.dotClass)}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-label-md font-semibold text-on-surface">Sync RC</p>
          <p className="truncate text-label-sm text-on-surface-variant">
            {statusMeta.label}
            {queueItems.length > 0
              ? ` · ${queueItems.length} demanda(s) na fila`
              : ' · nada pendente'}
          </p>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-on-surface-variant" />
        ) : expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-on-surface-variant" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-outline-variant/60 px-margin-mobile pb-3 pt-2">
          <div className="grid gap-1 rounded-lg border border-outline-variant/70 bg-surface/70 p-2.5">
            <StatusRow
              label="Internet"
              value={snapshot?.online ? 'Online' : 'Offline'}
              tone={snapshot?.online ? 'success' : 'danger'}
            />
            <StatusRow
              label="Replicache"
              value={
                snapshot?.replicache.ready
                  ? 'Pronto'
                  : snapshot?.replicache.hasInstance
                    ? 'Inicializando'
                    : 'Indisponível'
              }
              tone={snapshot?.replicache.ready ? 'success' : 'warning'}
            />
            <StatusRow
              label="Fila checklist"
              value={String(snapshot?.runtime.pendingChecklistDemands.length ?? 0)}
              tone={
                (snapshot?.runtime.pendingChecklistDemands.length ?? 0) > 0
                  ? 'warning'
                  : 'neutral'
              }
            />
            <StatusRow
              label="Fila finalização"
              value={String(snapshot?.runtime.pendingFinalizacaoDemands.length ?? 0)}
              tone={
                (snapshot?.runtime.pendingFinalizacaoDemands.length ?? 0) > 0
                  ? 'warning'
                  : 'neutral'
              }
            />
            <StatusRow
              label="Fila avaria fotos"
              value={String(snapshot?.avariaRuntime.pendingDemands.length ?? 0)}
              tone={
                (snapshot?.avariaRuntime.pendingDemands.length ?? 0) > 0
                  ? 'warning'
                  : 'neutral'
              }
            />
            <StatusRow
              label="Fila conferência (Rep)"
              value={String(snapshot?.summary.pendingConferenceCount ?? 0)}
              tone={
                (snapshot?.summary.pendingConferenceCount ?? 0) > 0
                  ? 'warning'
                  : 'neutral'
              }
            />
          </div>

          {activeDemandId ? (
            <div className="rounded-lg border border-outline-variant/70 bg-surface/70 p-2.5">
              <p className="mb-1.5 text-label-sm font-semibold text-on-surface">
                Demanda ativa · {shortId(activeDemandId)}
              </p>
              <div className="grid gap-1">
                <StatusRow
                  label="Situação (Rep)"
                  value={snapshot?.demand?.situacao ?? '—'}
                  tone={
                    snapshot?.demand?.situacao === 'conferido' ? 'success' : 'warning'
                  }
                />
                <StatusRow
                  label="UI concluída"
                  value={snapshot?.dexieChecklist?.isCompletedUi ? 'Sim' : 'Não'}
                  tone={snapshot?.dexieChecklist?.isCompletedUi ? 'success' : 'warning'}
                />
              </div>
              {mismatchHint ? (
                <p className="mt-2 rounded-md bg-warning/10 px-2 py-1 text-label-sm text-warning">
                  {mismatchHint}
                </p>
              ) : null}
            </div>
          ) : null}

          {queueItems.length > 0 ? (
            <div className="rounded-lg border border-outline-variant/70 bg-surface/70 p-2.5">
              <p className="mb-1.5 text-label-sm font-semibold text-on-surface">Filas pendentes</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-label-sm">
                {queueItems.map((item) => (
                  <li
                    key={item.demandId}
                    className="space-y-1 rounded-md bg-surface-container/60 px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[11px]">
                        {shortId(item.demandId)}
                      </span>
                      <span className="truncate text-[11px] text-on-surface-variant">
                        {item.reasons.join(' · ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={isBusy || !rep}
                        onClick={() => void handleSyncDemand(item.demandId)}
                        className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface px-2 py-1 text-[11px] disabled:opacity-50"
                      >
                        <Upload className="h-3 w-3" />
                        Sync
                      </button>
                      {canDiscardQueueItem(item) ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleDiscardQueue(item.demandId)}
                          className="inline-flex items-center gap-1 rounded-full border border-error/40 bg-error/10 px-2 py-1 text-[11px] text-error disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Excluir fila
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {lastAction ? (
            <p className="text-label-sm text-on-surface-variant">Última ação: {lastAction}</p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">{actionButtons}</div>
        </div>
      ) : null}
    </section>
  );
}

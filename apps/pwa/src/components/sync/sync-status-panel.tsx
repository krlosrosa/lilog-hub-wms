import { cn, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lilog/ui';

import {

  AlertCircle,

  CheckCircle2,

  Clock,

  CloudOff,

  CloudUpload,

  History,

  Loader2,

  RefreshCw,

  RotateCcw,

  QrCode,

  Trash2,

  Wifi,

  WifiOff,

} from 'lucide-react';

import { useMemo, useState } from 'react';



import { hapticLight, hapticMedium } from '@/lib/haptics';

import type { OutboxEntry } from '@/lib/offline/db';

import { db } from '@/lib/offline/db';

import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import { useSyncStatus } from '@/lib/offline/hooks/use-sync-status';

import { resetAllErrors, resetError, removeAllOutboxEntries, removeOutboxEntry } from '@/lib/offline/outbox';

import { syncNow } from '@/lib/offline/sync-engine';
import { groupOutboxErrorsByDemand } from '@/lib/offline/sync-export';

import { SyncExportModal } from './sync-export-modal';



interface SyncStatusPanelProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

}



function formatTimestamp(ts: number): string {

  return new Intl.DateTimeFormat('pt-BR', {

    day: '2-digit',

    month: '2-digit',

    hour: '2-digit',

    minute: '2-digit',

  }).format(new Date(ts));

}



function formatRelativeSync(ts: number | null): string {

  if (!ts) return 'Nunca sincronizado';

  const diffMs = Date.now() - ts;

  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'Agora há pouco';

  if (diffMin < 60) return `Há ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);

  if (diffH < 24) return `Há ${diffH}h`;

  return formatTimestamp(ts);

}



function StatPill({

  label,

  value,

  tone = 'default',

}: {

  label: string;

  value: number;

  tone?: 'default' | 'warning' | 'error';

}) {

  return (

    <div className="rounded-lg border border-outline-variant/80 bg-surface-container-low px-2.5 py-2.5 text-center">

      <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">

        {label}

      </p>

      <p

        className={cn(

          'mt-0.5 font-mono text-headline-md font-bold tabular-nums leading-none',

          tone === 'error' && value > 0 && 'text-destructive',

          tone === 'warning' && value > 0 && 'text-warning',

          tone === 'default' && 'text-on-surface',

        )}

      >

        {value}

      </p>

    </div>

  );

}



function EmptyBlock({ icon: Icon, title, description }: {

  icon: typeof CheckCircle2;

  title: string;

  description: string;

}) {

  return (

    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-8 text-center">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container">

        <Icon className="h-6 w-6 text-outline" aria-hidden />

      </div>

      <p className="text-body-md font-semibold text-on-surface">{title}</p>

      <p className="max-w-[240px] text-body-sm text-on-surface-variant">{description}</p>

    </div>

  );

}



function OutboxRow({

  entry,

  variant,

  onRetry,

  onDelete,

  deleteDisabled = false,

}: {

  entry: OutboxEntry;

  variant: 'pending' | 'error';

  onRetry?: (id: number) => void;

  onDelete?: (id: number) => void;

  deleteDisabled?: boolean;

}) {

  return (

    <li>

      <article

        className={cn(

          'flex items-start gap-3 rounded-lg border p-3 shadow-sm transition-colors',

          variant === 'error'

            ? 'border-destructive/30 bg-error-container/10'

            : 'border-outline-variant bg-surface active:bg-surface-container',

        )}

      >

        <div

          className={cn(

            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',

            variant === 'error'

              ? 'bg-error-container/30'

              : 'bg-secondary-container',

          )}

        >

          {variant === 'error' ? (

            <AlertCircle className="h-5 w-5 text-destructive" aria-hidden />

          ) : entry.status === 'syncing' ? (

            <Loader2 className="h-5 w-5 animate-spin text-secondary" aria-hidden />

          ) : (

            <Clock className="h-5 w-5 text-on-secondary-container" aria-hidden />

          )}

        </div>

        <div className="min-w-0 flex-1">

          <p className="truncate text-body-md font-semibold text-on-surface">{entry.label}</p>

          <p className="mt-0.5 font-mono text-label-sm text-on-surface-variant">

            {entry.method} · {formatTimestamp(entry.createdAt)}

          </p>

          {(entry.photoIds?.length ?? 0) > 0 && (

            <p className="mt-1 text-label-sm text-on-surface-variant">

              {entry.photoIds?.length ?? 0} foto(s) anexada(s)

            </p>

          )}

          {variant === 'error' && entry.errorMessage && (

            <p className="mt-1.5 rounded-md bg-error-container/20 px-2 py-1 text-label-sm text-destructive">

              {entry.errorMessage}

            </p>

          )}

        </div>

        <div className="flex shrink-0 flex-col gap-1.5">

        {variant === 'error' && entry.id != null && onRetry && (

          <button

            type="button"

            onClick={() => {

              hapticLight();

              onRetry(entry.id!);

            }}

            className="flex h-9 items-center justify-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 text-label-sm font-semibold text-secondary touch-manipulation active:scale-95"

          >

            <RotateCcw className="h-3.5 w-3.5" aria-hidden />

            Tentar

          </button>

        )}

        {entry.id != null && onDelete && (

          <button

            type="button"

            disabled={deleteDisabled || entry.status === 'syncing'}

            onClick={() => {

              hapticLight();

              onDelete(entry.id!);

            }}

            aria-label={`Excluir ${entry.label}`}

            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface text-destructive touch-manipulation active:scale-95 disabled:opacity-40"

          >

            <Trash2 className="h-4 w-4" aria-hidden />

          </button>

        )}

        </div>

      </article>

    </li>

  );

}



function ConnectionHero({

  isOnline,

  isSyncing,

  hasIssues,

  pendingCount,

  errorCount,

  todaySyncedCount,

  lastSyncLabel,

}: {

  isOnline: boolean;

  isSyncing: boolean;

  hasIssues: boolean;

  pendingCount: number;

  errorCount: number;

  todaySyncedCount: number;

  lastSyncLabel: string;

}) {

  const statusLabel = !isOnline

    ? 'Modo offline'

    : isSyncing

      ? 'Sincronizando…'

      : hasIssues

        ? 'Atenção necessária'

        : pendingCount > 0

          ? 'Aguardando envio'

          : 'Tudo em dia';



  const StatusIcon = !isOnline ? WifiOff : isSyncing ? Loader2 : hasIssues ? AlertCircle : Wifi;



  return (

    <div

      className={cn(

        'relative overflow-hidden rounded-xl border p-4',

        !isOnline

          ? 'border-warning/30 bg-warning-container/15'

          : hasIssues

            ? 'border-destructive/25 bg-error-container/10'

            : 'border-secondary/25 bg-secondary-container/20',

      )}

    >

      <div

        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-secondary opacity-20 blur-2xl"

        aria-hidden

      />

      <div className="relative z-10 flex items-start gap-3">

        <div

          className={cn(

            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',

            !isOnline

              ? 'bg-warning-container text-on-warning-container'

              : hasIssues

                ? 'bg-error-container/40 text-destructive'

                : 'bg-secondary text-on-secondary',

          )}

        >

          <StatusIcon

            className={cn('h-6 w-6', isSyncing && 'animate-spin')}

            aria-hidden

          />

        </div>

        <div className="min-w-0 flex-1">

          <p className="text-label-sm font-medium uppercase tracking-wide text-on-surface-variant">

            Status da conexão

          </p>

          <p className="mt-0.5 text-headline-md font-semibold text-on-surface">{statusLabel}</p>

          <p className="mt-1 text-body-sm text-on-surface-variant">

            {isOnline

              ? 'Alterações são enviadas automaticamente quando há rede.'

              : 'Suas alterações ficam salvas no aparelho até reconectar.'}

          </p>

        </div>

      </div>



      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">

        <StatPill label="Pendentes" value={pendingCount} tone="warning" />

        <StatPill label="Hoje" value={todaySyncedCount} />

        <StatPill label="Erros" value={errorCount} tone="error" />

      </div>



      <p className="relative z-10 mt-3 flex items-center gap-1.5 text-label-sm text-on-surface-variant">

        <History className="h-3.5 w-3.5 shrink-0" aria-hidden />

        Última sync:{' '}

        <span className="font-medium text-on-surface">{lastSyncLabel}</span>

      </p>

    </div>

  );

}



export function SyncStatusPanel({ open, onOpenChange }: SyncStatusPanelProps) {

  const { isOnline } = useNetworkStatus();

  const { pending, errors, lastSyncAt, todaySyncedCount, isSyncing, hasIssues } =

    useSyncStatus();

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportEntries, setExportEntries] = useState<OutboxEntry[]>([]);

  const lastSyncLabel = useMemo(() => formatRelativeSync(lastSyncAt), [lastSyncAt]);
  const demandErrorGroups = useMemo(
    () => groupOutboxErrorsByDemand(errors),
    [errors],
  );

  const busy = isManualSyncing || isSyncing;

  const openExportForEntries = (entries: OutboxEntry[]) => {
    hapticMedium();
    setExportEntries(entries);
    setExportOpen(true);
  };



  const handleSyncNow = async () => {

    if (!isOnline || busy) return;

    hapticMedium();

    setIsManualSyncing(true);

    try {

      await syncNow();

    } finally {

      setIsManualSyncing(false);

    }

  };



  const handleRetry = async (id: number) => {

    await resetError(db, id);

    if (isOnline) {

      hapticMedium();

      await syncNow();

    }

  };



  const handleRetryAll = async () => {

    hapticMedium();

    await resetAllErrors(db);

    if (isOnline) {

      await syncNow();

    }

  };



  const handleDeleteEntry = async (id: number) => {

    const entry = pending.find((item) => item.id === id) ?? errors.find((item) => item.id === id);

    const label = entry?.label ?? 'este item';

    const confirmed = window.confirm(

      `Excluir "${label}" da fila?\n\nEsta alteração não será enviada ao servidor.`,

    );

    if (!confirmed) return;

    hapticMedium();

    const removed = await removeOutboxEntry(db, id);

    if (!removed) {

      window.alert('Não foi possível excluir. O item pode estar sincronizando agora.');

    }

  };



  const handleDeleteAll = async () => {

    const total = pending.length + errors.length;

    if (total === 0) return;

    const confirmed = window.confirm(

      `Excluir todos os ${total} item(ns) da fila?\n\nNenhuma dessas alterações será enviada ao servidor.`,

    );

    if (!confirmed) return;

    hapticMedium();

    const removed = await removeAllOutboxEntries(db);

    if (removed === 0 && busy) {

      window.alert('Aguarde a sincronização terminar para excluir itens em envio.');

    }

  };



  const queueCount = pending.length + errors.length;



  return (

    <>

      <Sheet open={open} onOpenChange={onOpenChange}>

      <SheetContent

        side="bottom"

        closeClassName="top-10"

        className="flex max-h-[88vh] flex-col gap-0 rounded-t-2xl border-outline-variant bg-surface px-0 pb-0 pt-2"

      >

        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-lg bg-outline-variant" aria-hidden />



        <div className="min-h-0 flex-1 overflow-y-auto px-margin-mobile pb-[calc(20px+env(safe-area-inset-bottom,0px))] hide-scrollbar">

          <SheetHeader className="pr-12 text-left">

            <SheetTitle className="flex items-center gap-2 text-headline-md text-on-surface">

              <CloudUpload className="h-5 w-5 text-secondary" aria-hidden />

              Sincronização

            </SheetTitle>

            <SheetDescription className="text-body-sm text-on-surface-variant">

              Envio de alterações feitas offline para o servidor.

            </SheetDescription>

          </SheetHeader>



          <div className="mt-4">

            <ConnectionHero

              isOnline={isOnline}

              isSyncing={busy}

              hasIssues={hasIssues}

              pendingCount={pending.length}

              errorCount={errors.length}

              todaySyncedCount={todaySyncedCount}

              lastSyncLabel={lastSyncLabel}

            />

          </div>



          <div className="mt-4 -mx-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-2 px-1">
              <button
                type="button"
                disabled={!isOnline || busy}
                onClick={() => void handleSyncNow()}
                aria-label={busy ? 'Sincronizando' : 'Sincronizar agora'}
                title={busy ? 'Sincronizando…' : 'Sincronizar agora'}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-on-secondary touch-manipulation transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-5 w-5" aria-hidden />
                )}
              </button>

              {errors.length > 0 && (
                <button
                  type="button"
                  onClick={() => openExportForEntries(errors)}
                  aria-label="Exportar tudo"
                  title="Exportar tudo"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container touch-manipulation active:scale-[0.98]"
                >
                  <QrCode className="h-5 w-5 text-secondary" aria-hidden />
                </button>
              )}

              {errors.length > 0 && (
                <button
                  type="button"
                  disabled={!isOnline || busy}
                  onClick={() => void handleRetryAll()}
                  className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-4 text-label-md font-semibold text-on-surface touch-manipulation active:scale-[0.98] disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4 text-secondary" aria-hidden />
                  Erros
                </button>
              )}

              {queueCount > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDeleteAll()}
                  className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-error-container/10 px-4 text-label-md font-semibold text-destructive touch-manipulation active:scale-[0.98] disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Excluir todos
                </button>
              )}
            </div>
          </div>



          {!isOnline && (

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-container/15 px-3 py-2.5">

              <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />

              <p className="text-label-sm text-on-surface-variant">

                Sem conexão. O botão de sincronizar fica disponível quando a rede voltar.

              </p>

            </div>

          )}



          <section className="mt-6" aria-labelledby="sync-pending-heading">

            <h3

              id="sync-pending-heading"

              className="mb-2 flex items-center justify-between gap-2"

            >

              <span className="flex items-center gap-2 text-label-md font-semibold text-on-surface">

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary-container">

                  <Clock className="h-3.5 w-3.5 text-on-secondary-container" aria-hidden />

                </span>

                Na fila

              </span>

              <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-mono text-label-sm font-bold text-secondary">

                {pending.length}

              </span>

            </h3>

            {pending.length === 0 ? (

              <EmptyBlock

                icon={CheckCircle2}

                title="Fila vazia"

                description="Nenhuma alteração aguardando envio para o servidor."

              />

            ) : (

              <ul className="space-y-2">

                {pending.map((entry) => (

                  <OutboxRow

                    key={entry.id}

                    entry={entry}

                    variant="pending"

                    deleteDisabled={busy}

                    onDelete={(id) => void handleDeleteEntry(id)}

                  />

                ))}

              </ul>

            )}

          </section>



          <section className="mt-6" aria-labelledby="sync-errors-heading">

            <h3

              id="sync-errors-heading"

              className="mb-2 flex items-center justify-between gap-2"

            >

              <span className="flex items-center gap-2 text-label-md font-semibold text-on-surface">

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-error-container/30">

                  <AlertCircle className="h-3.5 w-3.5 text-destructive" aria-hidden />

                </span>

                Falhas

              </span>

              <span

                className={cn(

                  'rounded-full px-2.5 py-0.5 font-mono text-label-sm font-bold',

                  errors.length > 0

                    ? 'bg-error-container/30 text-destructive'

                    : 'bg-surface-container text-on-surface-variant',

                )}

              >

                {errors.length}

              </span>

            </h3>

            {errors.length === 0 ? (

              <EmptyBlock

                icon={CheckCircle2}

                title="Sem falhas"

                description="Nenhum envio falhou. Tudo certo por aqui."

              />

            ) : (

              <div className="space-y-4">

                {demandErrorGroups.length > 0 && (

                  <div className="space-y-2">

                    <p className="text-label-sm text-on-surface-variant">

                      Demandas com falha — exporte uma por vez e importe no portal da demanda.

                    </p>

                    <ul className="space-y-2">

                      {demandErrorGroups.map((group) => (

                        <li key={`${group.module}:${group.demandId}`}>

                          <article className="rounded-lg border border-outline-variant bg-surface p-3">

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0 flex-1">

                                <p className="truncate font-mono text-body-sm font-semibold text-on-surface">

                                  {group.demandId === 'sem-demanda'

                                    ? 'Sem demanda identificada'

                                    : `#${group.demandId}`}

                                </p>

                                <p className="mt-0.5 text-label-sm text-on-surface-variant">

                                  {group.moduleLabel} · {group.entries.length} falha

                                  {group.entries.length === 1 ? '' : 's'} ·{' '}

                                  {formatTimestamp(group.firstErrorAt)}

                                </p>

                                <p className="mt-1 truncate text-label-sm text-on-surface-variant">

                                  {group.labelSample}

                                </p>

                              </div>

                              <button

                                type="button"

                                onClick={() => openExportForEntries(group.entries)}

                                className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 text-label-sm font-semibold text-on-surface touch-manipulation active:scale-[0.98]"

                              >

                                <QrCode className="h-3.5 w-3.5 text-secondary" aria-hidden />

                                Exportar

                              </button>

                            </div>

                          </article>

                        </li>

                      ))}

                    </ul>

                  </div>

                )}

                <ul className="space-y-2">

                  {errors.map((entry) => (

                    <OutboxRow

                      key={entry.id}

                      entry={entry}

                      variant="error"

                      deleteDisabled={busy}

                      onRetry={(id) => void handleRetry(id)}

                      onDelete={(id) => void handleDeleteEntry(id)}

                    />

                  ))}

                </ul>

              </div>

            )}

          </section>

        </div>

      </SheetContent>

      </Sheet>

      <SyncExportModal

        open={exportOpen}
        onOpenChange={(open) => {
          setExportOpen(open);
          if (!open) {
            setExportEntries([]);
          }
        }}
        entries={exportEntries}
      />

    </>

  );

}



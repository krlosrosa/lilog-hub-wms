import { Button, cn } from '@lilog/ui';
import type { ProcessStatus } from '@lilog/contracts';
import { Link } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronRight,
  Download,
  Loader2,
  MapPin,
  Truck,
} from 'lucide-react';

import { StatusBadge } from '@/features/recebimento/components/status-badge';
import { hapticMedium } from '@/lib/haptics';
import { useChecklistV2 } from '@/features/recebimento-v2/hooks/use-checklist-v2';
import { useDockDisplayLabelV2 } from '@/features/recebimento-v2/hooks/use-dock-display-label-v2';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import type { ProcessRecord } from '@/features/recebimento-v2/local-db/schema';
import { useProcessCapabilitiesV2 } from '@/features/recebimento-v2/hooks/use-process-capabilities-v2';

interface ProcessStatusCardV3Props {
  process: ProcessRecord;
  onPrepare: (demandId: string) => void;
  isPreparingThis: boolean;
}

const STATUS_LABELS: Record<ProcessStatus, string> = {
  notDownloaded: 'Aguardando',
  downloading: 'Baixando',
  ready: 'Pronto',
  working: 'Conferindo',
  pendingSync: 'Sync pendente',
  syncing: 'Sincronizando',
  completed: 'Concluído',
  error: 'Erro',
  conflict: 'Conflito',
};

function formatArrival(arrival: string | undefined): string {
  if (!arrival) return '—';
  try {
    return new Date(arrival).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return arrival;
  }
}

function isPriorityStatus(status: ProcessStatus): boolean {
  return status === 'pendingSync' || status === 'conflict';
}

export function ProcessStatusCardV3({
  process,
  onPrepare,
  isPreparingThis,
}: ProcessStatusCardV3Props) {
  const isReady =
    process.status === 'ready' ||
    process.status === 'working' ||
    process.status === 'pendingSync' ||
    process.status === 'completed';

  const { isComplete: isChecklistComplete } = useChecklistV2(process.id);
  const demand = useLiveQuery(
    () => recebimentoV2Db.demands.get(process.id),
    [process.id],
  );

  const dockLabel = useDockDisplayLabelV2(process.dock);
  const { souApoio } = useProcessCapabilitiesV2(process.id);

  const placa = process.placa?.trim();
  const isPriority = isPriorityStatus(process.status);
  const isLocalImpedido = demand?.situacao === 'impedido';
  const arrival = formatArrival(process.arrival);
  const statusLabel = STATUS_LABELS[process.status] ?? 'Aguardando';

  const actionTo =
    process.status === 'completed'
      ? '/recebimento-v3/$id/resumo'
      : isLocalImpedido
        ? '/recebimento-v3/$id/checklist'
        : isChecklistComplete
          ? '/recebimento-v3/$id/itens'
          : '/recebimento-v3/$id/checklist';

  const prepareLabel = isPreparingThis
    ? 'Baixando...'
    : process.status === 'error'
      ? 'Tentar novamente'
      : process.status === 'downloading'
        ? 'Retomar'
        : souApoio
          ? 'Baixar para apoiar'
          : 'Preparar';

  const needsDownload =
    process.status === 'notDownloaded' ||
    process.status === 'downloading' ||
    process.status === 'error';
  const showApoioDownloadHint = souApoio && needsDownload;
  const isEffectivelyDownloading =
    isPreparingThis || process.status === 'downloading';

  const cardClassName = cn(
    'group relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 shadow-sm',
    'transition-all duration-150 touch-manipulation active:scale-[0.98] active:bg-surface-container-low',
    isPriority && 'border-l-[3px] border-l-warning bg-warning/[0.03]',
  );

  const cardContent = (
    <>
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          isPriority
            ? 'bg-warning-container text-on-warning-container'
            : 'bg-secondary-container/80 text-on-secondary-container',
        )}
      >
        <Truck className="h-4 w-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span
            className={cn(
              'truncate font-mono text-label-md font-bold text-primary',
              placa && 'uppercase tracking-wide',
            )}
          >
            {placa || process.supplier || 'Sem placa'}
          </span>
          <time
            dateTime={process.arrival}
            className={cn(
              'font-mono text-label-sm font-semibold tabular-nums',
              isPriority ? 'text-warning' : 'text-on-surface-variant',
            )}
          >
            {arrival}
          </time>
        </div>

        {placa && process.supplier ? (
          <p className="truncate text-body-sm font-medium text-on-surface">{process.supplier}</p>
        ) : null}

        <div className="flex min-w-0 items-center justify-between gap-2 pt-0.5">
          <span className="flex min-w-0 items-center gap-1 truncate text-body-sm text-on-surface-variant">
            <MapPin className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
            <span className="truncate">
              {dockLabel !== '—' ? `Doca ${dockLabel}` : 'Doca —'}
            </span>
          </span>
          <StatusBadge
            label={statusLabel}
            pulse={process.status === 'working' || process.status === 'downloading'}
            compact
          />
        </div>

        {process.status === 'error' && process.errorMessage ? (
          <p className="line-clamp-2 pt-0.5 text-[11px] text-destructive">{process.errorMessage}</p>
        ) : null}

        {showApoioDownloadHint ? (
          <p className="line-clamp-2 pt-0.5 text-[11px] text-on-surface-variant">
            Baixe os dados da carga para conferir itens
          </p>
        ) : null}
      </div>

      {isReady ? (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (isReady) {
    return (
      <Link
        to={actionTo}
        params={{ id: process.id }}
        onClick={() => hapticMedium()}
        className={cardClassName}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article className={cn(cardClassName, 'flex-col items-stretch')}>
      <div className="flex w-full items-center gap-2.5">{cardContent}</div>

      <div className="mt-2 flex items-center gap-2 border-t border-outline-variant/40 pt-2">
        <Button
          type="button"
          disabled={isEffectivelyDownloading}
          onClick={() => {
            hapticMedium();
            onPrepare(process.id);
          }}
          className="h-9 flex-1 rounded-lg bg-secondary text-label-sm font-semibold text-on-secondary touch-manipulation disabled:opacity-100 disabled:saturate-75"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {prepareLabel}
        </Button>
        <Link
          to="/recebimento-v3/$id/preparacao"
          params={{ id: process.id }}
          className="flex h-9 items-center rounded-lg border border-outline-variant px-3 text-label-sm font-medium text-on-surface-variant touch-manipulation active:bg-surface-container"
        >
          Detalhes
        </Link>
      </div>

      {isEffectivelyDownloading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface/80">
          {isPreparingThis ? (
            <Loader2 className="h-5 w-5 animate-spin text-secondary" aria-hidden />
          ) : (
            <Button
              type="button"
              onClick={() => {
                hapticMedium();
                onPrepare(process.id);
              }}
              className="h-9 rounded-lg bg-secondary px-4 text-label-sm font-semibold text-on-secondary touch-manipulation"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Retomar
            </Button>
          )}
        </div>
      ) : null}
    </article>
  );
}

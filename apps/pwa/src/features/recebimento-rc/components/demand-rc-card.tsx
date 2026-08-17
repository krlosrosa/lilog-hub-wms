import { cn } from '@lilog/ui';
import type { DemandView } from '@lilog/contracts';
import { Link } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, MapPin, Truck } from 'lucide-react';

import { StatusBadge } from '@/features/recebimento/components/status-badge';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import { hapticMedium } from '@/lib/haptics';

import {
  formatArrival,
  formatDockLabel,
  isPriorityDemand,
  resolveDemandDisplayStatus,
} from '../lib/demand-view-ui';
import { useRcOperadorSituacao } from '../context/rc-operador-situacao-context';
import { useDemandEntryRoute } from '../hooks/use-demand-entry-route';

interface DemandRcCardProps {
  demanda: DemandView;
}

export function DemandRcCard({ demanda }: DemandRcCardProps) {
  const entryRoute = useDemandEntryRoute(demanda.preRecebimentoId, demanda);
  const operadorSituacao = useRcOperadorSituacao(demanda.preRecebimentoId);
  const localChecklist = useLiveQuery(
    () => recebimentoV2Db.checklists.get(demanda.preRecebimentoId),
    [demanda.preRecebimentoId],
  );
  const placa = demanda.placa?.trim();
  const supplier = demanda.transportadoraNome?.trim();
  const isPriority = isPriorityDemand(demanda);
  const arrival = formatArrival(demanda.horarioPrevisto);
  const displayStatus = resolveDemandDisplayStatus(demanda, localChecklist ?? undefined, {
    serverSituacao: operadorSituacao,
  });
  const dockLabel = formatDockLabel(demanda.dock);

  const cardClassName = cn(
    'group relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 shadow-sm',
    'transition-all duration-150 touch-manipulation active:scale-[0.98] active:bg-surface-container-low',
    isPriority && 'border-l-[3px] border-l-warning bg-warning/[0.03]',
  );

  return (
    <Link
      to={entryRoute}
      params={{ id: demanda.preRecebimentoId }}
      onClick={() => hapticMedium()}
      className={cardClassName}
    >
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
            {placa || supplier || 'Sem placa'}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {demanda.atribuidoAMim ? (
              <span className="rounded-full bg-primary-container px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-on-primary-container">
                Atribuída a você
              </span>
            ) : null}
            <time
              dateTime={demanda.horarioPrevisto}
              className={cn(
                'font-mono text-label-sm font-semibold tabular-nums',
                isPriority ? 'text-warning' : 'text-on-surface-variant',
              )}
            >
              {arrival}
            </time>
          </div>
        </div>

        {placa && supplier ? (
          <p className="truncate text-body-sm font-medium text-on-surface">{supplier}</p>
        ) : null}

        <div className="flex min-w-0 items-center justify-between gap-2 pt-0.5">
          <span className="flex min-w-0 items-center gap-1 truncate text-body-sm text-on-surface-variant">
            <MapPin className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
            <span className="truncate">
              {dockLabel !== '—' ? `Doca ${dockLabel}` : 'Doca —'}
            </span>
          </span>
          <StatusBadge
            label={displayStatus.label}
            pulse={displayStatus.pulse}
            compact
          />
        </div>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

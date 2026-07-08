'use client';

import { useRouter } from 'next/navigation';

import { cn } from '@lilog/ui';

import {
  DevolucaoStatusBadge,
  TipoNfBadge,
} from '@/features/devolucao/components/devolucao-status-badge';
import type { DemandaDevolucaoListItem } from '@/features/devolucao/types/devolucao-gestao.schema';
import { canAgruparDemanda } from '@/features/devolucao/types/devolucao-grupo-descarga.schema';
import { formatDemandaData } from '@/features/devolucao/types/devolucao-gestao.schema';

type DevolucaoDemandRowProps = {
  demanda: DemandaDevolucaoListItem;
  className?: string;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (demandaId: string) => void;
};

export function DevolucaoDemandRow({
  demanda,
  className,
  selectable = false,
  selected = false,
  onToggleSelect,
}: DevolucaoDemandRowProps) {
  const router = useRouter();
  const isInactive =
    demanda.status === 'concluida' || demanda.status === 'cancelada';
  const podeSelecionar =
    selectable &&
    canAgruparDemanda(demanda.status, demanda.grupoDescargaId ?? null);

  const openDemanda = () => {
    router.push(`/devolucao/${demanda.id}`);
  };

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (
          selectable &&
          podeSelecionar &&
          (event.target as HTMLElement).closest('[data-select-checkbox]')
        ) {
          return;
        }
        openDemanda();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDemanda();
        }
      }}
      className={cn(
        'cursor-pointer transition-colors hover:bg-surface-highest/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        demanda.status === 'aberta' &&
          'border-l-2 border-l-primary bg-primary/[0.03] hover:bg-primary/[0.06]',
        selected && 'bg-primary/[0.08]',
        className,
      )}
    >
      {selectable ? (
        <td className="w-10 px-2 py-1.5">
          <input
            data-select-checkbox
            type="checkbox"
            checked={selected}
            disabled={!podeSelecionar}
            onChange={() => onToggleSelect?.(demanda.id)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Selecionar demanda ${demanda.codigoDemanda}`}
          />
        </td>
      ) : null}
      <td className="px-2 py-1.5">
        <span
          className={cn(
            'font-mono text-[11px] font-bold text-foreground',
            isInactive && 'opacity-70',
          )}
        >
          {demanda.codigoDemanda}
        </span>
      </td>
      <td
        className={cn(
          'px-2 py-1.5 font-mono text-[11px]',
          isInactive && 'opacity-70',
        )}
      >
        {demanda.transporteId ?? '—'}
      </td>
      <td
        className={cn(
          'px-2 py-1.5 font-mono text-[11px] font-semibold',
          isInactive && 'opacity-70',
        )}
      >
        {demanda.placa ?? '—'}
      </td>
      <td
        className={cn(
          'hidden max-w-[140px] truncate px-2 py-1.5 text-[11px] sm:table-cell',
          isInactive && 'opacity-70',
        )}
      >
        {demanda.cliente ?? '—'}
      </td>
      <td
        className={cn(
          'px-2 py-1.5 text-center font-mono text-[11px]',
          isInactive && 'opacity-70',
        )}
      >
        {demanda.totalNfs}
      </td>
      <td
        className={cn(
          'hidden px-2 py-1.5 text-center font-mono text-[11px] md:table-cell',
          isInactive && 'opacity-70',
        )}
      >
        {demanda.totalItens}
      </td>
      <td className="px-2 py-1.5">
        <div className="flex flex-wrap gap-1">
          {demanda.tiposNf.length === 0 ? (
            <span className="text-[10px] text-muted-foreground">—</span>
          ) : (
            demanda.tiposNf.map((tipo) => (
              <TipoNfBadge key={tipo} tipo={tipo} compact />
            ))
          )}
        </div>
      </td>
      <td className="px-2 py-1.5">
        <DevolucaoStatusBadge status={demanda.status} compact />
        {demanda.codigoGrupo ? (
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
            {demanda.codigoGrupo}
          </div>
        ) : null}
      </td>
      <td
        className={cn(
          'hidden px-2 py-1.5 font-mono text-[10px] text-muted-foreground lg:table-cell',
        )}
      >
        {formatDemandaData(demanda.createdAt)}
      </td>
    </tr>
  );
}

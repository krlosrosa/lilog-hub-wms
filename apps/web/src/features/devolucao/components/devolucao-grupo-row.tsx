'use client';

import { useRouter } from 'next/navigation';

import { cn } from '@lilog/ui';

import {
  GRUPO_DESCARGA_STATUS_LABELS,
  type GrupoDescargaListItem,
} from '@/features/devolucao/types/devolucao-grupo-descarga.schema';
import { formatDemandaData } from '@/features/devolucao/types/devolucao-gestao.schema';

type DevolucaoGrupoRowProps = {
  grupo: GrupoDescargaListItem;
};

export function DevolucaoGrupoRow({ grupo }: DevolucaoGrupoRowProps) {
  const router = useRouter();

  const openGrupo = () => {
    router.push(`/devolucao/grupos/${grupo.id}`);
  };

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={openGrupo}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openGrupo();
        }
      }}
      className="cursor-pointer transition-colors hover:bg-surface-highest/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
    >
      <td className="px-2 py-1.5 font-mono text-[11px] font-bold">
        {grupo.codigoGrupo}
      </td>
      <td className="px-2 py-1.5 font-mono text-[11px] font-semibold">
        {grupo.placaDescarga}
      </td>
      <td className="px-2 py-1.5 text-[11px]">{grupo.doca ?? '—'}</td>
      <td className="px-2 py-1.5 text-center font-mono text-[11px]">
        {grupo.totalDemandas}
      </td>
      <td className="hidden px-2 py-1.5 text-center font-mono text-[11px] md:table-cell">
        {grupo.totalNfs}
      </td>
      <td className="hidden px-2 py-1.5 text-center font-mono text-[11px] lg:table-cell">
        {grupo.totalItens}
      </td>
      <td className="px-2 py-1.5">
        <span
          className={cn(
            'rounded px-2 py-0.5 text-[10px] font-medium',
            grupo.status === 'em_conferencia' &&
              'bg-tertiary/10 text-tertiary',
            grupo.status === 'aguardando_conferencia' &&
              'bg-secondary/10 text-secondary',
            grupo.status === 'conferida' && 'bg-primary/10 text-primary',
            grupo.status === 'concluida' &&
              'bg-muted text-muted-foreground',
          )}
        >
          {GRUPO_DESCARGA_STATUS_LABELS[grupo.status]}
        </span>
      </td>
      <td className="hidden px-2 py-1.5 font-mono text-[10px] text-muted-foreground lg:table-cell">
        {formatDemandaData(grupo.createdAt)}
      </td>
    </tr>
  );
}

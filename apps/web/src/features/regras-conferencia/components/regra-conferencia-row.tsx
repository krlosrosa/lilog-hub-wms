'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';
import {
  ChevronRight,
  Copy,
  MoreVertical,
  Pencil,
  Power,
  PowerOff,
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { formatarTempoEsperado } from '@/features/config-operacional/lib/formatar-tempo-esperado';
import {
  PREVIEW_QTD_CLIENTES,
  PREVIEW_QTD_LINHAS,
  PREVIEW_QTD_PALETES,
  type RegraConferencia,
} from '@/features/regras-conferencia/types/regra-conferencia.schema';

import { regrasProdutividadeEditPath } from '@/features/config-operacional/lib/regras-produtividade-paths';

type RegraConferenciaRowProps = {
  regra: RegraConferencia;
  tempoPreviewSeg: number;
  onToggleAtivo: (id: string) => void;
  onDuplicar: (id: string) => void;
  onExcluir: (id: string) => void;
};

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium',
        ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativa' : 'Inativa'}
    </span>
  );
}

export function RegraConferenciaRow({
  regra,
  tempoPreviewSeg,
  onToggleAtivo,
  onDuplicar,
  onExcluir,
}: RegraConferenciaRowProps) {
  const editHref = regrasProdutividadeEditPath('conferencia', regra.id);
  const { minutos } = formatarTempoEsperado(tempoPreviewSeg);

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        'border-l-2 border-l-transparent hover:border-l-primary/60',
      )}
    >
      <td className={compactTableCellClassName}>
        <Link href={editHref} className="block min-w-0">
          <p className="truncate text-[12px] font-medium text-foreground transition-colors group-hover:text-primary">
            {regra.nome}
          </p>
          {regra.descricao && (
            <p className="truncate text-[10px] text-muted-foreground">{regra.descricao}</p>
          )}
        </Link>
      </td>

      <td className={cn(compactTableCellClassName, 'hidden sm:table-cell')}>
        <p className="text-[11px] font-medium text-foreground">
          {tempoPreviewSeg}s
          <span className="ml-1 text-muted-foreground">({minutos} min)</span>
        </p>
        <p className="text-[10px] text-muted-foreground">
          {PREVIEW_QTD_LINHAS} linhas · {PREVIEW_QTD_PALETES} paletes · {PREVIEW_QTD_CLIENTES}{' '}
          clientes
        </p>
      </td>

      <td className={compactTableCellClassName}>
        <StatusBadge ativo={regra.ativo} />
      </td>

      <td className={cn(compactTableCellClassName, 'hidden md:table-cell')}>
        {regra.padrao ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/15 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            <Star className="size-3" aria-hidden />
            Padrão
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        )}
      </td>

      <td className={cn(compactTableCellClassName, 'text-right')}>
        <div className="flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-md text-muted-foreground opacity-70 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
            asChild
          >
            <Link href={editHref} aria-label={`Editar ${regra.nome}`}>
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Mais ações para ${regra.nome}`}
                className="size-7 rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-highest hover:text-foreground"
              >
                <MoreVertical className="size-3.5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuItem asChild>
                <Link href={editHref} className="flex items-center gap-2">
                  <Pencil className="size-3.5" aria-hidden />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => onDuplicar(regra.id)}
              >
                <Copy className="size-3.5" aria-hidden />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => onToggleAtivo(regra.id)}
              >
                {regra.ativo ? (
                  <>
                    <PowerOff className="size-3.5" aria-hidden />
                    Desativar
                  </>
                ) : (
                  <>
                    <Power className="size-3.5" aria-hidden />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive"
                onClick={() => onExcluir(regra.id)}
              >
                <Trash2 className="size-3.5" aria-hidden />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

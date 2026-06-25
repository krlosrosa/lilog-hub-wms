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
  FolderTree,
  MoreVertical,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { formatArvoreResumo } from '@/features/regras-wms/lib/arvore-condicoes-utils';
import { RegraStatusBadge } from '@/features/regras-wms/components/regra-status-badge';
import {
  GATILHO_LABELS,
  TIPO_ACAO_LABELS,
} from '@/features/regras-wms/types/regra-wms.schema';
import {
  GRUPO_OPERADOR_LABELS,
  type RegraWmsV2,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

type RegraWmsRowProps = {
  regra: RegraWmsV2;
  onToggleAtivo: (id: string) => void;
  onDuplicar: (id: string) => void;
  onExcluir: (id: string) => void;
};

function countSubgrupos(regra: RegraWmsV2): number {
  function walk(nos: RegraWmsV2['arvoreCondicoes']['filhos']): number {
    return nos.reduce((acc, no) => {
      if (no.tipo === 'grupo') return acc + 1 + walk(no.filhos);
      return acc;
    }, 0);
  }
  return walk(regra.arvoreCondicoes.filhos);
}

export function RegraWmsRow({
  regra,
  onToggleAtivo,
  onDuplicar,
  onExcluir,
}: RegraWmsRowProps) {
  const editHref = `/regras-wms/${regra.id}`;
  const resumo = formatArvoreResumo(regra.arvoreCondicoes);
  const subgrupos = countSubgrupos(regra);

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
            <p className="truncate text-[10px] text-muted-foreground">
              {regra.descricao}
            </p>
          )}
        </Link>
      </td>

      <td className={compactTableCellClassName}>
        <span className="inline-flex rounded-md bg-surface-highest px-2 py-0.5 text-[10px] font-medium text-foreground">
          {GATILHO_LABELS[regra.gatilho]}
        </span>
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden max-w-[220px] lg:table-cell',
        )}
      >
        <p
          className="truncate text-[10px] text-muted-foreground"
          title={resumo}
        >
          <span className="font-medium text-foreground/70">
            {GRUPO_OPERADOR_LABELS[regra.arvoreCondicoes.operador]}:
          </span>{' '}
          {resumo}
          {subgrupos > 0 && (
            <span className="ml-1 inline-flex items-center gap-0.5 text-primary">
              <FolderTree className="size-2.5" aria-hidden />
              {subgrupos}
            </span>
          )}
        </p>
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden text-[10px] text-foreground md:table-cell',
        )}
      >
        {TIPO_ACAO_LABELS[regra.acao.tipo]}
      </td>

      <td
        className={cn(
          compactTableCellClassName,
          'hidden font-mono text-[10px] text-muted-foreground sm:table-cell',
        )}
      >
        {regra.prioridade}
      </td>

      <td className={compactTableCellClassName}>
        <RegraStatusBadge ativo={regra.ativo} compact />
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

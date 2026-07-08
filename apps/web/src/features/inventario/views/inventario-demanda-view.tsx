'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';

import { ClipboardList, Loader2, Play, Plus, Users } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';

import { DemandaRow } from '@/features/inventario/components/demanda-row';
import { useInventarioDemanda } from '@/features/inventario/hooks/use-inventario-demanda';

const glassCard =
  'overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass';

const TABLE_HEADERS = [
  { label: 'Demanda', className: 'min-w-[9rem]' },
  { label: 'Tipo', className: 'hidden sm:table-cell w-24' },
  { label: 'Progresso', className: 'min-w-[7rem]' },
  { label: 'Status', className: 'w-24' },
  { label: '', className: 'w-8 text-right' },
] as const;

const FILTROS = [
  ['todas', 'Todos'],
  ['cega', 'Cega'],
  ['validacao', 'Validação'],
] as const;

export type InventarioDemandaViewProps = {
  inventarioId: string;
};

function MiniStat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        glassCard,
        'flex min-w-[8.5rem] shrink-0 snap-start items-center gap-2 p-2.5 sm:min-w-0',
      )}
    >
      {icon ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold tabular-nums text-foreground">{value}</p>
        {detail ? (
          <p className="truncate text-[9px] text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

export function InventarioDemandaView({
  inventarioId,
}: InventarioDemandaViewProps) {
  const {
    demandas,
    filtroTipo,
    setFiltroTipo,
    resumo,
    irParaNovaDemanda,
    removerDemanda,
    voltarDetalhe,
    salvarEIniciar,
    salvando,
    carregando,
  } = useInventarioDemanda(inventarioId);

  return (
    <SidebarMain className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-glass-bg px-margin-mobile py-2.5 backdrop-blur-glass md:px-margin-desktop">
        <div className="min-w-0">
          <nav
            aria-label="Migalhas"
            className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground"
          >
            <Link href="/inventario" className="transition-colors hover:text-primary">
              Inventário
            </Link>
            <span aria-hidden>/</span>
            <Link
              href={`/inventario/${inventarioId}`}
              className="transition-colors hover:text-primary"
            >
              Detalhe
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">Demandas</span>
          </nav>
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
            Demandas de contagem
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-outline-variant text-xs"
            onClick={voltarDetalhe}
          >
            Voltar
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5"
            onClick={irParaNovaDemanda}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Nova demanda</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-surface-lowest px-margin-mobile py-3 md:px-margin-desktop md:py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:overflow-visible sm:gap-2">
            <MiniStat
              label="Total"
              value={resumo.total}
              detail={`${resumo.progressoMedio}% progresso médio`}
              icon={<ClipboardList className="size-3.5" aria-hidden />}
            />
            <MiniStat
              label="Cega / Validação"
              value={`${resumo.cega} / ${resumo.validacao}`}
              detail={`${resumo.concluidas} concluída(s)`}
            />
            <MiniStat
              label="Em andamento"
              value={resumo.emAndamento}
              detail={`de ${resumo.total} demanda(s)`}
            />
            <MiniStat
              label="Equipe"
              value={resumo.total > 0 ? resumo.avatares.length + resumo.extras : 0}
              detail={
                resumo.extras > 0
                  ? `${resumo.extras + resumo.avatares.length} operador(es)`
                  : 'operador(es)'
              }
              icon={<Users className="size-3.5" aria-hidden />}
            />
          </div>

          <article className={glassCard}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant px-3 py-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Demandas
              </h2>
              <div
                className="flex flex-wrap items-center gap-1"
                role="group"
                aria-label="Filtrar por tipo"
              >
                {FILTROS.map(([key, lab]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFiltroTipo(key)}
                    className={cn(
                      'rounded-full px-2 py-px text-[10px] font-medium transition-colors',
                      filtroTipo === key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
                    )}
                  >
                    {lab}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className={compactTableClassName}>
                <thead>
                  <tr className={compactTableHeadRowClassName}>
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.label || 'actions'}
                        className={compactTableHeadCellClassName(header.className)}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={compactTableBodyClassName}>
                  {carregando ? (
                    <tr>
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className={compactTableEmptyCellClassName}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          Carregando demandas…
                        </span>
                      </td>
                    </tr>
                  ) : demandas.length > 0 ? (
                    demandas.map((d) => (
                      <DemandaRow key={d.id} item={d} onRemover={removerDemanda} />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className={compactTableEmptyCellClassName}
                      >
                        <ClipboardList
                          className="mx-auto mb-2 size-5 text-muted-foreground/50"
                          aria-hidden
                        />
                        Nenhuma demanda com este filtro.
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="mt-1 h-auto p-0 text-[11px]"
                          onClick={irParaNovaDemanda}
                        >
                          Adicionar demanda
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <div className="flex justify-end gap-1.5 pt-1">
            <Button
              disabled={salvando || carregando || resumo.total === 0}
              type="button"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => void salvarEIniciar()}
            >
              {salvando ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Iniciando…
                </>
              ) : (
                <>
                  <Play className="size-3.5 shrink-0" aria-hidden />
                  Iniciar inventário
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

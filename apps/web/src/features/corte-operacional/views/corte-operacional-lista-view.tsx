'use client';

import Link from 'next/link';

import { Loader2, Plus, Scissors, Search } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { CorteStatusBadge } from '@/features/corte-operacional/components/corte-status-badge';
import { useCorteOperacionalLista } from '@/features/corte-operacional/hooks/use-corte-operacional-lista';
import {
  FILTRO_CORTE_STATUS_LABELS,
  type FiltroCorteStatus,
} from '@/features/corte-operacional/types/corte-operacional.schema';

const FILTROS: FiltroCorteStatus[] = [
  'todos',
  'solicitado',
  'em_andamento',
  'concluido',
  'cancelado',
];

export function CorteOperacionalListaView() {
  const {
    items,
    total,
    page,
    pageSize,
    setPage,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    carregando,
    erro,
    unidadeNome,
  } = useCorteOperacionalLista();

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="flex items-center gap-2 text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                <Scissors className="size-6 text-primary" aria-hidden />
                Corte Operacional
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                {unidadeNome ?? 'Selecione uma unidade'}
              </p>
            </div>
            <Button asChild>
              <Link href="/expedicao/corte-operacional/nova">
                <Plus className="size-4" aria-hidden />
                Solicitar corte
              </Link>
            </Button>
          </header>

          <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/50 bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {FILTROS.map((filtro) => (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => setFiltroStatus(filtro)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                    filtroStatus === filtro
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-low text-muted-foreground hover:text-foreground',
                  )}
                >
                  {FILTRO_CORTE_STATUS_LABELS[filtro]}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Código, rota, mapa…"
                className="h-8 w-full rounded-md border border-outline-variant/60 bg-surface-low py-1 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            {carregando ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando cortes…
              </div>
            ) : erro ? (
              <p className="py-16 text-center text-sm text-destructive">{erro}</p>
            ) : items.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Nenhum corte operacional encontrado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-surface-highest/50">
                      <th className="px-3 py-2 font-semibold text-muted-foreground">
                        Código
                      </th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">
                        Mapa
                      </th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">
                        Rota
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-muted-foreground">
                        Vol.
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-muted-foreground">
                        Peso
                      </th>
                      <th className="hidden px-3 py-2 font-semibold text-muted-foreground lg:table-cell">
                        Solicitante
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-surface-highest/40"
                      >
                        <td className="px-3 py-2 font-mono font-semibold text-foreground">
                          {item.codigo}
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2 text-foreground">
                          {item.mapaGrupoTitulo}
                        </td>
                        <td className="px-3 py-2 text-foreground">{item.rota}</td>
                        <td className="px-3 py-2 text-center tabular-nums text-foreground">
                          {item.totalVolumes ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-foreground">
                          {item.pesoTotalKg != null
                            ? item.pesoTotalKg.toLocaleString('pt-BR')
                            : '—'}
                        </td>
                        <td className="hidden px-3 py-2 text-foreground lg:table-cell">
                          {item.solicitadoPorNome ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <CorteStatusBadge status={item.status} compact />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Link
                            href={`/expedicao/corte-operacional/${item.id}`}
                            className="text-[11px] font-semibold text-primary hover:underline"
                          >
                            Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {totalPaginas > 1 ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {total} registro{total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-2 tabular-nums">
                  {page} / {totalPaginas}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPaginas}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </SidebarMain>
  );
}

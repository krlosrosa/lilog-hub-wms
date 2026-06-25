'use client';

import {
  AlertTriangle,
  Calendar,
  Compass,
  Filter,
  Loader2,
  Plus,
  Search,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { DevolucaoDemandRow } from '@/features/devolucao/components/devolucao-demand-row';
import { DevolucaoDockGrid } from '@/features/devolucao/components/devolucao-dock-grid';
import { DevolucaoKpiCard } from '@/features/devolucao/components/devolucao-kpi-card';
import { useDevolucaoGestao } from '@/features/devolucao/hooks/use-devolucao-gestao';
import {
  FILTRO_TIPO_LABELS,
  FILTROS_TIPO,
} from '@/features/devolucao/types/devolucao-gestao.schema';

const TABLE_HEADERS = [
  { label: 'Doca', className: 'w-16' },
  { label: 'Veículo / Placa', className: 'min-w-[120px]' },
  { label: 'Motorista', className: 'hidden sm:table-cell' },
  { label: 'Tipo', className: 'w-16' },
  { label: 'Prog.', className: 'w-24' },
  { label: 'Prev.', className: 'hidden md:table-cell w-16' },
  { label: 'Status', className: 'min-w-[80px]' },
  { label: 'Ações', className: 'w-20 text-center' },
] as const;

export function DevolucaoGestaoView() {
  const {
    isLoading,
    stats,
    demandas,
    dockSlots,
    operators,
    busca,
    setBusca,
    filtroTipo,
    setFiltroTipo,
    criarDemandaUrgente,
  } = useDevolucaoGestao();

  const handleNovaOperacao = async () => {
    const result = await criarDemandaUrgente();
    if (result.success) {
      toast.success('Nova operação urgente registrada.');
    }
  };

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Gestão de Demandas Diárias
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                FranchiseOS • Unidade Logística Principal
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded border border-outline-variant bg-muted px-3 py-2">
                <Calendar className="size-4 text-tertiary" aria-hidden />
                <span className="text-label-md">24 Outubro, 2023</span>
              </div>
              <Button type="button" variant="outline" size="sm">
                <Filter className="size-4" aria-hidden />
                Filtros Avançados
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-4">
            <DevolucaoKpiCard
              label="Demandas Ativas"
              icon={<Timer className="size-5 text-primary" aria-hidden />}
              value={
                <>
                  {stats.demandasAtivas}{' '}
                  <span className="text-body-md font-normal text-muted-foreground">
                    / {stats.demandasTotal}
                  </span>
                </>
              }
              badge={
                <span className="flex items-center gap-1 text-caption text-tertiary">
                  <TrendingUp className="size-4" aria-hidden />
                  12% vs Ontem
                </span>
              }
              progressPercent={(stats.demandasAtivas / stats.demandasTotal) * 100}
              progressClassName="bg-primary"
            />
            <DevolucaoKpiCard
              label="Tempo Médio de Carga"
              icon={<Timer className="size-5 text-tertiary" aria-hidden />}
              value={
                <>
                  {stats.tempoMedioMinutos}m{' '}
                  <span className="text-body-md font-normal text-muted-foreground">
                    {stats.tempoMedioSegundos}s
                  </span>
                </>
              }
              badge={
                <span className="flex items-center gap-1 text-caption text-tertiary">
                  <TrendingDown className="size-4" aria-hidden />
                  -4m vs Alvo
                </span>
              }
              progressPercent={80}
              progressClassName="bg-tertiary"
            />
            <DevolucaoKpiCard
              label="Ocupação de Docas"
              icon={<Warehouse className="size-5 text-secondary" aria-hidden />}
              value={`${stats.ocupacaoDocasPercent}%`}
              badge={
                <span className="text-caption text-muted-foreground">
                  {stats.docasOcupadas} de {stats.docasTotal} Ocupadas
                </span>
              }
              progressPercent={stats.ocupacaoDocasPercent}
              progressClassName="bg-secondary"
            />
            <DevolucaoKpiCard
              label="Veículos Atrasados"
              variant="critical"
              icon={
                <AlertTriangle className="size-5 text-destructive" aria-hidden />
              }
              value={
                <span className="text-destructive">
                  {String(stats.veiculosAtrasados).padStart(2, '0')}
                </span>
              }
              badge={
                <button
                  type="button"
                  className="cursor-pointer text-caption text-destructive underline underline-offset-4"
                >
                  Ver Detalhes
                </button>
              }
              progressPercent={15}
              progressClassName="bg-destructive"
            />
          </div>

          <div className="grid grid-cols-12 gap-gutter">
            <section className="col-span-12 space-y-4 xl:col-span-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xs font-semibold text-foreground">
                  Demandas em Tempo Real
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {FILTROS_TIPO.map((filtro) => (
                    <button
                      key={filtro}
                      type="button"
                      onClick={() => setFiltroTipo(filtro)}
                      className={cn(
                        'rounded px-2 py-1 text-[11px] transition-colors',
                        filtroTipo === filtro
                          ? 'border border-primary/20 bg-muted text-primary'
                          : 'text-muted-foreground hover:bg-muted/50',
                      )}
                    >
                      {FILTRO_TIPO_LABELS[filtro]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mb-2 max-w-md">
                <Search
                  className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar demandas, veículos ou docas..."
                  className="h-8 w-full rounded-full border border-outline-variant bg-muted py-1 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
                        {TABLE_HEADERS.map((h) => (
                          <th
                            key={h.label}
                            className={cn(
                              'border-b border-outline-variant px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                              h.className,
                            )}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {demandas.length === 0 ? (
                        <tr>
                          <td
                            colSpan={TABLE_HEADERS.length}
                            className="px-2 py-12 text-center text-xs text-muted-foreground"
                          >
                            Nenhuma demanda encontrada.
                          </td>
                        </tr>
                      ) : (
                        demandas.map((demanda) => (
                          <DevolucaoDemandRow
                            key={demanda.id}
                            demanda={demanda}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <aside className="col-span-12 space-y-gutter xl:col-span-4">
              <section className="rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-label-md font-bold uppercase tracking-wider text-foreground">
                    Status das Docas (1-20)
                  </h3>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-tertiary" aria-hidden />
                      Ativa
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-muted" aria-hidden />
                      Livre
                    </span>
                  </div>
                </div>
                <DevolucaoDockGrid slots={dockSlots} />
                <div className="mt-6 rounded-lg border border-outline-variant bg-muted/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-caption font-bold text-muted-foreground">
                      Média de Giro de Doca
                    </span>
                    <span className="font-mono text-primary">
                      {stats.mediaGiroDoca} v/h
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full bg-primary" />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-label-md font-bold uppercase tracking-wider text-foreground">
                    Líderes de Produtividade
                  </h3>
                  <Trophy className="size-5 text-secondary" aria-hidden />
                </div>
                <div className="space-y-4">
                  {operators.map((op) => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-10 items-center justify-center rounded-full border border-outline-variant bg-muted text-label-md font-bold">
                          {op.nome.charAt(0)}
                          <span
                            className={cn(
                              'absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold',
                              op.rank === 1
                                ? 'bg-tertiary text-on-tertiary-container'
                                : 'border border-outline-variant bg-muted text-foreground',
                            )}
                          >
                            {op.rank}
                          </span>
                        </div>
                        <div>
                          <p className="text-label-md font-bold">{op.nome}</p>
                          <p className="text-caption text-muted-foreground">
                            {op.movimentacoesPorHora} Movimentações / h
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            'font-mono',
                            op.rank === 1 ? 'text-tertiary' : 'text-foreground',
                          )}
                        >
                          {op.eficiencia}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Eficiência
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-6 w-full text-caption"
                >
                  Ver Ranking Completo
                </Button>
              </section>

              <section className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                <div className="pointer-events-none absolute inset-0 opacity-20">
                  <div className="absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-primary/30" />
                  <div className="absolute left-1/2 top-1/2 size-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/50" />
                </div>
                <div className="z-10 text-center">
                  <Compass className="mx-auto mb-2 size-10 text-primary" aria-hidden />
                  <p className="text-label-md font-bold">Radar de Veículos</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Aproximação em tempo real
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNovaOperacao}
          disabled={isLoading}
          className="fixed bottom-8 right-8 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
          aria-label="Nova operação urgente"
        >
          {isLoading ? (
            <Loader2 className="size-6 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-6" aria-hidden />
          )}
        </button>
      </main>
    </SidebarMain>
  );
}

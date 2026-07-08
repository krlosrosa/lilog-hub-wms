'use client';



import {

  AlertTriangle,

  Calendar,

  CheckCircle2,

  ClipboardList,

  Filter,

  Loader2,

  Package,

  Plus,

  RefreshCw,

  Search,

  Truck,

  Layers,

} from 'lucide-react';

import { toast } from 'sonner';



import { Button, cn } from '@lilog/ui';



import { SidebarMain } from '@/components/layout/sidebar';

import { DevolucaoDemandRow } from '@/features/devolucao/components/devolucao-demand-row';
import { DevolucaoGrupoRow } from '@/features/devolucao/components/devolucao-grupo-row';

import { IncluirDemandaManualDialog } from '@/features/devolucao/components/incluir-demanda-manual-dialog';
import { ModalCriarGrupoDescarga } from '@/features/devolucao/components/modal-criar-grupo-descarga';

import { DevolucaoKpiCard } from '@/features/devolucao/components/devolucao-kpi-card';

import { TipoNfBadge } from '@/features/devolucao/components/devolucao-status-badge';

import { useDevolucaoGestao } from '@/features/devolucao/hooks/use-devolucao-gestao';

import {

  DEVOLUCAO_NF_TIPO_LABELS,

  FILTRO_STATUS_LABELS,

  FILTROS_STATUS,

  formatPesoDevolucao,

} from '@/features/devolucao/types/devolucao-gestao.schema';



const TABLE_HEADERS = [

  { label: 'Código', className: 'min-w-[100px]' },

  { label: 'Transporte', className: 'min-w-[90px]' },

  { label: 'Placa', className: 'min-w-[80px]' },

  { label: 'Cliente', className: 'hidden sm:table-cell min-w-[120px]' },

  { label: 'NFs', className: 'w-12 text-center' },

  { label: 'Itens', className: 'hidden md:table-cell w-12 text-center' },

  { label: 'Tipo(s)', className: 'min-w-[100px]' },

  { label: 'Status', className: 'min-w-[90px]' },

  { label: 'Criada em', className: 'hidden lg:table-cell w-28' },

] as const;

const GRUPO_TABLE_HEADERS = [
  { label: 'Grupo', className: 'min-w-[100px]' },
  { label: 'Placa', className: 'min-w-[90px]' },
  { label: 'Doca', className: 'min-w-[70px]' },
  { label: 'Demandas', className: 'w-16 text-center' },
  { label: 'NFs', className: 'hidden md:table-cell w-12 text-center' },
  { label: 'Itens', className: 'hidden lg:table-cell w-12 text-center' },
  { label: 'Status', className: 'min-w-[120px]' },
  { label: 'Criado em', className: 'hidden lg:table-cell w-28' },
] as const;



export function DevolucaoGestaoView() {

  const {

    isLoading,

    stats,

    pesoPorStatus,

    demandas,

    grupos,

    tiposNfCounts,

    busca,

    setBusca,

    filtroStatus,

    setFiltroStatus,

    recarregar,

    unidadeId,

    incluirManualOpen,

    openIncluirManual,

    closeIncluirManual,

    onDemandaIncluida,

    abaAtiva,

    setAbaAtiva,

    demandasSelecionadas,

    toggleDemandaSelecionada,

    demandasSelecionadasLista,

    criarGrupoOpen,

    openCriarGrupo,

    closeCriarGrupo,

    criarGrupoDescarga,

    isUpdating,

  } = useDevolucaoGestao();

  const handleRecarregar = async () => {

    await recarregar();

    toast.success('Lista de demandas atualizada.');

  };



  const dataAtual = new Intl.DateTimeFormat('pt-BR', {

    day: 'numeric',

    month: 'long',

    year: 'numeric',

  }).format(new Date());



  return (

    <SidebarMain>

      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">

        <div className="mx-auto max-w-container space-y-gutter">

          <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

            <div>

              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">

                Gestão de Demandas de Devolução

              </h1>

              <p className="mt-1 text-body-md text-muted-foreground">

                {unidadeId

                  ? 'Demandas integradas com o backend'

                  : 'Selecione uma unidade para visualizar as demandas'}

              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <div className="flex items-center gap-2 rounded border border-outline-variant bg-muted px-3 py-2">

                <Calendar className="size-4 text-tertiary" aria-hidden />

                <span className="text-label-md">{dataAtual}</span>

              </div>

              <Button

                type="button"

                variant="outline"

                size="sm"

                disabled={isLoading || isUpdating || demandasSelecionadas.size < 1}

                onClick={openCriarGrupo}

              >

                <Layers className="size-4" aria-hidden />

                Agrupar descarga ({demandasSelecionadas.size})

              </Button>

              <Button

                type="button"

                variant="default"

                size="sm"

                disabled={isLoading || !unidadeId}

                onClick={openIncluirManual}

              >

                <Plus className="size-4" aria-hidden />

                Incluir Manual

              </Button>

              <Button

                type="button"

                variant="outline"

                size="sm"

                disabled={isLoading || !unidadeId}

                onClick={() => void handleRecarregar()}

              >

                {isLoading ? (

                  <Loader2 className="size-4 animate-spin" aria-hidden />

                ) : (

                  <RefreshCw className="size-4" aria-hidden />

                )}

                Atualizar

              </Button>

            </div>

          </header>



          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-4">

            <DevolucaoKpiCard

              label="Demandas Abertas"

              icon={<Package className="size-5 text-primary" aria-hidden />}

              value={stats.aberta}

              badge={

                <span className="text-caption text-muted-foreground">

                  de {stats.total} total

                </span>

              }

              footer={

                <p className="text-[10px] text-muted-foreground">

                  Peso: {formatPesoDevolucao(pesoPorStatus.aberta)}

                </p>

              }

              progressPercent={

                stats.total > 0 ? (stats.aberta / stats.total) * 100 : 0

              }

              progressClassName="bg-primary"

            />

            <DevolucaoKpiCard

              label="Em Análise"

              icon={<ClipboardList className="size-5 text-secondary" aria-hidden />}

              value={stats.emAnalise}

              badge={

                <span className="text-caption text-muted-foreground">

                  aguardando validação

                </span>

              }

              footer={

                <p className="text-[10px] text-muted-foreground">

                  Peso: {formatPesoDevolucao(pesoPorStatus.emAnalise)}

                </p>

              }

              progressPercent={

                stats.total > 0 ? (stats.emAnalise / stats.total) * 100 : 0

              }

              progressClassName="bg-secondary"

            />

            <DevolucaoKpiCard

              label="Em Execução"

              icon={<Truck className="size-5 text-tertiary" aria-hidden />}

              value={stats.emExecucao}

              badge={

                <span className="text-caption text-muted-foreground">

                  operação ativa

                </span>

              }

              footer={

                <p className="text-[10px] text-muted-foreground">

                  Peso: {formatPesoDevolucao(pesoPorStatus.emExecucao)}

                </p>

              }

              progressPercent={

                stats.total > 0 ? (stats.emExecucao / stats.total) * 100 : 0

              }

              progressClassName="bg-tertiary"

            />

            <DevolucaoKpiCard

              label="Concluídas"

              icon={

                <CheckCircle2 className="size-5 text-muted-foreground" aria-hidden />

              }

              value={stats.concluida}

              badge={

                <span className="text-caption text-muted-foreground">

                  {stats.cancelada > 0

                    ? `${stats.cancelada} cancelada(s)`

                    : 'finalizadas'}

                </span>

              }

              footer={

                <p className="text-[10px] text-muted-foreground">

                  Peso: {formatPesoDevolucao(pesoPorStatus.concluida)}

                </p>

              }

              progressPercent={

                stats.total > 0 ? (stats.concluida / stats.total) * 100 : 0

              }

              progressClassName="bg-muted-foreground"

            />

          </div>



          <div className="grid grid-cols-12 gap-gutter">

            <section className="col-span-12 space-y-4 xl:col-span-8">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex gap-1 rounded-lg border border-outline-variant bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('demandas')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      abaAtiva === 'demandas'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Demandas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('grupos')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      abaAtiva === 'grupos'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Descargas Agrupadas ({grupos.length})
                  </button>
                </div>

                {abaAtiva === 'demandas' ? (
                  <div className="flex flex-wrap gap-1.5">

                  {FILTROS_STATUS.map((filtro) => (

                    <button

                      key={filtro}

                      type="button"

                      onClick={() => setFiltroStatus(filtro)}

                      className={cn(

                        'rounded px-2 py-1 text-[11px] transition-colors',

                        filtroStatus === filtro

                          ? 'border border-primary/20 bg-muted text-primary'

                          : 'text-muted-foreground hover:bg-muted/50',

                      )}

                    >

                      {FILTRO_STATUS_LABELS[filtro]}

                    </button>

                  ))}

                </div>
                ) : null}

              </div>



              {abaAtiva === 'demandas' ? (
                <>
              <div className="relative mb-2 max-w-md">

                <Search

                  className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"

                  aria-hidden

                />

                <input

                  type="search"

                  value={busca}

                  onChange={(e) => setBusca(e.target.value)}

                  placeholder="Pesquisar por código, placa, transporte ou cliente..."

                  className="h-8 w-full rounded-full border border-outline-variant bg-muted py-1 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"

                />

              </div>



              <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">

                {isLoading ? (

                  <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground">

                    <Loader2 className="size-4 animate-spin" aria-hidden />

                    Carregando demandas...

                  </div>

                ) : !unidadeId ? (

                  <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground">

                    <AlertTriangle className="size-4 text-destructive" aria-hidden />

                    Selecione uma unidade logística para visualizar as demandas.

                  </div>

                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full border-collapse text-left text-xs">

                      <thead>

                        <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">

                          <th className="w-10 px-2 py-1.5" aria-label="Selecionar" />

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

                              colSpan={TABLE_HEADERS.length + 1}

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
                              selectable
                              selected={demandasSelecionadas.has(demanda.id)}
                              onToggleSelect={toggleDemandaSelecionada}

                            />

                          ))

                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>
                </>
              ) : (
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Carregando grupos...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
                            {GRUPO_TABLE_HEADERS.map((h) => (
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
                          {grupos.length === 0 ? (
                            <tr>
                              <td
                                colSpan={GRUPO_TABLE_HEADERS.length}
                                className="px-2 py-12 text-center text-xs text-muted-foreground"
                              >
                                Nenhuma descarga agrupada encontrada.
                              </td>
                            </tr>
                          ) : (
                            grupos.map((grupo) => (
                              <DevolucaoGrupoRow key={grupo.id} grupo={grupo} />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </section>



            <aside className="col-span-12 space-y-gutter xl:col-span-4">

              <section className="rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">

                <div className="mb-6 flex items-center justify-between">

                  <h3 className="text-label-md font-bold uppercase tracking-wider text-foreground">

                    Distribuição por Tipo de NF

                  </h3>

                  <Filter className="size-5 text-muted-foreground" aria-hidden />

                </div>

                <div className="space-y-4">

                  {(

                    Object.entries(DEVOLUCAO_NF_TIPO_LABELS) as [

                      keyof typeof DEVOLUCAO_NF_TIPO_LABELS,

                      string,

                    ][]

                  ).map(([tipo, label]) => {

                    const count = tiposNfCounts[tipo];

                    const percent =

                      stats.total > 0 ? (count / stats.total) * 100 : 0;



                    return (

                      <div key={tipo} className="space-y-2">

                        <div className="flex items-center justify-between">

                          <TipoNfBadge tipo={tipo} />

                          <span className="font-mono text-sm font-bold">

                            {count}

                          </span>

                        </div>

                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">

                          <div

                            className="h-full rounded-full bg-primary transition-all"

                            style={{ width: `${percent}%` }}

                          />

                        </div>

                        <p className="text-[10px] text-muted-foreground">

                          {label} — {percent.toFixed(0)}% das demandas

                        </p>

                      </div>

                    );

                  })}

                </div>

              </section>



              <section className="rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">

                <h3 className="mb-4 text-label-md font-bold uppercase tracking-wider text-foreground">

                  Resumo por Status

                </h3>

                <div className="space-y-3">

                  {[

                    { label: 'Rascunho', value: stats.rascunho },

                    { label: 'Abertas', value: stats.aberta },

                    { label: 'Em Análise', value: stats.emAnalise },

                    { label: 'Em Execução', value: stats.emExecucao },

                    { label: 'Concluídas', value: stats.concluida },

                    { label: 'Canceladas', value: stats.cancelada },

                  ].map((item) => (

                    <div

                      key={item.label}

                      className="flex items-center justify-between rounded-lg border border-outline-variant/50 bg-muted/30 px-3 py-2"

                    >

                      <span className="text-caption text-muted-foreground">

                        {item.label}

                      </span>

                      <span className="font-mono text-sm font-bold">

                        {item.value}

                      </span>

                    </div>

                  ))}

                </div>

              </section>

            </aside>

          </div>

        </div>

      </main>

      <IncluirDemandaManualDialog
        open={incluirManualOpen}
        onOpenChange={(open) => {
          if (open) {
            openIncluirManual();
          } else {
            closeIncluirManual();
          }
        }}
        unidadeId={unidadeId}
        onSuccess={onDemandaIncluida}
      />

      <ModalCriarGrupoDescarga
        open={criarGrupoOpen}
        onOpenChange={(open) => {
          if (open) {
            openCriarGrupo();
          } else {
            closeCriarGrupo();
          }
        }}
        unidadeId={unidadeId}
        demandasSelecionadas={demandasSelecionadasLista}
        isSubmitting={isUpdating}
        onSubmit={criarGrupoDescarga}
      />

    </SidebarMain>

  );

}



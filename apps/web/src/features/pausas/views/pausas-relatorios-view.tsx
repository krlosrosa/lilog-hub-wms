'use client';

import {
  Calendar,
  Filter,
  Loader2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { PausaStatusBadge } from '@/features/pausas/components/pausa-status-badge';
import { PausaTipoBadge } from '@/features/pausas/components/pausa-tipo-badge';
import {
  fieldLabelClassName,
  glassPanelClassName,
} from '@/features/pausas/components/pausas-panel-classes';
import { SessaoPausasContextBanner } from '@/features/pausas/components/sessao-pausas-context-banner';
import { usePausasRelatorios } from '@/features/pausas/hooks/use-pausas-relatorios';

const TABLE_HEADERS = [
  { label: 'Funcionário', className: 'min-w-[140px]' },
  { label: 'Equipe', className: 'hidden sm:table-cell min-w-[90px]' },
  { label: 'Início', className: 'w-14 text-center' },
  { label: 'Fim', className: 'hidden md:table-cell w-14 text-center' },
  { label: 'Duração', className: 'w-16 text-center' },
  { label: 'Tipo', className: 'w-20' },
  { label: 'Status', className: 'w-20' },
] as const;

export function PausasRelatoriosView() {
  const {
    isLoading,
    filtros,
    setDataReferencia,
    setFuncionario,
    aplicarFiltros,
    registros,
    resumoPorTipo,
    footerKpi,
    totalRegistros,
    funcionariosDisponiveis,
    semUnidade,
  } = usePausasRelatorios();

  const handleAplicar = async () => {
    const result = await aplicarFiltros();
    if (result.success) toast.success('Filtros aplicados.');
  };

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <header>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
              Relatórios de Pausas
            </h1>
            <p className="mt-1 text-body-md text-muted-foreground">
              Pausas finalizadas das sessões do dia selecionado
            </p>
          </header>

          <SessaoPausasContextBanner semUnidade={semUnidade} />

          {!semUnidade && (
            <>
              <section
                className={`${glassPanelClassName} flex flex-wrap items-end gap-4 p-5`}
              >
                <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                  <label htmlFor="data-referencia" className={fieldLabelClassName}>
                    Data de referência
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-low px-3 py-2">
                    <Calendar
                      className="size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <input
                      id="data-referencia"
                      type="date"
                      value={filtros.dataReferencia}
                      onChange={(e) => setDataReferencia(e.target.value)}
                      className="w-full border-none bg-transparent p-0 text-label-md text-foreground focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                  <label htmlFor="funcionario" className={fieldLabelClassName}>
                    Funcionário
                  </label>
                  <select
                    id="funcionario"
                    value={filtros.funcionario}
                    onChange={(e) => setFuncionario(e.target.value)}
                    className="rounded-lg border border-outline-variant bg-surface-low px-3 py-2 text-label-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {funcionariosDisponiveis.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 gap-2"
                  disabled={isLoading}
                  onClick={() => void handleAplicar()}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Filter className="size-4" />
                  )}
                  Atualizar
                </Button>
              </section>

              <section className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
                <div className={`${glassPanelClassName} lg:col-span-2 p-6`}>
                  <h3 className="text-headline-md font-semibold text-foreground">
                    Distribuição por tipo
                  </h3>
                  <p className="text-caption text-muted-foreground">
                    Pausas finalizadas no dia
                  </p>
                  <div className="mt-6 space-y-4">
                    {resumoPorTipo.map((item) => (
                      <div key={item.tipo} className="space-y-1">
                        <div className="flex justify-between text-label-md">
                          <span className="text-foreground">{item.tipo}</span>
                          <span className="text-muted-foreground">
                            {item.count} ({item.percent}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {totalRegistros === 0 && !isLoading && (
                      <p className="text-body-md text-muted-foreground">
                        Nenhuma pausa finalizada para esta data.
                      </p>
                    )}
                  </div>
                </div>
                <div className={`${glassPanelClassName} p-6`}>
                  <h3 className="text-headline-md font-semibold text-foreground">
                    Resumo do dia
                  </h3>
                  <dl className="mt-4 space-y-3 text-body-md">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total de pausas</dt>
                      <dd className="font-semibold text-foreground">
                        {footerKpi.totalPausas}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Média por pausa</dt>
                      <dd className="font-semibold text-foreground">
                        {footerKpi.mediaPausaPorTurno}
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>

              <section className={`${glassPanelClassName} overflow-hidden`}>
                <div className="border-b border-outline-variant px-3 py-2">
                  <h3 className="text-xs font-semibold text-foreground">
                    Registros Detalhados
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Somente pausas já finalizadas
                  </p>
                </div>
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
                      <Loader2 className="size-5 animate-spin" />
                      Carregando registros...
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
                          {TABLE_HEADERS.map((header) => (
                            <th
                              key={header.label}
                              className={cn(
                                'border-b border-outline-variant px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                                header.className,
                              )}
                            >
                              {header.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30">
                        {registros.map((reg) => (
                          <tr
                            key={reg.id}
                            className="group transition-colors hover:bg-surface-highest/50"
                          >
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-2">
                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                                  <User className="size-3 text-muted-foreground" />
                                </div>
                                <span className="truncate text-[11px] font-medium text-foreground">
                                  {reg.funcionario}
                                </span>
                              </div>
                            </td>
                            <td className="hidden px-2 py-1.5 text-[11px] text-muted-foreground sm:table-cell">
                              {reg.departamento}
                            </td>
                            <td className="px-2 py-1.5 text-center font-mono text-[10px] text-foreground">
                              {reg.inicio}
                            </td>
                            <td className="hidden px-2 py-1.5 text-center font-mono text-[10px] text-muted-foreground md:table-cell">
                              {reg.fim}
                            </td>
                            <td className="px-2 py-1.5 text-center font-mono text-[10px] font-semibold tabular-nums text-primary">
                              {reg.duracao}
                            </td>
                            <td className="px-2 py-1.5">
                              <PausaTipoBadge tipo={reg.tipo} compact />
                            </td>
                            <td className="px-2 py-1.5">
                              <PausaStatusBadge
                                kind="registro"
                                status={reg.status}
                                compact
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p className="border-t border-outline-variant px-3 py-1.5 text-[11px] text-muted-foreground">
                    Exibindo {registros.length} registro(s) finalizado(s)
                  </p>
                </div>
              </section>

              <footer className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <FooterKpi
                  label="Total de Pausas"
                  value={String(footerKpi.totalPausas)}
                />
                <FooterKpi
                  label="Média por Pausa"
                  value={footerKpi.mediaPausaPorTurno}
                />
                <FooterKpi
                  label="Minutos Térmicas"
                  value={`${footerKpi.pausasTermicasMinutos} min`}
                />
                <FooterKpi
                  label="Minutos Refeição"
                  value={`${footerKpi.pausasRefeicaoMinutos} min`}
                />
              </footer>
            </>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}

function FooterKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${glassPanelClassName} p-4 text-center`}>
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 text-headline-md font-bold text-foreground">{value}</p>
    </div>
  );
}

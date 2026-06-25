'use client';

import {
  AlertTriangle,
  Clock,
  Loader2,
  Search,
  Timer,
  TrendingUp,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { KpiCard } from '@/features/pausas/components/kpi-card';
import { PausaStatusBadge } from '@/features/pausas/components/pausa-status-badge';
import { PausaTipoBadge } from '@/features/pausas/components/pausa-tipo-badge';
import { glassPanelClassName } from '@/features/pausas/components/pausas-panel-classes';
import { SessaoPausasContextBanner } from '@/features/pausas/components/sessao-pausas-context-banner';
import { usePausasMonitor } from '@/features/pausas/hooks/use-pausas-monitor';

const TABLE_HEADERS = [
  'Operador',
  'Tipo de Pausa',
  'Início',
  'Previsão Retorno',
  'Status / Restante',
  'Ações',
] as const;

export function PausasMonitorView() {
  const {
    isLoading,
    isSubmitting,
    stats,
    operadores,
    busca,
    setBusca,
    clock,
    sessaoAtiva,
    sessoesAbertas,
    selectSessao,
    semUnidade,
    semSessaoAberta,
    encerrarPausa,
  } = usePausasMonitor();

  const handleEncerrar = async (funcionarioId: number) => {
    const result = await encerrarPausa(funcionarioId);
    if (result.success) {
      toast.success(`Pausa encerrada para ${result.nome}.`);
    }
  };

  const canOperate = !semUnidade && !semSessaoAberta && sessaoAtiva;

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Monitoramento de Pausas
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Visão em tempo real dos operadores em intervalo
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Pesquisar operadores..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  disabled={!canOperate}
                  className="w-full min-w-[16rem] rounded-full border border-outline-variant bg-surface-low py-2 pl-10 pr-4 text-body-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 md:w-64"
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-muted px-3 py-2 font-mono text-label-md">
                <Clock className="size-4 text-primary" aria-hidden />
                {clock}
              </div>
              <Button type="button" asChild>
                <Link href="/pausas/registro">Registrar Pausa</Link>
              </Button>
            </div>
          </header>

          <SessaoPausasContextBanner
            semUnidade={semUnidade}
            semSessaoAberta={semSessaoAberta}
            isLoading={isLoading && !sessaoAtiva}
            sessaoAtiva={sessaoAtiva}
            sessoesAbertas={sessoesAbertas}
            onSelectSessao={selectSessao}
            showDataReferenciaInSelector
            emptySessaoTitle="Nenhuma sessão aberta"
          />

          {canOperate && (
            <>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
                <KpiCard
                  label="Em Pausa agora"
                  icon={<Timer className="size-5 text-primary" aria-hidden />}
                  value={
                    <>
                      {stats.emPausa}{' '}
                      <span className="text-body-md font-normal text-muted-foreground">
                        / {stats.totalOperadores}
                      </span>
                    </>
                  }
                />
                <KpiCard
                  label="Atrasos no Retorno"
                  variant="critical"
                  icon={
                    <AlertTriangle
                      className="size-5 text-destructive"
                      aria-hidden
                    />
                  }
                  value={
                    <span className="text-destructive">
                      {String(stats.atrasosCriticos).padStart(2, '0')} Críticos
                    </span>
                  }
                />
                <KpiCard
                  label="Total Pausado Hoje"
                  variant="tertiary"
                  icon={<TrendingUp className="size-5 text-tertiary" aria-hidden />}
                  value={`${stats.totalPausadoMinutos} min`}
                />
              </div>

              <section className={`${glassPanelClassName} overflow-hidden`}>
                <div className="border-b border-outline-variant p-6">
                  <h2 className="text-headline-md font-semibold text-foreground">
                    Operadores em Intervalo
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
                      <Loader2 className="size-5 animate-spin" />
                      Carregando pausas...
                    </div>
                  ) : (
                    <table className="w-full min-w-[720px] text-left">
                      <thead className="bg-surface-high">
                        <tr className="text-label-md text-muted-foreground">
                          {TABLE_HEADERS.map((h) => (
                            <th key={h} className="px-6 py-4 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {operadores.map((op) => (
                          <tr
                            key={op.id}
                            className={cn(
                              'transition-colors hover:bg-surface-high',
                              op.status === 'atrasado' &&
                                'bg-destructive/5 ring-1 ring-inset ring-destructive/20',
                            )}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                                  <User className="size-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {op.nome}
                                  </p>
                                  <p className="font-mono text-caption text-muted-foreground">
                                    {op.matricula}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <PausaTipoBadge tipo={op.tipo} />
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-caption">
                              {op.inicio}
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-caption">
                              {op.previsaoRetorno}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <PausaStatusBadge
                                kind="monitor"
                                status={op.status}
                                tempo={op.tempoRestante}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={isSubmitting}
                                  onClick={() =>
                                    void handleEncerrar(op.funcionarioId)
                                  }
                                >
                                  {isSubmitting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    'ENCERRAR'
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {!isLoading && operadores.length === 0 && (
                    <p className="p-8 text-center text-body-md text-muted-foreground">
                      Nenhum operador em pausa no momento.
                    </p>
                  )}
                </div>
              </section>

              <div className={`${glassPanelClassName} p-6`}>
                <h3 className="text-headline-md font-semibold text-foreground">
                  Pausa mais longa do dia
                </h3>
                <p className="mt-4 font-mono text-display-lg text-primary">
                  {stats.pausaMaisLonga}
                </p>
                <p className="mt-2 text-body-md text-muted-foreground">
                  por {stats.pausaMaisLongaOperador}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}

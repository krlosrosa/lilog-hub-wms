'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { BalanceamentoCharts } from '@/features/distribuicao-demandas/components/balanceamento-charts';
import {
  BalanceamentoDesvioTable,
  BalanceamentoScoreCards,
} from '@/features/distribuicao-demandas/components/balanceamento-score-cards';
import {
  EquilibrioScoreGlobal,
} from '@/features/distribuicao-demandas/components/equilibrio-indicador';
import { useDistribuicaoSessao } from '@/features/distribuicao-demandas/hooks/use-distribuicao-sessao';

export function BalanceamentoView() {
  const { isLoading, temTransportes, state } = useDistribuicaoSessao();
  const { balanceamento, workloads, docas } = state;

  if (!isLoading && !temTransportes) {
    return (
      <SidebarMain>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground">Nenhum transporte para balancear.</p>
          <Button asChild variant="outline">
            <Link href="/op-wms/distribuicao-demandas">Voltar ao planejamento</Link>
          </Button>
        </main>
      </SidebarMain>
    );
  }

  return (
    <SidebarMain>
      <main className="min-h-dvh pb-12">
        <div className="px-margin-mobile pb-8 pt-6 md:px-margin-desktop md:pt-8">
          <div className="mx-auto max-w-container">
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <nav className="mb-1 text-xs text-muted-foreground">
                  <Link
                    href="/op-wms/distribuicao-demandas"
                    className="hover:text-foreground"
                  >
                    Planejamento
                  </Link>
                  <span className="mx-1">→</span>
                  <Link
                    href="/op-wms/distribuicao-demandas/sessao"
                    className="hover:text-foreground"
                  >
                    Distribuição
                  </Link>
                  <span className="mx-1">→</span>
                  <span>Balanceamento</span>
                </nav>
                <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                  Visão de Balanceamento
                </h1>
                <p className="mt-1 text-body-md text-muted-foreground">
                  Comparativo de scores entre workloads por transporte inteiro
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <EquilibrioScoreGlobal
                  score={balanceamento.scoreGlobalEquilibrio}
                />
                <span className="text-xs text-muted-foreground">
                  Desvio máx: {balanceamento.desvioMaximoPercentual}%
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href="/op-wms/distribuicao-demandas/sessao">
                    Voltar à distribuição
                  </Link>
                </Button>
              </div>
            </header>

            {isLoading ? (
              <div
                className="flex min-h-[320px] items-center justify-center"
                role="status"
                aria-label="Carregando balanceamento"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : workloads.length === 0 ? (
              <div className="rounded-xl border border-outline-variant p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum workload simulado. Configure a distribuição primeiro.
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/op-wms/distribuicao-demandas/sessao">
                    Ir para distribuição
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-gutter">
                <BalanceamentoScoreCards
                  workloads={workloads}
                  scoreMedio={balanceamento.scoreMedio}
                />
                <BalanceamentoCharts
                  workloads={workloads}
                  docas={docas}
                />
                <BalanceamentoDesvioTable
                  workloads={workloads}
                  scoreMedio={balanceamento.scoreMedio}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

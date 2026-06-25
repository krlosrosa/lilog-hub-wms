'use client';

import {
  Calendar,
  Filter,
  Loader2,
  RefreshCw,
  Shield,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { DevolucaoReportCard } from '@/features/devolucao/components/devolucao-report-card';
import { useDevolucaoRelatorios } from '@/features/devolucao/hooks/use-devolucao-relatorios';
import {
  RELATORIO_PERIODOS,
  RELATORIO_PERIODO_LABELS,
  RELATORIO_STATUS_LABELS,
  RELATORIO_STATUS_OPTIONS,
  RELATORIO_TAB_LABELS,
  RELATORIO_UNIDADE_LABELS,
  RELATORIO_UNIDADES,
  type RelatorioTab,
} from '@/features/devolucao/types/devolucao-relatorios.schema';

const TABS: RelatorioTab[] = ['favoritos', 'todos', 'recentes'];

export function DevolucaoRelatoriosView() {
  const {
    isRefreshing,
    activeTab,
    setActiveTab,
    filtros,
    setPeriodo,
    setUnidade,
    setStatus,
    relatorios,
    refreshResults,
    downloadReport,
    getDownloadStatus,
  } = useDevolucaoRelatorios();

  const handleRefresh = async () => {
    const result = await refreshResults();
    if (result.success) {
      toast.success('Resultados atualizados com sucesso.');
    }
  };

  const handleDownload = async (reportId: string) => {
    const result = await downloadReport(reportId);
    if (result.success) {
      toast.success('Relatório exportado com sucesso.');
    }
  };

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Central de Relatórios
              </h1>
              <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
                Acesse e exporte dados operacionais em tempo real para otimizar a
                gestão da sua unidade logística.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-surface-low p-1">
              {TABS.map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'rounded-lg px-4 py-2 text-label-md transition-all',
                    activeTab === tab
                      ? 'bg-secondary-container text-secondary-on-container hover:bg-secondary-container hover:text-secondary-on-container'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {RELATORIO_TAB_LABELS[tab]}
                </Button>
              ))}
            </div>
          </header>

          <section className="rounded-2xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="relatorio-periodo"
                  className="text-caption uppercase tracking-wider text-muted-foreground"
                >
                  Período
                </label>
                <div className="relative">
                  <Calendar
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
                    aria-hidden
                  />
                  <select
                    id="relatorio-periodo"
                    value={filtros.periodo}
                    onChange={(e) =>
                      setPeriodo(
                        e.target.value as typeof filtros.periodo,
                      )
                    }
                    className="w-full appearance-none rounded-lg border-none bg-surface py-3 pl-10 pr-4 text-label-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {RELATORIO_PERIODOS.map((periodo) => (
                      <option key={periodo} value={periodo}>
                        {RELATORIO_PERIODO_LABELS[periodo]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="relatorio-unidade"
                  className="text-caption uppercase tracking-wider text-muted-foreground"
                >
                  Unidade
                </label>
                <div className="relative">
                  <Warehouse
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
                    aria-hidden
                  />
                  <select
                    id="relatorio-unidade"
                    value={filtros.unidade}
                    onChange={(e) =>
                      setUnidade(
                        e.target.value as typeof filtros.unidade,
                      )
                    }
                    className="w-full appearance-none rounded-lg border-none bg-surface py-3 pl-10 pr-4 text-label-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {RELATORIO_UNIDADES.map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {RELATORIO_UNIDADE_LABELS[unidade]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="relatorio-status"
                  className="text-caption uppercase tracking-wider text-muted-foreground"
                >
                  Status
                </label>
                <div className="relative">
                  <Filter
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
                    aria-hidden
                  />
                  <select
                    id="relatorio-status"
                    value={filtros.status}
                    onChange={(e) =>
                      setStatus(e.target.value as typeof filtros.status)
                    }
                    className="w-full appearance-none rounded-lg border-none bg-surface py-3 pl-10 pr-4 text-label-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {RELATORIO_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {RELATORIO_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isRefreshing}
                  onClick={handleRefresh}
                  className="w-full gap-2 py-3 font-semibold hover:bg-primary hover:text-primary-foreground"
                >
                  {isRefreshing ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden />
                  )}
                  Atualizar Resultados
                </Button>
              </div>
            </div>
          </section>

          {relatorios.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant bg-card p-12 text-center">
              <p className="text-body-md text-muted-foreground">
                Nenhum relatório encontrado para esta aba.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {relatorios.map((report) => (
                <DevolucaoReportCard
                  key={report.id}
                  report={report}
                  downloadStatus={getDownloadStatus(report.id)}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}

          <footer className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant pt-8 md:flex-row">
            <div className="flex items-center gap-2 text-muted-foreground opacity-60">
              <Shield className="size-4" aria-hidden />
              <span className="text-caption">
                Dados protegidos por criptografia de ponta a ponta
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button
                type="button"
                className="text-caption text-muted-foreground transition-colors hover:text-primary"
              >
                Política de Retenção
              </button>
              <button
                type="button"
                className="text-caption text-muted-foreground transition-colors hover:text-primary"
              >
                Logs de Auditoria
              </button>
              <span className="text-caption text-muted-foreground">
                v2.4.0-premium
              </span>
            </div>
          </footer>
        </div>
      </main>
    </SidebarMain>
  );
}

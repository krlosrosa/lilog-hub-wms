'use client';

import type { ComponentType } from 'react';
import { useState } from 'react';

import Link from 'next/link';

import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock,
  Download,
  Filter,
  Loader2,
  LogOut,
  Package2,
  Printer,
  RotateCcw,
  Thermometer,
  Timer,
  Truck,
  User,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { Pagination } from '@/features/filiais/components/pagination';
import { ConferenceStatusBadge } from '@/features/devolucao/components/devolucao-status-badge';
import { ModalConfirmarFinalizarDevolucao } from '@/features/devolucao/components/modal-confirmar-finalizar-devolucao';
import type { FinalizarDevolucaoOpcoes } from '@/features/devolucao/components/modal-confirmar-finalizar-devolucao';
import {
  DevolucaoEvidenciaLightbox,
  isEvidenciaComZoom,
} from '@/features/devolucao/components/devolucao-evidencia-lightbox';
import { DevolucaoKpiCard } from '@/features/devolucao/components/devolucao-kpi-card';
import { DevolucaoTimeline } from '@/features/devolucao/components/devolucao-timeline';
import { useDevolucaoDetalhes } from '@/features/devolucao/hooks/use-devolucao-detalhes';
import type { ConferenceItemStatus } from '@/features/devolucao/types/devolucao-detalhes.schema';
import {
  canReabrirDemanda,
  DETALHE_STATUS_LABELS,
  isTemperaturaForaFaixa,
} from '@/features/devolucao/types/devolucao-detalhes.schema';

const nf = new Intl.NumberFormat('pt-BR');

const CONFERENCE_ICONS: Record<
  ConferenceItemStatus,
  ComponentType<{ className?: string }>
> = {
  concluido: CheckCircle2,
  pendente: Clock,
  divergente: CircleAlert,
  iniciando: Clock,
};

type DevolucaoDetalhesViewProps = {
  id: string;
};

export function DevolucaoDetalhesView({ id }: DevolucaoDetalhesViewProps) {
  const {
    isLoading,
    detalhe,
    conferenceItems,
    allConferenceItems,
    timeline,
    evidences,
    pagina,
    setPagina,
    totalPaginas,
    totalSkus,
    pageSize,
    isFinalizarOpen,
    openFinalizar,
    closeFinalizar,
    confirmarFinalizar,
    reabrirDemanda,
    imprimirRelatorio,
    reportarIncidente,
    liberarDoca,
    anexarEvidencia,
  } = useDevolucaoDetalhes(id);

  const [evidenciaZoomId, setEvidenciaZoomId] = useState<string | null>(null);
  const fotosEvidencia = evidences.filter(isEvidenciaComZoom);

  const handleConfirmarFinalizar = async (opcoes: FinalizarDevolucaoOpcoes) => {
    const result = await confirmarFinalizar(opcoes);
    if (!result.success) return;

    const extras: string[] = [];
    if (opcoes.liberarDoca) extras.push('doca liberada');
    if (opcoes.gerarLiberacaoAutomatica) extras.push('liberação automática gerada');

    toast.success('Processo finalizado com sucesso.', {
      description:
        extras.length > 0
          ? `Diferenças encaminhadas ao depósito. ${extras.join(' • ')}.`
          : 'Diferenças encaminhadas ao depósito para tratativa.',
    });
  };

  const handleReabrir = async () => {
    const result = await reabrirDemanda();
    if (result.success) toast.success('Demanda reaberta para conferência.');
  };

  const handleImprimir = async () => {
    const result = await imprimirRelatorio();
    if (result.success) toast.success('Relatório enviado para impressão.');
  };

  const handleIncidente = async () => {
    const result = await reportarIncidente();
    if (result.success) toast.error('Incidente reportado à central.');
  };

  const handleLiberarDoca = async () => {
    const result = await liberarDoca();
    if (result.success) toast.success('Doca liberada.');
  };

  const handleAnexar = async () => {
    const result = await anexarEvidencia();
    if (result.success) toast.success('Evidência anexada.');
  };

  const progressItens =
    (detalhe.totalItens / detalhe.totalItensEsperado) * 100;

  const isFinalizado = detalhe.status === 'finalizado';
  const podeReabrir = canReabrirDemanda(detalhe.status);

  const statusBadgeClass =
    detalhe.status === 'finalizado'
      ? 'border-muted-foreground/30 bg-muted text-muted-foreground'
      : detalhe.status === 'aguardando'
        ? 'border-secondary/30 bg-secondary/10 text-secondary'
        : 'border-tertiary/30 bg-tertiary/10 text-tertiary';

  const bauForaFaixa = isTemperaturaForaFaixa(
    detalhe.temperaturaBau,
    detalhe.temperaturaBauAlvo,
  );
  const produtoForaFaixa = isTemperaturaForaFaixa(
    detalhe.temperaturaProduto,
    detalhe.temperaturaProdutoAlvo,
  );

  const formatTemp = (valor: number) =>
    `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}°C`;

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-6">
          <nav className="text-caption text-muted-foreground">
            <Link href="/devolucao" className="hover:text-primary">
              Devolução
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{detalhe.placa}</span>
          </nav>

          <header className="flex flex-col gap-6 rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Truck className="size-8" aria-hidden />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-headline-md font-bold text-foreground">
                    {detalhe.placa}
                  </h1>
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-label-md',
                      statusBadgeClass,
                    )}
                  >
                    {DETALHE_STATUS_LABELS[detalhe.status]}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-body-md text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="size-4" aria-hidden />
                    {detalhe.motorista}
                  </span>
                  <span>ID: {detalhe.viagemId}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {podeReabrir ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={handleReabrir}
                  className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RotateCcw className="size-4" aria-hidden />
                  )}
                  Reabrir Demanda
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={handleImprimir}
                  >
                    <Printer className="size-4" aria-hidden />
                    Imprimir Relatório
                  </Button>
                  <Button
                    type="button"
                    disabled={isLoading || isFinalizado}
                    onClick={openFinalizar}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2 className="size-4" aria-hidden />
                    )}
                    Finalizar Processo
                  </Button>
                </>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
            <DevolucaoKpiCard
              label="Total de Itens"
              icon={
                <Package2 className="size-5 text-primary" aria-hidden />
              }
              value={
                <>
                  {nf.format(detalhe.totalItens)} /{' '}
                  <span className="opacity-40">
                    {nf.format(detalhe.totalItensEsperado)}
                  </span>
                </>
              }
              badge={
                <span className="flex items-center gap-1 text-caption text-tertiary">
                  +12%
                </span>
              }
              progressPercent={progressItens}
              progressClassName="bg-primary"
            />
            <DevolucaoKpiCard
              label="Temp. do Baú"
              variant={bauForaFaixa ? 'critical' : 'default'}
              icon={
                <Thermometer
                  className={cn(
                    'size-5',
                    bauForaFaixa ? 'text-destructive' : 'text-secondary',
                  )}
                  aria-hidden
                />
              }
              value={
                <>
                  {formatTemp(detalhe.temperaturaBau)}{' '}
                  <span className="text-body-md font-normal opacity-50">
                    (alvo {formatTemp(detalhe.temperaturaBauAlvo)})
                  </span>
                </>
              }
              badge={
                bauForaFaixa ? (
                  <span className="flex items-center gap-1 text-caption text-destructive">
                    <AlertTriangle className="size-3" aria-hidden />
                    Alerta
                  </span>
                ) : (
                  <span className="text-caption text-tertiary">OK</span>
                )
              }
            />
            <DevolucaoKpiCard
              label="Temp. do Produto"
              variant={produtoForaFaixa ? 'critical' : 'tertiary'}
              icon={
                <Thermometer
                  className={cn(
                    'size-5',
                    produtoForaFaixa ? 'text-destructive' : 'text-tertiary',
                  )}
                  aria-hidden
                />
              }
              value={
                <>
                  {formatTemp(detalhe.temperaturaProduto)}{' '}
                  <span className="text-body-md font-normal opacity-50">
                    (alvo {formatTemp(detalhe.temperaturaProdutoAlvo)})
                  </span>
                </>
              }
              badge={
                produtoForaFaixa ? (
                  <span className="flex items-center gap-1 text-caption text-destructive">
                    <AlertTriangle className="size-3" aria-hidden />
                    Alerta
                  </span>
                ) : (
                  <span className="text-caption text-tertiary">OK</span>
                )
              }
            />
            <DevolucaoKpiCard
              label="Início da Operação"
              icon={<Clock className="size-5 text-secondary" aria-hidden />}
              value={detalhe.inicioOperacao}
              footer={
                <p className="mt-4 text-caption text-muted-foreground">
                  Duração: {detalhe.duracao}
                </p>
              }
            />
            <DevolucaoKpiCard
              label="Estimativa de Término"
              icon={<Timer className="size-5 text-tertiary" aria-hidden />}
              value={detalhe.estimativaTermino}
              footer={
                <p className="mt-4 text-caption text-muted-foreground">
                  Eficiência: {detalhe.eficiencia}%
                </p>
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2 overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="flex items-center justify-between border-b border-outline-variant bg-muted/30 p-5">
                <h2 className="text-headline-md font-semibold">
                  Lista de Conferência
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded p-1.5 hover:bg-muted"
                    aria-label="Filtrar"
                  >
                    <Filter className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1.5 hover:bg-muted"
                    aria-label="Download"
                  >
                    <Download className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant bg-muted/30 text-caption uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">SKU</th>
                      <th className="px-5 py-3 font-semibold">Produto</th>
                      <th className="px-5 py-3 text-center font-semibold">
                        Previsto
                      </th>
                      <th className="px-5 py-3 text-center font-semibold">
                        Confirmado
                      </th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {conferenceItems.map((item) => {
                      const Icon = CONFERENCE_ICONS[item.status];
                      return (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <td className="px-5 py-3 font-mono text-muted-foreground">
                            {item.sku}
                          </td>
                          <td className="px-5 py-3 font-medium">
                            {item.produto}
                          </td>
                          <td className="px-5 py-3 text-center opacity-60">
                            {item.previsto} un
                          </td>
                          <td
                            className={cn(
                              'px-5 py-3 text-center',
                              item.status === 'concluido' && 'text-tertiary',
                              item.status === 'divergente' && 'text-destructive',
                              item.status === 'pendente' && 'text-primary',
                            )}
                          >
                            {item.confirmado} un
                          </td>
                          <td className="px-5 py-3">
                            <ConferenceStatusBadge status={item.status} />
                            <Icon className="sr-only" aria-hidden />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-outline-variant bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-caption text-muted-foreground">
                  Mostrando {conferenceItems.length} de {totalSkus} SKUs na
                  remessa
                </p>
                <Pagination
                  pagina={pagina}
                  totalPaginas={totalPaginas}
                  onChangePagina={setPagina}
                  itemsInicio={(pagina - 1) * pageSize}
                  totalFiltrados={totalSkus}
                  pageSize={pageSize}
                  resourceLabelPlural="SKUs"
                />
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-xl border border-outline-variant bg-glass-bg p-5 shadow-inner-glow backdrop-blur-glass">
                <h2 className="mb-6 text-headline-md font-semibold">
                  Linha do Tempo
                </h2>
                <DevolucaoTimeline steps={timeline} />
              </section>

              <section className="rounded-xl border border-outline-variant bg-glass-bg p-5 shadow-inner-glow backdrop-blur-glass">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-headline-md font-semibold">
                    Evidências ({evidences.filter((e) => !e.isPlaceholder).length})
                  </h2>
                  <button
                    type="button"
                    className="text-label-md text-primary hover:underline"
                    onClick={() => {
                      if (fotosEvidencia[0]) {
                        setEvidenciaZoomId(fotosEvidencia[0].id);
                      }
                    }}
                    disabled={fotosEvidencia.length === 0}
                  >
                    Ver todas
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {evidences.map((ev) =>
                    ev.isPlaceholder ? (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={handleAnexar}
                        disabled={isLoading}
                        className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant bg-muted transition-colors hover:bg-muted/80"
                      >
                        <span className="text-muted-foreground">+ Foto</span>
                        <span className="text-caption text-muted-foreground">
                          Anexar Nova
                        </span>
                      </button>
                    ) : (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setEvidenciaZoomId(ev.id)}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-outline-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Ampliar foto: ${ev.alt}`}
                      >
                        {ev.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ev.url}
                            alt={ev.alt}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-muted text-caption">
                            {ev.alt}
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                          <ZoomIn className="size-6 text-background" aria-hidden />
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </section>

              <DevolucaoEvidenciaLightbox
                evidences={evidences}
                selectedId={evidenciaZoomId}
                onSelectedIdChange={setEvidenciaZoomId}
              />

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={isLoading}
                  onClick={handleIncidente}
                >
                  <AlertTriangle className="size-4" aria-hidden />
                  Reportar Incidente
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={handleLiberarDoca}
                >
                  <LogOut className="size-4" aria-hidden />
                  Liberar Doca
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <ModalConfirmarFinalizarDevolucao
        open={isFinalizarOpen}
        onClose={closeFinalizar}
        onConfirm={handleConfirmarFinalizar}
        detalhe={detalhe}
        conferenceItems={allConferenceItems}
        isLoading={isLoading}
      />
    </SidebarMain>
  );
}

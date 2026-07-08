'use client';

import type { ComponentType } from 'react';
import { useState } from 'react';

import Link from 'next/link';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  Download,
  Loader2,
  MoreHorizontal,
  Package2,
  PackageX,
  Pencil,
  Printer,
  RotateCcw,
  Scale,
  Thermometer,
  Timer,
  Trash2,
  Truck,
  User,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { Pagination } from '@/features/filiais/components/pagination';
import { ConferenceStatusBadge } from '@/features/devolucao/components/devolucao-status-badge';
import { ModalConfirmarFinalizarDevolucao } from '@/features/devolucao/components/modal-confirmar-finalizar-devolucao';
import type { FinalizarDevolucaoOpcoes } from '@/features/devolucao/components/modal-confirmar-finalizar-devolucao';
import { ModalDemandaFalta } from '@/features/devolucao/components/modal-demanda-falta';
import { ModalLiberarArmazem } from '@/features/devolucao/components/modal-liberar-armazem';
import type { LiberarArmazemFormValues } from '@/features/devolucao/components/modal-liberar-armazem';
import { ModalRegistrarFaltaPeso } from '@/features/devolucao/components/modal-registrar-falta-peso';
import { DevolucaoChecklistSection } from '@/features/devolucao/components/devolucao-checklist-section';
import { DevolucaoKpiCard } from '@/features/devolucao/components/devolucao-kpi-card';
import { DevolucaoTimeline } from '@/features/devolucao/components/devolucao-timeline';
import { useDevolucaoDetalhes } from '@/features/devolucao/hooks/use-devolucao-detalhes';
import { getAvariaDetalheLabels } from '@/features/devolucao/lib/avaria-labels';
import {
  formatQuantidadeAvariada,
  getQuantidadeAvariadaForItem,
  itemHasAvaria,
  resolveAvariasForItem,
} from '@/features/devolucao/lib/resolve-avarias-for-item';
import {
  canFinalizarDemanda,
  canLiberarArmazem,
  canReabrirDemanda,
  canRegistrarDemandaFalta,
  canDeletarDemanda,
  DETALHE_STATUS_LABELS,
  FILTRO_CONDICAO_LABELS,
  FILTROS_CONDICAO,
  isTemperaturaForaFaixa,
  type ConferenceItemStatus,
} from '@/features/devolucao/types/devolucao-detalhes.schema';
import type { DevolucaoAvariaDetalhe } from '@/features/devolucao/types/devolucao-buscar.schema';

const nf = new Intl.NumberFormat('pt-BR');

function formatPesoKg(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} kg`;
}

const CONFERENCE_ICONS: Record<
  ConferenceItemStatus,
  ComponentType<{ className?: string }>
> = {
  concluido: CheckCircle2,
  pendente: Clock,
  divergente: CircleAlert,
  iniciando: Clock,
  'ajuste-peso': Scale,
};

type SidebarTab = 'timeline' | 'checklist';

type DevolucaoDetalhesViewProps = {
  id: string;
};

function AvariaDetalhePanel({ avarias }: { avarias: DevolucaoAvariaDetalhe[] }) {
  if (avarias.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Item marcado como avariado, mas nenhum registro de avaria foi encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {avarias.map((avaria) => {
        const labels = getAvariaDetalheLabels(avaria);

        return (
          <div
            key={avaria.id}
            className="rounded-md border border-destructive/20 bg-destructive/5 p-3"
          >
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                {labels.tipo}
              </span>
              {labels.natureza ? (
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {labels.natureza}
                </span>
              ) : null}
              {labels.causa ? (
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {labels.causa}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              {avaria.quantidadeCaixa > 0 ? (
                <span>
                  <span className="font-medium text-foreground">
                    {avaria.quantidadeCaixa}
                  </span>{' '}
                  caixa(s)
                </span>
              ) : null}
              {avaria.quantidadeUnidade > 0 ? (
                <span>
                  <span className="font-medium text-foreground">
                    {avaria.quantidadeUnidade}
                  </span>{' '}
                  unidade(s)
                </span>
              ) : null}
            </div>

            {avaria.observacao ? (
              <p className="mt-2 text-xs text-foreground/80">{avaria.observacao}</p>
            ) : null}

            {avaria.photoUrls.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {avaria.photoUrls.map((url, index) => (
                  <a
                    key={`${avaria.id}-photo-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-md border border-outline-variant transition-opacity hover:opacity-80"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto da avaria ${index + 1}`}
                      className="size-16 object-cover sm:size-20"
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function DevolucaoDetalhesView({ id }: DevolucaoDetalhesViewProps) {
  const {
    isLoading,
    loadError,
    detalhe,
    conferenceItems,
    allConferenceItems,
    avarias,
    filtroCondicao,
    setFiltroCondicao,
    contagemPorCondicao,
    timeline,
    checklist,
    checklistFotos,
    checklistFotoTotal,
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
    liberarArmazem,
    registrarDemandaFalta,
    salvarFaltaPeso,
    deletarDemanda,
    imprimirRelatorio,
    isLiberarArmazemOpen,
    openLiberarArmazem,
    closeLiberarArmazem,
    itensPesoVariavelElegiveis,
    faltasPesoEditaveis,
    faltaPesoEmEdicao,
    temItensPesoVariavel,
    isDemandaFaltaOpen,
    openDemandaFalta,
    closeDemandaFalta,
    isRegistrarFaltaPesoOpen,
    openRegistrarFaltaPeso,
    openEditarFaltaPeso,
    closeRegistrarFaltaPeso,
    isDeletarOpen,
    openDeletar,
    closeDeletar,
    unidadeId,
  } = useDevolucaoDetalhes(id);

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('timeline');
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleConfirmarFinalizar = async (opcoes: FinalizarDevolucaoOpcoes) => {
    const result = await confirmarFinalizar(opcoes);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

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
    else toast.error(result.error);
  };

  const handleLiberarArmazem = async (values: LiberarArmazemFormValues) => {
    const result = await liberarArmazem(values);
    if (result.success) {
      toast.success('Demanda liberada para armazém — aguardando conferência.');
    } else {
      toast.error(result.error);
    }
  };

  const handleDemandaFalta = async () => {
    const result = await registrarDemandaFalta();
    if (result.success) toast.success('Demanda de falta registrada e processo finalizado.');
    else toast.error(result.error);
  };

  const handleSalvarFaltaPeso = async (
    values: Parameters<typeof salvarFaltaPeso>[0],
  ) => {
    const result = await salvarFaltaPeso(values);
    if (result.success) {
      toast.success(
        values.faltaPesoId
          ? 'Diferença de peso atualizada.'
          : 'Diferença de peso registrada.',
      );
    } else {
      toast.error(result.error);
    }
  };

  const handleDeletar = async () => {
    const result = await deletarDemanda();
    if (result.success) toast.success('Demanda excluída.');
    else toast.error(result.error);
  };

  const handleImprimir = async () => {
    const result = await imprimirRelatorio();
    if (result.success) toast.success('Relatório enviado para impressão.');
  };

  const progressItens =
    (detalhe.totalItens / detalhe.totalItensEsperado) * 100;

  const isCancelada = detalhe.status === 'cancelada';
  const podeReabrir = canReabrirDemanda(detalhe.status, detalhe.statusDb);
  const podeFinalizar = canFinalizarDemanda(detalhe.status, detalhe.statusDb);
  const podeLiberarArmazem = canLiberarArmazem(detalhe.status, detalhe.statusDb);
  const podeRegistrarDemandaFalta = canRegistrarDemandaFalta(
    detalhe.status,
    detalhe.statusDb,
  );
  const podeDeletarDemanda = canDeletarDemanda(detalhe.status, detalhe.statusDb);
  const podeRegistrarFaltaPeso =
    !isCancelada &&
    temItensPesoVariavel &&
    itensPesoVariavelElegiveis.length > 0;
  const podeEditarFaltaPeso =
    !isCancelada && faltasPesoEditaveis.length > 0;

  const statusBadgeClass =
    detalhe.status === 'finalizado'
      ? 'border-muted-foreground/30 bg-muted text-muted-foreground'
      : detalhe.status === 'cancelada'
        ? 'border-destructive/30 bg-destructive/10 text-destructive'
        : detalhe.status === 'conferido'
          ? 'border-tertiary/30 bg-tertiary/10 text-tertiary'
          : detalhe.status === 'aguardando' ||
              detalhe.status === 'aguardando-conferencia'
            ? 'border-secondary/30 bg-secondary/10 text-secondary'
            : 'border-primary/30 bg-primary/10 text-primary';

  const bauForaFaixa = isTemperaturaForaFaixa(
    detalhe.temperaturaBau,
    detalhe.temperaturaBauAlvo,
  );
  const produtoForaFaixa = isTemperaturaForaFaixa(
    detalhe.temperaturaProduto,
    detalhe.temperaturaProdutoAlvo,
  );
  const hasTempBau = detalhe.temperaturaBau !== null;
  const hasTempProduto = detalhe.temperaturaProduto !== null;

  const formatTemp = (valor: number | null) =>
    valor === null
      ? '—'
      : `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}°C`;

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container space-y-4">
          {loadError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {loadError}
            </div>
          ) : null}

          <nav className="flex items-center gap-2 text-caption text-muted-foreground">
            <Link
              href="/devolucao"
              className="inline-flex items-center gap-1 transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Devolução
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">
              {detalhe.codigoDemanda}
            </span>
            {detalhe.placa !== '—' ? (
              <>
                <span aria-hidden>·</span>
                <span>{detalhe.placa}</span>
              </>
            ) : null}
          </nav>

          <header className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <Truck className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-foreground">
                    {detalhe.codigoDemanda}
                  </h1>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      statusBadgeClass,
                    )}
                  >
                    {DETALHE_STATUS_LABELS[detalhe.status]}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {detalhe.placa !== '—' ? (
                    <span className="inline-flex items-center gap-1">
                      <Truck className="size-3" aria-hidden />
                      {detalhe.placa}
                    </span>
                  ) : null}
                  {detalhe.cliente ? (
                    <>
                      <span className="hidden sm:inline" aria-hidden>
                        ·
                      </span>
                      <span>{detalhe.cliente}</span>
                    </>
                  ) : null}
                  <span className="hidden sm:inline" aria-hidden>
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" aria-hidden />
                    {detalhe.motorista}
                  </span>
                  <span className="hidden sm:inline" aria-hidden>
                    ·
                  </span>
                  <span className="font-mono text-[11px]">
                    {detalhe.viagemId}
                  </span>
                </div>
                {detalhe.observacao ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {detalhe.observacao}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {podeRegistrarFaltaPeso ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={openRegistrarFaltaPeso}
                  className="gap-1.5 border-secondary/30 text-secondary hover:bg-secondary/10"
                >
                  <Scale className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Registrar diferença de peso</span>
                  <span className="sm:hidden">Dif. peso</span>
                </Button>
              ) : null}
              {podeReabrir ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={handleReabrir}
                  className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RotateCcw className="size-3.5" aria-hidden />
                  )}
                  Reabrir Demanda
                </Button>
              ) : null}
              {podeFinalizar ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={isLoading}
                  onClick={openFinalizar}
                  className="gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-3.5" aria-hidden />
                  )}
                  Finalizar
                </Button>
              ) : null}
              {podeLiberarArmazem ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading || isCancelada}
                  onClick={openLiberarArmazem}
                  className="gap-1.5"
                >
                  <Warehouse className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Liberar Armazém</span>
                  <span className="sm:hidden">Armazém</span>
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={handleImprimir}
                className="gap-1.5"
              >
                <Printer className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Imprimir</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-8 px-0"
                    aria-label="Mais ações"
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {podeEditarFaltaPeso ? (
                    <DropdownMenuItem
                      disabled={isLoading}
                      onClick={() => {
                        const falta = faltasPesoEditaveis[0];
                        if (falta) openEditarFaltaPeso(falta);
                      }}
                      className="gap-2"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Editar diferença de peso
                    </DropdownMenuItem>
                  ) : null}
                  {podeRegistrarFaltaPeso ? (
                    <DropdownMenuItem
                      disabled={isLoading}
                      onClick={openRegistrarFaltaPeso}
                      className="gap-2"
                    >
                      <Scale className="size-3.5" aria-hidden />
                      Registrar diferença de peso
                    </DropdownMenuItem>
                  ) : null}
                  {podeRegistrarDemandaFalta ? (
                    <DropdownMenuItem
                      disabled={isLoading}
                      onClick={openDemandaFalta}
                      className="gap-2"
                    >
                      <PackageX className="size-3.5" aria-hidden />
                      Demanda de falta
                    </DropdownMenuItem>
                  ) : null}
                  {podeDeletarDemanda ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isLoading}
                        onClick={openDeletar}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Deletar demanda
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <DevolucaoKpiCard
              size="compact"
              label="Itens"
              icon={
                <Package2 className="size-3.5 text-primary" aria-hidden />
              }
              value={
                <>
                  {nf.format(detalhe.totalItens)}
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    / {nf.format(detalhe.totalItensEsperado)}
                  </span>
                </>
              }
              progressPercent={progressItens}
              progressClassName="bg-primary"
            />
            <DevolucaoKpiCard
              size="compact"
              label="Temp. Baú"
              variant={
                !hasTempBau ? 'default' : bauForaFaixa ? 'critical' : 'default'
              }
              icon={
                <Thermometer
                  className={cn(
                    'size-3.5',
                    !hasTempBau
                      ? 'text-muted-foreground'
                      : bauForaFaixa
                        ? 'text-destructive'
                        : 'text-secondary',
                  )}
                  aria-hidden
                />
              }
              value={formatTemp(detalhe.temperaturaBau)}
              badge={
                !hasTempBau ? (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Sem leitura
                  </span>
                ) : bauForaFaixa ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-destructive">
                    <AlertTriangle className="size-2.5" aria-hidden />
                    Alerta
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-tertiary">
                    OK
                  </span>
                )
              }
              footer={
                detalhe.temperaturaBauAlvo !== null ? (
                  <p className="text-[10px] text-muted-foreground">
                    alvo {formatTemp(detalhe.temperaturaBauAlvo)}
                  </p>
                ) : null
              }
            />
            <DevolucaoKpiCard
              size="compact"
              label="Temp. Produto"
              variant={
                !hasTempProduto
                  ? 'default'
                  : produtoForaFaixa
                    ? 'critical'
                    : 'tertiary'
              }
              icon={
                <Thermometer
                  className={cn(
                    'size-3.5',
                    !hasTempProduto
                      ? 'text-muted-foreground'
                      : produtoForaFaixa
                        ? 'text-destructive'
                        : 'text-tertiary',
                  )}
                  aria-hidden
                />
              }
              value={formatTemp(detalhe.temperaturaProduto)}
              badge={
                !hasTempProduto ? (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Sem leitura
                  </span>
                ) : produtoForaFaixa ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-destructive">
                    <AlertTriangle className="size-2.5" aria-hidden />
                    Alerta
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-tertiary">
                    OK
                  </span>
                )
              }
              footer={
                detalhe.temperaturaProdutoAlvo !== null ? (
                  <p className="text-[10px] text-muted-foreground">
                    alvo {formatTemp(detalhe.temperaturaProdutoAlvo)}
                  </p>
                ) : null
              }
            />
            <DevolucaoKpiCard
              size="compact"
              label="Início"
              icon={<Clock className="size-3.5 text-secondary" aria-hidden />}
              value={detalhe.inicioOperacao}
              footer={
                <p className="text-[10px] text-muted-foreground">
                  {detalhe.duracao}
                </p>
              }
            />
            <DevolucaoKpiCard
              size="compact"
              label="Estimativa"
              icon={<Timer className="size-3.5 text-tertiary" aria-hidden />}
              value={detalhe.estimativaTermino}
              footer={
                <p className="text-[10px] text-muted-foreground">
                  {detalhe.eficiencia !== null
                    ? `${detalhe.eficiencia}% eficiência`
                    : 'Eficiência indisponível'}
                </p>
              }
              className="col-span-2 sm:col-span-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <section className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass lg:col-span-2">
              <div className="border-b border-outline-variant px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    Conferência
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      ({totalSkus}
                      {filtroCondicao !== 'todos'
                        ? ` de ${allConferenceItems.length}`
                        : ''}{' '}
                      SKUs)
                    </span>
                  </h2>
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Download"
                  >
                    <Download className="size-3.5" aria-hidden />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {FILTROS_CONDICAO.map((filtro) => (
                    <button
                      key={filtro}
                      type="button"
                      onClick={() => setFiltroCondicao(filtro)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors',
                        filtroCondicao === filtro
                          ? 'border border-primary/20 bg-muted text-primary'
                          : 'text-muted-foreground hover:bg-muted/50',
                      )}
                    >
                      {FILTRO_CONDICAO_LABELS[filtro]}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0 text-[10px] tabular-nums',
                          filtroCondicao === filtro
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {contagemPorCondicao[filtro]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="w-8 px-2 py-2" aria-label="Expandir" />
                      <th className="px-3 py-2 font-semibold">SKU</th>
                      <th className="px-3 py-2 font-semibold">Produto</th>
                      <th className="hidden px-3 py-2 text-center font-semibold sm:table-cell">
                        Prev.
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Conf.
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Avar.
                      </th>
                      <th className="hidden px-3 py-2 text-center font-semibold md:table-cell">
                        Dif. peso
                      </th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {conferenceItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-8 text-center text-xs text-muted-foreground"
                        >
                          {allConferenceItems.length === 0
                            ? 'Nenhum item registrado para esta demanda.'
                            : 'Nenhum item corresponde ao filtro selecionado.'}
                        </td>
                      </tr>
                    ) : (
                      conferenceItems.flatMap((item) => {
                        const Icon = CONFERENCE_ICONS[item.status];
                        const hasAvaria = itemHasAvaria(item, avarias);
                        const isExpanded = expandedItemIds.has(item.id);
                        const itemAvarias = hasAvaria
                          ? resolveAvariasForItem(item, avarias)
                          : [];
                        const quantidadeAvariada = formatQuantidadeAvariada(
                          getQuantidadeAvariadaForItem(item, avarias),
                        );

                        const rows = [
                          <tr
                            key={item.id}
                            className={cn(
                              'transition-colors hover:bg-muted/20',
                              hasAvaria &&
                                'border-l-2 border-l-destructive/60',
                              hasAvaria && 'cursor-pointer',
                            )}
                            onClick={
                              hasAvaria
                                ? () => toggleItemExpanded(item.id)
                                : undefined
                            }
                          >
                            <td className="px-2 py-2">
                              {hasAvaria ? (
                                isExpanded ? (
                                  <ChevronDown
                                    className="size-3.5 text-destructive"
                                    aria-hidden
                                  />
                                ) : (
                                  <ChevronRight
                                    className="size-3.5 text-destructive"
                                    aria-hidden
                                  />
                                )
                              ) : null}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                              {item.sku}
                            </td>
                            <td className="max-w-[140px] truncate px-3 py-2 text-xs font-medium sm:max-w-none">
                              {item.produto}
                            </td>
                            <td className="hidden px-3 py-2 text-center text-xs tabular-nums text-muted-foreground sm:table-cell">
                              <span>{item.previsto}</span>
                              {item.quantidadeFiscalOriginal != null ? (
                                <span className="mt-0.5 block text-[10px] text-muted-foreground/80">
                                  NF: {Math.round(item.quantidadeFiscalOriginal)}
                                </span>
                              ) : null}
                            </td>
                            <td
                              className={cn(
                                'px-3 py-2 text-center text-xs font-medium tabular-nums',
                                item.status === 'concluido' && 'text-tertiary',
                                item.status === 'divergente' &&
                                  'text-destructive',
                                item.status === 'pendente' && 'text-primary',
                              )}
                            >
                              {item.confirmado}
                            </td>
                            <td
                              className={cn(
                                'px-3 py-2 text-center text-xs tabular-nums',
                                quantidadeAvariada
                                  ? 'font-medium text-destructive'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {quantidadeAvariada ?? '—'}
                            </td>
                            <td
                              className={cn(
                                'hidden px-3 py-2 text-center text-xs tabular-nums md:table-cell',
                                item.diferencaPesoKg != null
                                  ? 'font-medium text-secondary'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {item.diferencaPesoKg != null
                                ? formatPesoKg(item.diferencaPesoKg)
                                : item.pesoVariavel
                                  ? '—'
                                  : '—'}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-end gap-1.5">
                                {item.faltaPesoId ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      const falta = faltasPesoEditaveis.find(
                                        (entry) => entry.id === item.faltaPesoId,
                                      );
                                      if (falta) openEditarFaltaPeso(falta);
                                    }}
                                    disabled={isLoading || isCancelada}
                                    className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                                    title="Editar diferença de peso"
                                  >
                                    <Pencil className="size-3.5" aria-hidden />
                                    <span className="sr-only">
                                      Editar diferença de peso
                                    </span>
                                  </button>
                                ) : null}
                                <div className="flex items-center gap-1.5">
                                  {hasAvaria ? (
                                    <span
                                      className="inline-flex shrink-0 rounded-full bg-destructive/10 p-0.5"
                                      title="Avaria registrada"
                                    >
                                      <AlertTriangle
                                        className="size-3 text-destructive"
                                        aria-label="Avaria registrada"
                                      />
                                    </span>
                                  ) : null}
                                  <ConferenceStatusBadge
                                    status={item.status}
                                    compact
                                  />
                                </div>
                              </div>
                              <Icon className="sr-only" aria-hidden />
                            </td>
                          </tr>,
                        ];

                        if (hasAvaria && isExpanded) {
                          rows.push(
                            <tr key={`${item.id}-avaria`}>
                              <td colSpan={8} className="bg-muted/10 px-4 py-3">
                                <AvariaDetalhePanel avarias={itemAvarias} />
                              </td>
                            </tr>,
                          );
                        }

                        return rows;
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-2 border-t border-outline-variant bg-muted/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-muted-foreground">
                  {conferenceItems.length} de {totalSkus} SKUs
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

            <aside className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div
                className="flex border-b border-outline-variant"
                role="tablist"
                aria-label="Painel lateral"
              >
                {(
                  [
                    { id: 'timeline', label: 'Linha do tempo' },
                    {
                      id: 'checklist',
                      label: checklist
                        ? `Checklist (${Math.max(checklistFotoTotal, checklistFotos.length)})`
                        : 'Checklist',
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={sidebarTab === tab.id}
                    onClick={() => setSidebarTab(tab.id)}
                    className={cn(
                      'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                      sidebarTab === tab.id
                        ? 'border-b-2 border-primary bg-primary/5 text-primary'
                        : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-3">
                {sidebarTab === 'timeline' ? (
                  <DevolucaoTimeline steps={timeline} compact />
                ) : (
                  <DevolucaoChecklistSection
                    checklist={checklist}
                    fotos={checklistFotos}
                    fotoTotalInformado={checklistFotoTotal}
                    compact
                  />
                )}
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

      <ModalRegistrarFaltaPeso
        open={isRegistrarFaltaPesoOpen}
        onClose={closeRegistrarFaltaPeso}
        onConfirm={handleSalvarFaltaPeso}
        itensElegiveis={itensPesoVariavelElegiveis}
        faltaPesoEdicao={faltaPesoEmEdicao}
        isLoading={isLoading}
      />

      <ModalLiberarArmazem
        open={isLiberarArmazemOpen}
        onClose={closeLiberarArmazem}
        onConfirm={handleLiberarArmazem}
        codigoDemanda={detalhe.codigoDemanda}
        unidadeId={unidadeId}
        isLoading={isLoading}
      />

      <ModalDemandaFalta
        open={isDemandaFaltaOpen}
        onClose={closeDemandaFalta}
        onConfirm={handleDemandaFalta}
        codigoDemanda={detalhe.codigoDemanda}
        isLoading={isLoading}
      />

      <AlertDialog open={isDeletarOpen} onOpenChange={(open) => !open && closeDeletar()}>
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Deletar demanda?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação remove permanentemente a demanda{' '}
              <span className="font-medium text-foreground">
                {detalhe.codigoDemanda}
              </span>{' '}
              e todos os registros vinculados (NFs, itens e eventos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isLoading}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isLoading}
              onClick={() => void handleDeletar()}
              className="gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-3.5" aria-hidden />
              )}
              Deletar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMain>
  );
}

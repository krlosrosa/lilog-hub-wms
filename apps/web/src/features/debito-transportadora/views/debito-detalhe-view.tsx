'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  Package,
  PenLine,
  Scale,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { DetalheAnalise } from '@/features/debito-transportadora/components/detalhe-analise';
import { DetalheChecklistDevolucao } from '@/features/debito-transportadora/components/detalhe-checklist-devolucao';
import { DetalheConferenciaTable } from '@/features/debito-transportadora/components/detalhe-conferencia-table';
import { DetalheEvidencias } from '@/features/debito-transportadora/components/detalhe-evidencias';
import { DetalheInfoGeral } from '@/features/debito-transportadora/components/detalhe-info-geral';
import { DetalheRegistrosCorte } from '@/features/debito-transportadora/components/detalhe-registros-corte';
import { DebitoConversa } from '@/features/debito-transportadora/components/debito-conversa';
import { DetalheTimeline } from '@/features/debito-transportadora/components/detalhe-timeline';
import { DetalheTransporte } from '@/features/debito-transportadora/components/detalhe-transporte';
import { DetalheValorizacaoExcel } from '@/features/debito-transportadora/components/detalhe-valorizacao-excel';
import {
  ModalConfirmarAcaoDebito,
  type AcaoDebitoConfirmacao,
} from '@/features/debito-transportadora/components/modal-confirmar-acao-debito';
import { useDebitoDetalhe } from '@/features/debito-transportadora/hooks/use-debito-detalhe';
import { useDebitoItemActions } from '@/features/debito-transportadora/hooks/use-debito-item-actions';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { DebitoStatusBadge } from '@/features/debito-transportadora/components/debito-status-badge';
import { isStatusEmInvestigacao } from '@/features/debito-transportadora/lib/map-processo-debito';

type DebitoDetalheViewProps = {
  debitoId: string;
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const kpiCardClass = cn(
  'relative overflow-hidden rounded-lg border border-outline-variant/50',
  'bg-glass-bg px-3 py-2 shadow-inner-glow backdrop-blur-glass',
);

type KpiCardProps = {
  label: string;
  value: string;
  icon: typeof DollarSign;
  accent?: 'default' | 'tertiary' | 'destructive' | 'primary';
};

function KpiCard({ label, value, icon: Icon, accent = 'default' }: KpiCardProps) {
  const valueColor = {
    default: 'text-foreground',
    tertiary: 'text-tertiary',
    destructive: 'text-destructive',
    primary: 'text-primary',
  }[accent];

  const iconColor = {
    default: 'text-primary',
    tertiary: 'text-tertiary',
    destructive: 'text-destructive',
    primary: 'text-primary',
  }[accent];

  return (
    <div className={kpiCardClass}>
      <Icon
        className={cn(
          'pointer-events-none absolute -right-1 -top-1 size-7 opacity-[0.08]',
          iconColor,
        )}
        aria-hidden
      />
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-0.5 font-mono text-sm font-bold leading-tight tabular-nums', valueColor)}>
        {value}
      </p>
    </div>
  );
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-low/80 px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-outline-variant">
      <Icon className="size-3 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

export function DebitoDetalheView({ debitoId }: DebitoDetalheViewProps) {
  const { unidadeSelecionada } = useUnidadeContext();
  const {
    debito,
    isLoading,
    notFound,
    notasAnalista,
    setNotasAnalista,
    salvandoNota,
    processandoAcao,
    baixandoMapa,
    actions,
    recarregar,
    conferenciaItensPagina,
    conferenciaPagina,
    conferenciaTotalPaginas,
    conferenciaItemsInicio,
    conferenciaTotalItens,
    conferenciaPageSize,
    setPaginaConferencia,
    buscaConferencia,
    setBuscaConferencia,
  } = useDebitoDetalhe(debitoId);

  const itemActions = useDebitoItemActions({
    processoId: debitoId,
    unidadeId: unidadeSelecionada?.id ?? null,
    onRefetch: recarregar,
  });

  const [acaoConfirmacao, setAcaoConfirmacao] =
    useState<AcaoDebitoConfirmacao | null>(null);

  const abrirConfirmacao = useCallback((acao: AcaoDebitoConfirmacao) => {
    setAcaoConfirmacao(acao);
  }, []);

  const fecharConfirmacao = useCallback(() => {
    if (!processandoAcao) {
      setAcaoConfirmacao(null);
    }
  }, [processandoAcao]);

  const confirmarAcao = useCallback(async () => {
    if (!acaoConfirmacao) {
      return;
    }

    if (acaoConfirmacao === 'assinatura') {
      await actions.enviarParaAssinatura();
    } else {
      await actions.cancelarCobranca();
    }

    setAcaoConfirmacao(null);
  }, [acaoConfirmacao, actions]);

  if (isLoading) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile py-16 md:px-margin-desktop">
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-body-md text-muted-foreground">
            Carregando processo de débito…
          </p>
        </main>
      </SidebarMain>
    );
  }

  if (!debito || notFound) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-16 md:px-margin-desktop">
          <div className="max-w-md text-center">
            <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
              Ocorrência não encontrada
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              Não há processo de débito correspondente ao identificador
              informado.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/debito-transportadora">
                Voltar para débitos
              </Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const statusEmInvestigacao = isStatusEmInvestigacao(debito.status);

  return (
    <SidebarMain>
      <ModalConfirmarAcaoDebito
        open={acaoConfirmacao !== null}
        acao={acaoConfirmacao}
        debito={debito}
        processando={processandoAcao}
        onOpenChange={(aberto) => {
          if (!aberto) {
            fecharConfirmacao();
          }
        }}
        onConfirm={() => void confirmarAcao()}
      />

      <main className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              <Link
                href="/debito-transportadora"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3" aria-hidden />
                Débitos
              </Link>
              <ChevronRight className="size-3 shrink-0" aria-hidden />
              <span className="font-medium text-foreground">{debito.protocolo}</span>
            </nav>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={processandoAcao}
                onClick={() => abrirConfirmacao('cancelar')}
              >
                Cancelar cobrança
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5"
                disabled={processandoAcao}
                onClick={() => abrirConfirmacao('assinatura')}
              >
                <PenLine className="size-3.5" aria-hidden />
                Aprovar cobrança
              </Button>
            </div>
          </div>

          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {debito.protocolo}
              </h1>
              {statusEmInvestigacao ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-tertiary/30 bg-tertiary-container/15 px-2 py-0.5 text-[10px] font-semibold text-tertiary">
                  <span
                    className="size-1.5 rounded-full bg-tertiary shadow-[0_0_6px_hsl(var(--tertiary)/0.5)]"
                    aria-hidden
                  />
                  Em Investigação
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-outline-variant bg-surface-low px-2 py-0.5">
                  <DebitoStatusBadge status={debito.status} compact />
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <MetaChip icon={Clock}>
                {debito.criadaHaDias}{' '}
                {debito.criadaHaDias === 1 ? 'dia' : 'dias'} aberta
              </MetaChip>
              <MetaChip icon={Package}>{debito.transportadora}</MetaChip>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiCard
              label="Valor Reclamado"
              value={formatCurrency(debito.valorReclamado)}
              icon={DollarSign}
              accent="tertiary"
            />
            <KpiCard
              label="Peso Afetado"
              value={`${debito.pesoAfetadoKg.toLocaleString('pt-BR')} kg`}
              icon={Scale}
            />
            <KpiCard
              label="Itens Conferidos"
              value={String(debito.itensConferidos.length)}
              icon={Package}
              accent="primary"
            />
            <KpiCard
              label="Anomalias"
              value={String(debito.totalAnomalias)}
              icon={AlertTriangle}
              accent={debito.totalAnomalias > 0 ? 'destructive' : 'default'}
            />
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8">
              <DetalheInfoGeral
                debito={debito}
                onEditar={actions.editarDados}
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <DetalheTransporte debito={debito} />
            </div>
            <div className="col-span-12">
              <DetalheConferenciaTable
                itensPagina={conferenciaItensPagina}
                totalAnomalias={debito.totalAnomalias}
                busca={buscaConferencia}
                onChangeBusca={setBuscaConferencia}
                pagina={conferenciaPagina}
                totalPaginas={conferenciaTotalPaginas}
                onChangePagina={setPaginaConferencia}
                totalFiltrados={conferenciaTotalItens}
                itemsInicio={conferenciaItemsInicio}
                pageSize={conferenciaPageSize}
                selectedIds={itemActions.selectedIds}
                disabled={itemActions.isUpdating || itemActions.isRemoving}
                onToggleSelect={itemActions.toggleSelect}
                onToggleSelectAll={itemActions.toggleSelectAll}
                onUpdateItem={itemActions.atualizarItem}
                onRemoveItem={itemActions.removerItem}
                onBulkStatus={itemActions.aplicarStatusEmMassa}
              />
            </div>
            <div className="col-span-12">
              <DetalheValorizacaoExcel
                processoId={debitoId}
                unidadeId={unidadeSelecionada?.id ?? null}
                itens={debito.itensConferidos}
                onRefetch={recarregar}
                disabled={itemActions.isUpdating || itemActions.isRemoving}
              />
            </div>
            <div className="col-span-12">
              <DetalheRegistrosCorte
                registros={debito.registrosCorte}
                mapaSeparacao={debito.mapaSeparacao}
                baixandoMapa={baixandoMapa}
                onBaixarMapa={() => void actions.baixarMapaSeparacao()}
              />
            </div>
            <div className="col-span-12">
              <DebitoConversa
                processoId={debitoId}
                unidadeId={unidadeSelecionada?.id ?? ''}
                status={debito.status}
                interacoes={debito.interacoes}
                onSuccess={() => void recarregar()}
              />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <DetalheEvidencias
                evidencias={debito.evidencias}
                onUpload={actions.uploadEvidencia}
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <DetalheChecklistDevolucao demandaId={debito.demandaId} />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <DetalheAnalise
                notasAnalista={notasAnalista}
                salvandoNota={salvandoNota}
                onNotasChange={setNotasAnalista}
                onSalvarNota={() => void actions.salvarNota()}
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <DetalheTimeline eventos={debito.timeline} />
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

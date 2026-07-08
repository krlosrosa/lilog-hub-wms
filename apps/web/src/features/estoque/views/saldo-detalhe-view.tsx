'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  History,
  Loader2,
  Lock,
  LockOpen,
  Pencil,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
import { AjustarSaldoDialog } from '@/features/estoque/components/ajustar-saldo-dialog';
import { BloquearSaldoDialog } from '@/features/estoque/components/bloquear-saldo-dialog';
import { DesbloquearSaldoDialog } from '@/features/estoque/components/desbloquear-saldo-dialog';
import { SaldoDetalheHeader } from '@/features/estoque/components/saldo-detalhe-header';
import { TransferirSaldoDialog } from '@/features/estoque/components/transferir-saldo-dialog';
import { useHistoricoProduto } from '@/features/estoque/hooks/use-historico-produto';
import { useSaldoDetalhe } from '@/features/estoque/hooks/use-saldo-detalhe';
import {
  formatDescricaoMovimento,
  formatQuantidadeMovimento,
  formatTituloMovimento,
  quantidadeToneClassNameByDirecao,
} from '@/features/estoque/lib/format-historico-movimento';
import type { HistoricoMovimentacaoItem } from '@/features/estoque/types/estoque-gestao.schema';
import type { TipoMovimentoEstoque } from '@/features/estoque/types/estoque.api';

type SaldoDetalheViewProps = {
  saldoEnderecoId: string;
};

type DialogType = 'bloquear' | 'desbloquear' | 'ajustar' | 'transferir' | null;

const nf = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const dtf = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const glassPanelClassName =
  'rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass';

function MovimentoIcon({ tipo }: { tipo: TipoMovimentoEstoque }) {
  const className = 'size-3.5';

  switch (tipo) {
    case 'ENTRADA':
      return <ArrowDownLeft className={className} aria-hidden />;
    case 'SAIDA':
      return <ArrowUpRight className={className} aria-hidden />;
    case 'TRANSFERENCIA_DEPOSITO':
      return <ArrowLeftRight className={className} aria-hidden />;
    case 'AJUSTE':
      return <Lock className={className} aria-hidden />;
    case 'ESTORNO':
      return <RefreshCw className={className} aria-hidden />;
    default:
      return <History className={className} aria-hidden />;
  }
}

function HistoricoItem({ item }: { item: HistoricoMovimentacaoItem }) {
  const descricao = formatDescricaoMovimento(item, nf);
  const quantidade = formatQuantidadeMovimento(item, nf);

  return (
    <div className="flex gap-3 border-b border-outline-variant/40 py-3 last:border-b-0">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-low">
        <MovimentoIcon tipo={item.tipoMovimento} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {formatTituloMovimento(item)}
          </p>
          <p
            className={cn(
              'font-mono text-sm font-bold tabular-nums',
              quantidade.signed
                ? quantidadeToneClassNameByDirecao(item)
                : 'text-foreground',
            )}
          >
            {quantidade.prefix}
            {quantidade.quantidade} {quantidade.unidadeMedida}
          </p>
        </div>
        {descricao ? (
          <p className="mt-0.5 text-xs font-medium text-foreground">
            {descricao}
          </p>
        ) : null}
        {item.motivo ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.motivo}</p>
        ) : null}
        {(item.enderecoOrigemMascarado || item.enderecoDestinoMascarado) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {item.enderecoOrigemMascarado ? (
              <span>{item.enderecoOrigemMascarado}</span>
            ) : null}
            {item.enderecoOrigemMascarado && item.enderecoDestinoMascarado ? (
              <span> → </span>
            ) : null}
            {item.enderecoDestinoMascarado ? (
              <span>{item.enderecoDestinoMascarado}</span>
            ) : null}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          {dtf.format(new Date(item.occurredAt))}
          {item.operatorNome ? ` · ${item.operatorNome}` : ''}
        </p>
      </div>
    </div>
  );
}

export function SaldoDetalheView({ saldoEnderecoId }: SaldoDetalheViewProps) {
  const [dialogAberto, setDialogAberto] = useState<DialogType>(null);

  const {
    saldo,
    motivosBloqueio,
    isLoading,
    notFound,
    processandoAcao,
    actions,
  } = useSaldoDetalhe(saldoEnderecoId);

  const produtoHistorico = useMemo(
    () =>
      saldo
        ? {
            produtoId: saldo.produtoId,
            produtoSku: saldo.produtoSku,
            produtoDescricao: saldo.produtoDescricao,
            lote: saldo.lote,
            depositoId: saldo.depositoId,
            enderecoId: saldo.enderecoId,
            enderecoMascarado: saldo.enderecoMascarado,
          }
        : null,
    [saldo],
  );

  const {
    isLoading: historicoLoading,
    isLoadingMore,
    itens: historicoItens,
    hasMore,
    carregarMais,
  } = useHistoricoProduto(produtoHistorico);

  const saldoDisponivel = useMemo(() => {
    if (!saldo) {
      return 0;
    }

    if (saldo.status === 'bloqueado' || saldo.natureza === 'debito') {
      return 0;
    }

    return Math.max(0, saldo.quantidade - saldo.saldoReservado);
  }, [saldo]);

  const fecharDialog = () => setDialogAberto(null);

  const executarEFechar = async (acao: () => Promise<unknown>) => {
    const sucesso = await acao();
    if (sucesso) {
      fecharDialog();
    }
  };

  if (isLoading) {
    return (
      <SidebarMain>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
        </div>
      </SidebarMain>
    );
  }

  if (notFound || !saldo) {
    return (
      <SidebarMain>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-headline-sm font-semibold text-foreground">
            Saldo não encontrado
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            O item de estoque solicitado não existe ou foi removido.
          </p>
          <Button asChild className="mt-6">
            <Link href="/estoque">Voltar ao estoque</Link>
          </Button>
        </div>
      </SidebarMain>
    );
  }

  const podeBloquear = saldo.status === 'liberado' && saldo.quantidade > 0;
  const podeDesbloquear = saldo.status === 'bloqueado';
  const podeAjustar = saldo.quantidade >= 0;
  const podeTransferir =
    saldo.status === 'liberado' && saldo.quantidade > 0 && saldo.natureza === 'fisico';

  return (
    <SidebarMain>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-fit gap-2 px-0 text-muted-foreground hover:text-primary"
        >
          <Link href="/estoque">
            <ArrowLeft className="size-4" aria-hidden />
            Voltar ao estoque
          </Link>
        </Button>

        <SaldoDetalheHeader saldo={saldo} />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <EnderecoKpiCard
            icon={<Boxes className="size-4 shrink-0 text-primary" aria-hidden />}
            label="Quantidade"
            value={`${nf.format(saldo.quantidade)} ${saldo.unidadeMedida}`}
          />
          <EnderecoKpiCard
            icon={
              <TrendingDown
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            }
            label="Reservado"
            value={`${nf.format(saldo.saldoReservado)} ${saldo.unidadeMedida}`}
          />
          <EnderecoKpiCard
            icon={
              <ArrowDownLeft
                className="size-4 shrink-0 text-tertiary"
                aria-hidden
              />
            }
            label="Disponível"
            value={`${nf.format(saldoDisponivel)} ${saldo.unidadeMedida}`}
          />
          <EnderecoKpiCard
            icon={
              <Lock
                className={cn(
                  'size-4 shrink-0',
                  saldo.status === 'bloqueado'
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
                aria-hidden
              />
            }
            label="Status"
            value={saldo.status === 'bloqueado' ? 'Bloqueado' : 'Liberado'}
            variant={saldo.status === 'bloqueado' ? 'critical' : 'default'}
          />
        </div>

        <section className={cn(glassPanelClassName, 'p-5')}>
          <h2 className="text-label-lg font-semibold text-foreground">Ações</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie bloqueios, ajustes e movimentações deste saldo.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!podeBloquear || processandoAcao}
              onClick={() => setDialogAberto('bloquear')}
              className="gap-2"
            >
              <Lock className="size-4" aria-hidden />
              Bloquear
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!podeDesbloquear || processandoAcao}
              onClick={() => setDialogAberto('desbloquear')}
              className="gap-2"
            >
              <LockOpen className="size-4" aria-hidden />
              Desbloquear
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!podeAjustar || processandoAcao}
              onClick={() => setDialogAberto('ajustar')}
              className="gap-2"
            >
              <Pencil className="size-4" aria-hidden />
              Ajustar quantidade
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!podeTransferir || processandoAcao}
              onClick={() => setDialogAberto('transferir')}
              className="gap-2"
            >
              <ArrowLeftRight className="size-4" aria-hidden />
              Transferir posição
            </Button>
          </div>
        </section>

        <section className={cn(glassPanelClassName, 'p-5')}>
          <div className="mb-4 flex items-center gap-2">
            <History className="size-4 text-primary" aria-hidden />
            <h2 className="text-label-lg font-semibold text-foreground">
              Histórico de movimentações
            </h2>
          </div>

          {historicoLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando histórico...
            </div>
          ) : historicoItens.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Nenhuma movimentação registrada para este item.
            </p>
          ) : (
            <div>
              {historicoItens.map((item) => (
                <HistoricoItem key={item.id} item={item} />
              ))}

              {hasMore ? (
                <div className="pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLoadingMore}
                    onClick={carregarMais}
                    className="gap-2"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    Carregar mais
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      <BloquearSaldoDialog
        open={dialogAberto === 'bloquear'}
        saldo={saldo}
        motivos={motivosBloqueio}
        processando={processandoAcao}
        onOpenChange={(open) => !open && fecharDialog()}
        onConfirm={(params) =>
          executarEFechar(() => actions.bloquear(params))
        }
      />

      <DesbloquearSaldoDialog
        open={dialogAberto === 'desbloquear'}
        saldo={saldo}
        processando={processandoAcao}
        onOpenChange={(open) => !open && fecharDialog()}
        onConfirm={(params) =>
          executarEFechar(() => actions.desbloquear(params))
        }
      />

      <AjustarSaldoDialog
        open={dialogAberto === 'ajustar'}
        saldo={saldo}
        processando={processandoAcao}
        onOpenChange={(open) => !open && fecharDialog()}
        onConfirm={(params) => executarEFechar(() => actions.ajustar(params))}
      />

      <TransferirSaldoDialog
        open={dialogAberto === 'transferir'}
        saldo={saldo}
        processando={processandoAcao}
        onOpenChange={(open) => !open && fecharDialog()}
        onConfirm={(params) =>
          executarEFechar(() => actions.transferir(params))
        }
      />
    </SidebarMain>
  );
}

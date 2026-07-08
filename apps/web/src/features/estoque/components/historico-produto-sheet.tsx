'use client';

import Link from 'next/link';

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  History,
  Loader2,
  Lock,
  MapPin,
  Package,
  RefreshCw,
  User,
} from 'lucide-react';

import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';

import { useHistoricoProduto } from '@/features/estoque/hooks/use-historico-produto';
import {
  formatDescricaoMovimento,
  formatQuantidadeMovimento,
  formatTituloMovimento,
  quantidadeToneClassNameByDirecao,
} from '@/features/estoque/lib/format-historico-movimento';
import type {
  HistoricoMovimentacaoItem,
  HistoricoProdutoSelecionado,
} from '@/features/estoque/types/estoque-gestao.schema';
import type { TipoMovimentoEstoque } from '@/features/estoque/types/estoque.api';

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

const df = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

type HistoricoProdutoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: HistoricoProdutoSelecionado | null;
};

function MovimentoIcon({ tipo }: { tipo: TipoMovimentoEstoque }) {
  const className = 'size-3';

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

function iconToneClassName(tipo: TipoMovimentoEstoque): string {
  switch (tipo) {
    case 'ENTRADA':
      return 'border-tertiary/30 bg-tertiary/10 text-tertiary';
    case 'SAIDA':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    case 'TRANSFERENCIA_DEPOSITO':
      return 'border-primary/30 bg-primary/10 text-primary';
    case 'AJUSTE':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400';
    case 'ESTORNO':
      return 'border-outline-variant bg-surface-low text-muted-foreground';
    default:
      return 'border-primary/30 bg-primary/10 text-primary';
  }
}

function quantidadeToneClassName(tipo: TipoMovimentoEstoque): string {
  switch (tipo) {
    case 'ENTRADA':
      return 'text-tertiary';
    case 'SAIDA':
      return 'text-destructive';
    case 'TRANSFERENCIA_DEPOSITO':
      return 'text-primary';
    case 'AJUSTE':
      return 'text-amber-700 dark:text-amber-400';
    default:
      return 'text-foreground';
  }
}

function formatDeposito(
  codigo: string | null,
  nome: string | null,
): string | null {
  if (!codigo && !nome) {
    return null;
  }

  if (codigo && nome) {
    return `${codigo} · ${nome}`;
  }

  return codigo ?? nome;
}

function formatLocalizacao(item: HistoricoMovimentacaoItem): string | null {
  const origemDeposito = formatDeposito(
    item.depositoOrigemCodigo,
    item.depositoOrigemNome,
  );
  const destinoDeposito = formatDeposito(
    item.depositoDestinoCodigo,
    item.depositoDestinoNome,
  );

  const origemEndereco = item.enderecoOrigemMascarado;
  const destinoEndereco = item.enderecoDestinoMascarado;

  const origem =
    origemEndereco && origemDeposito
      ? `${origemEndereco} (${origemDeposito})`
      : origemEndereco ?? origemDeposito;
  const destino =
    destinoEndereco && destinoDeposito
      ? `${destinoEndereco} (${destinoDeposito})`
      : destinoEndereco ?? destinoDeposito;

  if (origem && destino) {
    return `${origem} → ${destino}`;
  }

  return origem ?? destino;
}

function resolveDocumentoLink(
  documentoRef: string | null,
): { href: string; label: string } | null {
  if (!documentoRef) {
    return null;
  }

  const recebimentoMatch = documentoRef.match(/^recebimento:([^:]+):/);
  const recebimentoId = recebimentoMatch?.[1];
  if (recebimentoId) {
    return {
      href: `/recebimento/${recebimentoId}`,
      label: `Recebimento ${recebimentoId.slice(0, 8)}…`,
    };
  }

  if (
    documentoRef.startsWith('ajuste_saldo:') ||
    documentoRef.startsWith('bloqueio_saldo:') ||
    documentoRef.startsWith('desbloqueio_saldo:')
  ) {
    return null;
  }

  return {
    href: '#',
    label: documentoRef,
  };
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-outline-variant bg-surface-low px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function HistoricoTimelineItem({
  item,
  isLast,
}: {
  item: HistoricoMovimentacaoItem;
  isLast: boolean;
}) {
  const localizacao = formatLocalizacao(item);
  const documento = resolveDocumentoLink(item.documentoRef);
  const descricao = formatDescricaoMovimento(item, nf);
  const quantidade = formatQuantidadeMovimento(item, nf);

  return (
    <div className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full border',
            iconToneClassName(item.tipoMovimento),
          )}
        >
          <MovimentoIcon tipo={item.tipoMovimento} />
        </div>
        {!isLast ? (
          <div className="my-1 w-px flex-1 bg-outline-variant/80" aria-hidden />
        ) : null}
      </div>

      <article
        className={cn(
          'mb-2 min-w-0 flex-1 border border-outline-variant bg-surface-high px-3 py-2.5',
          !isLast && 'mb-2.5',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {formatTituloMovimento(item)}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {dtf.format(new Date(item.occurredAt))}
            </p>
          </div>
          <p
            className={cn(
              'shrink-0 font-mono text-xs font-bold tabular-nums',
              quantidade.signed
                ? quantidadeToneClassNameByDirecao(item)
                : quantidadeToneClassName(item.tipoMovimento),
            )}
          >
            {quantidade.prefix}
            {quantidade.quantidade}{' '}
            <span className="text-[10px] font-normal text-muted-foreground">
              {quantidade.unidadeMedida}
            </span>
          </p>
        </div>

        {descricao ? (
          <p className="mt-1.5 text-[11px] font-medium leading-snug text-foreground">
            {descricao}
          </p>
        ) : null}

        {item.motivo ? (
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            {item.motivo}
          </p>
        ) : null}

        {localizacao ? (
          <p className="mt-1.5 flex items-start gap-1 text-[10px] leading-snug text-muted-foreground">
            <MapPin className="mt-0.5 size-2.5 shrink-0" aria-hidden />
            <span>{localizacao}</span>
          </p>
        ) : null}

        {(item.lote || item.validade || item.numeroSerie) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.lote ? (
              <MetaBadge>Lote {item.lote}</MetaBadge>
            ) : null}
            {item.validade ? (
              <MetaBadge>Val. {df.format(new Date(item.validade))}</MetaBadge>
            ) : null}
            {item.numeroSerie ? (
              <MetaBadge>Série {item.numeroSerie}</MetaBadge>
            ) : null}
          </div>
        )}

        {(documento || item.operatorNome) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-outline-variant/50 pt-2">
            {documento ? (
              documento.href === '#' ? (
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {documento.label}
                </p>
              ) : (
                <Link
                  href={documento.href}
                  className="truncate font-mono text-[10px] text-primary hover:underline"
                >
                  {documento.label}
                </Link>
              )
            ) : null}

            {item.operatorNome ? (
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <User className="size-2.5 shrink-0" aria-hidden />
                {item.operatorNome}
              </p>
            ) : null}
          </div>
        )}
      </article>
    </div>
  );
}

export function HistoricoProdutoSheet({
  open,
  onOpenChange,
  produto,
}: HistoricoProdutoSheetProps) {
  const { isLoading, isLoadingMore, itens, total, hasMore, carregarMais } =
    useHistoricoProduto(open ? produto : null);

  const isPosicao = Boolean(produto?.enderecoId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-outline-variant px-5 pb-4 pt-5">
          <SheetHeader className="space-y-0 text-left">
            <SheetTitle className="text-sm font-semibold text-muted-foreground">
              {isPosicao ? 'Histórico da Posição' : 'Histórico do Lote'}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Movimentações registradas para o produto selecionado
            </SheetDescription>
          </SheetHeader>

          {produto ? (
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                  isPosicao
                    ? 'border-primary/20 bg-primary/10'
                    : 'border-outline-variant bg-surface-low',
                )}
              >
                {isPosicao ? (
                  <MapPin className="size-4 text-primary" aria-hidden />
                ) : (
                  <Package className="size-4 text-muted-foreground" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {produto.produtoDescricao}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  SKU {produto.produtoSku}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {produto.lote ? (
                    <MetaBadge>Lote {produto.lote}</MetaBadge>
                  ) : null}
                  {isPosicao && produto.enderecoMascarado ? (
                    <MetaBadge>{produto.enderecoMascarado}</MetaBadge>
                  ) : null}
                </div>
                {!isPosicao ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    Todas as posições do lote, incluindo transferências entre
                    endereços.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecione um produto para ver o histórico.
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
          {isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
              <p className="text-xs">Carregando histórico...</p>
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-2 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl border border-outline-variant bg-surface-low">
                <History className="size-5 text-muted-foreground/70" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Nenhuma movimentação registrada
                </p>
                <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                  O histórico será preenchido conforme recebimentos, bloqueios e
                  demais operações forem registrados no sistema.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Movimentações
                </p>
                <span className="rounded-full bg-surface-high px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {total === 1 ? '1 registro' : `${total} registros`}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="pb-1">
                  {itens.map((item, index) => (
                    <HistoricoTimelineItem
                      key={item.id}
                      item={item}
                      isLast={index === itens.length - 1 && !hasMore}
                    />
                  ))}
                </div>
              </div>

              {hasMore ? (
                <div className="mt-3 shrink-0 border-t border-outline-variant pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isLoadingMore}
                    onClick={carregarMais}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2
                          className="mr-2 size-3.5 animate-spin"
                          aria-hidden
                        />
                        Carregando...
                      </>
                    ) : (
                      'Carregar mais'
                    )}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

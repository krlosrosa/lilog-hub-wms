'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Layers, Loader2, Package, X } from 'lucide-react';

import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';

import { EnderecoStatusBadge } from '@/features/enderecos/components/endereco-status-badge';
import { fetchMapaCdPosicaoDetalhe } from '@/features/enderecos/lib/mapa-cd-posicao-detalhe';
import {
  buildPosicaoLabel,
  resolverCorOcupacao,
  type MapaCdNivel,
  type PosicaoSelecionada,
} from '@/features/enderecos/types/mapa-cd.schema';
import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';
import { EstoqueStatusBadge } from '@/features/estoque/components/estoque-status-badge';
import { SaldoCell } from '@/features/estoque/components/saldo-cell';
import type { SaldoEnderecoComProdutoApi } from '@/features/estoque/types/estoque.api';

type MapaCdPrateleiraSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posicao: PosicaoSelecionada | null;
  unidadeId?: string;
};

const nf = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const df = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function compareNivelDesc(a: MapaCdNivel, b: MapaCdNivel): number {
  return Number.parseInt(b.nivel, 10) - Number.parseInt(a.nivel, 10);
}

export function MapaCdPrateleiraSheet({
  open,
  onOpenChange,
  posicao,
  unidadeId,
}: MapaCdPrateleiraSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Awaited<
    ReturnType<typeof fetchMapaCdPosicaoDetalhe>
  > | null>(null);

  const carregar = useCallback(async () => {
    if (!open || !posicao || !unidadeId) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await fetchMapaCdPosicaoDetalhe(unidadeId, posicao.niveis);
      setDetalhe(data);
    } catch (error) {
      setDetalhe(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o conteúdo da posição',
      );
    } finally {
      setIsLoading(false);
    }
  }, [open, posicao, unidadeId]);

  useEffect(() => {
    if (!open) {
      setDetalhe(null);
      setLoadError(null);
      return;
    }

    void carregar();
  }, [carregar, open]);

  const niveisOrdenados = useMemo(
    () => (posicao ? [...posicao.niveis].sort(compareNivelDesc) : []),
    [posicao],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-outline-variant bg-card p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-outline-variant px-4 py-3 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <SheetTitle className="truncate font-mono text-sm text-primary">
                {posicao
                  ? buildPosicaoLabel(
                      posicao.zona,
                      posicao.rua,
                      posicao.posicao,
                    )
                  : 'Posição'}
              </SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span>
                  {posicao?.niveis.length ?? 0} nível
                  {(posicao?.niveis.length ?? 0) === 1 ? '' : 'is'}
                </span>
                {detalhe && detalhe.totalSaldos > 0 ? (
                  <span className="text-muted-foreground">
                    · {detalhe.totalSaldos}{' '}
                    {detalhe.totalSaldos === 1 ? 'item' : 'itens'}
                  </span>
                ) : null}
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
              <p className="text-xs">Carregando prateleira...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          ) : posicao ? (
            <div className="relative mx-auto max-w-sm">
              <div
                className="absolute inset-y-3 left-3 w-2 rounded-full bg-gradient-to-b from-outline-variant/80 via-outline-variant/50 to-outline-variant/80"
                aria-hidden
              />

              <div className="space-y-4 pl-7">
                {niveisOrdenados.map((nivel) => (
                  <PrateleiraNivel
                    key={nivel.id}
                    nivel={nivel}
                    saldos={detalhe?.saldosPorNivel[nivel.id] ?? []}
                  />
                ))}
              </div>

              <div
                className="mt-2 h-3 rounded-b-md border border-t-0 border-outline-variant/60 bg-gradient-to-b from-surface-highest to-surface-high"
                aria-hidden
              />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PrateleiraNivel({
  nivel,
  saldos,
}: {
  nivel: MapaCdNivel;
  saldos: SaldoEnderecoComProdutoApi[];
}) {
  const cor = resolverCorOcupacao(nivel.status, nivel.ocupacaoPercent);
  const quantidadeTotal = saldos.reduce((acc, item) => acc + item.quantidade, 0);
  const vazio = saldos.length === 0;

  return (
    <div className="group relative">
      <div className="mb-1 flex items-center justify-between gap-2 pr-1">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3 text-muted-foreground" aria-hidden />
          <span className="font-mono text-[11px] font-bold text-foreground">
            Nv. {nivel.nivel}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {ENDERECO_TIPO_LABELS[nivel.tipo]}
          </span>
        </div>
        <EnderecoStatusBadge status={nivel.status} compact />
      </div>

      <div
        className={cn(
          'relative min-h-[4.5rem] rounded-md border px-2.5 pb-2 pt-2 transition-colors',
          vazio
            ? 'border-dashed border-outline-variant/50 bg-surface-lowest/40'
            : 'border-outline-variant/60 bg-surface-lowest/70',
        )}
      >
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 h-1.5 rounded-b-md border-t border-outline-variant/40',
            cor.bg,
          )}
          style={{ opacity: vazio ? 0.35 : 0.65 }}
          aria-hidden
        />

        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {nivel.enderecoMascarado}
          </p>
          <span className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
            {nivel.ocupacaoPercent}%
          </span>
        </div>

        {vazio ? (
          <div className="flex items-center gap-2 py-2 text-muted-foreground/70">
            <Box className="size-4 shrink-0 opacity-40" aria-hidden />
            <p className="text-[11px]">Prateleira vazia</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {saldos.map((saldo) => (
              <ProdutoNaPrateleira key={saldo.id} saldo={saldo} />
            ))}
          </div>
        )}

        {!vazio ? (
          <p className="mt-2 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
            {nf.format(quantidadeTotal)} un. total
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ProdutoNaPrateleira({ saldo }: { saldo: SaldoEnderecoComProdutoApi }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-outline-variant/50 bg-card/80 px-2 py-1.5 shadow-sm">
      <div className="flex size-7 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary/10">
        <Package className="size-3.5 text-primary" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground">
          {saldo.produtoNome || '—'}
        </p>
        <p className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground">
          {saldo.produtoSku || saldo.produtoId}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] font-bold tabular-nums text-foreground">
            <SaldoCell value={saldo.quantidade} />
            <span className="ml-0.5 font-normal text-muted-foreground">
              {saldo.unidadeMedida}
            </span>
          </span>

          {saldo.lote ? (
            <span className="rounded bg-surface-high px-1 py-px font-mono text-[9px] text-muted-foreground">
              Lote {saldo.lote}
            </span>
          ) : null}

          {saldo.validade ? (
            <span className="text-[9px] text-muted-foreground">
              Val. {df.format(new Date(saldo.validade))}
            </span>
          ) : null}

          <EstoqueStatusBadge variant="status" value={saldo.status} compact />
        </div>
      </div>
    </div>
  );
}

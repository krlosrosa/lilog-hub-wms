'use client';

import Link from 'next/link';

import { ChevronRight, MapPin, Package } from 'lucide-react';

import { cn } from '@lilog/ui';

import { EstoqueStatusBadge } from '@/features/estoque/components/estoque-status-badge';
import type { SaldoDetalhe } from '@/features/estoque/types/estoque-gestao.schema';
import {
  NATUREZA_SALDO_LABELS,
} from '@/features/estoque/types/estoque-gestao.schema';

type SaldoDetalheHeaderProps = {
  saldo: SaldoDetalhe;
};

const df = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function SaldoDetalheHeader({ saldo }: SaldoDetalheHeaderProps) {
  return (
    <div className="space-y-4">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/estoque" className="hover:text-primary hover:underline">
          Estoque
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground">Gerenciar item</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-low">
            <Package className="size-5 text-primary" aria-hidden />
          </div>

          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-primary">
              {saldo.produtoSku}
            </p>
            <h1 className="text-headline-md font-bold text-foreground">
              {saldo.produtoDescricao}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                Lote:{' '}
                <span className="font-medium text-foreground">
                  {saldo.lote || '—'}
                </span>
              </span>
              {saldo.validade ? (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    Validade:{' '}
                    <span className="font-medium text-foreground">
                      {df.format(new Date(saldo.validade))}
                    </span>
                  </span>
                </>
              ) : null}
              {saldo.numeroSerie ? (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    Série:{' '}
                    <span className="font-mono font-medium text-foreground">
                      {saldo.numeroSerie}
                    </span>
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EstoqueStatusBadge variant="status" value={saldo.status} />
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
              saldo.natureza === 'debito'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'border-outline-variant bg-surface-low text-muted-foreground',
            )}
          >
            {NATUREZA_SALDO_LABELS[saldo.natureza]}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Posição
              </p>
              <Link
                href={`/enderecos/${saldo.enderecoId}`}
                className="font-mono text-sm font-bold text-primary hover:underline"
              >
                {saldo.enderecoMascarado}
              </Link>
              <p className="text-xs text-muted-foreground">
                {saldo.depositoCodigo} · {saldo.depositoNome}
              </p>
            </div>
          </div>

          {saldo.motivoBloqueio ? (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Motivo de bloqueio
              </p>
              <p className="text-sm font-medium text-foreground">
                {saldo.motivoBloqueio.nome}
              </p>
              {saldo.observacaoBloqueio ? (
                <p className="text-xs text-muted-foreground">
                  {saldo.observacaoBloqueio}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

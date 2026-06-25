'use client';

import { cn } from '@lilog/ui';
import { RefreshCw } from 'lucide-react';

import type { OperacaoDocaApi } from '@/features/docas/types/doca.api';

type DocaOperacoesAtivasProps = {
  operacoes: OperacaoDocaApi[];
};

export function DocaOperacoesAtivas({ operacoes }: DocaOperacoesAtivasProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg p-3 shadow-inner-glow backdrop-blur-glass">
      <h4 className="text-xs font-semibold text-foreground">
        Operações em andamento
      </h4>
      <p className="mb-2 text-[10px] text-muted-foreground">
        Veículos em execução nas docas
      </p>
      <div className="space-y-1.5">
        {operacoes.length ? (
          operacoes.map((operacao) => (
            <div
              key={operacao.id}
              className={cn(
                'flex items-center justify-between gap-2 rounded-md border-l-2 border-secondary bg-surface-low px-2 py-1.5',
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <RefreshCw
                  className="size-3.5 shrink-0 animate-spin text-secondary"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-foreground">
                    {operacao.tipoOperacao.replace('_', ' ')}
                  </p>
                  <p className="truncate text-[9px] text-muted-foreground">
                    Veículo {operacao.veiculoId.slice(0, 8)}…
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-3 text-center text-[11px] text-muted-foreground">
            Nenhuma operação em andamento.
          </p>
        )}
      </div>
    </div>
  );
}

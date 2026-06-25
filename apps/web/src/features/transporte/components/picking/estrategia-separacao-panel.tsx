'use client';

import { cn } from '@lilog/ui';
import { Check, SlidersHorizontal } from 'lucide-react';

import {
  ESTRATEGIA_LABELS,
  OPCOES_ESTRATEGIA,
  type EstrategiaSeparacao,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

type EstrategiaSeparacaoPanelProps = {
  estrategia: EstrategiaSeparacao;
  onSelecionar: (estrategia: EstrategiaSeparacao) => void;
};

export function EstrategiaSeparacaoPanel({
  estrategia,
  onSelecionar,
}: EstrategiaSeparacaoPanelProps) {
  return (
    <section className={cn(panelClassName, 'space-y-4 p-5')}>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden />
          Estratégia de Separação
        </h2>
        <span className="text-xs text-muted-foreground">
          Selecionado: {ESTRATEGIA_LABELS[estrategia]}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Define como os pedidos selecionados serão transformados em mapas
        operacionais de separação.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OPCOES_ESTRATEGIA.map((opcao) => {
          const Icon = opcao.icon;
          const selecionado = estrategia === opcao.estrategia;

          return (
            <button
              key={opcao.estrategia}
              type="button"
              onClick={() => onSelecionar(opcao.estrategia)}
              className={cn(
                'relative rounded-xl border p-4 text-left transition-colors',
                selecionado
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-outline-variant bg-surface-low/40 hover:border-primary/20',
              )}
            >
              <span
                className={cn(
                  'absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary-container transition-all',
                  selecionado ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
                )}
              >
                <Check className="size-3 text-on-primary-container" />
              </span>
              <span
                className={cn(
                  'mb-3 flex size-10 items-center justify-center rounded-lg',
                  selecionado
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-high text-primary',
                )}
              >
                <Icon className="size-5" />
              </span>
              <h3 className="text-sm font-bold text-foreground">
                {opcao.label}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {opcao.descricao}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

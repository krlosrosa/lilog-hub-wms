import { cn } from '@lilog/ui';
import { ListOrdered } from 'lucide-react';

import type { FilaDoca } from '../lib/manobra-queue';

interface FilaPorDocaProps {
  filas: FilaDoca[];
  proximoVeiculoId: string | null;
}

export function FilaPorDoca({ filas, proximoVeiculoId }: FilaPorDocaProps) {
  if (filas.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        <ListOrdered className="h-4 w-4 text-on-surface-variant" aria-hidden />
        <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          Fila por doca
        </h2>
      </div>

      <div className="space-y-3">
        {filas.map((fila) => (
          <article
            key={fila.doca}
            className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container"
          >
            <header className="flex items-center justify-between border-b border-outline-variant bg-surface px-4 py-2.5">
              <p className="text-label-md font-bold text-on-surface">{fila.doca}</p>
              <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-on-surface-variant">
                {fila.veiculos.length} {fila.veiculos.length === 1 ? 'veículo' : 'veículos'}
              </span>
            </header>

            <ol className="divide-y divide-outline-variant/60">
              {fila.veiculos.map((veiculo) => {
                const isProximo = veiculo.id === proximoVeiculoId;

                return (
                  <li
                    key={veiculo.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3',
                      isProximo && 'bg-secondary/10',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-sm font-bold tabular-nums',
                        isProximo
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-surface-container-high text-on-surface-variant',
                      )}
                    >
                      {veiculo.posicao}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-body-md font-bold tracking-wide text-on-surface">
                        {veiculo.placa}
                      </p>
                      <p className="truncate text-label-sm text-on-surface-variant">
                        {veiculo.transportadora}
                      </p>
                    </div>
                    {isProximo ? (
                      <span className="shrink-0 rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-secondary">
                        Próximo
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

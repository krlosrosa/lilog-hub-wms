import { Button } from '@lilog/ui';
import { ArrowRight, CheckCircle2, Grid3x3, Package, Warehouse } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import type { ProximaDemandaArmazenagem } from '../lib/proxima-demanda';

type ArmazenagemConclusaoScreenProps = {
  demandaLabel: string;
  itensGuardados: number;
  proximaDemanda: ProximaDemandaArmazenagem | null;
  autoRedirectSeconds: number;
  onProximaDemanda: () => void;
  onVoltarLista: () => void;
};

export function ArmazenagemConclusaoScreen({
  demandaLabel,
  itensGuardados,
  proximaDemanda,
  autoRedirectSeconds,
  onProximaDemanda,
  onVoltarLista,
}: ArmazenagemConclusaoScreenProps) {
  return (
    <div className="page-enter flex min-h-[70dvh] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-margin-mobile pb-8 pt-10 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </div>

        <h2 className="text-headline-lg font-semibold text-on-surface">
          Armazenagem concluída!
        </h2>
        <p className="mt-2 max-w-sm text-body-md text-on-surface-variant">
          {proximaDemanda
            ? `Próxima demanda (${proximaDemanda.label}) em ${autoRedirectSeconds}s...`
            : `Voltando à lista em ${autoRedirectSeconds}s...`}
        </p>

        <article className="mt-8 w-full max-w-md rounded-lg border border-outline-variant bg-surface p-5 text-left shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-label-md uppercase text-on-surface-variant">
            <Warehouse className="h-4 w-4" aria-hidden />
            Resumo
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                Demanda
              </span>
              <p className="font-mono text-headline-md font-bold text-on-surface">
                {demandaLabel}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-surface-container-low px-4 py-3">
              <Package className="h-5 w-5 text-secondary" aria-hidden />
              <div>
                <p className="text-label-sm text-on-surface-variant">Itens guardados</p>
                <p className="font-mono text-headline-md font-semibold text-on-surface">
                  {itensGuardados}
                </p>
              </div>
            </div>
            {proximaDemanda && (
              <div className="border-t border-outline-variant pt-4">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Próxima demanda
                </span>
                <p className="font-mono text-headline-md font-bold text-on-surface">
                  {proximaDemanda.label}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {proximaDemanda.origem}
                </p>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="flex w-full flex-col gap-3 px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
        {proximaDemanda && (
          <Button
            type="button"
            onPointerDown={() => hapticLight()}
            onClick={onProximaDemanda}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary touch-manipulation active:scale-95"
          >
            <ArrowRight className="h-5 w-5" aria-hidden />
            Próxima demanda
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onPointerDown={() => hapticLight()}
          onClick={onVoltarLista}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-primary text-primary touch-manipulation active:scale-95"
        >
          <Grid3x3 className="h-5 w-5" aria-hidden />
          Voltar à lista
        </Button>
      </div>
    </div>
  );
}

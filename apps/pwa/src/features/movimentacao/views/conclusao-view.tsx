import { Button } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  Grid3x3,
  LayoutList,
  MapPin,
  Package,
  Timer,
  TrendingDown,
} from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { useConclusao } from '../hooks/use-conclusao';

interface ConclusaoViewProps {
  tarefaId: string;
}

export function ConclusaoView({ tarefaId }: ConclusaoViewProps) {
  const { state, actions } = useConclusao(tarefaId);
  const {
    taskId,
    destino,
    elapsedTime,
    targetTime,
    performanceDelta,
    loteMessage,
    proximaTarefa,
    autoRedirectSeconds,
  } = state;

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/movimentacao/ressuprimento"
            aria-label="Voltar"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold text-on-surface leading-tight">
              Conclusão
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-margin-mobile pb-8 pt-6">
        <div className="mb-10 w-full text-center">
          <h2 className="text-headline-lg font-semibold text-on-surface">
            Movimentação Concluída!
          </h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Operação registrada com sucesso no sistema.
          </p>
          <p className="mt-3 text-body-sm text-on-surface-variant">
            {proximaTarefa
              ? `Próxima demanda (${proximaTarefa.taskId}) em ${autoRedirectSeconds}s...`
              : `Voltando à lista em ${autoRedirectSeconds}s...`}
          </p>
        </div>

        <div className="w-full space-y-4">
          <article className="relative overflow-hidden rounded-lg border border-outline-variant bg-surface p-6 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-1 bg-secondary" aria-hidden />
            <h3 className="mb-4 flex items-center gap-2 text-label-md uppercase text-on-surface-variant">
              <LayoutList className="h-4 w-4" aria-hidden />
              Resumo da Operação
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                  ID da Tarefa
                </span>
                <span className="font-mono text-headline-md font-bold text-on-surface">
                  {taskId}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Destino Confirmado
                </span>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-secondary" aria-hidden />
                  <span className="font-mono text-headline-md font-bold text-on-surface">
                    {destino}
                  </span>
                </div>
              </div>
              <div className="border-t border-outline-variant pt-4">
                <span className="mb-1 block text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Tempo de Operação
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex flex-1 items-center gap-3 rounded-lg bg-surface-container-low px-4 py-2">
                    <Timer className="h-5 w-5 text-on-primary-container" aria-hidden />
                    <span className="font-mono text-headline-md font-semibold text-primary">
                      {elapsedTime}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-label-sm text-on-surface-variant">
                      Meta: {targetTime}
                    </span>
                    <span className="flex items-center justify-end gap-1 text-label-sm font-bold text-secondary">
                      <TrendingDown className="h-3 w-3" aria-hidden />
                      {performanceDelta}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="flex items-center gap-4 rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface shadow-sm">
              <Package className="h-6 w-6 text-secondary" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-label-md text-on-surface-variant">Lote Atualizado</p>
              <p className="text-body-sm text-on-surface-variant">{loteMessage}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex w-full flex-col gap-4">
          <Button
            type="button"
            onClick={actions.onProximaTarefa}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary shadow-md touch-manipulation active:scale-95"
          >
            <ArrowRight className="h-5 w-5" aria-hidden />
            Próxima Tarefa
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={actions.onVoltar}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-primary text-primary touch-manipulation active:scale-95"
          >
            <Grid3x3 className="h-5 w-5" aria-hidden />
            Voltar à lista
          </Button>
        </div>
      </div>
    </div>
  );
}

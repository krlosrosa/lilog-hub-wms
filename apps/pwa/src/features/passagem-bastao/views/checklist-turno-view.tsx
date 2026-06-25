import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  ClipboardList,
  Loader2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { AreaFilterChip } from '../components/area-filter-chip';
import { ChecklistCard } from '../components/checklist-card';
import { ChecklistExtrasSection } from '../components/checklist-extras-section';
import { TurnoStatusRing } from '../components/turno-status-ring';
import { CHECKLIST_ITEMS } from '../data/passagem-bastao-seed';
import {
  useChecklistTurno,
  type ChecklistTurnoToast,
} from '../hooks/use-checklist-turno';
import type { AreaFilter } from '../types/passagem-bastao.schema';

function ChecklistToastPortal({ toast }: { toast: ChecklistTurnoToast | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+16px)] z-[60] flex justify-center px-margin-mobile transition-opacity duration-300',
        toast ? 'opacity-100' : 'opacity-0',
      )}
      aria-live="polite"
    >
      <div
        className={cn(
          'rounded-lg px-4 py-3 text-body-sm font-medium shadow-lg',
          toast?.variant === 'error'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-secondary-container text-on-secondary-container',
        )}
      >
        {toast?.message ?? ''}
      </div>
    </div>,
    document.body,
  );
}

function areaItemCount(filter: AreaFilter): number {
  if (filter === 'all') return CHECKLIST_ITEMS.length;
  return CHECKLIST_ITEMS.filter((item) => item.area === filter).length;
}

function ChecklistBottomDock({
  isSubmitting,
  canFinish,
  pendingCount,
  naoConformeCount,
  onFinish,
}: {
  isSubmitting: boolean;
  canFinish: boolean;
  pendingCount: number;
  naoConformeCount: number;
  onFinish: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 w-full pb-safe">
      <div className="pointer-events-auto border-t border-outline-variant bg-surface/95 px-margin-mobile pt-3 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-surface/90">
        {!canFinish && !isSubmitting ? (
          <p className="mb-2 text-center text-label-sm text-on-surface-variant">
            Avalie todos os itens ({pendingCount} pendente
            {pendingCount === 1 ? '' : 's'})
          </p>
        ) : naoConformeCount > 0 && !isSubmitting ? (
          <p className="mb-2 text-center text-label-sm text-destructive">
            {naoConformeCount} item{naoConformeCount === 1 ? '' : 's'} não conforme
            {naoConformeCount === 1 ? '' : 's'} — será registrado no resumo
          </p>
        ) : null}
        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void onFinish();
          }}
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary text-label-md font-semibold touch-manipulation transition-transform active:scale-[0.98] hover:bg-secondary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Salvando...
            </>
          ) : (
            <>
              <ClipboardCheck className="h-5 w-5" aria-hidden />
              Finalizar
              <ArrowRight className="h-5 w-5" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

export function ChecklistTurnoView() {
  const { state, actions } = useChecklistTurno();
  const {
    areaFilter,
    areaFilters,
    filteredItems,
    itemStates,
    conformeCount,
    naoConformeCount,
    evaluatedCount,
    pendingCount,
    totalCount,
    progressPercent,
    conformePercent,
    naoConformePercent,
    isSubmitting,
    toast,
    observacoesAdicionais,
    extrasPhotos,
  } = state;

  const canFinish = evaluatedCount >= totalCount;
  const areaCounts = useMemo(
    () =>
      Object.fromEntries(
        areaFilters.map((filter) => [filter.id, areaItemCount(filter.id)]),
      ) as Record<AreaFilter, number>,
    [areaFilters],
  );

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/"
            aria-label="Voltar para o menu"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Passagem de bastão
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              Checklist 5S · turno
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-label-md font-bold text-secondary">
              {evaluatedCount}/{totalCount}
            </p>
            <p className="text-label-sm text-on-surface-variant">avaliados</p>
          </div>
        </div>

        <div className="space-y-2 px-margin-mobile pb-3">
          <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface px-3 py-2.5 shadow-sm">
            <TurnoStatusRing percent={progressPercent} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-label-sm font-medium text-on-surface">
                  Resumo do turno
                </span>
                <span className="text-label-sm text-on-surface-variant">
                  {evaluatedCount}/{totalCount}
                </span>
              </div>
              <div
                className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-container"
                role="progressbar"
                aria-valuenow={Math.round(progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do checklist"
              >
                {conformePercent > 0 ? (
                  <div
                    className="h-full bg-secondary transition-all duration-500"
                    style={{ width: `${conformePercent}%` }}
                    title={`${conformeCount} conforme${conformeCount === 1 ? '' : 's'}`}
                  />
                ) : null}
                {naoConformePercent > 0 ? (
                  <div
                    className="h-full bg-destructive transition-all duration-500"
                    style={{ width: `${naoConformePercent}%` }}
                    title={`${naoConformeCount} não conforme${naoConformeCount === 1 ? '' : 's'}`}
                  />
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px]">
                <span className="inline-flex items-center gap-0.5 text-secondary">
                  <Check className="h-3 w-3" aria-hidden />
                  {conformeCount}
                </span>
                <span className="inline-flex items-center gap-0.5 text-destructive">
                  <X className="h-3 w-3" aria-hidden />
                  {naoConformeCount}
                </span>
                <span className="text-on-surface-variant">
                  {pendingCount} pend.
                </span>
              </div>
            </div>
          </div>

          <div className="hide-scrollbar -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">
            {areaFilters.map((filter) => (
              <AreaFilterChip
                key={filter.id}
                label={filter.label}
                count={areaCounts[filter.id]}
                active={areaFilter === filter.id}
                onClick={() => actions.setAreaFilter(filter.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 px-margin-mobile pb-[calc(88px+env(safe-area-inset-bottom,0px))] pt-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container">
              <ClipboardList className="h-6 w-6 text-outline" aria-hidden />
            </div>
            <p className="text-body-md font-semibold text-on-surface">
              Nenhum item nesta área
            </p>
            <p className="text-label-sm text-on-surface-variant">
              Selecione outro filtro para continuar o checklist.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemState = itemStates[item.id];
            return (
              <ChecklistCard
                key={item.id}
                item={item}
                conformidade={itemState?.conformidade ?? 'pendente'}
                observacao={itemState?.observacao ?? ''}
                onConformidadeChange={(value) => actions.setConformidade(item.id, value)}
                onObservacaoChange={(value) => actions.setObservacao(item.id, value)}
              />
            );
          })
        )}

        <ChecklistExtrasSection
          observacoesAdicionais={observacoesAdicionais}
          onObservacoesChange={actions.setObservacoesAdicionais}
          photos={extrasPhotos}
          onCapturePhoto={actions.captureExtraPhoto}
          onRemovePhoto={actions.removeExtraPhoto}
          hiddenInput={actions.extrasHiddenInput}
        />
      </div>

      <ChecklistBottomDock
        isSubmitting={isSubmitting}
        canFinish={canFinish}
        pendingCount={pendingCount}
        naoConformeCount={naoConformeCount}
        onFinish={actions.handleSubmit}
      />
      <ChecklistToastPortal toast={toast} />
    </div>
  );
}

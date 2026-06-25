import { cn } from '@lilog/ui';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, ClipboardCheck, ListOrdered } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { EtiquetasListaSheet } from '../components/etiquetas-lista-sheet';
import { LabelScanInput } from '../components/label-scan-input';
import { WeightInputPanel } from '../components/weight-input-panel';
import {
  useCadastroPicking,
  type CadastroPickingToast,
} from '../hooks/use-cadastro-picking';

function CadastroToastPortal({ toast }: { toast: CadastroPickingToast | null }) {
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

export function CadastroPickingView() {
  const { id } = useParams({ from: '/peso-variavel/$id/' });
  const { state, actions } = useCadastroPicking(id);
  const { form, etiquetaAtual, tarefa } = state;

  const pesoError = form.formState.errors.pesoCaixaAtual?.message;
  const scanFocusKey = state.conferidasCount;

  return (
    <div className="page-enter pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <CadastroToastPortal toast={state.toast} />

      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/peso-variavel"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant active:scale-90 transition-transform touch-manipulation"
            aria-label="Voltar para tarefas"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold text-on-surface leading-tight">
              {tarefa?.tituloJornada ?? 'Separação'}
            </h1>
            {tarefa && (
              <p className="truncate font-mono text-label-sm text-on-surface-variant">
                {tarefa.pedidoId} · {tarefa.zona}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={actions.toggleListMode}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full active:scale-90 transition-transform touch-manipulation',
              state.isListMode
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container text-on-surface-variant',
            )}
            aria-label="Ver lista de etiquetas"
            aria-pressed={state.isListMode}
          >
            <ListOrdered className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mx-margin-mobile mt-3 space-y-3">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-label-md">
            Conferência de peso · {state.conferidasCount} / {state.totalEtiquetas}{' '}
            etiquetas
          </span>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface p-4">
          <div className="mb-2 flex justify-between text-label-sm text-on-surface-variant">
            <span>Progresso</span>
            <span className="font-semibold text-on-surface">
              {state.conferidasCount} / {state.totalEtiquetas}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500"
              style={{ width: `${state.progressPercent}%` }}
              role="progressbar"
              aria-valuenow={state.conferidasCount}
              aria-valuemin={0}
              aria-valuemax={state.totalEtiquetas}
            />
          </div>
          {state.pesoAcumulado > 0 && (
            <p className="mt-2 text-right font-mono text-label-sm font-semibold text-secondary">
              {state.pesoAcumulado.toFixed(2)} kg acumulados
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4 px-margin-mobile">
        {etiquetaAtual == null ? (
          <LabelScanInput
            isScanning={state.isScanning}
            disabled={state.todasConferidas}
            onScan={(codigo) => void actions.handleScanLabel(codigo)}
            focusKey={scanFocusKey}
          />
        ) : (
          <WeightInputPanel
            etiquetaCodigo={etiquetaAtual.codigo}
            pesoRegister={form.register('pesoCaixaAtual')}
            pesoError={pesoError}
            pesoAcumulado={state.pesoAcumulado}
            onConfirmPeso={() => void actions.handleConfirmarPeso()}
            onCancelar={actions.handleCancelarEtiqueta}
            isSubmitting={state.isSubmitting}
          >
            <article className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-label-md uppercase tracking-wider text-secondary">
                  Produto identificado
                </span>
                <span className="shrink-0 rounded bg-secondary-container px-2 py-0.5 font-mono text-label-md font-bold text-on-secondary-container">
                  {etiquetaAtual.sku}
                </span>
              </div>
              <p className="line-clamp-2 text-headline-md font-semibold text-on-surface">
                {etiquetaAtual.nome}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-label-md text-on-surface-variant">Lote</p>
                  <p className="font-mono text-body-md font-semibold text-on-surface">
                    {etiquetaAtual.lote}
                  </p>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant">Unidade</p>
                  <p className="text-body-md font-semibold text-on-surface">
                    {etiquetaAtual.unidade}
                  </p>
                </div>
              </div>
            </article>
          </WeightInputPanel>
        )}
      </div>

      <EtiquetasListaSheet
        open={state.isListMode}
        onOpenChange={actions.setListMode}
        etiquetas={state.etiquetas}
        conferidas={state.conferidas}
      />
    </div>
  );
}

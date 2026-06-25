import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Forklift,
  Loader2,
  Package,
  ScanLine,
} from 'lucide-react';
import { useState } from 'react';

import { QrScannerModal } from '@/components/qr-scanner/qr-scanner-modal';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import { useDirecionamento } from '../hooks/use-direcionamento';

interface DirecionamentoViewProps {
  tarefaId: string;
}

export function DirecionamentoView({ tarefaId }: DirecionamentoViewProps) {
  const { state, actions } = useDirecionamento(tarefaId);
  const { tarefa, form, progressPercent, isDestinoValid, isReady, isSubmitting } = state;
  const { register, formState, setValue } = form;

  const [scanOpen, setScanOpen] = useState(false);

  if (!tarefa) {
    return (
      <div className="page-enter px-margin-mobile py-8 text-center text-body-sm text-on-surface-variant">
        Tarefa não encontrada.
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/movimentacao/$id/confirmacao-coleta"
            params={{ id: tarefaId }}
            aria-label="Voltar"
            onPointerDown={() => hapticLight()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-body-lg font-semibold text-on-surface leading-tight">
              Direcionamento
            </h1>
            <p className="truncate font-mono text-body-sm text-on-surface-variant">
              {tarefa.taskId} · {progressPercent}%
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-margin-mobile pb-4 pt-3">
        <section
          aria-labelledby="destino-operador"
          className="rounded-xl border-2 border-secondary bg-secondary-container px-4 py-6 text-center shadow-lg"
        >
          <p
            id="destino-operador"
            className="mb-3 text-body-md font-semibold uppercase tracking-wider text-on-secondary-container/90"
          >
            Ir para o destino
          </p>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-on-secondary-container/15 text-on-secondary-container">
            <Forklift className="h-7 w-7" aria-hidden />
          </div>
          <p className="font-mono text-headline-lg font-bold leading-snug text-on-secondary-container sm:text-headline-xl">
            {tarefa.destino}
          </p>
        </section>

        <div className="space-y-1.5">
          <label htmlFor="destinoQrCode" className="text-body-md font-medium text-on-surface-variant">
            Confirmar destino
          </label>
          <div
            className={cn(
              'relative flex items-center rounded-xl border bg-surface-bright px-4 transition-colors',
              isDestinoValid
                ? 'border-secondary/50 ring-1 ring-secondary/20'
                : 'border-outline-variant focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary'
            )}
          >
            <input
              id="destinoQrCode"
              type="text"
              placeholder={`Escaneie ${tarefa.destinoQrExpected}`}
              autoComplete="off"
              className="h-12 flex-1 bg-transparent pr-[4.5rem] font-mono text-body-md text-on-surface outline-none"
              {...register('destinoQrCode')}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {isDestinoValid && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setScanOpen(true);
                }}
                aria-label="Escanear QR do destino"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition-colors active:bg-surface-container touch-manipulation"
              >
                <ScanLine className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
          {formState.errors.destinoQrCode && (
            <p className="text-body-sm text-destructive">
              {formState.errors.destinoQrCode.message}
            </p>
          )}
        </div>

        <article className="rounded-xl border border-outline-variant bg-surface p-4">
          <h3 className="mb-3 flex items-center gap-2 text-body-md font-semibold text-on-surface">
            <Package className="h-5 w-5 text-secondary" aria-hidden />
            Palete
          </h3>
          <dl className="space-y-2.5 text-body-md">
            <div className="flex justify-between gap-3 border-b border-outline-variant/60 pb-2.5">
              <dt className="text-on-surface-variant">SSCC</dt>
              <dd className="truncate font-mono text-body-md font-semibold text-on-surface">
                {tarefa.sscc}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-outline-variant/60 pb-2.5">
              <dt className="shrink-0 text-on-surface-variant">Produto</dt>
              <dd className="truncate text-right font-medium text-on-surface">{tarefa.produto}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-on-surface-variant">Qtd / Peso</dt>
              <dd className="font-semibold text-on-surface">
                {tarefa.qtyLabel} · {tarefa.pesoTotal}
              </dd>
            </div>
          </dl>
        </article>

        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void actions.onConfirmar();
          }}
          disabled={!isReady || isSubmitting}
          className={cn(
            'flex h-16 w-full items-center justify-center gap-2 rounded-xl text-body-md font-semibold shadow-lg touch-manipulation active:scale-[0.98]',
            isReady
              ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
              : 'bg-surface-container-high text-on-surface-variant'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              Confirmando...
            </>
          ) : (
            <>
              <ClipboardCheck className="h-6 w-6" aria-hidden />
              Confirmar entrega e continuar
              <ArrowRight className="h-6 w-6" aria-hidden />
            </>
          )}
        </Button>
      </div>

      <QrScannerModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        title="Escanear posição de destino"
        onScan={(value) => {
          setValue('destinoQrCode', value, { shouldValidate: true, shouldDirty: true });
          setScanOpen(false);
        }}
      />
    </div>
  );
}

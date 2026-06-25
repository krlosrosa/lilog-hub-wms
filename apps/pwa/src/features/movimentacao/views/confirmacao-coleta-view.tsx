import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MapPin,
  Package,
  ScanLine,
} from 'lucide-react';
import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { QrScannerModal } from '@/components/qr-scanner/qr-scanner-modal';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import { useConfirmacaoColeta } from '../hooks/use-confirmacao-coleta';

interface ConfirmacaoColetaViewProps {
  tarefaId: string;
}

type ScanTarget = 'enderecoOrigem' | 'lpn';

function ScanField({
  id,
  label,
  placeholder,
  registerProps,
  isValid,
  onScanClick,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  registerProps: UseFormRegisterReturn<'enderecoOrigem'> | UseFormRegisterReturn<'lpn'>;
  isValid: boolean;
  onScanClick: () => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-body-md font-medium text-on-surface-variant">
        {label}
      </label>
      <div
        className={cn(
          'relative flex items-center rounded-xl border bg-surface-bright px-4 transition-colors',
          isValid
            ? 'border-secondary/50 ring-1 ring-secondary/20'
            : 'border-outline-variant focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary'
        )}
      >
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          autoComplete="off"
          className="h-12 flex-1 bg-transparent pr-[4.5rem] text-body-md text-on-surface outline-none"
          {...registerProps}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isValid && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
          )}
          <button
            type="button"
            onClick={() => {
              hapticLight();
              onScanClick();
            }}
            aria-label={`Escanear ${label}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition-colors active:bg-surface-container touch-manipulation"
          >
            <ScanLine className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      {error && <p className="text-body-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ConfirmacaoColetaView({ tarefaId }: ConfirmacaoColetaViewProps) {
  const { state, actions } = useConfirmacaoColeta(tarefaId);
  const { tarefa, form, isEnderecoValid, isLpnValid, isReady, isSubmitting } = state;
  const { register, formState, setValue } = form;

  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);

  function handleScan(value: string) {
    if (!scanTarget) return;
    setValue(scanTarget, value, { shouldValidate: true, shouldDirty: true });
    setScanTarget(null);
  }

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
            to="/movimentacao"
            aria-label="Voltar"
            onPointerDown={() => hapticLight()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-body-lg font-semibold text-on-surface leading-tight">
              Confirmar coleta
            </h1>
            <p className="truncate font-mono text-body-sm text-on-surface-variant">
              {tarefa.taskId}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-margin-mobile pb-4 pt-3">
        <div className="flex items-center gap-4 rounded-xl border border-secondary/25 bg-secondary/5 px-4 py-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
            <MapPin className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-md text-on-surface-variant">Vá para a origem</p>
            <p className="truncate font-mono text-body-lg font-bold text-secondary">
              {tarefa.origem}
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <ScanField
            id="enderecoOrigem"
            label="Endereço de origem"
            placeholder={`Escaneie ${tarefa.origem}`}
            registerProps={register('enderecoOrigem')}
            isValid={isEnderecoValid}
            onScanClick={() => setScanTarget('enderecoOrigem')}
            error={formState.errors.enderecoOrigem?.message}
          />
          <ScanField
            id="lpn"
            label="Palete / LPN"
            placeholder="Escaneie o LPN"
            registerProps={register('lpn')}
            isValid={isLpnValid}
            onScanClick={() => setScanTarget('lpn')}
            error={formState.errors.lpn?.message}
          />
        </section>

        <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
          <div className="flex items-center justify-between gap-3 bg-secondary-container px-4 py-3.5">
            <span className="truncate font-mono text-body-lg font-bold text-on-secondary-container">
              {tarefa.sku}
            </span>
            <span className="shrink-0 rounded-lg bg-on-secondary-container/20 px-2.5 py-1 font-mono text-body-sm text-on-secondary-container">
              LOTE {tarefa.lote}
            </span>
          </div>
          <div className="flex gap-4 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-outline-variant/80 bg-surface-container-low">
              <Package className="h-7 w-7 text-outline" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-body-md font-semibold text-on-surface">
                {tarefa.skuNome}
              </p>
              <p className="line-clamp-2 text-body-md text-on-surface-variant">
                {tarefa.skuDescricao}
              </p>
              <p className="mt-2 font-mono text-body-lg font-bold text-secondary">
                {tarefa.skuQty}{' '}
                <span className="font-sans text-body-md font-normal text-on-surface-variant">
                  un.
                </span>
              </p>
            </div>
          </div>
        </article>

        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void actions.onConfirm();
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
              Confirmar e ir para próxima etapa
              <ArrowRight className="h-6 w-6" aria-hidden />
            </>
          )}
        </Button>
      </div>

      <QrScannerModal
        open={scanTarget !== null}
        onOpenChange={(open) => {
          if (!open) setScanTarget(null);
        }}
        title={
          scanTarget === 'enderecoOrigem'
            ? 'Escanear endereço de origem'
            : 'Escanear LPN do palete'
        }
        onScan={handleScan}
      />
    </div>
  );
}

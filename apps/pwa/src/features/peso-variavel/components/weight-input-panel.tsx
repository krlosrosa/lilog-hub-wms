import { Button, cn } from '@lilog/ui';
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Scale,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface WeightInputPanelProps {
  etiquetaCodigo: string;
  pesoRegister: UseFormRegisterReturn<'pesoCaixaAtual'>;
  pesoError?: string;
  pesoAcumulado: number;
  onConfirmPeso: () => void;
  onCancelar: () => void;
  isSubmitting: boolean;
  children?: ReactNode;
}

export function WeightInputPanel({
  etiquetaCodigo,
  pesoRegister,
  pesoError,
  pesoAcumulado,
  onConfirmPeso,
  onCancelar,
  isSubmitting,
  children,
}: WeightInputPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-headline-md font-semibold text-on-surface">
            Informar peso
          </h3>
          <span className="shrink-0 rounded bg-secondary-container px-2 py-0.5 font-mono text-label-md font-bold text-on-secondary-container">
            {etiquetaCodigo}
          </span>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="box-weight"
            className="text-label-md text-on-surface-variant"
          >
            Peso desta caixa (kg)
          </label>
          <div className="relative">
            <input
              id="box-weight"
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="0,00"
              className={cn(
                'h-12 w-full rounded-lg border bg-surface-bright px-4 pr-12 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary numeric-input',
                pesoError ? 'border-destructive' : 'border-outline-variant',
              )}
              {...pesoRegister}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-body-sm text-on-surface-variant">
              kg
            </span>
          </div>
          {pesoError && (
            <p className="text-label-sm text-destructive">{pesoError}</p>
          )}
        </div>

        {pesoAcumulado > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-outline bg-surface-container-low p-3">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <Scale className="h-5 w-5" aria-hidden />
              <span className="text-label-sm uppercase tracking-tight">
                Peso acumulado
              </span>
            </div>
            <span className="font-mono text-label-md font-bold text-on-surface">
              {pesoAcumulado.toFixed(2)} kg
            </span>
          </div>
        )}
      </div>

      {children}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="h-12 w-full rounded-lg bg-secondary text-on-secondary active:scale-95 transition-transform touch-manipulation"
          disabled={isSubmitting}
          onClick={onConfirmPeso}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
              Salvando…
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" aria-hidden />
              Confirmar peso
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-lg active:scale-95 transition-transform touch-manipulation"
          disabled={isSubmitting}
          onClick={onCancelar}
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Voltar e bipar outra etiqueta
        </Button>
      </div>
    </div>
  );
}

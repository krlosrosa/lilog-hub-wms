import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Loader2, Thermometer } from 'lucide-react';
import { useEffect, useState } from 'react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import {
  useTemperaturaProdutoEtapas,
  type TemperaturaProdutoEtapaState,
} from '../hooks/use-temperatura-produto-etapas';
import type { TemperaturaProdutoEtapa } from '../types/recebimento.api';

type TemperaturaFormValues = Record<TemperaturaProdutoEtapa, string>;

const EMPTY_FORM: TemperaturaFormValues = {
  inicio: '',
  meio: '',
  fim: '',
};

const INPUTS: Array<{
  etapa: TemperaturaProdutoEtapa;
  label: string;
  hint: string;
}> = [
  { etapa: 'inicio', label: 'Início do baú', hint: 'Primeira leitura da carga' },
  { etapa: 'meio', label: 'Meio do baú', hint: 'Leitura na metade da conferência' },
  { etapa: 'fim', label: 'Fim do baú', hint: 'Última leitura antes de encerrar' },
];

function buildFormFromEtapas(etapas: TemperaturaProdutoEtapaState[]): TemperaturaFormValues {
  return {
    inicio:
      etapas.find((item) => item.etapa === 'inicio')?.temperatura?.toString() ??
      '',
    meio:
      etapas.find((item) => item.etapa === 'meio')?.temperatura?.toString() ?? '',
    fim:
      etapas.find((item) => item.etapa === 'fim')?.temperatura?.toString() ?? '',
  };
}

function TemperaturaProdutoModal({
  open,
  etapas,
  isSaving,
  saveError,
  onOpenChange,
  onSave,
  onClearError,
}: {
  open: boolean;
  etapas: TemperaturaProdutoEtapaState[];
  isSaving: boolean;
  saveError: string | null;
  onOpenChange: (open: boolean) => void;
  onSave: (
    entries: Array<{ etapa: TemperaturaProdutoEtapa; temperatura: number }>,
  ) => Promise<boolean>;
  onClearError: () => void;
}) {
  const [values, setValues] = useState<TemperaturaFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    onClearError();
    setValues(buildFormFromEtapas(etapas));
  }, [open, etapas, onClearError]);

  const parsedEntries = INPUTS.map((input) => {
    const raw = values[input.etapa].trim().replace(',', '.');
    const temperatura = raw === '' ? null : Number(raw);
    return {
      etapa: input.etapa,
      temperatura:
        temperatura != null && !Number.isNaN(temperatura) ? temperatura : null,
      invalid: raw !== '' && Number.isNaN(Number(raw)),
    };
  });

  const hasInvalid = parsedEntries.some((entry) => entry.invalid);
  const hasAtLeastOne = parsedEntries.some((entry) => entry.temperatura != null);
  const canSave = hasAtLeastOne && !hasInvalid && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;

    hapticMedium();
    const payload = parsedEntries
      .filter(
        (entry): entry is { etapa: TemperaturaProdutoEtapa; temperatura: number } =>
          entry.temperatura != null,
      )
      .map((entry) => ({
        etapa: entry.etapa,
        temperatura: entry.temperatura,
      }));

    const ok = await onSave(payload);
    if (ok) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant"
          aria-hidden
        />

        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-headline-md text-on-surface">
            <Thermometer className="h-5 w-5 text-secondary" aria-hidden />
            Temperatura do produto
          </SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Registre as três leituras exigidas pela qualidade durante a
            conferência.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-3">
          {INPUTS.map((input) => (
            <div key={input.etapa} className="space-y-1.5">
              <label
                className="text-label-md text-on-surface-variant"
                htmlFor={`temp-produto-${input.etapa}`}
              >
                {input.label}
              </label>
              <input
                id={`temp-produto-${input.etapa}`}
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="0.0"
                value={values[input.etapa]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [input.etapa]: event.target.value,
                  }))
                }
                className="numeric-input h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 text-center font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
              <p className="text-label-sm text-on-surface-variant">{input.hint}</p>
            </div>
          ))}

          {hasInvalid ? (
            <p className="text-label-sm text-destructive" role="alert">
              Informe temperaturas válidas em °C.
            </p>
          ) : null}

          {saveError ? (
            <p className="text-label-sm text-destructive" role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-12 flex-1 items-center justify-center rounded-lg border border-outline-variant text-label-md font-medium text-on-surface-variant touch-manipulation active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void handleSave()}
              className={cn(
                'flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
                canSave
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-high text-on-surface-variant',
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                'Salvar leituras'
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function TemperaturaProdutoModalButton({
  demandId,
  variant = 'secondary',
}: {
  demandId: string;
  variant?: 'secondary' | 'surface';
}) {
  const {
    etapas,
    preenchidas,
    totalEtapas,
    isLoading,
    isSaving,
    saveError,
    salvarEtapas,
    clearSaveError,
  } = useTemperaturaProdutoEtapas(demandId);
  const [open, setOpen] = useState(false);

  const completo = preenchidas === totalEtapas && totalEtapas > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          hapticLight();
          setOpen(true);
        }}
        aria-label="Registrar temperaturas do produto"
        className={cn(
          'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 touch-manipulation',
          variant === 'secondary'
            ? 'bg-secondary text-on-secondary'
            : 'bg-surface-container text-secondary',
        )}
      >
        <Thermometer className="h-4 w-4" aria-hidden />
        {!isLoading && preenchidas > 0 ? (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none',
              completo
                ? 'bg-tertiary-container text-on-tertiary-container'
                : 'bg-surface text-on-surface',
            )}
          >
            {preenchidas}
          </span>
        ) : null}
      </button>

      <TemperaturaProdutoModal
        open={open}
        etapas={etapas}
        isSaving={isSaving}
        saveError={saveError}
        onOpenChange={setOpen}
        onSave={salvarEtapas}
        onClearError={clearSaveError}
      />
    </>
  );
}

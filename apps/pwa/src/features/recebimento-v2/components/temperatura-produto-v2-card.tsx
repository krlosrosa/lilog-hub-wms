import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { CheckCircle2, Loader2, Thermometer } from 'lucide-react';
import { useCallback, useRef, useState, type KeyboardEvent } from 'react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import {
  useTemperaturaProdutoV2,
  type TemperaturaEtapaStateV2,
  type TemperaturaEtapaV2,
} from '../hooks/use-temperatura-produto-v2';
import { useProcessCapabilitiesV2 } from '../hooks/use-process-capabilities-v2';
import { TEMPERATURA_BAU_ETAPA_LABELS } from '../lib/temperatura-bau-v2';

type TemperaturaFormValues = Record<TemperaturaEtapaV2, string>;

const EMPTY_FORM: TemperaturaFormValues = {
  inicio: '',
  meio: '',
  fim: '',
};

const INPUTS: Array<{ etapa: TemperaturaEtapaV2; label: string; hint: string }> = [
  { etapa: 'inicio', label: TEMPERATURA_BAU_ETAPA_LABELS.inicio, hint: 'Primeira leitura da carga' },
  { etapa: 'meio', label: TEMPERATURA_BAU_ETAPA_LABELS.meio, hint: 'Leitura na metade da conferência' },
  { etapa: 'fim', label: TEMPERATURA_BAU_ETAPA_LABELS.fim, hint: 'Última leitura antes de encerrar' },
];

function buildFormFromEtapas(etapas: TemperaturaEtapaStateV2[]): TemperaturaFormValues {
  return {
    inicio: etapas.find((item) => item.etapa === 'inicio')?.temperatura?.toString() ?? '',
    meio: etapas.find((item) => item.etapa === 'meio')?.temperatura?.toString() ?? '',
    fim: etapas.find((item) => item.etapa === 'fim')?.temperatura?.toString() ?? '',
  };
}

function parseTemperatura(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;
  const temperatura = Number(normalized);
  return Number.isNaN(temperatura) ? null : temperatura;
}

export function TemperaturaProdutoV2ModalButton({ demandId }: { demandId: string }) {
  const { capabilities } = useProcessCapabilitiesV2(demandId);
  const canRegistrar = capabilities.canRegistrarTemperatura;
  const [open, setOpen] = useState(false);
  const [savingEtapa, setSavingEtapa] = useState<TemperaturaEtapaV2 | null>(null);
  const isClosingRef = useRef(false);
  const { etapas, preenchidas, completo, saveError, saveEtapas, clearSaveError } =
    useTemperaturaProdutoV2(demandId);
  const [values, setValues] = useState<TemperaturaFormValues>(EMPTY_FORM);

  const collectPendingEntries = useCallback((): Array<{
    etapa: TemperaturaEtapaV2;
    temperatura: number;
  }> => {
    return INPUTS.flatMap((input) => {
      const raw = values[input.etapa];
      const invalid = raw.trim() !== '' && parseTemperatura(raw) == null;
      if (invalid) return [];

      const temperatura = parseTemperatura(raw);
      if (temperatura == null) return [];

      const saved = etapas.find((item) => item.etapa === input.etapa)?.temperatura;
      if (saved === temperatura) return [];

      return [{ etapa: input.etapa, temperatura }];
    });
  }, [etapas, values]);

  const persistPendingEntries = useCallback(async () => {
    const entries = collectPendingEntries();
    if (entries.length === 0) return;

    setSavingEtapa(entries[entries.length - 1]?.etapa ?? null);
    try {
      await saveEtapas(entries);
    } finally {
      setSavingEtapa(null);
    }
  }, [collectPendingEntries, saveEtapas]);

  function openSheet() {
    if (!canRegistrar) return;
    hapticLight();
    clearSaveError();
    setValues(buildFormFromEtapas(etapas));
    setOpen(true);
  }

  async function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      isClosingRef.current = false;
      clearSaveError();
      setValues(buildFormFromEtapas(etapas));
      setOpen(true);
      return;
    }

    if (isClosingRef.current) {
      setOpen(false);
      return;
    }

    isClosingRef.current = true;
    await persistPendingEntries();
    isClosingRef.current = false;
    setOpen(false);
  }

  async function persistEtapa(etapa: TemperaturaEtapaV2) {
    const raw = values[etapa];
    const invalid = raw.trim() !== '' && parseTemperatura(raw) == null;
    if (invalid) return;

    const temperatura = parseTemperatura(raw);
    if (temperatura == null) return;

    const saved = etapas.find((item) => item.etapa === etapa)?.temperatura;
    if (saved === temperatura) return;

    setSavingEtapa(etapa);
    try {
      await saveEtapas([{ etapa, temperatura }]);
    } finally {
      setSavingEtapa(null);
    }
  }

  async function handleBlur(etapa: TemperaturaEtapaV2) {
    hapticMedium();
    await persistEtapa(etapa);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    etapa: TemperaturaEtapaV2,
    nextEtapa?: TemperaturaEtapaV2,
  ) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void persistEtapa(etapa).then(() => {
      if (nextEtapa) {
        document.getElementById(`temp-${nextEtapa}`)?.focus();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        disabled={!canRegistrar}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-medium touch-manipulation',
          !canRegistrar && 'cursor-not-allowed opacity-50',
          canRegistrar && completo
            ? 'bg-secondary-container text-on-secondary-container'
            : canRegistrar && preenchidas > 0
              ? 'bg-warning/15 text-warning'
              : 'bg-surface-container text-on-surface-variant',
        )}
        aria-label="Temperaturas do produto"
        title={!canRegistrar ? 'Somente o responsável registra temperaturas' : undefined}
      >
        <Thermometer className="h-3.5 w-3.5" aria-hidden />
        Temp. {preenchidas}/3
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />
          <SheetHeader className="text-left">
            <SheetTitle className="text-headline-md text-on-surface">
              Temperatura por etapa
            </SheetTitle>
            <SheetDescription className="text-body-sm text-on-surface-variant">
              Cada leitura é salva automaticamente ao sair do campo. As três etapas são
              obrigatórias para finalizar a conferência.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {INPUTS.map((input, index) => {
              const raw = values[input.etapa];
              const invalid = raw.trim() !== '' && parseTemperatura(raw) == null;
              const saved = etapas.find((item) => item.etapa === input.etapa)?.temperatura;
              const parsed = parseTemperatura(raw);
              const isSaved = saved != null && parsed === saved;
              const isFieldSaving = savingEtapa === input.etapa;
              const nextEtapa = INPUTS[index + 1]?.etapa;

              return (
                <div key={input.etapa} className="space-y-1.5">
                  <label
                    className="text-label-sm font-medium text-on-surface"
                    htmlFor={`temp-${input.etapa}`}
                  >
                    {input.label}
                  </label>
                  <p className="text-[11px] text-muted-foreground">{input.hint}</p>
                  <div className="relative">
                    <input
                      id={`temp-${input.etapa}`}
                      type="number"
                      step="0.1"
                      value={values[input.etapa]}
                      onChange={(e) =>
                        setValues((current) => ({ ...current, [input.etapa]: e.target.value }))
                      }
                      onBlur={() => void handleBlur(input.etapa)}
                      onKeyDown={(event) => handleKeyDown(event, input.etapa, nextEtapa)}
                      placeholder="Ex: -18.0"
                      aria-invalid={invalid}
                      className={cn(
                        'w-full rounded-lg border bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                        invalid ? 'border-destructive' : 'border-input',
                      )}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      {isFieldSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" aria-hidden />
                      ) : isSaved ? (
                        <CheckCircle2 className="h-4 w-4 text-secondary" aria-hidden />
                      ) : null}
                    </div>
                  </div>
                  {invalid ? (
                    <p className="text-label-sm text-destructive" role="alert">
                      Informe uma temperatura válida em °C.
                    </p>
                  ) : null}
                </div>
              );
            })}

            {saveError && <p className="text-label-sm text-destructive">{saveError}</p>}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

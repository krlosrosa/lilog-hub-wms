import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { CheckCircle2, Loader2, Thermometer } from 'lucide-react';
import { useState } from 'react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import {
  useTemperaturaProdutoV2,
  type TemperaturaEtapaStateV2,
  type TemperaturaEtapaV2,
} from '../hooks/use-temperatura-produto-v2';
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
  const [open, setOpen] = useState(false);
  const [savingEtapa, setSavingEtapa] = useState<TemperaturaEtapaV2 | null>(null);
  const { etapas, preenchidas, completo, saveError, saveEtapa, clearSaveError } =
    useTemperaturaProdutoV2(demandId);
  const [values, setValues] = useState<TemperaturaFormValues>(EMPTY_FORM);

  function openSheet() {
    hapticLight();
    clearSaveError();
    setValues(buildFormFromEtapas(etapas));
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      clearSaveError();
      setValues(buildFormFromEtapas(etapas));
    }
    setOpen(nextOpen);
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
      await saveEtapa(etapa, temperatura);
    } finally {
      setSavingEtapa(null);
    }
  }

  async function handleBlur(etapa: TemperaturaEtapaV2) {
    hapticMedium();
    await persistEtapa(etapa);
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-medium touch-manipulation',
          completo
            ? 'bg-secondary-container text-on-secondary-container'
            : preenchidas > 0
              ? 'bg-warning/15 text-warning'
              : 'bg-surface-container text-on-surface-variant',
        )}
        aria-label="Temperaturas do produto"
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
            {INPUTS.map((input) => {
              const raw = values[input.etapa];
              const invalid = raw.trim() !== '' && parseTemperatura(raw) == null;
              const saved = etapas.find((item) => item.etapa === input.etapa)?.temperatura;
              const parsed = parseTemperatura(raw);
              const isSaved = saved != null && parsed === saved;
              const isFieldSaving = savingEtapa === input.etapa;

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

'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Loader2, Truck } from 'lucide-react';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/recebimento/components/form-field-classes';
import type {
  GrauPrioridadePreRecebimentoApi,
  RecepcionarCarroPayload,
} from '@/features/recebimento/types/recebimento.api';

export type RecepcionarCarroFormValues = {
  motoristaNome: string;
  motoristaTelefone: string;
  placa: string;
  dataChegada: string;
  grauPrioridade: GrauPrioridadePreRecebimentoApi | '';
};

const GRAU_PRIORIDADE_OPTIONS: Array<{
  value: GrauPrioridadePreRecebimentoApi;
  label: string;
}> = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'normal', label: 'Normal' },
  { value: 'alto', label: 'Alto' },
  { value: 'urgente', label: 'Urgente' },
];

function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function buildDefaultValues(placa?: string): RecepcionarCarroFormValues {
  return {
    motoristaNome: '',
    motoristaTelefone: '',
    placa: placa ?? '',
    dataChegada: toDatetimeLocalValue(new Date()),
    grauPrioridade: 'normal',
  };
}

function toPayload(values: RecepcionarCarroFormValues): RecepcionarCarroPayload {
  const payload: RecepcionarCarroPayload = {};

  const motoristaNome = values.motoristaNome.trim();
  const motoristaTelefone = values.motoristaTelefone.trim();
  const placa = values.placa.trim();
  const dataChegada = values.dataChegada.trim();

  if (motoristaNome) payload.motoristaNome = motoristaNome;
  if (motoristaTelefone) payload.motoristaTelefone = motoristaTelefone;
  if (placa) payload.placa = placa;
  if (dataChegada) payload.dataChegada = new Date(dataChegada).toISOString();
  if (values.grauPrioridade) payload.grauPrioridade = values.grauPrioridade;

  return payload;
}

type RecepcionarCarroSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placa?: string;
  isSubmitting?: boolean;
  onConfirm: (payload: RecepcionarCarroPayload) => Promise<void>;
};

export function RecepcionarCarroSheet({
  open,
  onOpenChange,
  placa,
  isSubmitting = false,
  onConfirm,
}: RecepcionarCarroSheetProps) {
  const [values, setValues] = useState<RecepcionarCarroFormValues>(() =>
    buildDefaultValues(placa),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(buildDefaultValues(placa));
      setError(null);
    }
  }, [open, placa]);

  const updateField = <K extends keyof RecepcionarCarroFormValues>(
    field: K,
    value: RecepcionarCarroFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(null);

    try {
      await onConfirm(toPayload(values));
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível recepcionar o veículo';
      setError(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-outline-variant bg-surface-highest/30 px-6 py-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Truck className="size-4 text-primary" aria-hidden />
            Recepcionar carro
          </SheetTitle>
          <SheetDescription>
            Registre a chegada do veículo. Todos os campos são opcionais.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-0.5">
            <label htmlFor="recepcionar-motorista" className={fieldLabelClassName}>
              Motorista
            </label>
            <input
              id="recepcionar-motorista"
              type="text"
              autoComplete="name"
              placeholder="Nome do motorista"
              className={fieldInputClassName}
              value={values.motoristaNome}
              onChange={(event) =>
                updateField('motoristaNome', event.target.value)
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-0.5">
            <label htmlFor="recepcionar-telefone" className={fieldLabelClassName}>
              Telefone
            </label>
            <input
              id="recepcionar-telefone"
              type="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              className={fieldInputClassName}
              value={values.motoristaTelefone}
              onChange={(event) =>
                updateField('motoristaTelefone', event.target.value)
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-0.5">
            <label htmlFor="recepcionar-chegada" className={fieldLabelClassName}>
              Horário de chegada
            </label>
            <input
              id="recepcionar-chegada"
              type="datetime-local"
              className={fieldInputClassName}
              value={values.dataChegada}
              onChange={(event) =>
                updateField('dataChegada', event.target.value)
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-0.5">
            <label htmlFor="recepcionar-placa" className={fieldLabelClassName}>
              Placa
            </label>
            <input
              id="recepcionar-placa"
              type="text"
              autoCapitalize="characters"
              placeholder="ABC-1234"
              className={fieldInputClassName}
              value={values.placa}
              onChange={(event) => updateField('placa', event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-0.5">
            <label htmlFor="recepcionar-prioridade" className={fieldLabelClassName}>
              Grau de prioridade
            </label>
            <select
              id="recepcionar-prioridade"
              className={fieldInputClassName}
              value={values.grauPrioridade}
              onChange={(event) =>
                updateField(
                  'grauPrioridade',
                  event.target.value as RecepcionarCarroFormValues['grauPrioridade'],
                )
              }
              disabled={isSubmitting}
            >
              <option value="">Sem prioridade</option>
              {GRAU_PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className={fieldErrorClassName} role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <SheetFooter className="flex shrink-0 flex-row gap-2 border-t border-outline-variant px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Confirmando…
              </>
            ) : (
              'Confirmar recepção'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

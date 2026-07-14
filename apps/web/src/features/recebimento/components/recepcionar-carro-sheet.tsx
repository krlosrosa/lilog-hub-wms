'use client';

import { useEffect, useState } from 'react';

import {
  isPlacaVeiculoValida,
  normalizarPlacaVeiculo,
  PLACA_VEICULO_FORMATO_MENSAGEM,
} from '@lilog/contracts';
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
  quantidadePaletesEsperada: string;
  numeroTermoPalete: string;
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
    quantidadePaletesEsperada: '',
    numeroTermoPalete: '',
  };
}

function toPayload(values: RecepcionarCarroFormValues): RecepcionarCarroPayload {
  const motoristaNome = values.motoristaNome.trim();
  const motoristaTelefone = values.motoristaTelefone.trim();
  const placa = normalizarPlacaVeiculo(values.placa);
  const dataChegada = values.dataChegada.trim();
  const quantidadePaletesEsperada = values.quantidadePaletesEsperada.trim();
  const numeroTermoPalete = values.numeroTermoPalete.trim();

  const payload: RecepcionarCarroPayload = {
    motoristaNome,
    placa,
  };

  if (motoristaTelefone) payload.motoristaTelefone = motoristaTelefone;
  if (dataChegada) payload.dataChegada = new Date(dataChegada).toISOString();
  if (values.grauPrioridade) payload.grauPrioridade = values.grauPrioridade;
  if (quantidadePaletesEsperada) {
    payload.quantidadePaletesEsperada = Number.parseInt(
      quantidadePaletesEsperada,
      10,
    );
  }
  if (numeroTermoPalete) payload.numeroTermoPalete = numeroTermoPalete;

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
  const [fieldErrors, setFieldErrors] = useState<{
    motoristaNome?: string;
    placa?: string;
  }>({});

  useEffect(() => {
    if (open) {
      setValues(buildDefaultValues(placa));
      setError(null);
      setFieldErrors({});
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

    const nextFieldErrors: { motoristaNome?: string; placa?: string } = {};
    if (!values.motoristaNome.trim()) {
      nextFieldErrors.motoristaNome = 'Informe o nome do motorista';
    }
    if (!values.placa.trim()) {
      nextFieldErrors.placa = 'Informe a placa do veículo';
    } else if (!isPlacaVeiculoValida(values.placa)) {
      nextFieldErrors.placa = PLACA_VEICULO_FORMATO_MENSAGEM;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

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
            Registre a chegada do veículo. Motorista e placa são obrigatórios.
            A placa deve seguir o formato antigo (AAA9999) ou Mercosul (AAA9A99),
            opcionalmente com UF (ex.: ABC1234-SP, EZU5H23-MG).
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-0.5">
            <label htmlFor="recepcionar-motorista" className={fieldLabelClassName}>
              Motorista <span className="text-error">*</span>
            </label>
            <input
              id="recepcionar-motorista"
              type="text"
              autoComplete="name"
              placeholder="Nome do motorista"
              className={fieldInputClassName}
              value={values.motoristaNome}
              onChange={(event) => {
                updateField('motoristaNome', event.target.value);
                if (fieldErrors.motoristaNome) {
                  setFieldErrors((prev) => ({ ...prev, motoristaNome: undefined }));
                }
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.motoristaNome)}
            />
            {fieldErrors.motoristaNome ? (
              <p className={fieldErrorClassName} role="alert">
                {fieldErrors.motoristaNome}
              </p>
            ) : null}
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
              Placa <span className="text-error">*</span>
            </label>
            <input
              id="recepcionar-placa"
              type="text"
              autoCapitalize="characters"
              placeholder="ABC1234 ou ABC1234-SP"
              className={fieldInputClassName}
              value={values.placa}
              onChange={(event) => {
                updateField('placa', event.target.value.toUpperCase());
                if (fieldErrors.placa) {
                  setFieldErrors((prev) => ({ ...prev, placa: undefined }));
                }
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.placa)}
            />
            {fieldErrors.placa ? (
              <p className={fieldErrorClassName} role="alert">
                {fieldErrors.placa}
              </p>
            ) : null}
          </div>

          <div className="space-y-0.5">
            <label
              htmlFor="recepcionar-paletes-esperados"
              className={fieldLabelClassName}
            >
              Quantidade esperada de paletes
            </label>
            <input
              id="recepcionar-paletes-esperados"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="0"
              className={fieldInputClassName}
              value={values.quantidadePaletesEsperada}
              onChange={(event) =>
                updateField('quantidadePaletesEsperada', event.target.value)
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-0.5">
            <label
              htmlFor="recepcionar-termo-palete"
              className={fieldLabelClassName}
            >
              Número do termo palete
            </label>
            <input
              id="recepcionar-termo-palete"
              type="text"
              placeholder="Informe o número do termo palete"
              className={fieldInputClassName}
              value={values.numeroTermoPalete}
              onChange={(event) =>
                updateField('numeroTermoPalete', event.target.value)
              }
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

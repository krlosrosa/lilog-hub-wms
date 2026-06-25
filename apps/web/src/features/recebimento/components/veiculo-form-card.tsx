'use client';

import { Truck } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/recebimento/components/form-field-classes';
import type { RecebimentoCadastroFormValues } from '@/features/recebimento/types/recebimento-cadastro.schema';

export function VeiculoFormCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RecebimentoCadastroFormValues>();

  return (
    <section className={sectionCardClassName} aria-labelledby="titulo-veiculo-doc">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Truck className="size-6 shrink-0 text-primary" aria-hidden />
        <h2
          id="titulo-veiculo-doc"
          className="text-headline-md font-bold uppercase tracking-wide text-foreground"
        >
          Informações do veículo
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        <div className="space-y-1">
          <label htmlFor="recv-placa" className={fieldLabelClassName}>
            Placa do veículo *
          </label>
          <input
            id="recv-placa"
            type="text"
            autoCapitalize="characters"
            placeholder="ABC-1234"
            aria-invalid={Boolean(errors.placa)}
            className={fieldInputClassName}
            {...register('placa')}
          />
          {errors.placa?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.placa.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="recv-transportadora" className={fieldLabelClassName}>
            Transportadora *
          </label>
          <input
            id="recv-transportadora"
            type="text"
            autoComplete="organization"
            placeholder="Ex.: TRANSLOG-001"
            aria-invalid={Boolean(errors.transportadoraId)}
            className={fieldInputClassName}
            {...register('transportadoraId')}
          />
          {errors.transportadoraId?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.transportadoraId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="recv-horario" className={fieldLabelClassName}>
            Previsão de chegada *
          </label>
          <input
            id="recv-horario"
            type="datetime-local"
            aria-invalid={Boolean(errors.horarioPrevisto)}
            className={fieldInputClassName}
            {...register('horarioPrevisto')}
          />
          {errors.horarioPrevisto?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.horarioPrevisto.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="recv-observacao" className={fieldLabelClassName}>
            Observação
          </label>
          <textarea
            id="recv-observacao"
            rows={3}
            placeholder="Informações adicionais sobre a carga (opcional)"
            aria-invalid={Boolean(errors.observacao)}
            className={`${fieldInputClassName} resize-y min-h-[5rem]`}
            {...register('observacao')}
          />
          {errors.observacao?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.observacao.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

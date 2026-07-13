'use client';

import { Truck } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  fieldTextareaClassName,
  sectionCardClassName,
  sectionHeaderClassName,
  sectionIconClassName,
  sectionTitleClassName,
} from '@/features/recebimento/components/form-field-classes';
import type { RecebimentoCadastroFormValues } from '@/features/recebimento/types/recebimento-cadastro.schema';

export function VeiculoFormCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RecebimentoCadastroFormValues>();

  return (
    <section className={sectionCardClassName} aria-labelledby="titulo-veiculo-doc">
      <div className={sectionHeaderClassName}>
        <h2 id="titulo-veiculo-doc" className={sectionTitleClassName}>
          <Truck className={sectionIconClassName} aria-hidden />
          Veículo
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-0.5 sm:col-span-2">
          <label htmlFor="recv-placa" className={fieldLabelClassName}>
            Placa
          </label>
          <input
            id="recv-placa"
            type="text"
            autoCapitalize="characters"
            placeholder="ABC-1234 (opcional)"
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

        <div className="space-y-0.5 sm:col-span-2">
          <label htmlFor="recv-transportadora" className={fieldLabelClassName}>
            Transportadora
          </label>
          <input
            id="recv-transportadora"
            type="text"
            autoComplete="organization"
            placeholder="Ex.: TRANSLOG SP"
            aria-invalid={Boolean(errors.transportadoraNome)}
            className={fieldInputClassName}
            {...register('transportadoraNome')}
          />
          {errors.transportadoraNome?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.transportadoraNome.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-0.5">
          <label htmlFor="recv-numero-ocr" className={fieldLabelClassName}>
            Nº OCR
          </label>
          <input
            id="recv-numero-ocr"
            type="text"
            placeholder="Referência OCR"
            className={fieldInputClassName}
            {...register('numeroOcr')}
          />
        </div>

        <div className="space-y-0.5">
          <label htmlFor="recv-numero-transporte" className={fieldLabelClassName}>
            Nº transporte
          </label>
          <input
            id="recv-numero-transporte"
            type="text"
            placeholder="Referência transporte"
            className={fieldInputClassName}
            {...register('numeroTransporte')}
          />
        </div>

        <div className="space-y-0.5">
          <label htmlFor="recv-paletes-esperados" className={fieldLabelClassName}>
            Paletes esperados
          </label>
          <input
            id="recv-paletes-esperados"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="Opcional"
            aria-invalid={Boolean(errors.quantidadePaletesEsperada)}
            className={fieldInputClassName}
            {...register('quantidadePaletesEsperada')}
          />
          {errors.quantidadePaletesEsperada?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.quantidadePaletesEsperada.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-0.5 sm:col-span-2">
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

        <div className="space-y-0.5 sm:col-span-2">
          <label htmlFor="recv-observacao" className={fieldLabelClassName}>
            Observação
          </label>
          <textarea
            id="recv-observacao"
            rows={2}
            placeholder="Informações adicionais (opcional)"
            aria-invalid={Boolean(errors.observacao)}
            className={fieldTextareaClassName}
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

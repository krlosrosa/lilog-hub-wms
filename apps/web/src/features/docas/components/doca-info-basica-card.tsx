'use client';

import { Building2, Info } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@lilog/ui';

import {
  DOCA_FORM_TIPO_LABELS,
  DOCA_FORM_TIPO_OPTIONS,
  type DocaFormValues,
} from '@/features/docas/types/doca-form.schema';
import type { UnidadeSelecionada } from '@/contexts/unidade-context';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from './form-field-classes';

type DocaInfoBasicaCardProps = {
  unidadeSelecionada: UnidadeSelecionada | null;
};

export function DocaInfoBasicaCard({
  unidadeSelecionada,
}: DocaInfoBasicaCardProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<DocaFormValues>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Info className="size-5" aria-hidden />
        </div>
        <h3 className="text-headline-md font-semibold text-foreground">
          Dados da Doca
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className={fieldLabelClassName}>Unidade</p>
          {unidadeSelecionada ? (
            <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-low px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-body-md font-semibold text-foreground">
                  {unidadeSelecionada.nomeFilial}
                </p>
                <p className="truncate text-body-sm text-muted-foreground">
                  {unidadeSelecionada.nome}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
                  {unidadeSelecionada.id}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-sm text-destructive">
              Nenhuma unidade selecionada. Selecione uma unidade para cadastrar
              a doca.
            </p>
          )}
          <input type="hidden" {...register('unidadeId')} />
          {errors.unidadeId?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.unidadeId.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="doca-codigo" className={fieldLabelClassName}>
            Código *
          </label>
          <input
            id="doca-codigo"
            type="text"
            autoComplete="off"
            placeholder="Ex: D01"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.codigo)}
            disabled={!unidadeSelecionada}
            {...register('codigo')}
          />
          {errors.codigo?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.codigo.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="doca-nome" className={fieldLabelClassName}>
            Nome *
          </label>
          <input
            id="doca-nome"
            type="text"
            autoComplete="off"
            placeholder="Ex: Doca 01"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.nome)}
            disabled={!unidadeSelecionada}
            {...register('nome')}
          />
          {errors.nome?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.nome.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="doca-tipo" className={fieldLabelClassName}>
            Tipo *
          </label>
          <select
            id="doca-tipo"
            className={cn(fieldInputClassName, 'appearance-none')}
            aria-invalid={Boolean(errors.tipo)}
            disabled={!unidadeSelecionada}
            {...register('tipo')}
          >
            {DOCA_FORM_TIPO_OPTIONS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {DOCA_FORM_TIPO_LABELS[tipo]}
              </option>
            ))}
          </select>
          {errors.tipo?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.tipo.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="doca-capacidade" className={fieldLabelClassName}>
            Capacidade de veículos
          </label>
          <input
            id="doca-capacidade"
            type="number"
            min={1}
            step={1}
            placeholder="Opcional"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.capacidadeVeiculos)}
            disabled={!unidadeSelecionada}
            {...register('capacidadeVeiculos', {
              setValueAs: (value) => {
                if (value === '' || value === null || value === undefined) {
                  return undefined;
                }

                const parsed = Number(value);
                return Number.isNaN(parsed) ? undefined : parsed;
              },
            })}
          />
          {errors.capacidadeVeiculos?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.capacidadeVeiculos.message}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="doca-observacao" className={fieldLabelClassName}>
            Observação
          </label>
          <textarea
            id="doca-observacao"
            rows={3}
            placeholder="Informações adicionais sobre a doca"
            className={cn(fieldInputClassName, 'resize-none')}
            aria-invalid={Boolean(errors.observacao)}
            disabled={!unidadeSelecionada}
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

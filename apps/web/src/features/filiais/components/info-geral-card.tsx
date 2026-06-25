'use client';

import { Info } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@lilog/ui';

import {
  CLUSTER_OPTIONS,
  type FilialFormValues,
} from '@/features/filiais/types/filial.schema';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from './form-field-classes';

export type InfoGeralCardProps = {
  mode: 'create' | 'edit';
  unidadeId?: string;
};

export function InfoGeralCard({ mode, unidadeId }: InfoGeralCardProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FilialFormValues>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-3">
        <Info className="size-6 shrink-0 text-primary" aria-hidden />
        <h3 className="text-headline-md font-semibold text-foreground">
          Informações Gerais
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <label htmlFor="filial-id" className={fieldLabelClassName}>
            Código da unidade <span className="text-destructive">*</span>
          </label>
          {mode === 'edit' ? (
            <>
              <input type="hidden" {...register('id')} />
              <p
                id="filial-id"
                className={cn(
                  fieldInputClassName,
                  'bg-surface-lowest font-mono text-sm text-muted-foreground',
                )}
              >
                {unidadeId}
              </p>
              <p className="mt-1 text-caption text-muted-foreground">
                O código não pode ser alterado após o cadastro.
              </p>
            </>
          ) : (
            <>
              <input
                id="filial-id"
                type="text"
                autoComplete="off"
                maxLength={50}
                placeholder="Ex: SP01"
                className={fieldInputClassName}
                aria-invalid={Boolean(errors.id)}
                {...register('id')}
              />
              <p className="mt-1 text-caption text-muted-foreground">
                Identificador único com até 50 caracteres.
              </p>
              {errors.id?.message ? (
                <p className={fieldErrorClassName} role="alert">
                  {errors.id.message}
                </p>
              ) : null}
            </>
          )}
        </div>
        <div className="md:col-span-1">
          <label htmlFor="filial-cluster" className={fieldLabelClassName}>
            Cluster <span className="text-destructive">*</span>
          </label>
          <select
            id="filial-cluster"
            className={cn(fieldInputClassName, 'appearance-none')}
            aria-invalid={Boolean(errors.cluster)}
            {...register('cluster')}
          >
            {CLUSTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.cluster?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.cluster.message}
            </p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="filial-nome" className={fieldLabelClassName}>
            Nome da unidade <span className="text-destructive">*</span>
          </label>
          <input
            id="filial-nome"
            type="text"
            autoComplete="organization"
            placeholder="Ex: Unidade São Paulo Norte"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.nome)}
            {...register('nome')}
          />
          {errors.nome?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.nome.message}
            </p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="filial-nome-filial" className={fieldLabelClassName}>
            Nome da filial <span className="text-destructive">*</span>
          </label>
          <input
            id="filial-nome-filial"
            type="text"
            autoComplete="organization"
            placeholder="Ex: Filial São Paulo Norte"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.nomeFilial)}
            {...register('nomeFilial')}
          />
          {errors.nomeFilial?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.nomeFilial.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

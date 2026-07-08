'use client';

import { Building2, Copy } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@lilog/ui';

import {
  DOCA_FORM_TIPO_LABELS,
  DOCA_FORM_TIPO_OPTIONS,
} from '@/features/docas/types/doca-form.schema';
import type { DocaBulkFormValues } from '@/features/docas/types/doca-bulk-form.schema';
import type { UnidadeSelecionada } from '@/contexts/unidade-context';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from './form-field-classes';

type DocaBulkCardProps = {
  unidadeSelecionada: UnidadeSelecionada | null;
  quantidade: number;
  preview: {
    primeiroCodigo: string;
    ultimoCodigo: string;
    primeiroNome: string;
    ultimoNome: string;
  } | null;
};

export function DocaBulkCard({
  unidadeSelecionada,
  quantidade,
  preview,
}: DocaBulkCardProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<DocaBulkFormValues>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Copy className="size-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-headline-md font-semibold text-foreground">
            Cadastro em massa
          </h3>
          <p className="text-body-sm text-muted-foreground">
            Informe o intervalo numérico para gerar várias docas de uma vez.
          </p>
        </div>
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
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-sm text-destructive">
              Nenhuma unidade selecionada. Selecione uma unidade para cadastrar
              as docas.
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
          <label htmlFor="doca-numero-inicial" className={fieldLabelClassName}>
            Número inicial *
          </label>
          <input
            id="doca-numero-inicial"
            type="number"
            min={1}
            step={1}
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.numeroInicial)}
            disabled={!unidadeSelecionada}
            {...register('numeroInicial', { valueAsNumber: true })}
          />
          {errors.numeroInicial?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.numeroInicial.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="doca-numero-final" className={fieldLabelClassName}>
            Número final *
          </label>
          <input
            id="doca-numero-final"
            type="number"
            min={1}
            step={1}
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.numeroFinal)}
            disabled={!unidadeSelecionada}
            {...register('numeroFinal', { valueAsNumber: true })}
          />
          {errors.numeroFinal?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.numeroFinal.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="doca-codigo-prefixo" className={fieldLabelClassName}>
            Prefixo do código
          </label>
          <input
            id="doca-codigo-prefixo"
            type="text"
            autoComplete="off"
            placeholder="Ex: D"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.codigoPrefixo)}
            disabled={!unidadeSelecionada}
            {...register('codigoPrefixo')}
          />
          {errors.codigoPrefixo?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.codigoPrefixo.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="doca-nome-prefixo" className={fieldLabelClassName}>
            Prefixo do nome
          </label>
          <input
            id="doca-nome-prefixo"
            type="text"
            autoComplete="off"
            placeholder="Ex: Doca "
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.nomePrefixo)}
            disabled={!unidadeSelecionada}
            {...register('nomePrefixo')}
          />
          {errors.nomePrefixo?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.nomePrefixo.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="doca-bulk-tipo" className={fieldLabelClassName}>
            Tipo *
          </label>
          <select
            id="doca-bulk-tipo"
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
          <label htmlFor="doca-bulk-capacidade" className={fieldLabelClassName}>
            Capacidade de veículos
          </label>
          <input
            id="doca-bulk-capacidade"
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
          <label htmlFor="doca-bulk-observacao" className={fieldLabelClassName}>
            Observação
          </label>
          <textarea
            id="doca-bulk-observacao"
            rows={3}
            placeholder="Informações adicionais aplicadas a todas as docas"
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

        {preview ? (
          <div className="md:col-span-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Pré-visualização
            </p>
            <p className="mt-2 text-body-md text-foreground">
              Serão criadas{' '}
              <span className="font-semibold tabular-nums">{quantidade}</span>{' '}
              doca(s):
            </p>
            <p className="mt-1 font-mono text-body-sm text-muted-foreground">
              {preview.primeiroCodigo} ({preview.primeiroNome})
              {quantidade > 1 ? (
                <>
                  {' '}
                  até {preview.ultimoCodigo} ({preview.ultimoNome})
                </>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

'use client';

import { Ruler } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@lilog/ui';

import type { ProdutoFormValues } from '@/features/produto/types/produto.schema';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/produto/components/form-field-classes';

export function MedidasCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProdutoFormValues>();

  return (
    <section className={cn(sectionCardClassName, 'relative overflow-hidden')}>
      <div className="pointer-events-none absolute right-0 top-0 p-3 opacity-10" aria-hidden>
        <Ruler className="size-28 text-foreground" />
      </div>
      <div className="relative z-10 mb-4 flex items-center gap-3">
        <Ruler className="size-5 shrink-0 text-tertiary" aria-hidden />
        <h3 className="text-headline-md font-semibold text-foreground">
          Medidas e Cubagem
        </h3>
      </div>
      <div className="relative z-10 space-y-5">
        <div className="space-y-3">
          <h4 className="border-b border-primary/10 pb-2 text-xs font-bold uppercase tracking-widest text-primary/70">
            Pesos líquidos
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="produto-peso-unidade" className={fieldLabelClassName}>
                Unidade (kg)
              </label>
              <input
                id="produto-peso-unidade"
                type="text"
                autoComplete="off"
                placeholder="0,000"
                className={fieldInputClassName}
                {...register('pesoBrutoUnidade')}
              />
            </div>
            <div>
              <label htmlFor="produto-peso-caixa" className={fieldLabelClassName}>
                Caixa (kg)
              </label>
              <input
                id="produto-peso-caixa"
                type="text"
                autoComplete="off"
                placeholder="0,000"
                className={fieldInputClassName}
                {...register('pesoBrutoCaixa')}
              />
            </div>
            <div>
              <label htmlFor="produto-peso-palete" className={fieldLabelClassName}>
                Palete (kg)
              </label>
              <input
                id="produto-peso-palete"
                type="text"
                autoComplete="off"
                placeholder="0,000"
                className={fieldInputClassName}
                {...register('pesoBrutoPalete')}
              />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="border-b border-primary/10 pb-2 text-xs font-bold uppercase tracking-widest text-primary/70">
            Empacotamento
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="produto-ux-caixa" className={fieldLabelClassName}>
                Unidades por caixa
              </label>
              <input
                id="produto-ux-caixa"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="12"
                className={fieldInputClassName}
                aria-invalid={Boolean(errors.unidadesPorCaixa)}
                {...register('unidadesPorCaixa')}
              />
              {errors.unidadesPorCaixa?.message ? (
                <p className={fieldErrorClassName} role="alert">
                  {errors.unidadesPorCaixa.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="produto-caixas-palete" className={fieldLabelClassName}>
                Caixas por palete
              </label>
              <input
                id="produto-caixas-palete"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="48"
                className={fieldInputClassName}
                aria-invalid={Boolean(errors.caixasPorPalete)}
                {...register('caixasPorPalete')}
              />
              {errors.caixasPorPalete?.message ? (
                <p className={fieldErrorClassName} role="alert">
                  {errors.caixasPorPalete.message}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { Barcode, Truck } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '@lilog/ui';

import {
  TIPO_PRODUTO_VALUES,
  type ProdutoFormValues,
} from '@/features/produto/types/produto.schema';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/produto/components/form-field-classes';

export function LogisticaCard() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProdutoFormValues>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-4 flex items-center gap-3">
        <Truck className="size-5 shrink-0 text-primary" aria-hidden />
        <h3 className="text-headline-md font-semibold text-foreground">
          Logística e Identificação
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        <div>
          <label htmlFor="produto-ean" className={fieldLabelClassName}>
            EAN (Código de Barras)
          </label>
          <div className="relative">
            <Barcode
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="produto-ean"
              type="text"
              autoComplete="off"
              placeholder="7890000000000"
              className={cn(fieldInputClassName, 'pl-10')}
              aria-invalid={Boolean(errors.ean)}
              {...register('ean')}
            />
          </div>
          {errors.ean?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.ean.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="produto-dum" className={fieldLabelClassName}>
            DUM (Unidade Despacho)
          </label>
          <input
            id="produto-dum"
            type="text"
            autoComplete="off"
            placeholder="Ex: 17890000000000"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.dum)}
            {...register('dum')}
          />
          {errors.dum?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.dum.message}
            </p>
          ) : null}
        </div>
        <div>
          <p id="tipo-produto-hint" className={fieldLabelClassName}>
            Tipo (PVAR/PPAR)
          </p>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <div
                className="flex rounded-lg border border-outline-variant bg-surface-low p-1"
                role="group"
                aria-labelledby="tipo-produto-hint"
              >
                {TIPO_PRODUTO_VALUES.map((t) => {
                  const selected = field.value === t;

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        field.onChange(t);
                      }}
                      className={cn(
                        'flex-1 rounded-md py-2 text-sm font-semibold transition-colors',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.tipo?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.tipo.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

'use client';

import { Layers } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@lilog/ui';

import {
  CATEGORIA_OPTIONS,
  EMPRESA_OPTIONS,
  type ProdutoFormValues,
} from '@/features/produto/types/produto.schema';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/produto/components/form-field-classes';

export function ClassificacaoCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProdutoFormValues>();

  return (
    <section className={cn(sectionCardClassName, 'space-y-4')}>
      <div className="mb-0 flex items-center gap-3">
        <Layers className="size-5 shrink-0 text-secondary-foreground" aria-hidden />
        <h3 className="text-headline-md font-semibold text-foreground">
          Classificação
        </h3>
      </div>
      <div>
        <label htmlFor="produto-empresa" className={fieldLabelClassName}>
          Empresa
        </label>
        <select
          id="produto-empresa"
          className={cn(fieldInputClassName, 'appearance-none')}
          aria-invalid={Boolean(errors.empresa)}
          {...register('empresa')}
        >
          <option value="">Selecione a Unidade</option>
          {EMPRESA_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.empresa?.message ? (
          <p className={fieldErrorClassName} role="alert">
            {errors.empresa.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="produto-categoria" className={fieldLabelClassName}>
          Categoria
        </label>
        <select
          id="produto-categoria"
          className={cn(fieldInputClassName, 'appearance-none')}
          aria-invalid={Boolean(errors.categoria)}
          {...register('categoria')}
        >
          <option value="">Selecione a Categoria</option>
          {CATEGORIA_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.categoria?.message ? (
          <p className={fieldErrorClassName} role="alert">
            {errors.categoria.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="produto-shelf-life" className={fieldLabelClassName}>
          Shelf Life (Dias)
        </label>
        <input
          id="produto-shelf-life"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ex: 365"
          className={fieldInputClassName}
          aria-invalid={Boolean(errors.shelfLife)}
          {...register('shelfLife')}
        />
        {errors.shelfLife?.message ? (
          <p className={fieldErrorClassName} role="alert">
            {errors.shelfLife.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

'use client';

import { Info } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@lilog/ui';

import type { ProdutoFormValues } from '@/features/produto/types/produto.schema';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/produto/components/form-field-classes';

export function InfoBasicaCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProdutoFormValues>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-4 flex items-center gap-3">
        <Info className="size-5 shrink-0 text-tertiary" aria-hidden />
        <h3 className="text-headline-md font-semibold text-foreground">
          Informações Básicas
        </h3>
      </div>
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-6 md:col-span-2">
          <label htmlFor="produto-id" className={fieldLabelClassName}>
            ID do Produto
          </label>
          <input
            id="produto-id"
            type="text"
            autoComplete="off"
            placeholder="Ex: PRD-001"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.produtoId)}
            {...register('produtoId')}
          />
          {errors.produtoId?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.produtoId.message}
            </p>
          ) : null}
        </div>
        <div className="col-span-6 md:col-span-4">
          <label htmlFor="produto-sku" className={fieldLabelClassName}>
            SKU
          </label>
          <input
            id="produto-sku"
            type="text"
            autoComplete="off"
            placeholder="Stock Keeping Unit"
            className={fieldInputClassName}
            aria-invalid={Boolean(errors.sku)}
            {...register('sku')}
          />
          {errors.sku?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.sku.message}
            </p>
          ) : null}
        </div>
        <div className="col-span-6">
          <label htmlFor="produto-descricao" className={fieldLabelClassName}>
            Nome / Descrição
          </label>
          <textarea
            id="produto-descricao"
            rows={3}
            placeholder="Descrição detalhada do produto…"
            className={cn(fieldInputClassName, 'resize-none')}
            aria-invalid={Boolean(errors.descricao)}
            {...register('descricao')}
          />
          {errors.descricao?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {errors.descricao.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

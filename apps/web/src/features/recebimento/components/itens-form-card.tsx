'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, cn } from '@lilog/ui';
import { Loader2, Package, Plus, Search, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
  sectionHeaderClassName,
  sectionIconClassName,
  sectionTitleClassName,
} from '@/features/recebimento/components/form-field-classes';
import { listProdutos } from '@/features/produto/lib/produto-api';
import type { ProdutoApi } from '@/features/produto/types/produto.api';
import {
  EMPTY_ITEM_PRE_RECEBIMENTO,
  type RecebimentoCadastroFormInput,
} from '@/features/recebimento/types/recebimento-cadastro.schema';

const UNIDADE_MEDIDA_OPTIONS = ['UN', 'CX', 'KG', 'PLT'] as const;

type ProdutoSearchRowProps = {
  index: number;
};

function ProdutoSearchRow({ index }: ProdutoSearchRowProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<RecebimentoCadastroFormInput>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProdutoApi[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const produtoLabel = watch(`itens.${index}.produtoLabel`);
  const itemErrors = errors.itens?.[index];

  useEffect(() => {
    if (produtoLabel && !query) {
      setQuery(produtoLabel);
    }
  }, [produtoLabel, query]);

  useEffect(() => {
    if (!query.trim() || query === produtoLabel) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await listProdutos({
          search: query.trim(),
          limit: 8,
        });
        setResults(response.items);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, produtoLabel]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectProduto = useCallback(
    (produto: ProdutoApi) => {
      setValue(`itens.${index}.produtoId`, produto.produtoId, { shouldValidate: true });
      setValue(`itens.${index}.produtoLabel`, `${produto.sku} — ${produto.descricao}`, {
        shouldValidate: true,
      });
      setQuery(`${produto.sku} — ${produto.descricao}`);
      setIsOpen(false);
    },
    [index, setValue],
  );

  return (
    <div ref={containerRef} className="relative space-y-0.5">
      <label htmlFor={`item-produto-${index}`} className={fieldLabelClassName}>
        Produto (SKU) *
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id={`item-produto-${index}`}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setValue(`itens.${index}.produtoId`, '', { shouldValidate: false });
            setValue(`itens.${index}.produtoLabel`, '', { shouldValidate: false });
          }}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Buscar SKU ou descrição"
          className={`${fieldInputClassName} pl-8`}
          autoComplete="off"
        />
        {isSearching ? (
          <Loader2
            className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>

      {isOpen && results.length > 0 ? (
        <ul
          className="absolute z-20 mt-0.5 max-h-40 w-full overflow-auto rounded-md border border-outline-variant bg-card shadow-lg"
          role="listbox"
        >
          {results.map((produto) => (
            <li key={produto.produtoId}>
              <button
                type="button"
                role="option"
                className="flex w-full flex-col gap-0 px-2.5 py-1.5 text-left hover:bg-muted/60"
                onClick={() => selectProduto(produto)}
              >
                <span className="text-xs font-semibold text-foreground">{produto.sku}</span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {produto.descricao}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input type="hidden" {...register(`itens.${index}.produtoId`)} />
      <input type="hidden" {...register(`itens.${index}.produtoLabel`)} />

      {itemErrors?.produtoId?.message || itemErrors?.produtoLabel?.message ? (
        <p className={fieldErrorClassName} role="alert">
          {itemErrors.produtoId?.message ?? itemErrors.produtoLabel?.message}
        </p>
      ) : null}
    </div>
  );
}

export function ItensFormCard() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RecebimentoCadastroFormInput>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'itens',
  });

  const adicionarItem = useCallback(() => {
    append({ ...EMPTY_ITEM_PRE_RECEBIMENTO });
  }, [append]);

  return (
    <section className={cn(sectionCardClassName, 'flex flex-col')} aria-labelledby="titulo-itens">
      <div className={sectionHeaderClassName}>
        <h2 id="titulo-itens" className={sectionTitleClassName}>
          <Package className={sectionIconClassName} aria-hidden />
          Itens esperados
          {fields.length > 0 ? (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
              {fields.length}
            </span>
          ) : null}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 border-outline-variant px-2 text-xs"
          onClick={adicionarItem}
        >
          <Plus className="size-3.5" aria-hidden />
          Adicionar
        </Button>
      </div>

      {typeof errors.itens?.message === 'string' ? (
        <p className={`${fieldErrorClassName} mb-2`} role="alert">
          {errors.itens.message}
        </p>
      ) : null}

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-outline-variant/80 bg-muted/5 px-4 py-8 text-center">
          <Package className="mb-2 size-8 text-muted-foreground/40" aria-hidden />
          <p className="text-sm font-medium text-foreground">Nenhum item</p>
          <p className="mt-0.5 max-w-xs text-[11px] text-muted-foreground">
            Adicione SKUs e quantidades previstas para esta carga.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-7 gap-1 text-xs"
            onClick={adicionarItem}
          >
            <Plus className="size-3.5" aria-hidden />
            Adicionar item
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => {
            const itemErrors = errors.itens?.[index];

            return (
              <article
                key={field.id}
                className="rounded-md border border-outline-variant/70 bg-muted/5 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Item {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-destructive"
                    aria-label={`Remover item ${index + 1}`}
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-12">
                  <div className="col-span-2 md:col-span-12">
                    <ProdutoSearchRow index={index} />
                  </div>

                  <div className="space-y-0.5 md:col-span-3">
                    <label htmlFor={`item-qtd-${index}`} className={fieldLabelClassName}>
                      Qtd. *
                    </label>
                    <input
                      id={`item-qtd-${index}`}
                      type="number"
                      min={0}
                      step="any"
                      className={fieldInputClassName}
                      {...register(`itens.${index}.quantidadeEsperada`, {
                        valueAsNumber: true,
                      })}
                    />
                    {itemErrors?.quantidadeEsperada?.message ? (
                      <p className={fieldErrorClassName} role="alert">
                        {itemErrors.quantidadeEsperada.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-0.5 md:col-span-2">
                    <label htmlFor={`item-unidade-${index}`} className={fieldLabelClassName}>
                      Un. *
                    </label>
                    <select
                      id={`item-unidade-${index}`}
                      className={fieldInputClassName}
                      {...register(`itens.${index}.unidadeMedida`)}
                    >
                      {UNIDADE_MEDIDA_OPTIONS.map((unidade) => (
                        <option key={unidade} value={unidade}>
                          {unidade}
                        </option>
                      ))}
                    </select>
                    {itemErrors?.unidadeMedida?.message ? (
                      <p className={fieldErrorClassName} role="alert">
                        {itemErrors.unidadeMedida.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-0.5 md:col-span-3">
                    <label htmlFor={`item-lote-${index}`} className={fieldLabelClassName}>
                      Lote
                    </label>
                    <input
                      id={`item-lote-${index}`}
                      type="text"
                      placeholder="Opcional"
                      className={fieldInputClassName}
                      {...register(`itens.${index}.loteEsperado`)}
                    />
                  </div>

                  <div className="space-y-0.5 md:col-span-2">
                    <label htmlFor={`item-peso-${index}`} className={fieldLabelClassName}>
                      Peso (kg)
                    </label>
                    <input
                      id={`item-peso-${index}`}
                      type="number"
                      min={0}
                      step="any"
                      placeholder="—"
                      className={fieldInputClassName}
                      {...register(`itens.${index}.pesoEsperado`)}
                    />
                  </div>

                  <div className="col-span-2 space-y-0.5 md:col-span-2">
                    <label htmlFor={`item-validade-${index}`} className={fieldLabelClassName}>
                      Validade
                    </label>
                    <input
                      id={`item-validade-${index}`}
                      type="datetime-local"
                      className={fieldInputClassName}
                      {...register(`itens.${index}.validadeEsperada`)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

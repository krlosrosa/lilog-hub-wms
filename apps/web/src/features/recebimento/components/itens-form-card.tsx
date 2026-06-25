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
} from '@/features/recebimento/components/form-field-classes';
import { listProdutos } from '@/features/produto/lib/produto-api';
import type { ProdutoApi } from '@/features/produto/types/produto.api';
import {
  EMPTY_ITEM_PRE_RECEBIMENTO,
  type RecebimentoCadastroFormValues,
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
  } = useFormContext<RecebimentoCadastroFormValues>();

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
      setValue(`itens.${index}.produtoId`, produto.id, { shouldValidate: true });
      setValue(`itens.${index}.produtoLabel`, `${produto.sku} — ${produto.descricao}`, {
        shouldValidate: true,
      });
      setQuery(`${produto.sku} — ${produto.descricao}`);
      setIsOpen(false);
    },
    [index, setValue],
  );

  return (
    <div ref={containerRef} className="relative space-y-1">
      <label htmlFor={`item-produto-${index}`} className={fieldLabelClassName}>
        Produto (SKU) *
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
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
          placeholder="Buscar por SKU ou descrição"
          className={`${fieldInputClassName} pl-9`}
          autoComplete="off"
        />
        {isSearching ? (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>

      {isOpen && results.length > 0 ? (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-outline-variant bg-card shadow-lg"
          role="listbox"
        >
          {results.map((produto) => (
            <li key={produto.id}>
              <button
                type="button"
                role="option"
                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/60"
                onClick={() => selectProduto(produto)}
              >
                <span className="font-semibold text-foreground">{produto.sku}</span>
                <span className="truncate text-xs text-muted-foreground">
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
  } = useFormContext<RecebimentoCadastroFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'itens',
  });

  const adicionarItem = useCallback(() => {
    append({ ...EMPTY_ITEM_PRE_RECEBIMENTO });
  }, [append]);

  return (
    <section
      className={cn(sectionCardClassName, 'flex min-h-[22rem] flex-col')}
      aria-labelledby="titulo-itens"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Package className="size-6 shrink-0 text-primary" aria-hidden />
          <h2
            id="titulo-itens"
            className="text-headline-md font-bold uppercase tracking-wide text-foreground"
          >
            Itens esperados
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 border-outline-variant"
          onClick={adicionarItem}
        >
          <Plus className="size-4" aria-hidden />
          Adicionar item
        </Button>
      </div>

      {typeof errors.itens?.message === 'string' ? (
        <p className={`${fieldErrorClassName} mb-4`} role="alert">
          {errors.itens.message}
        </p>
      ) : null}

      {fields.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-muted/10 p-8 text-center">
          <Package className="mb-4 size-10 text-muted-foreground opacity-50" aria-hidden />
          <p className="text-body-md font-medium text-foreground">
            Nenhum item adicionado
          </p>
          <p className="mt-1 max-w-sm text-caption text-muted-foreground">
            Informe manualmente os SKUs e quantidades previstas para esta carga.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 gap-1.5"
            onClick={adicionarItem}
          >
            <Plus className="size-4" aria-hidden />
            Adicionar primeiro item
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => {
            const itemErrors = errors.itens?.[index];

            return (
              <article
                key={field.id}
                className="rounded-xl border border-outline-variant bg-muted/10 p-4 md:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Item {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Remover item ${index + 1}`}
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <ProdutoSearchRow index={index} />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`item-qtd-${index}`}
                      className={fieldLabelClassName}
                    >
                      Quantidade esperada *
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

                  <div className="space-y-1">
                    <label
                      htmlFor={`item-unidade-${index}`}
                      className={fieldLabelClassName}
                    >
                      Unidade de medida *
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

                  <div className="space-y-1">
                    <label
                      htmlFor={`item-lote-${index}`}
                      className={fieldLabelClassName}
                    >
                      Lote esperado
                    </label>
                    <input
                      id={`item-lote-${index}`}
                      type="text"
                      placeholder="Opcional"
                      className={fieldInputClassName}
                      {...register(`itens.${index}.loteEsperado`)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`item-peso-${index}`}
                      className={fieldLabelClassName}
                    >
                      Peso esperado (kg)
                    </label>
                    <input
                      id={`item-peso-${index}`}
                      type="number"
                      min={0}
                      step="any"
                      placeholder="Opcional"
                      className={fieldInputClassName}
                      {...register(`itens.${index}.pesoEsperado`)}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label
                      htmlFor={`item-validade-${index}`}
                      className={fieldLabelClassName}
                    >
                      Validade esperada
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

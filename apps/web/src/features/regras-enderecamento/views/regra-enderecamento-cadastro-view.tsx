'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useFieldArray } from 'react-hook-form';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { listProdutos } from '@/features/produto/lib/produto-api';
import { CATEGORIA_OPTIONS } from '@/features/produto/types/produto.schema';
import { useRegraEnderecamentoCadastro } from '@/features/regras-enderecamento/hooks/use-regra-enderecamento-cadastro';
import {
  CRITERIO_TIPO_OPTIONS,
  DESTINO_TIPO_OPTIONS,
} from '@/features/regras-enderecamento/types/regra-enderecamento.schema';

const fieldInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

const fieldLabelClassName = 'block text-xs font-medium text-muted-foreground';

const fieldErrorClassName = 'mt-1 text-xs text-destructive';

const sectionCardClassName =
  'rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass md:p-5';

type RegraEnderecamentoCadastroViewProps = {
  regraId?: string;
};

export function RegraEnderecamentoCadastroView({
  regraId,
}: RegraEnderecamentoCadastroViewProps) {
  const {
    unidadeId,
    isEditing,
    isLoading,
    isLoadingOptions,
    isSubmitting,
    notFound,
    optionsLoadError,
    form,
    zonas,
    getRuasForZona,
    carregarRuasDaZona,
    enderecos,
    salvar,
    cancelar,
  } = useRegraEnderecamentoCadastro({ regraId });

  const destinosFieldArray = useFieldArray({
    control: form.control,
    name: 'destinos',
  });

  const criterioTipo = form.watch('criterioTipo');
  const destinos = form.watch('destinos');
  const nomeAtual = form.watch('nome');

  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtoOpcoes, setProdutoOpcoes] = useState<
    Array<{ produtoId: string; label: string }>
  >([]);

  useEffect(() => {
    if (criterioTipo !== 'produto') {
      return;
    }

    const termo = produtoBusca.trim();
    if (termo.length < 2) {
      setProdutoOpcoes([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await listProdutos({ search: termo, limit: 20 });
        if (cancelled) {
          return;
        }

        setProdutoOpcoes(
          response.items.map((item) => ({
            produtoId: item.produtoId,
            label: `${item.sku} — ${item.descricao}`,
          })),
        );
      } catch {
        if (!cancelled) {
          setProdutoOpcoes([]);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [criterioTipo, produtoBusca]);

  const reordenarDestinos = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= destinosFieldArray.fields.length) {
      return;
    }

    destinosFieldArray.move(fromIndex, toIndex);

    const reordered = form.getValues('destinos');
    reordered.forEach((_, index) => {
      form.setValue(`destinos.${index}.prioridade`, index + 1, {
        shouldDirty: true,
      });
    });
  };

  const adicionarDestino = () => {
    destinosFieldArray.append({
      prioridade: destinosFieldArray.fields.length + 1,
      tipo: 'zona',
      zona: '',
      rua: '',
      ativo: true,
    });
  };

  const criterioValorField = useMemo(() => {
    if (criterioTipo === 'categoria') {
      return (
        <select
          {...form.register('criterioValor')}
          disabled={isSubmitting}
          className={cn(fieldInputClassName, 'mt-1')}
        >
          <option value="">Selecione a categoria</option>
          {CATEGORIA_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (criterioTipo === 'produto') {
      return (
        <div className="mt-1 space-y-2">
          <input
            type="search"
            value={produtoBusca}
            onChange={(event) => setProdutoBusca(event.target.value)}
            placeholder="Buscar por SKU ou descrição..."
            disabled={isSubmitting}
            className={fieldInputClassName}
          />
          <select
            {...form.register('criterioValor')}
            disabled={isSubmitting}
            className={fieldInputClassName}
          >
            <option value="">Selecione o produto</option>
            {produtoOpcoes.map((option) => (
              <option key={option.produtoId} value={option.produtoId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <input
        {...form.register('criterioValor')}
        disabled={isSubmitting}
        placeholder="Ex.: Poupa Garrafão"
        className={cn(fieldInputClassName, 'mt-1')}
      />
    );
  }, [criterioTipo, form, isSubmitting, produtoBusca, produtoOpcoes]);

  if (notFound) {
    return (
      <SidebarMain>
        <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
          <div className="mx-auto max-w-container space-y-4 text-center">
            <p className="text-sm font-medium text-foreground">Regra não encontrada</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/armazenagem/regras-enderecamento">Voltar para a lista</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  if (!unidadeId) {
    return (
      <SidebarMain>
        <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
          <div className="mx-auto max-w-container space-y-4 text-center">
            <p className="text-sm font-medium text-foreground">
              Selecione uma unidade para continuar
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/armazenagem/regras-enderecamento">Voltar para a lista</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  if (isLoading) {
    return (
      <SidebarMain>
        <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
          <div className="mx-auto flex max-w-container items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando regra...
          </div>
        </main>
      </SidebarMain>
    );
  }

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Link
              href="/armazenagem/regras-enderecamento"
              className="transition-colors hover:text-primary"
            >
              Regras de Endereçamento
            </Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-foreground">
              {isEditing ? 'Editar regra' : 'Nova regra'}
            </span>
          </nav>

          <header className="sticky top-0 z-20 -mx-margin-mobile border-b border-outline-variant bg-glass-bg px-margin-mobile py-2.5 backdrop-blur-glass md:-mx-margin-desktop md:px-margin-desktop">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  asChild
                >
                  <Link
                    href="/armazenagem/regras-enderecamento"
                    aria-label="Voltar"
                  >
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Armazenagem · WMS
                  </p>
                  <h1 className="truncate text-body-md font-semibold text-foreground">
                    {nomeAtual ||
                      (isEditing
                        ? 'Editar regra de endereçamento'
                        : 'Nova regra de endereçamento')}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelar}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="regra-enderecamento-form"
                  size="sm"
                  className="gap-1.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-4" aria-hidden />
                  )}
                  {isEditing ? 'Salvar alterações' : 'Criar regra'}
                </Button>
              </div>
            </div>
          </header>

          <form
            id="regra-enderecamento-form"
            onSubmit={(event) => void salvar(event)}
            className="space-y-4"
            noValidate
          >
            <section className={sectionCardClassName}>
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Identificação e critério
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Defina quando a regra se aplica e sua precedência entre outras
                  regras do mesmo tipo.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={fieldLabelClassName} htmlFor="regra-nome">
                    Nome da regra
                  </label>
                  <input
                    id="regra-nome"
                    {...form.register('nome')}
                    disabled={isSubmitting}
                    placeholder="Ex.: Poupa Garrafão → Corredor A"
                    className={cn(fieldInputClassName, 'mt-1')}
                  />
                  {form.formState.errors.nome && (
                    <p className={fieldErrorClassName}>
                      {form.formState.errors.nome.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className={fieldLabelClassName} htmlFor="regra-criterio-tipo">
                    Critério
                  </label>
                  <select
                    id="regra-criterio-tipo"
                    {...form.register('criterioTipo')}
                    disabled={isSubmitting}
                    className={cn(fieldInputClassName, 'mt-1')}
                  >
                    {CRITERIO_TIPO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={fieldLabelClassName} htmlFor="regra-prioridade">
                    Prioridade da regra
                  </label>
                  <input
                    id="regra-prioridade"
                    type="number"
                    min={1}
                    {...form.register('prioridade', { valueAsNumber: true })}
                    disabled={isSubmitting}
                    className={cn(fieldInputClassName, 'mt-1')}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Menor número = maior precedência entre regras do mesmo tipo.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className={fieldLabelClassName}>Valor do critério</label>
                  {criterioValorField}
                  {form.formState.errors.criterioValor && (
                    <p className={fieldErrorClassName}>
                      {form.formState.errors.criterioValor.message}
                    </p>
                  )}
                </div>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  {...form.register('ativo')}
                  disabled={isSubmitting}
                  className="size-4 rounded border-outline-variant"
                />
                Regra ativa
              </label>
            </section>

            <section className={sectionCardClassName}>
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Destinos (ordem de tentativa)
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    O sistema tenta o destino 1 primeiro; se estiver ocupado, vai
                    para o próximo. Zona e corredor vêm dos endereços cadastrados
                    no estoque.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isSubmitting}
                  onClick={adicionarDestino}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Destino
                </Button>
              </div>

              {isLoadingOptions && (
                <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Carregando zonas e endereços...
                </p>
              )}

              {!isLoadingOptions && optionsLoadError && (
                <p className="mb-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {optionsLoadError}
                </p>
              )}

              {!isLoadingOptions && !optionsLoadError && zonas.length === 0 && (
                <p className="mb-3 rounded-lg border border-dashed border-outline-variant px-3 py-2 text-xs text-muted-foreground">
                  Nenhuma zona cadastrada nos endereços desta unidade. Cadastre
                  endereços em Estoque antes de definir destinos por zona/corredor.
                </p>
              )}

              <div className="space-y-2">
                {destinosFieldArray.fields.map((field, index) => {
                  const destinoTipo = destinos[index]?.tipo ?? 'zona';
                  const zonaSelecionada = destinos[index]?.zona ?? '';
                  const ruasDisponiveis = getRuasForZona(zonaSelecionada);
                  const zonaField = form.register(`destinos.${index}.zona`);

                  return (
                    <div
                      key={field.id}
                      className="rounded-lg border border-outline-variant/70 bg-surface-highest p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Prioridade {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                            disabled={isSubmitting || index === 0}
                            onClick={() => reordenarDestinos(index, index - 1)}
                            aria-label="Subir destino"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                            disabled={
                              isSubmitting ||
                              index === destinosFieldArray.fields.length - 1
                            }
                            onClick={() => reordenarDestinos(index, index + 1)}
                            aria-label="Descer destino"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                            disabled={
                              isSubmitting || destinosFieldArray.fields.length <= 1
                            }
                            onClick={() => {
                              destinosFieldArray.remove(index);
                              const restantes = form.getValues('destinos');
                              restantes.forEach((_, itemIndex) => {
                                form.setValue(
                                  `destinos.${itemIndex}.prioridade`,
                                  itemIndex + 1,
                                  { shouldDirty: true },
                                );
                              });
                            }}
                            aria-label="Remover destino"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'grid gap-3',
                          destinoTipo === 'zona'
                            ? 'sm:grid-cols-3'
                            : 'sm:grid-cols-2',
                        )}
                      >
                        <div>
                          <label className={fieldLabelClassName}>Tipo</label>
                          <select
                            {...form.register(`destinos.${index}.tipo`)}
                            disabled={isSubmitting}
                            className={cn(fieldInputClassName, 'mt-1')}
                          >
                            {DESTINO_TIPO_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {destinoTipo === 'zona' ? (
                          <>
                            <div>
                              <label className={fieldLabelClassName}>Zona</label>
                              <select
                                {...zonaField}
                                disabled={isSubmitting || zonas.length === 0}
                                className={cn(fieldInputClassName, 'mt-1')}
                                onChange={(event) => {
                                  zonaField.onChange(event);
                                  form.setValue(`destinos.${index}.rua`, '', {
                                    shouldDirty: true,
                                  });
                                  void carregarRuasDaZona(event.target.value);
                                }}
                              >
                                <option value="">Selecione a zona</option>
                                {zonas.map((zona) => (
                                  <option key={zona} value={zona}>
                                    {zona}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={fieldLabelClassName}>
                                Corredor (rua)
                              </label>
                              <select
                                {...form.register(`destinos.${index}.rua`)}
                                disabled={
                                  isSubmitting ||
                                  !zonaSelecionada ||
                                  ruasDisponiveis.length === 0
                                }
                                className={cn(fieldInputClassName, 'mt-1')}
                              >
                                <option value="">
                                  {zonaSelecionada
                                    ? 'Todos os corredores da zona'
                                    : 'Selecione a zona primeiro'}
                                </option>
                                {ruasDisponiveis.map((rua) => (
                                  <option key={rua} value={rua}>
                                    {rua}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : (
                          <div className="sm:col-span-2">
                            <label className={fieldLabelClassName}>Endereço</label>
                            <select
                              {...form.register(`destinos.${index}.enderecoId`)}
                              disabled={isSubmitting}
                              className={cn(fieldInputClassName, 'mt-1')}
                            >
                              <option value="">Selecione o endereço</option>
                              {enderecos.map((endereco) => (
                                <option key={endereco.id} value={endereco.id}>
                                  {endereco.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <label className="mt-3 flex items-center gap-2 text-xs text-foreground">
                        <input
                          type="checkbox"
                          {...form.register(`destinos.${index}.ativo`)}
                          disabled={isSubmitting}
                          className="size-3.5 rounded border-outline-variant"
                        />
                        Destino ativo
                      </label>
                    </div>
                  );
                })}
              </div>

              {form.formState.errors.destinos && (
                <p className={fieldErrorClassName}>
                  {form.formState.errors.destinos.message ??
                    form.formState.errors.destinos.root?.message}
                </p>
              )}
            </section>
          </form>
        </div>
      </main>
    </SidebarMain>
  );
}

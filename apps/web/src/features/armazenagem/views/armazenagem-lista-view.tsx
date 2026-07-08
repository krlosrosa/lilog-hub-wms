'use client';

import { Loader2, MapPin, RefreshCw, Search, ShieldCheck, Sparkles } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import { ArmazenagemItensTable } from '../components/armazenagem-itens-table';
import { SelecionarEnderecoDialog } from '../components/selecionar-endereco-dialog';
import {
  useArmazenagemPainel,
  type ArmazenagemPainelVisao,
} from '../hooks/use-armazenagem-painel';

const VISAO_TABS: { id: ArmazenagemPainelVisao; label: string }[] = [
  { id: 'pendentes', label: 'Pendentes' },
  { id: 'aguardando_validacao', label: 'Aguardando validação' },
  { id: 'armazenados', label: 'Armazenados' },
];

const statCardClassName =
  'rounded-lg border border-outline-variant bg-card px-3 py-2 shadow-sm';

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}

export function ArmazenagemListaView() {
  const {
    unidadeId,
    isLoading,
    isSaving,
    isValidating,
    isAutoAllocating,
    visao,
    setVisao,
    itensPagina,
    gruposValidacao,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    total,
    itemsInicio,
    pageSize,
    resumo,
    itemSelecionado,
    abrirSelecaoEndereco,
    fecharSelecaoEndereco,
    salvarEnderecoSugerido,
    buscarEnderecosDisponiveis,
    validarDemanda,
    alocarAutomaticamente,
    recarregar,
  } = useArmazenagemPainel();

  const visaoDescricao =
    visao === 'pendentes'
      ? 'Alocar endereços de destino para os itens pendentes.'
      : visao === 'aguardando_validacao'
        ? 'Revisar endereços sugeridos e liberar paletes para movimentação no PWA.'
        : 'Histórico de itens já armazenados nas demandas concluídas.';

  return (
    <SidebarMain>
      <main className="min-h-dvh px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto flex max-w-container flex-col gap-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Armazenagem
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{visaoDescricao}</p>
            </div>
            <div className="flex flex-wrap gap-2 self-start">
              {visao === 'pendentes' && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  disabled={
                    !unidadeId ||
                    isLoading ||
                    isAutoAllocating ||
                    resumo.pendentesEndereco === 0
                  }
                  onClick={() => void alocarAutomaticamente()}
                >
                  {isAutoAllocating ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="size-3.5" aria-hidden />
                  )}
                  Alocação automática
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!unidadeId || isLoading}
                onClick={() => void recarregar()}
              >
                <RefreshCw className="size-3.5" aria-hidden />
                Atualizar
              </Button>
            </div>
          </header>

          {!unidadeId ? (
            <div className="rounded-lg border border-dashed border-outline-variant px-6 py-10 text-center text-sm text-muted-foreground">
              Selecione uma unidade para visualizar os itens de armazenagem.
            </div>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-5">
                <div className={statCardClassName}>
                  <p className="text-[10px] text-muted-foreground">Pendentes</p>
                  <p className="text-lg font-bold tabular-nums">{resumo.pendentes}</p>
                </div>
                <div className={statCardClassName}>
                  <p className="text-[10px] text-muted-foreground">Aguard. validação</p>
                  <p className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">
                    {resumo.aguardandoValidacao}
                  </p>
                </div>
                <div className={statCardClassName}>
                  <p className="text-[10px] text-muted-foreground">Sem endereço</p>
                  <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {visao === 'aguardando_validacao'
                      ? resumo.validacaoSemEndereco
                      : resumo.pendentesEndereco}
                  </p>
                </div>
                <div className={statCardClassName}>
                  <p className="text-[10px] text-muted-foreground">Com endereço</p>
                  <p className="text-lg font-bold tabular-nums">{resumo.comEndereco}</p>
                </div>
                <div className={statCardClassName}>
                  <p className="text-[10px] text-muted-foreground">Armazenados</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {resumo.armazenados}
                  </p>
                </div>
              </div>

              <div
                className="flex flex-wrap gap-1.5"
                role="tablist"
                aria-label="Visualização dos itens"
              >
                {VISAO_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={visao === tab.id}
                    onClick={() => setVisao(tab.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      visao === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-surface-highest hover:text-foreground',
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                        visao === tab.id
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-background/80 text-muted-foreground',
                      )}
                    >
                      {tab.id === 'pendentes'
                        ? resumo.pendentes
                        : tab.id === 'aguardando_validacao'
                          ? resumo.aguardandoValidacao
                          : resumo.armazenados}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative max-w-sm">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por demanda, SKU, produto ou endereço..."
                  className={cn(
                    'h-8 w-full rounded-lg border border-outline-variant bg-background pl-8 pr-3 text-xs outline-none',
                    'focus:border-primary focus:ring-1 focus:ring-primary/30',
                  )}
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Carregando itens...
                </div>
              ) : visao === 'aguardando_validacao' ? (
                <section className="space-y-3">
                  {gruposValidacao.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-outline-variant px-6 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma demanda aguardando validação.
                    </div>
                  ) : (
                    gruposValidacao.map((grupo) => (
                      <article
                        key={grupo.demandaId}
                        className="overflow-hidden rounded-lg border border-outline-variant/70 bg-card shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Demanda {shortId(grupo.demandaId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Recebimento {shortId(grupo.recebimentoId)} ·{' '}
                              {grupo.itens.length}{' '}
                              {grupo.itens.length === 1 ? 'palete' : 'paletes'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1.5"
                            disabled={!grupo.podeValidar || isValidating === grupo.demandaId}
                            onClick={() => void validarDemanda(grupo.demandaId)}
                          >
                            {isValidating === grupo.demandaId ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <ShieldCheck className="size-3.5" aria-hidden />
                            )}
                            Validar e liberar
                          </Button>
                        </div>
                        <ArmazenagemItensTable
                          itens={grupo.itens}
                          pagina={1}
                          totalPaginas={1}
                          total={grupo.itens.length}
                          itemsInicio={grupo.itens.length > 0 ? 1 : 0}
                          pageSize={grupo.itens.length || 1}
                          onChangePagina={() => undefined}
                          onSelecionarEndereco={abrirSelecaoEndereco}
                        />
                      </article>
                    ))
                  )}
                </section>
              ) : (
                <ArmazenagemItensTable
                  itens={itensPagina}
                  pagina={pagina}
                  totalPaginas={totalPaginas}
                  total={total}
                  itemsInicio={itemsInicio}
                  pageSize={pageSize}
                  somenteLeitura={visao === 'armazenados'}
                  onChangePagina={setPagina}
                  onSelecionarEndereco={abrirSelecaoEndereco}
                />
              )}

              {visao === 'pendentes' && resumo.pendentesEndereco > 0 && !isLoading && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden />
                  {resumo.pendentesEndereco}{' '}
                  {resumo.pendentesEndereco === 1 ? 'item aguarda' : 'itens aguardam'}{' '}
                  alocação de endereço.
                </p>
              )}

              {visao === 'aguardando_validacao' &&
                resumo.validacaoSemEndereco > 0 &&
                !isLoading && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden />
                    {resumo.validacaoSemEndereco}{' '}
                    {resumo.validacaoSemEndereco === 1
                      ? 'palete aguarda'
                      : 'paletes aguardam'}{' '}
                    definição de endereço antes da validação.
                  </p>
                )}
            </>
          )}
        </div>
      </main>

      <SelecionarEnderecoDialog
        open={itemSelecionado !== null}
        item={itemSelecionado}
        isSaving={isSaving}
        onClose={fecharSelecaoEndereco}
        onConfirm={salvarEnderecoSugerido}
        onSearch={buscarEnderecosDisponiveis}
      />
    </SidebarMain>
  );
}

'use client';

import { Loader2, MapPin, RefreshCw, Search, Sparkles } from 'lucide-react';

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
  { id: 'armazenados', label: 'Armazenados' },
];

const statCardClassName =
  'rounded-lg border border-outline-variant bg-card px-3 py-2 shadow-sm';

export function ArmazenagemListaView() {
  const {
    unidadeId,
    isLoading,
    isSaving,
    isAutoAllocating,
    visao,
    setVisao,
    itensPagina,
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
    alocarAutomaticamente,
    recarregar,
  } = useArmazenagemPainel();

  return (
    <SidebarMain>
      <main className="min-h-dvh px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto flex max-w-container flex-col gap-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Armazenagem
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {visao === 'pendentes'
                  ? 'Alocar endereços de destino para os itens pendentes.'
                  : 'Histórico de itens já armazenados nas demandas concluídas.'}
              </p>
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
              <div className="grid gap-2 sm:grid-cols-4">
                <div className={statCardClassName}>
                  <p className="text-[10px] text-muted-foreground">Pendentes</p>
                  <p className="text-lg font-bold tabular-nums">{resumo.pendentes}</p>
                </div>
                <div className={statCardClassName}>
                  <p className="text-[10px] text-muted-foreground">Sem endereço</p>
                  <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {resumo.pendentesEndereco}
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

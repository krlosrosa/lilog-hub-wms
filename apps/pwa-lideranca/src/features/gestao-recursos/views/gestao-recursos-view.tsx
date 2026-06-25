import { cn } from '@lilog/ui';
import { Loader2, RefreshCw, Search, Users } from 'lucide-react';

import { GestaoRecursosFilterChips } from '@/features/gestao-recursos/components/gestao-recursos-filter-chips';
import { GestaoRecursosResumoCard } from '@/features/gestao-recursos/components/gestao-recursos-resumo-card';
import { OperadorRecursoCard } from '@/features/gestao-recursos/components/operador-recurso-card';
import { PrecisaPausaAlertBanner } from '@/features/gestao-recursos/components/precisa-pausa-alert-banner';
import { SessaoContextBanner } from '@/features/gestao-recursos/components/sessao-context-banner';
import { useGestaoRecursosPwa } from '@/features/gestao-recursos/hooks/use-gestao-recursos-pwa';
import type { GestaoRecursosFilter } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import { SessaoSubHeader } from '@/features/sessao-presenca/components/sessao-sub-header';
import { hapticMedium } from '@/lib/haptics';

function OperadorCardSkeleton() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-3">
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-container" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-4 w-36 animate-pulse rounded bg-surface-container" />
          <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
        </div>
      </div>
      <div className="mt-3 h-12 animate-pulse rounded-lg bg-surface-container" />
    </div>
  );
}

const EMPTY_MESSAGES: Record<GestaoRecursosFilter, string> = {
  all: 'Nenhum operador encontrado nesta sessão.',
  atuando: 'Nenhum operador atuando no momento.',
  precisa_pausa: 'Nenhum operador precisa de pausa agora.',
  em_pausa: 'Nenhum operador em pausa no momento.',
  ociosos: 'Nenhum operador ocioso no momento.',
};

export function GestaoRecursosView() {
  const {
    unidadeNome,
    sessaoAtiva,
    sessoesAbertas,
    semUnidade,
    semSessaoAberta,
    selectSessao,
    kpis,
    counts,
    atrasadosCount,
    filteredOperators,
    searchQuery,
    filter,
    isLoading,
    isRefreshing,
    canShowPainel,
    lastUpdatedAt,
    loadError,
    setSearchQuery,
    setFilter,
    triggerRefresh,
  } = useGestaoRecursosPwa();

  const sessaoLabel = sessaoAtiva
    ? `${sessaoAtiva.equipeNome} · ${new Date(sessaoAtiva.dataReferencia).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
    : 'Sem sessão';

  return (
    <div className="page-enter flex flex-col pb-8">
      <SessaoSubHeader
        backTo="/"
        backLabel="Voltar ao menu"
        title="Gestão de Recursos"
        subtitle={
          isLoading
            ? 'Carregando equipe...'
            : `${filteredOperators.length} de ${counts.all} operadores`
        }
        trailing={
          <button
            type="button"
            disabled={isRefreshing || semUnidade}
            onClick={() => {
              hapticMedium();
              void triggerRefresh();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation disabled:opacity-50"
            aria-label="Atualizar recursos"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
          </button>
        }
      />

      <div className="flex flex-col gap-3 px-margin-mobile py-3">
        <SessaoContextBanner
          semUnidade={semUnidade}
          semSessaoAberta={semSessaoAberta}
          isLoading={isLoading && !canShowPainel}
          unidadeNome={unidadeNome}
          sessaoAtiva={sessaoAtiva}
          sessoesAbertas={sessoesAbertas}
          onSelectSessao={selectSessao}
        />

        {loadError && canShowPainel ? (
          <div className="rounded-lg border border-error/30 bg-error-container/20 px-3 py-2.5 text-label-sm text-error">
            {loadError}
          </div>
        ) : null}

        {canShowPainel && !isLoading ? (
          <>
            <GestaoRecursosResumoCard
              kpis={kpis}
              sessaoLabel={sessaoLabel}
              unidadeNome={unidadeNome}
              lastUpdatedAt={lastUpdatedAt}
            />

            <PrecisaPausaAlertBanner
              count={counts.precisa_pausa}
              atrasadosCount={atrasadosCount}
            />

            <GestaoRecursosFilterChips
              active={filter}
              counts={counts}
              onChange={setFilter}
            />

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar operador, cargo ou missão..."
                className={cn(
                  'w-full rounded-lg border border-outline-variant bg-surface py-2 pl-9 pr-3 text-label-sm text-on-surface',
                  'placeholder:text-on-surface-variant focus-visible:border-secondary focus-visible:outline-none',
                )}
              />
            </div>

            {filteredOperators.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant px-4 py-10 text-center">
                <Users className="size-8 text-on-surface-variant/60" aria-hidden />
                <p className="text-label-sm text-on-surface-variant">
                  {searchQuery.trim()
                    ? 'Nenhum resultado para a busca.'
                    : EMPTY_MESSAGES[filter]}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredOperators.map((operator) => (
                  <OperadorRecursoCard key={operator.id} operator={operator} />
                ))}
              </div>
            )}
          </>
        ) : null}

        {isLoading && canShowPainel ? (
          <div className="space-y-2.5" role="status" aria-label="Carregando operadores">
            <OperadorCardSkeleton />
            <OperadorCardSkeleton />
            <OperadorCardSkeleton />
          </div>
        ) : null}
      </div>
    </div>
  );
}

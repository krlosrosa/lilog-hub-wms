import { Button } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import { CalendarDays, Loader2, Plus, RefreshCw, Users } from 'lucide-react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { FeatureToastPortal } from '../components/feature-toast';
import { SessaoCard } from '../components/sessao-card';
import { FilterChip, SessaoSubHeader } from '../components/sessao-sub-header';
import { useSessoesLista } from '../hooks/use-sessoes-lista';
import { formatDataReferencia } from '../lib/sessao-labels';
import type { SessaoStatusFiltro } from '../types';

function SessaoCardSkeleton() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4">
      <div className="mb-2 h-4 w-20 animate-pulse rounded bg-surface-container" />
      <div className="h-5 w-40 animate-pulse rounded bg-surface-container" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-surface-container" />
    </div>
  );
}

const STATUS_FILTERS: { id: SessaoStatusFiltro; label: string }[] = [
  { id: 'aberta', label: 'Abertas' },
  { id: 'planejada', label: 'Planejadas' },
  { id: 'todos', label: 'Todas' },
];

export function SessoesListaView() {
  const { state, actions } = useSessoesLista();
  const {
    sessoes,
    sessaoAberta,
    dataReferencia,
    statusFiltro,
    isLoading,
    isRefreshing,
    fetchError,
    missingUnidadeId,
    isEmpty,
    toast,
  } = state;

  return (
    <div className="page-enter flex flex-col pb-24">
      <FeatureToastPortal toast={toast} />

      <SessaoSubHeader
        backTo="/"
        backLabel="Voltar para o menu"
        title="Presença da Equipe"
        subtitle={formatDataReferencia(dataReferencia)}
        trailing={
          <button
            type="button"
            onClick={() => {
              hapticLight();
              void actions.refresh();
            }}
            disabled={isRefreshing}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant touch-manipulation active:scale-90"
            aria-label="Atualizar lista"
          >
            <RefreshCw
              className={isRefreshing ? 'h-5 w-5 animate-spin' : 'h-5 w-5'}
              aria-hidden
            />
          </button>
        }
      />

      <div className="space-y-4 px-margin-mobile pt-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
          <input
            type="date"
            value={dataReferencia}
            onChange={(e) => actions.setDataReferencia(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-outline-variant bg-surface px-3 text-body-sm text-on-surface"
            aria-label="Data de referência"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              active={statusFiltro === filter.id}
              onClick={() => actions.setStatusFiltro(filter.id)}
            />
          ))}
        </div>

        {fetchError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive-container/20 p-4 text-body-sm text-destructive">
            {fetchError}
          </div>
        ) : null}

        {missingUnidadeId ? (
          <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant">
            Selecione uma unidade no menu principal para ver as sessões.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            <SessaoCardSkeleton />
            <SessaoCardSkeleton />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-outline-variant p-8 text-center">
            <Users className="h-10 w-10 text-on-surface-variant/50" aria-hidden />
            <p className="text-body-sm text-on-surface-variant">
              Nenhuma sessão para esta data.
            </p>
            <Button asChild className="gap-2">
              <Link to="/sessao-presenca/nova" onClick={() => hapticMedium()}>
                <Plus className="h-4 w-4" aria-hidden />
                Nova sessão
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessaoAberta &&
            (statusFiltro === 'todos' || statusFiltro === 'aberta') ? (
              <div>
                <p className="mb-2 text-label-sm font-semibold uppercase tracking-wide text-secondary">
                  Sessão em andamento
                </p>
                <SessaoCard sessao={sessaoAberta} destacada />
              </div>
            ) : null}

            {sessoes
              .filter((s) => !sessaoAberta || s.id !== sessaoAberta.id)
              .map((sessao) => (
                <SessaoCard key={sessao.id} sessao={sessao} />
              ))}
          </div>
        )}
      </div>

      {!missingUnidadeId && !isLoading ? (
        <div className="fixed inset-x-0 bottom-0 z-30 pb-safe">
          <div className="px-margin-mobile pb-4 pt-2">
            <Button asChild className="h-12 w-full gap-2 rounded-lg shadow-lg">
              <Link to="/sessao-presenca/nova" onClick={() => hapticMedium()}>
                <Plus className="h-5 w-5" aria-hidden />
                Nova sessão
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {isRefreshing && !isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-secondary" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

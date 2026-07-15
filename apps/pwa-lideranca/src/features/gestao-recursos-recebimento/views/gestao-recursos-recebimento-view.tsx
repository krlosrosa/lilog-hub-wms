'use client';

import { cn } from '@lilog/ui';
import {
  AlertCircle,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { GestaoRecursosResumoCard } from '@/features/gestao-recursos/components/gestao-recursos-resumo-card';
import { AdicionarApoioSheet } from '@/features/gestao-recursos/components/adicionar-apoio-sheet';
import { OperadorRecursoCard } from '@/features/gestao-recursos/components/operador-recurso-card';
import { PrecisaPausaAlertBanner } from '@/features/gestao-recursos/components/precisa-pausa-alert-banner';
import { SessaoContextBanner } from '@/features/gestao-recursos/components/sessao-context-banner';
import { SessaoSubHeader } from '@/features/sessao-presenca/components/sessao-sub-header';
import { hapticMedium } from '@/lib/haptics';

import { AtribuirConferenteSheet } from '@/features/gestao-recursos-recebimento/components/atribuir-conferente-sheet';
import { DemandaRecebimentoCard } from '@/features/gestao-recursos-recebimento/components/demanda-recebimento-card';
import {
  DemandasFilterChips,
  type DemandaFilter,
} from '@/features/gestao-recursos-recebimento/components/demandas-filter-chips';
import { GestaoRecursosSegmentedTabs } from '@/features/gestao-recursos-recebimento/components/gestao-recursos-segmented-tabs';
import { ImpedimentoDetalheSheet } from '@/features/gestao-recursos-recebimento/components/impedimento-detalhe-sheet';
import { RecebimentoDemandasResumo } from '@/features/gestao-recursos-recebimento/components/recebimento-demandas-resumo';
import { useGestaoRecursosRecebimento } from '@/features/gestao-recursos-recebimento/hooks/use-gestao-recursos-recebimento';
import { useFuncionarioApoio } from '@/features/gestao-recursos/hooks/use-funcionario-apoio';
import { buildSessoesOrigemApoioOptions, filterCandidatosDeSessoesAbertas } from '@/features/gestao-recursos/lib/sessao-origem-apoio-options';
import type { DemandaRecebimentoRecursoApi } from '@/features/gestao-recursos-recebimento/types/recebimento-recursos.api';

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-3.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-surface-container" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-4 w-36 animate-pulse rounded bg-surface-container" />
          <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-24 animate-pulse rounded-full bg-surface-container" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container" />
      </div>
    </div>
  );
}

type Tab = 'demandas' | 'equipe';

function matchesSearch(
  query: string,
  placa: string | null,
  transportadora: string | null,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    (placa?.toLowerCase().includes(normalized) ?? false) ||
    (transportadora?.toLowerCase().includes(normalized) ?? false)
  );
}

export function GestaoRecursosRecebimentoView() {
  const {
    unidadeNome,
    sessaoAtiva,
    sessoesAbertas,
    todasSessoesAbertas,
    semUnidade,
    semSessaoAberta,
    selectSessao,
    operators,
    kpis,
    demandas,
    isLoading,
    isLoadingSessao,
    isRefreshing,
    lastUpdatedAt,
    loadError,
    canShowPainel,
    atribuindoId,
    cancelandoId,
    liberandoId,
    triggerRefresh,
    handleAtribuir,
    handleCancelarAlocacao,
    handleLiberarImpedimento,
    handleAdicionarApoio,
    handleRemoverApoio,
    adicionandoApoioId,
    removendoApoioId,
  } = useGestaoRecursosRecebimento();

  const apoio = useFuncionarioApoio(sessaoAtiva?.id, async () => {
    await triggerRefresh();
  });

  const candidatosApoio = useMemo(
    () => filterCandidatosDeSessoesAbertas(apoio.candidatos, todasSessoesAbertas),
    [apoio.candidatos, todasSessoesAbertas],
  );

  const sessoesOrigem = useMemo(
    () => buildSessoesOrigemApoioOptions(candidatosApoio, todasSessoesAbertas),
    [candidatosApoio, todasSessoesAbertas],
  );

  const [tab, setTab] = useState<Tab>('demandas');
  const [demandaFilter, setDemandaFilter] = useState<DemandaFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPreRecebimentoId, setSheetPreRecebimentoId] = useState<
    string | null
  >(null);
  const [apoioSheetOpen, setApoioSheetOpen] = useState(false);
  const [apoioPreRecebimentoId, setApoioPreRecebimentoId] = useState<
    string | null
  >(null);
  const [impedimentoSheetOpen, setImpedimentoSheetOpen] = useState(false);
  const [impedimentoDemanda, setImpedimentoDemanda] =
    useState<DemandaRecebimentoRecursoApi | null>(null);

  const sessaoLabel = sessaoAtiva
    ? `${sessaoAtiva.equipeNome} · ${new Date(sessaoAtiva.dataReferencia).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
    : 'Sem sessão';

  const precisamPausaCount = operators.filter(
    (op) => op.precisaPausa && !op.emPausa,
  ).length;
  const atrasadosCount = operators.filter(
    (op) => op.precisaPausa && !op.emPausa && (op.pausaAtrasoMinutos ?? 0) > 0,
  ).length;

  const demandaCounts = useMemo(
    () => ({
      all: demandas.length,
      impedido: demandas.filter((d) => d.statusDemanda === 'impedido').length,
      disponivel: demandas.filter((d) => d.statusDemanda === 'disponivel').length,
      atribuida: demandas.filter((d) => d.statusDemanda === 'atribuida').length,
      em_conferencia: demandas.filter(
        (d) => d.statusDemanda === 'em_conferencia',
      ).length,
    }),
    [demandas],
  );

  const filteredDemandas = useMemo(() => {
    return demandas.filter((demanda) => {
      const matchesFilter =
        demandaFilter === 'all' || demanda.statusDemanda === demandaFilter;
      const matchesQuery = matchesSearch(
        searchQuery,
        demanda.placa,
        demanda.transportadoraNome,
      );
      return matchesFilter && matchesQuery;
    });
  }, [demandas, demandaFilter, searchQuery]);

  const filteredOperators = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return operators;

    return operators.filter(
      (op) =>
        op.name.toLowerCase().includes(normalized) ||
        op.sector.toLowerCase().includes(normalized) ||
        (op.currentMission?.toLowerCase().includes(normalized) ?? false),
    );
  }, [operators, searchQuery]);

  function openSheet(preRecebimentoId: string) {
    setSheetPreRecebimentoId(preRecebimentoId);
    setSheetOpen(true);
  }

  function openApoioSheet(preRecebimentoId: string) {
    setApoioPreRecebimentoId(preRecebimentoId);
    setApoioSheetOpen(true);
  }

  function openImpedimentoSheet(demanda: DemandaRecebimentoRecursoApi) {
    setImpedimentoDemanda(demanda);
    setImpedimentoSheetOpen(true);
  }

  async function handleAtribuirFromSheet(
    preRecebimentoId: string,
    sessaoFuncionarioId: string,
  ) {
    await handleAtribuir(preRecebimentoId, sessaoFuncionarioId);
    setSheetOpen(false);
  }

  async function handleAdicionarApoioFromSheet(
    preRecebimentoId: string,
    sessaoFuncionarioId: string,
  ) {
    await handleAdicionarApoio(preRecebimentoId, sessaoFuncionarioId);
    setApoioSheetOpen(false);
  }

  async function handleLiberarFromImpedimentoSheet(preRecebimentoId: string) {
    await handleLiberarImpedimento(preRecebimentoId);
    setImpedimentoSheetOpen(false);
    setImpedimentoDemanda(null);
  }

  const subtitle = isLoading
    ? 'Carregando painel...'
    : tab === 'demandas'
      ? `${demandaCounts.all} demanda${demandaCounts.all === 1 ? '' : 's'} · ${demandaCounts.impedido > 0 ? `${demandaCounts.impedido} impedida${demandaCounts.impedido === 1 ? '' : 's'} · ` : ''}${demandaCounts.disponivel} pendente${demandaCounts.disponivel === 1 ? '' : 's'}`
      : `${operators.length} operador${operators.length === 1 ? '' : 'es'} na sessão`;

  return (
    <div className="page-enter flex flex-col pb-8">
      <SessaoSubHeader
        backTo="/"
        backLabel="Menu principal"
        title="Gestão de Recursos"
        subtitle={subtitle}
        trailing={
          <button
            type="button"
            disabled={isRefreshing || semUnidade}
            onClick={() => {
              hapticMedium();
              triggerRefresh();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation disabled:opacity-50"
            aria-label="Atualizar"
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
          </button>
        }
      />

      <div className="flex flex-col gap-3 px-margin-mobile py-3">
        <SessaoContextBanner
          semUnidade={semUnidade}
          semSessaoAberta={semSessaoAberta}
          isLoading={isLoadingSessao}
          unidadeNome={unidadeNome}
          sessaoAtiva={sessaoAtiva}
          sessoesAbertas={sessoesAbertas}
          onSelectSessao={selectSessao}
        />

        {loadError ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error-container/20 px-3 py-3">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-error"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-label-sm font-semibold text-error">
                Erro ao carregar dados
              </p>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                {loadError}
              </p>
              <button
                type="button"
                onClick={triggerRefresh}
                className="mt-1.5 text-label-sm font-semibold text-error underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : null}

        {canShowPainel && sessaoAtiva ? (
          <>
            <GestaoRecursosResumoCard
              kpis={kpis}
              sessaoLabel={sessaoLabel}
              unidadeNome={unidadeNome}
              lastUpdatedAt={lastUpdatedAt}
            />

            <PrecisaPausaAlertBanner
              count={precisamPausaCount}
              atrasadosCount={atrasadosCount}
            />

            <RecebimentoDemandasResumo
              demandas={demandas}
              activeFilter={demandaFilter === 'all' ? undefined : demandaFilter}
              onFilterChange={(filter) => {
                setDemandaFilter(filter);
                setTab('demandas');
              }}
            />

            <GestaoRecursosSegmentedTabs
              tabs={[
                {
                  id: 'demandas',
                  label: 'Demandas',
                  icon: PackageSearch,
                  badge: demandaCounts.impedido + demandaCounts.disponivel,
                  badgeTone: 'urgent',
                },
                {
                  id: 'equipe',
                  label: 'Equipe',
                  icon: Users,
                  badge: operators.length,
                  badgeTone: 'default',
                },
              ]}
              active={tab}
              onChange={setTab}
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
                placeholder={
                  tab === 'demandas'
                    ? 'Buscar placa ou transportadora...'
                    : 'Buscar operador ou missão...'
                }
                className={cn(
                  'w-full rounded-xl border border-outline-variant bg-surface py-2.5 pl-9 pr-3 text-label-sm text-on-surface shadow-sm',
                  'placeholder:text-on-surface-variant focus-visible:border-secondary focus-visible:outline-none',
                )}
              />
            </div>

            {tab === 'demandas' ? (
              <DemandasFilterChips
                active={demandaFilter}
                counts={demandaCounts}
                onChange={setDemandaFilter}
              />
            ) : null}

            {isLoading ? (
              <div className="space-y-2.5" role="status" aria-label="Carregando">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : tab === 'demandas' ? (
              filteredDemandas.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-12 text-center">
                  <PackageSearch
                    className="size-10 text-on-surface-variant/50"
                    aria-hidden
                  />
                  <p className="text-label-sm font-medium text-on-surface">
                    {searchQuery.trim() || demandaFilter !== 'all'
                      ? 'Nenhuma demanda encontrada'
                      : 'Nenhuma demanda no momento'}
                  </p>
                  <p className="max-w-[240px] text-[11px] text-on-surface-variant">
                    {searchQuery.trim() || demandaFilter !== 'all'
                      ? 'Ajuste os filtros ou a busca para ver outras demandas.'
                      : 'Novas demandas de recebimento aparecerão aqui automaticamente.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredDemandas.map((demanda) => (
                    <DemandaRecebimentoCard
                      key={demanda.preRecebimentoId}
                      demanda={demanda}
                      onAtribuir={openSheet}
                      onCancelar={handleCancelarAlocacao}
                      onAdicionarApoio={openApoioSheet}
                      onRemoverApoio={handleRemoverApoio}
                      onLiberarImpedimento={handleLiberarImpedimento}
                      onVerImpedimento={openImpedimentoSheet}
                      isAtribuindo={atribuindoId === demanda.preRecebimentoId}
                      isCancelando={
                        demanda.alocacao
                          ? cancelandoId === demanda.alocacao.id
                          : false
                      }
                      isAdicionandoApoio={
                        adicionandoApoioId === demanda.preRecebimentoId
                      }
                      isRemovendoApoio={removendoApoioId != null}
                      isLiberando={liberandoId === demanda.preRecebimentoId}
                    />
                  ))}
                </div>
              )
            ) : filteredOperators.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-12 text-center">
                <Users className="size-10 text-on-surface-variant/50" aria-hidden />
                <p className="text-label-sm font-medium text-on-surface">
                  {searchQuery.trim()
                    ? 'Nenhum operador encontrado'
                    : 'Nenhum operador na sessão'}
                </p>
                <p className="max-w-[240px] text-[11px] text-on-surface-variant">
                  {searchQuery.trim()
                    ? 'Tente buscar por outro nome ou cargo.'
                    : 'Os operadores presentes na sessão aparecerão aqui.'}
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={apoio.openApoioSheet}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-label-sm font-semibold text-secondary shadow-sm transition-colors hover:bg-surface-container active:bg-surface-container-high"
                >
                  <UserPlus className="size-4" aria-hidden />
                  Adicionar apoio de outro setor
                </button>

                <div className="space-y-2.5">
                  {filteredOperators.map((operator) => (
                    <OperadorRecursoCard
                      key={operator.id}
                      operator={operator}
                      onEncerrarApoio={apoio.handleEncerrarApoio}
                      encerrandoApoioId={apoio.encerrandoId}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>

      <ImpedimentoDetalheSheet
        isOpen={impedimentoSheetOpen}
        onClose={() => {
          setImpedimentoSheetOpen(false);
          setImpedimentoDemanda(null);
        }}
        demanda={impedimentoDemanda}
        onLiberar={handleLiberarFromImpedimentoSheet}
        isLiberando={
          impedimentoDemanda
            ? liberandoId === impedimentoDemanda.preRecebimentoId
            : false
        }
      />

      <AtribuirConferenteSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        operators={operators.filter(
          (op) => op.status !== 'pausa' || !op.emPausa,
        )}
        preRecebimentoId={sheetPreRecebimentoId}
        onAtribuir={handleAtribuirFromSheet}
        isLoading={
          sheetPreRecebimentoId
            ? atribuindoId === sheetPreRecebimentoId
            : false
        }
      />

      <AtribuirConferenteSheet
        isOpen={apoioSheetOpen}
        onClose={() => setApoioSheetOpen(false)}
        operators={operators}
        preRecebimentoId={apoioPreRecebimentoId}
        onAtribuir={handleAdicionarApoioFromSheet}
        isLoading={
          apoioPreRecebimentoId
            ? adicionandoApoioId === apoioPreRecebimentoId
            : false
        }
        title="Adicionar apoio"
        includeBusyOperators
        confirmBeforeAction
      />

      <AdicionarApoioSheet
        isOpen={apoio.apoioSheetOpen}
        onClose={apoio.closeApoioSheet}
        candidatos={candidatosApoio}
        sessoesOrigem={sessoesOrigem}
        onAdicionar={apoio.handleAdicionarApoio}
        isLoading={apoio.adicionandoId != null}
        isLoadingCandidatos={apoio.isLoadingCandidatos}
        errorMessage={apoio.candidatosError}
      />
    </div>
  );
}

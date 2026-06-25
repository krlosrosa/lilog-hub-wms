'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';
import { useVisibleInterval } from '@/lib/use-visible-interval';
import { listTransportes } from '@/features/transporte/lib/expedicao-api';
import { mapTransportesApiToGrupos } from '@/features/transporte/lib/map-transporte-api';
import { ordenarTransportesPorCriticidade } from '@/features/torre-controle-expedicao/lib/calcular-criticidade';
import { criarSnapshotVazio } from '@/features/torre-controle-expedicao/lib/criar-snapshot-vazio';
import {
  contarTransportesPorFiltro,
  filtrarTransportesNaoFinalizados,
  filtrarTransportesTorre,
  listarTransportesDecisaoPrioritaria,
} from '@/features/torre-controle-expedicao/lib/filtrar-transportes-torre';
import {
  criarIntervaloPadraoHoje,
  formatarRotuloLote,
  listarLotesNoIntervalo,
  normalizarIntervaloData,
  type IntervaloData,
  type LoteExpedicaoResumo,
} from '@/features/torre-controle-expedicao/lib/intervalo-data';
import {
  formatarAtualizadoHa,
  formatarRelogio,
} from '@/features/torre-controle-expedicao/lib/formatar-tempo';
import { obterTorreControleExpedicao } from '@/features/torre-controle-expedicao/lib/torre-controle-api';
import {
  persistTorreControleFiltro,
  readTorreControleFiltro,
} from '@/features/torre-controle-expedicao/storage/torre-controle-filtro-storage';
import type {
  AlertaOperacional,
  EtapaOperacional,
  FiltroRapidoTorre,
  TorreControleSnapshot,
  TransporteRisco,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const REFRESH_INTERVAL_MS = 15_000;

function resolverLoteInicial(
  lotes: LoteExpedicaoResumo[],
  preferido?: string | null,
): string | null {
  if (lotes.length === 0) {
    return null;
  }

  if (preferido && lotes.some((lote) => lote.uploadLoteId === preferido)) {
    return preferido;
  }

  return lotes[0]?.uploadLoteId ?? null;
}

export function useTorreControleExpedicao() {
  const { unidadeSelecionada, isResolved: unidadeResolvida } = useUnidadeContext();

  const [intervalo, setIntervaloState] = useState<IntervaloData>(
    criarIntervaloPadraoHoje,
  );
  const [uploadLoteIdSelecionado, setUploadLoteIdSelecionado] = useState<
    string | null
  >(null);
  const [lotesDisponiveis, setLotesDisponiveis] = useState<LoteExpedicaoResumo[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [fonteDados, setFonteDados] = useState<'api' | 'vazio'>('vazio');
  const [snapshot, setSnapshot] = useState<TorreControleSnapshot>(
    criarSnapshotVazio,
  );
  const [clock, setClock] = useState(() => formatarRelogio(new Date()));
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  const [sheetTransporteId, setSheetTransporteId] = useState<string | null>(null);
  const [sheetEtapa, setSheetEtapa] = useState<EtapaOperacional | null>(null);
  const [sheetDocaId, setSheetDocaId] = useState<string | null>(null);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapidoTorre>('todos');
  const [apenasNaoFinalizados, setApenasNaoFinalizados] = useState(false);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  useEffect(() => {
    if (!unidadeSelecionada?.id) {
      return;
    }

    const salvo = readTorreControleFiltro(unidadeSelecionada.id);
    if (salvo) {
      setIntervaloState(
        normalizarIntervaloData({
          dataInicio: salvo.dataInicio,
          dataFim: salvo.dataFim,
        }),
      );
      setUploadLoteIdSelecionado(salvo.uploadLoteId ?? null);
      return;
    }

    setIntervaloState(criarIntervaloPadraoHoje());
    setUploadLoteIdSelecionado(null);
  }, [unidadeSelecionada?.id]);

  const setIntervalo = useCallback(
    (proximo: IntervaloData) => {
      const normalizado = normalizarIntervaloData(proximo);
      setIntervaloState(normalizado);

      if (unidadeSelecionada?.id) {
        persistTorreControleFiltro(unidadeSelecionada.id, {
          ...normalizado,
          uploadLoteId: uploadLoteIdSelecionado ?? undefined,
        });
      }
    },
    [unidadeSelecionada?.id, uploadLoteIdSelecionado],
  );

  const uploadLoteIdRef = useRef<string | null>(null);
  uploadLoteIdRef.current = uploadLoteIdSelecionado;

  const carregarSnapshot = useCallback(
    async (lotePreferido?: string | null) => {
      if (!unidadeResolvida) {
        return;
      }

      if (!unidadeSelecionada?.id) {
        setSnapshot(criarSnapshotVazio());
        setFonteDados('vazio');
        setErro('Selecione uma unidade para monitorar a expedição.');
        setAviso(null);
        setLotesDisponiveis([]);
        setIsLoading(false);
        return;
      }

      setIsRefreshing(true);
      setErro(null);
      setAviso(null);

      try {
        const response = await listTransportes(unidadeSelecionada.id);
        const transportes = mapTransportesApiToGrupos(response.transportes);
        const lotes = listarLotesNoIntervalo(transportes, intervalo);
        setLotesDisponiveis(lotes);

        const preferido =
          lotePreferido !== undefined
            ? lotePreferido
            : uploadLoteIdRef.current;
        const loteId = resolverLoteInicial(lotes, preferido);

        if (!loteId) {
          setSnapshot(criarSnapshotVazio());
          setFonteDados('vazio');
          setUploadLoteIdSelecionado(null);
          setAviso(
            'Nenhuma expedição encontrada no período selecionado. Ajuste as datas ou importe remessas em Expedição de Cargas.',
          );
          setLastUpdatedAt(new Date());
          setSecondsSinceUpdate(0);
          return;
        }

        if (loteId !== uploadLoteIdRef.current) {
          setUploadLoteIdSelecionado(loteId);
          persistTorreControleFiltro(unidadeSelecionada.id, {
            ...intervalo,
            uploadLoteId: loteId,
          });
        }

        const data = await obterTorreControleExpedicao({
          unidadeId: unidadeSelecionada.id,
          uploadLoteId: loteId,
        });

        setSnapshot(data);
        setFonteDados('api');
        setLastUpdatedAt(new Date());
        setSecondsSinceUpdate(0);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível carregar a torre de controle.';

        setErro(message);
        setSnapshot(criarSnapshotVazio());
        setFonteDados('vazio');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [intervalo, unidadeResolvida, unidadeSelecionada?.id],
  );

  const selecionarUploadLote = useCallback(
    (uploadLoteId: string) => {
      setUploadLoteIdSelecionado(uploadLoteId);

      if (unidadeSelecionada?.id) {
        persistTorreControleFiltro(unidadeSelecionada.id, {
          ...intervalo,
          uploadLoteId,
        });
      }

      void carregarSnapshot(uploadLoteId);
    },
    [carregarSnapshot, intervalo, unidadeSelecionada?.id],
  );

  useEffect(() => {
    setIsLoading(true);
    void carregarSnapshot();
  }, [carregarSnapshot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatarRelogio(new Date()));
      setSecondsSinceUpdate(
        Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lastUpdatedAt]);

  const refresh = useCallback(() => {
    void carregarSnapshot(uploadLoteIdRef.current);
  }, [carregarSnapshot]);

  useVisibleInterval(
    refresh,
    REFRESH_INTERVAL_MS,
    autoRefresh && !isLoading && fonteDados === 'api',
  );

  const transportesRisco = useMemo(
    () => ordenarTransportesPorCriticidade(snapshot.transportes),
    [snapshot.transportes],
  );

  const contadoresFiltro = useMemo(
    () => contarTransportesPorFiltro(transportesRisco),
    [transportesRisco],
  );

  const transportesAposFiltroRapido = useMemo(
    () => filtrarTransportesTorre(transportesRisco, filtroRapido),
    [filtroRapido, transportesRisco],
  );

  const transportesFiltrados = useMemo(() => {
    if (!apenasNaoFinalizados) {
      return transportesAposFiltroRapido;
    }

    return filtrarTransportesNaoFinalizados(transportesAposFiltroRapido);
  }, [apenasNaoFinalizados, transportesAposFiltroRapido]);

  const transportesDecisaoPrioritaria = useMemo(
    () => listarTransportesDecisaoPrioritaria(transportesRisco),
    [transportesRisco],
  );

  const transporteSelecionado = useMemo(
    () =>
      sheetTransporteId
        ? snapshot.transportes.find((t) => t.id === sheetTransporteId) ?? null
        : null,
    [sheetTransporteId, snapshot.transportes],
  );

  const etapaSelecionada = useMemo(
    () =>
      sheetEtapa
        ? snapshot.pipeline.find((e) => e.etapa === sheetEtapa) ?? null
        : null,
    [sheetEtapa, snapshot.pipeline],
  );

  const docaSelecionada = useMemo(
    () =>
      sheetDocaId
        ? snapshot.docas.find((d) => d.id === sheetDocaId) ?? null
        : null,
    [sheetDocaId, snapshot.docas],
  );

  const mapasTransporteSelecionado = useMemo(() => {
    if (!transporteSelecionado) {
      return [];
    }

    return snapshot.mapas.filter(
      (m) => m.transporteId === transporteSelecionado.id,
    );
  }, [snapshot.mapas, transporteSelecionado]);

  const mapasEtapaSelecionada = useMemo(() => {
    if (!sheetEtapa) {
      return [];
    }

    return snapshot.mapas.filter(
      (m) => m.etapa === sheetEtapa && m.status !== 'concluido',
    );
  }, [sheetEtapa, snapshot.mapas]);

  const openTransporteSheet = useCallback((transporte: TransporteRisco | string) => {
    const id = typeof transporte === 'string' ? transporte : transporte.id;
    setSheetTransporteId(id);
    setSheetEtapa(null);
    setSheetDocaId(null);
  }, []);

  const closeTransporteSheet = useCallback(() => {
    setSheetTransporteId(null);
  }, []);

  const openEtapaSheet = useCallback((etapa: EtapaOperacional) => {
    setSheetEtapa(etapa);
    setSheetTransporteId(null);
    setSheetDocaId(null);
  }, []);

  const closeEtapaSheet = useCallback(() => {
    setSheetEtapa(null);
  }, []);

  const openDocaSheet = useCallback((docaId: string) => {
    setSheetDocaId(docaId);
    setSheetTransporteId(null);
    setSheetEtapa(null);
  }, []);

  const closeDocaSheet = useCallback(() => {
    setSheetDocaId(null);
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const aplicarFiltroRapido = useCallback(
    (filtro: FiltroRapidoTorre) => {
      setFiltroRapido(filtro);
      scrollToSection('painel-criticidade');
    },
    [scrollToSection],
  );

  const handleAlertClick = useCallback(
    (alerta: AlertaOperacional) => {
      if (alerta.entityId) {
        const transporte = snapshotRef.current.transportes.find(
          (t) => t.id === alerta.entityId,
        );

        if (transporte) {
          openTransporteSheet(transporte.id);
          return;
        }
      }

      if (alerta.sectionId) {
        scrollToSection(alerta.sectionId);
      }
    },
    [openTransporteSheet, scrollToSection],
  );

  const opcoesLote = useMemo(
    () =>
      lotesDisponiveis.map((lote) => ({
        value: lote.uploadLoteId,
        label: formatarRotuloLote(lote),
      })),
    [lotesDisponiveis],
  );

  return {
    isLoading,
    isRefreshing,
    erro,
    aviso,
    fonteDados,
    unidadeNome: unidadeSelecionada?.nome ?? null,
    intervalo,
    setIntervalo,
    uploadLoteIdSelecionado,
    selecionarUploadLote,
    opcoesLote,
    clock,
    snapshot,
    transportesRisco,
    transportesFiltrados,
    transportesAposFiltroRapido,
    transportesDecisaoPrioritaria,
    filtroRapido,
    apenasNaoFinalizados,
    setApenasNaoFinalizados,
    contadoresFiltro,
    aplicarFiltroRapido,
    alertas: snapshot.alertas,
    turno: snapshot.turno,
    autoRefresh,
    setAutoRefresh,
    atualizadoHaLabel: formatarAtualizadoHa(secondsSinceUpdate),
    refresh,
    sheetTransporteId,
    transporteSelecionado,
    mapasTransporteSelecionado,
    openTransporteSheet,
    closeTransporteSheet,
    sheetEtapa,
    etapaSelecionada,
    mapasEtapaSelecionada,
    openEtapaSheet,
    closeEtapaSheet,
    sheetDocaId,
    docaSelecionada,
    openDocaSheet,
    closeDocaSheet,
    scrollToSection,
    handleAlertClick,
  };
}

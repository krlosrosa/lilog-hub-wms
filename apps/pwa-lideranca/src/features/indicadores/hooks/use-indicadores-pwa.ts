import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  listTransportes,
  obterTorreControleExpedicao,
} from '@/features/indicadores/api/indicadores-api';
import { criarSnapshotVazio } from '@/features/indicadores/lib/criar-snapshot-vazio';
import {
  contarTransportesPorFiltro,
  filtrarTransportesTorre,
  listarTransportesDecisaoPrioritaria,
} from '@/features/indicadores/lib/filtrar-transportes-torre';
import { formatarAtualizadoHa } from '@/features/indicadores/lib/formatar-tempo';
import { ordenarTransportesPorCriticidade } from '@/features/indicadores/lib/ordenar-transportes';
import { resolverUploadLoteIdDoDia } from '@/features/indicadores/lib/resolver-upload-lote';
import type {
  AlertaOperacional,
  AlertSeverity,
  FiltroRapidoTorre,
  TorreControleSnapshot,
  TransporteRisco,
} from '@/features/indicadores/lib/torre-controle.schema';
import { useUnidade } from '@/features/unidade';

const POLL_INTERVAL_MS = 30_000;
const LIVE_TICK_MS = 1_000;

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

function ordenarAlertasPorSeveridade(
  alertas: AlertaOperacional[],
): AlertaOperacional[] {
  return [...alertas].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

function findKpiValue(snapshot: TorreControleSnapshot, id: string): string {
  return snapshot.kpis.find((kpi) => kpi.id === id)?.value ?? '0';
}

export function useIndicadoresPwa() {
  const { unidadeSelecionada, isLoading: isUnidadeLoading } = useUnidade();

  const [snapshot, setSnapshot] = useState<TorreControleSnapshot>(criarSnapshotVazio);
  const [uploadLoteId, setUploadLoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [semExpedicaoAtiva, setSemExpedicaoAtiva] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapidoTorre>('todos');
  const [transporteSelecionadoId, setTransporteSelecionadoId] = useState<
    string | null
  >(null);
  const [alertasSheetOpen, setAlertasSheetOpen] = useState(false);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const loadIndicadores = useCallback(
    async (options?: { silent?: boolean }) => {
      const unidadeId = unidadeSelecionada?.id;

      if (!unidadeId) {
        setSnapshot(criarSnapshotVazio());
        setUploadLoteId(null);
        setSemExpedicaoAtiva(false);
        setLoadError(null);
        setIsLoading(false);
        return;
      }

      if (!options?.silent) {
        setIsLoading(true);
      }

      setLoadError(null);

      try {
        const transportesResponse = await listTransportes(unidadeId);
        const loteId = resolverUploadLoteIdDoDia(transportesResponse.transportes);

        if (!loteId) {
          setUploadLoteId(null);
          setSemExpedicaoAtiva(true);
          setSnapshot(criarSnapshotVazio());
          setLastUpdatedAt(new Date());
          return;
        }

        setUploadLoteId(loteId);
        setSemExpedicaoAtiva(false);

        const torreSnapshot = await obterTorreControleExpedicao({
          unidadeId,
          uploadLoteId: loteId,
        });

        setSnapshot(torreSnapshot);
        setLastUpdatedAt(new Date());
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os indicadores.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [unidadeSelecionada?.id],
  );

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadIndicadores({ silent: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [loadIndicadores]);

  useEffect(() => {
    void loadIndicadores();
  }, [loadIndicadores]);

  useEffect(() => {
    if (!unidadeSelecionada?.id || semExpedicaoAtiva) {
      return;
    }

    const interval = setInterval(() => {
      void loadIndicadores({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [unidadeSelecionada?.id, semExpedicaoAtiva, loadIndicadores]);

  useEffect(() => {
    if (!lastUpdatedAt) {
      return;
    }

    const tick = () => {
      setSecondsSinceUpdate(
        Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000),
      );
    };

    tick();
    const interval = setInterval(tick, LIVE_TICK_MS);
    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  const transportesOrdenados = useMemo(
    () => ordenarTransportesPorCriticidade(snapshot.transportes),
    [snapshot.transportes],
  );

  const counts = useMemo(
    () => contarTransportesPorFiltro(transportesOrdenados),
    [transportesOrdenados],
  );

  const transportesFiltrados = useMemo(
    () => filtrarTransportesTorre(transportesOrdenados, filtroRapido),
    [transportesOrdenados, filtroRapido],
  );

  const transportesForaDoEixo = useMemo(
    () =>
      ordenarTransportesPorCriticidade(
        listarTransportesDecisaoPrioritaria(transportesOrdenados),
      ),
    [transportesOrdenados],
  );

  const alertasOrdenados = useMemo(
    () => ordenarAlertasPorSeveridade(snapshot.alertas),
    [snapshot.alertas],
  );

  const transporteSelecionado = useMemo(
    () =>
      transporteSelecionadoId
        ? (snapshot.transportes.find((t) => t.id === transporteSelecionadoId) ??
          null)
        : null,
    [snapshot.transportes, transporteSelecionadoId],
  );

  const mapasTransporteSelecionado = useMemo(() => {
    if (!transporteSelecionado) {
      return [];
    }

    return snapshot.mapas.filter(
      (mapa) => mapa.transporteCodigo === transporteSelecionado.codigo,
    );
  }, [snapshot.mapas, transporteSelecionado]);

  const kpiResumo = useMemo(
    () => ({
      prioritariosAtrasados: counts.prioritarios_atrasados,
      emRisco: findKpiValue(snapshot, 'transportes-risco'),
      sla: findKpiValue(snapshot, 'sla'),
      prioridadesPendentes: findKpiValue(snapshot, 'prioridades-pendentes'),
    }),
    [counts.prioritarios_atrasados, snapshot],
  );

  const semUnidade = !unidadeSelecionada?.id;
  const atualizadoLabel = formatarAtualizadoHa(secondsSinceUpdate);

  const abrirTransporte = useCallback((transporte: TransporteRisco) => {
    setTransporteSelecionadoId(transporte.id);
  }, []);

  return {
    unidadeNome: unidadeSelecionada?.nomeFilial ?? unidadeSelecionada?.nome ?? null,
    semUnidade,
    semExpedicaoAtiva,
    uploadLoteId,
    snapshot,
    transportesOrdenados,
    transportesFiltrados,
    transportesForaDoEixo,
    alertasOrdenados,
    counts,
    kpiResumo,
    filtroRapido,
    setFiltroRapido,
    transporteSelecionado,
    mapasTransporteSelecionado,
    transporteSelecionadoId,
    setTransporteSelecionadoId,
    abrirTransporte,
    alertasSheetOpen,
    setAlertasSheetOpen,
    isLoading: isUnidadeLoading || isLoading,
    isRefreshing,
    loadError,
    lastUpdatedAt,
    atualizadoLabel,
    triggerRefresh,
  };
}

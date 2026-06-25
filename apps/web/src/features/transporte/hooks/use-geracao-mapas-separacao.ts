'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  calcularResumoSelecao,
  filtrarPedidosPicking,
} from '@/features/transporte/lib/filtrar-pedidos-picking';
import {
  criarRegistroAuditoriaGeracao,
  criarRegistroAuditoriaRebalanceamento,
  criarRegistroAuditoriaReimpressao,
  gerarMapasPicking,
} from '@/features/transporte/lib/gerar-mapas-picking';
import { simularGeracaoMapas } from '@/features/transporte/lib/simular-geracao-mapas';
import {
  listarCentrosDisponiveis,
  listarClientesDisponiveis,
  listarRotasDisponiveis,
  listarTransportadorasDisponiveis,
  MOCK_AUDITORIA_INICIAL,
  MOCK_INDICADORES_OPERACIONAIS,
  MOCK_PEDIDOS_PICKING,
} from '@/features/transporte/mocks/pedidos-picking.mock';
import {
  criarConfigEstrategia,
  DEFAULT_CONFIG_GERACAO,
  DEFAULT_FILTROS_PEDIDO,
  ESTRATEGIA_LABELS,
  type ConfigBalanceamento,
  type ConfigEstrategia,
  type ConfigGeracaoMapas,
  type ConfigOtimizacaoRota,
  type EstrategiaSeparacao,
  type FiltrosPedidoPicking,
  type MapaPickingGerado,
  type RegistroAuditoria,
  type ResultadoGeracao,
  type ResultadoSimulacao,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

const USUARIO_ATUAL = 'João Silva';

export function useGeracaoMapasSeparacao() {
  const router = useRouter();

  const [pedidos] = useState(() => [...MOCK_PEDIDOS_PICKING]);
  const [filtros, setFiltros] = useState<FiltrosPedidoPicking>(DEFAULT_FILTROS_PEDIDO);
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set());
  const [config, setConfig] = useState<ConfigGeracaoMapas>(DEFAULT_CONFIG_GERACAO);
  const [resultado, setResultado] = useState<ResultadoGeracao | null>(null);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>(
    () => [...MOCK_AUDITORIA_INICIAL],
  );
  const [previewAberto, setPreviewAberto] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);

  const pedidosFiltrados = useMemo(
    () => filtrarPedidosPicking(pedidos, filtros),
    [pedidos, filtros],
  );

  const pedidosSelecionados = useMemo(
    () => pedidos.filter((p) => selecionados.has(p.id)),
    [pedidos, selecionados],
  );

  const resumoSelecao = useMemo(
    () => calcularResumoSelecao(pedidos, selecionados),
    [pedidos, selecionados],
  );

  const simulacao: ResultadoSimulacao | null = useMemo(() => {
    if (pedidosSelecionados.length === 0) return null;
    return simularGeracaoMapas(pedidosSelecionados, config);
  }, [config, pedidosSelecionados]);

  const prontoParaGerar =
    pedidosSelecionados.length > 0 && (simulacao?.totalMapas ?? 0) > 0;

  const atualizarFiltros = useCallback((novos: FiltrosPedidoPicking) => {
    setFiltros(novos);
  }, []);

  const togglePedido = useCallback((id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setResultado(null);
  }, []);

  const toggleTodos = useCallback(
    (ids: string[]) => {
      setSelecionados((prev) => {
        const todosMarcados = ids.every((id) => prev.has(id));
        if (todosMarcados) {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        }
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
      setResultado(null);
    },
    [],
  );

  const selecionarEstrategia = useCallback((estrategia: EstrategiaSeparacao) => {
    setConfig((prev) => ({
      ...prev,
      estrategia,
      configEstrategia: criarConfigEstrategia(estrategia),
    }));
    setResultado(null);
  }, []);

  const atualizarConfigEstrategia = useCallback((cfg: ConfigEstrategia) => {
    setConfig((prev) => ({ ...prev, configEstrategia: cfg }));
    setResultado(null);
  }, []);

  const atualizarBalanceamento = useCallback((balanceamento: ConfigBalanceamento) => {
    setConfig((prev) => ({ ...prev, balanceamento }));
    setResultado(null);
  }, []);

  const atualizarOtimizacaoRota = useCallback(
    (otimizacaoRota: ConfigOtimizacaoRota) => {
      setConfig((prev) => ({ ...prev, otimizacaoRota }));
      setResultado(null);
    },
    [],
  );

  const gerarMapas = useCallback(async () => {
    if (!prontoParaGerar) {
      toast.error('Selecione pedidos antes de gerar os mapas.');
      return;
    }

    setGerando(true);

    if (config.balanceamento.rebalancearAutomatico) {
      setAuditoria((prev) => [
        criarRegistroAuditoriaRebalanceamento(USUARIO_ATUAL),
        ...prev,
      ]);
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    const gerado = gerarMapasPicking(
      pedidosSelecionados,
      config,
      USUARIO_ATUAL,
    );

    setResultado(gerado);
    setAuditoria((prev) => [
      criarRegistroAuditoriaGeracao(gerado, USUARIO_ATUAL),
      ...prev,
    ]);

    setGerando(false);
    toast.success(
      `${gerado.totalMapas} mapa(s) gerado(s) — ${ESTRATEGIA_LABELS[config.estrategia]}.`,
    );
  }, [config, pedidosSelecionados, prontoParaGerar]);

  const abrirPreview = useCallback(() => {
    if (!resultado?.mapas.length) {
      toast.error('Gere os mapas antes de pré-visualizar.');
      return;
    }
    setPreviewAberto(true);
  }, [resultado]);

  const fecharPreview = useCallback(() => {
    setPreviewAberto(false);
  }, []);

  const imprimirMapas = useCallback(async () => {
    if (!resultado?.mapas.length) {
      toast.error('Gere os mapas antes de imprimir.');
      return;
    }

    setImprimindo(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const preview = document.getElementById('preview-mapas-picking');
    if (preview) {
      const janela = window.open('', '_blank');
      if (janela) {
        janela.document.write(`
          <html>
            <head>
              <title>Mapas de Separação — Picking</title>
              <style>
                body { font-family: Inter, sans-serif; padding: 20px; color: #111; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th, td { border: 1px solid #ccc; padding: 4px 8px; }
                th { background: #f4f4f5; }
                .bloco { page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #ddd; padding: 12px; }
              </style>
            </head>
            <body>${preview.innerHTML}</body>
          </html>
        `);
        janela.document.close();
        janela.print();
      }
    }

    resultado.mapas.forEach((mapa) => {
      setAuditoria((prev) => [
        criarRegistroAuditoriaReimpressao(mapa, USUARIO_ATUAL),
        ...prev,
      ]);
    });

    setImprimindo(false);
    toast.success(`${resultado.totalMapas} mapa(s) enviado(s) para impressão.`);
  }, [resultado]);

  const cancelar = useCallback(() => {
    router.push('/transporte');
  }, [router]);

  return {
    pedidosFiltrados,
    filtros,
    selecionados,
    resumoSelecao,
    config,
    simulacao,
    resultado,
    auditoria,
    indicadores: MOCK_INDICADORES_OPERACIONAIS,
    rotas: listarRotasDisponiveis(),
    transportadoras: listarTransportadorasDisponiveis(),
    clientes: listarClientesDisponiveis(),
    centros: listarCentrosDisponiveis(),
    prontoParaGerar,
    previewAberto,
    gerando,
    imprimindo,
    atualizarFiltros,
    togglePedido,
    toggleTodos,
    selecionarEstrategia,
    atualizarConfigEstrategia,
    atualizarBalanceamento,
    atualizarOtimizacaoRota,
    gerarMapas,
    abrirPreview,
    fecharPreview,
    imprimirMapas,
    cancelar,
  };
}

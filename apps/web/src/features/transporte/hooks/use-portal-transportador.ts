'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';
import {
  resolverCustoPrevistoTransporte,
} from '@/features/transporte/lib/calcular-custo';
import {
  buildPerfilTarifaMap,
  buildVeiculoAlocadoFromVeiculo,
  mapPlacasToVeiculos,
} from '@/features/transporte/lib/map-placa-to-veiculo';
import {
  listPerfisTarifas,
  mapPerfilTarifaToItem,
} from '@/features/transporte/lib/perfis-tarifas-api';
import { listAllPlacasUnidade } from '@/features/transporte/lib/placas-api';
import {
  MOCK_TRANSPORTES,
} from '@/features/transporte/mocks/transporte.mock';
import type {
  TipoVeiculo,
  TransporteGrupo,
  Veiculo,
} from '@/features/transporte/types/transporte.schema';

/** Simula a transportadora logada — futuramente virá do JWT/sessão. */
export const TRANSPORTADORA_ATUAL = 'Rápido Norte Transportes';

export type PortalTransportadorSummary = {
  totalEntregas: number;
  placasEmUso: number;
  totalNFs: number;
  naoAlocadas: number;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function calcularSummaryPortal(entregas: TransporteGrupo[]): PortalTransportadorSummary {
  const placas = new Set(
    entregas
      .map((entrega) => entrega.veiculoAlocado?.placa)
      .filter((placa): placa is string => Boolean(placa)),
  );

  return {
    totalEntregas: entregas.length,
    placasEmUso: placas.size,
    totalNFs: entregas.reduce(
      (acc, entrega) => acc + entrega.quantidadeRemessas,
      0,
    ),
    naoAlocadas: entregas.filter((entrega) => !entrega.veiculoAlocado).length,
  };
}

function pertenceTransportadoraPortal(
  transporte: TransporteGrupo,
  transportadora: string,
): boolean {
  return (
    transporte.transportadoraAtribuida === transportadora ||
    transporte.veiculoAlocado?.transportadora === transportadora
  );
}

export function usePortalTransportador() {
  const { unidadeSelecionada } = useUnidadeContext();
  const [transportes, setTransportes] = useState<TransporteGrupo[]>(() => [
    ...MOCK_TRANSPORTES,
  ]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
  const [filtroData, setFiltroData] = useState('2026-06-05');
  const [processando, setProcessando] = useState(false);
  const [modalTrocarAberto, setModalTrocarAberto] = useState(false);
  const [transporteSelecionado, setTransporteSelecionado] =
    useState<TransporteGrupo | null>(null);

  const carregarVeiculos = useCallback(async () => {
    if (!unidadeSelecionada?.id) {
      setVeiculos([]);
      return;
    }

    setCarregandoVeiculos(true);

    try {
      const [placasResultado, perfisResultado] = await Promise.all([
        listAllPlacasUnidade(unidadeSelecionada.id),
        listPerfisTarifas({ unidadeId: unidadeSelecionada.id }),
      ]);

      const perfisPorId = buildPerfilTarifaMap(
        perfisResultado.items.map(mapPerfilTarifaToItem),
      );
      setVeiculos(mapPlacasToVeiculos(placasResultado, perfisPorId));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as placas.';
      toast.error(message);
      setVeiculos([]);
    } finally {
      setCarregandoVeiculos(false);
    }
  }, [unidadeSelecionada?.id]);

  useEffect(() => {
    void carregarVeiculos();
  }, [carregarVeiculos]);

  const veiculosTransportadora = useMemo(
    () =>
      veiculos.filter(
        (veiculo) => veiculo.transportadora === TRANSPORTADORA_ATUAL,
      ),
    [veiculos],
  );

  const entregasBase = useMemo(
    () =>
      transportes.filter(
        (transporte) =>
          pertenceTransportadoraPortal(transporte, TRANSPORTADORA_ATUAL) &&
          transporte.dataTransporte === filtroData,
      ),
    [transportes, filtroData],
  );

  const entregas = entregasBase;

  const summary = useMemo(
    () => calcularSummaryPortal(entregasBase),
    [entregasBase],
  );

  const abrirModalTrocar = useCallback((transporte: TransporteGrupo) => {
    setTransporteSelecionado(transporte);
    setModalTrocarAberto(true);
  }, []);

  const fecharModalTrocar = useCallback(() => {
    setModalTrocarAberto(false);
    setTransporteSelecionado(null);
  }, []);

  const confirmarTroca = useCallback(
    async (veiculoId: string) => {
      if (!transporteSelecionado) {
        return;
      }

      const transporte = transportes.find(
        (item) => item.id === transporteSelecionado.id,
      );
      const veiculo = veiculosTransportadora.find(
        (item) => item.id === veiculoId,
      );

      if (!transporte || !veiculo) {
        toast.error('Entrega ou veículo não encontrado.');
        return;
      }

      if (veiculo.id === transporte.veiculoAlocado?.veiculoId) {
        toast.info('Esta placa já está alocada nesta entrega.');
        fecharModalTrocar();
        return;
      }

      const entregaComPlaca = transportes.find(
        (item) =>
          item.id !== transporte.id &&
          item.veiculoAlocado?.veiculoId === veiculoId &&
          item.veiculoAlocado?.transportadora === TRANSPORTADORA_ATUAL,
      );

      setProcessando(true);
      await delay(600);

      const freteSemCusto = transporte.freteSemCusto ?? false;
      const tipoTarifaCusto: TipoVeiculo =
        transporte.tipoTarifaCusto ?? veiculo.tipo;
      const placaAnteriorId = transporte.veiculoAlocado?.veiculoId;

      setTransportes((prev) =>
        prev.map((item) => {
          if (entregaComPlaca && item.id === entregaComPlaca.id) {
            return {
              ...item,
              status: 'PENDENTE' as const,
              transportadoraAtribuida: TRANSPORTADORA_ATUAL,
              veiculoAlocado: undefined,
              tipoTarifaCusto: undefined,
              custoPrevisto: undefined,
            };
          }

          if (item.id !== transporte.id) {
            return item;
          }

          return {
            ...item,
            transportadoraAtribuida: TRANSPORTADORA_ATUAL,
            status: item.status === 'PARCIAL' ? 'PARCIAL' : 'ALOCADO',
            veiculoAlocado: buildVeiculoAlocadoFromVeiculo(veiculo),
            custoPrevisto: freteSemCusto
              ? 0
              : resolverCustoPrevistoTransporte({
                  ...item,
                  freteSemCusto: false,
                  tipoTarifaCusto,
                  veiculoAlocado: buildVeiculoAlocadoFromVeiculo(veiculo),
                }),
          };
        }),
      );

      setVeiculos((prev) =>
        prev.map((item) => {
          if (item.id === veiculoId) {
            return {
              ...item,
              disponivel: false,
              pesoAlocado: transporte.pesoTotal,
            };
          }

          if (placaAnteriorId && item.id === placaAnteriorId) {
            return { ...item, disponivel: true, pesoAlocado: 0 };
          }

          return item;
        }),
      );

      setProcessando(false);
      fecharModalTrocar();

      if (entregaComPlaca) {
        toast.success(`Placa ${veiculo.placa} realocada`, {
          description: `Entrega ${transporte.rota} recebeu a placa. ${entregaComPlaca.rota} ficou sem alocação.`,
        });
        return;
      }

      toast.success(`Placa trocada para ${veiculo.placa}`, {
        description: `Entrega ${transporte.rota} — motorista ${veiculo.motorista}`,
      });
    },
    [
      transporteSelecionado,
      transportes,
      veiculosTransportadora,
      fecharModalTrocar,
    ],
  );

  return {
    transportadoraAtual: TRANSPORTADORA_ATUAL,
    summary,
    entregas,
    veiculosTransportadora,
    transportesTodos: transportes,
    filtroData,
    setFiltroData,
    processando,
    carregandoVeiculos,
    modalTrocarAberto,
    transporteSelecionado,
    abrirModalTrocar,
    fecharModalTrocar,
    confirmarTroca,
  };
}

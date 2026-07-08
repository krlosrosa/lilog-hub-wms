import { useCallback, useMemo, useState } from 'react';

import { SEED_VEICULOS } from '../data/manobra-seed';
import {
  agruparFilasPorDoca,
  obterProximoVeiculo,
  ordenarPendentes,
} from '../lib/manobra-queue';
import type { Veiculo } from '../types/manobra.schema';

export type ManobraAba = 'demanda' | 'na_doca';
export type FiltroTransportadora = 'todas' | string;

export type TransportadoraOpcao = {
  nome: string;
  count: number;
};

function porAtribuicaoDesc(a: Veiculo, b: Veiculo): number {
  const tempoA = a.atribuidoEm ? new Date(a.atribuidoEm).getTime() : 0;
  const tempoB = b.atribuidoEm ? new Date(b.atribuidoEm).getTime() : 0;
  return tempoB - tempoA;
}

function isEncostar(veiculo: Veiculo): boolean {
  return veiculo.status === 'pendente';
}

function isNaDoca(veiculo: Veiculo): boolean {
  return veiculo.status === 'encostado' && veiculo.concluido !== true;
}

function isRetirar(veiculo: Veiculo): boolean {
  return veiculo.status === 'encostado' && veiculo.concluido === true;
}

function isDemanda(veiculo: Veiculo): boolean {
  return isEncostar(veiculo) || isRetirar(veiculo);
}

function filtrarPorTransportadora(
  veiculos: Veiculo[],
  transportadora: FiltroTransportadora,
): Veiculo[] {
  if (transportadora === 'todas') return veiculos;
  return veiculos.filter((veiculo) => veiculo.transportadora === transportadora);
}

function filtrarPorAba(veiculos: Veiculo[], aba: ManobraAba): Veiculo[] {
  if (aba === 'demanda') return veiculos.filter(isDemanda);
  return veiculos.filter(isNaDoca);
}

function listarTransportadoras(veiculos: Veiculo[], aba: ManobraAba): TransportadoraOpcao[] {
  const contagem = new Map<string, number>();

  for (const veiculo of filtrarPorAba(veiculos, aba)) {
    contagem.set(veiculo.transportadora, (contagem.get(veiculo.transportadora) ?? 0) + 1);
  }

  return Array.from(contagem.entries())
    .map(([nome, count]) => ({ nome, count }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export function useManobra() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>(() => SEED_VEICULOS);
  const [aba, setAba] = useState<ManobraAba>('demanda');
  const [filtroTransportadora, setFiltroTransportadora] = useState<FiltroTransportadora>('todas');
  const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState<string | null>(null);

  const veiculosFiltrados = useMemo(
    () => filtrarPorTransportadora(filtrarPorAba(veiculos, aba), filtroTransportadora),
    [veiculos, aba, filtroTransportadora],
  );

  const veiculosEncostar = useMemo(
    () => ordenarPendentes(veiculosFiltrados.filter(isEncostar)),
    [veiculosFiltrados],
  );

  const veiculosRetirar = useMemo(
    () => [...veiculosFiltrados.filter(isRetirar)].sort(porAtribuicaoDesc),
    [veiculosFiltrados],
  );

  const veiculosNaDoca = useMemo(
    () => [...veiculosFiltrados.filter(isNaDoca)].sort(porAtribuicaoDesc),
    [veiculosFiltrados],
  );

  const veiculoSelecionado = useMemo(() => {
    const todos = [...veiculosEncostar, ...veiculosRetirar, ...veiculosNaDoca];
    return todos.find((veiculo) => veiculo.id === veiculoSelecionadoId) ?? null;
  }, [veiculosEncostar, veiculosRetirar, veiculosNaDoca, veiculoSelecionadoId]);

  const proximoEncostar = useMemo(() => obterProximoVeiculo(veiculosEncostar), [veiculosEncostar]);

  const filasPorDoca = useMemo(() => agruparFilasPorDoca(veiculosEncostar), [veiculosEncostar]);

  const transportadoras = useMemo(() => listarTransportadoras(veiculos, aba), [veiculos, aba]);

  const contadores = useMemo(() => {
    const base = filtrarPorTransportadora(veiculos, filtroTransportadora);
    return {
      demanda: base.filter(isDemanda).length,
      na_doca: base.filter(isNaDoca).length,
    };
  }, [veiculos, filtroTransportadora]);

  const confirmarEncosto = useCallback((id: string) => {
    setVeiculos((atual) =>
      atual.map((veiculo) =>
        veiculo.id === id
          ? { ...veiculo, status: 'encostado' as const, concluido: false }
          : veiculo,
      ),
    );
    setVeiculoSelecionadoId(null);
  }, []);

  const confirmarRetirada = useCallback((id: string) => {
    setVeiculos((atual) => atual.filter((veiculo) => veiculo.id !== id));
  }, []);

  const selecionarVeiculo = useCallback((id: string) => {
    setVeiculoSelecionadoId(id);
  }, []);

  const limparSelecao = useCallback(() => {
    setVeiculoSelecionadoId(null);
  }, []);

  const alterarAba = useCallback((novaAba: ManobraAba) => {
    setAba(novaAba);
    setFiltroTransportadora('todas');
  }, []);

  return {
    aba,
    proximoEncostar,
    filasPorDoca,
    veiculosEncostar,
    veiculosRetirar,
    veiculosNaDoca,
    veiculoSelecionado,
    filtroTransportadora,
    transportadoras,
    contadores,
    setAba: alterarAba,
    setFiltroTransportadora,
    confirmarEncosto,
    confirmarRetirada,
    selecionarVeiculo,
    limparSelecao,
  };
}

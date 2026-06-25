import { nanoid } from 'nanoid';

import type { GerarMapasResponse } from '../../dtos/expedicao/gerar-mapas.dto.js';
import {
  calcularTotalPaletesFisicos,
  type ItemComBreakdownPalete,
} from './calcular-breakdown-quantidade.js';

export type TransporteMetaMapa = {
  id: string;
  rota: string;
  placa: string | null;
  transportadora: string | null;
};

export type LinhaCabecalhoGrupo = {
  transporteId: string;
  transporteRota: string;
  codCliente: string;
  cliente: string;
};

export type BlocoCabecalhoGrupo = {
  titulo: string;
  empresa?: string;
  categoria?: string;
  linhas: LinhaCabecalhoGrupo[];
};

type ItemComBreakdown = GerarMapasResponse['grupos'][number]['itens'][number];

const SEPARADOR_CLIENTES = ' · ';

export function slugTransporte(rota: string): string {
  return (
    rota
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'sem-transporte'
  );
}

export function gerarMicroUuidMapa(transporteRota: string): string {
  return `${slugTransporte(transporteRota)}-${nanoid()}`;
}

function coletarClientesOrdem(
  linhas: LinhaCabecalhoGrupo[],
): Array<{ cod: string; nome: string }> {
  const vistos = new Set<string>();
  const clientes: Array<{ cod: string; nome: string }> = [];

  linhas.forEach((linha) => {
    if (vistos.has(linha.codCliente)) {
      return;
    }

    vistos.add(linha.codCliente);
    clientes.push({ cod: linha.codCliente, nome: linha.cliente });
  });

  return clientes;
}

function resolverTransporteRota(
  bloco: BlocoCabecalhoGrupo,
  transporteMeta: TransporteMetaMapa | undefined,
): string {
  return transporteMeta?.rota ?? bloco.linhas[0]?.transporteRota ?? '';
}

function resolverEmpresaCategoria(
  bloco: BlocoCabecalhoGrupo,
  itens: ItemComBreakdown[],
): { empresa: string; categoria: string } {
  if (bloco.empresa && bloco.categoria) {
    return { empresa: bloco.empresa, categoria: bloco.categoria };
  }

  const primeiro = itens[0];
  return {
    empresa: bloco.empresa ?? primeiro?.empresa ?? '',
    categoria: bloco.categoria ?? primeiro?.categoria ?? '',
  };
}

function somarBreakdown(
  itens: ItemComBreakdown[],
  itensEmpacotamento?: Array<{ caixasPorPalete?: number | null }>,
) {
  const itensPalete: ItemComBreakdownPalete[] = itens.map((item, index) => ({
    breakdown: item.breakdown,
    caixasPorPalete: itensEmpacotamento?.[index]?.caixasPorPalete,
  }));

  const totaisCaixasUnidades = itens.reduce(
    (acc, item) => {
      if (!item.breakdown) {
        return acc;
      }

      return {
        totalCaixas: acc.totalCaixas + item.breakdown.caixas,
        totalUnidades: acc.totalUnidades + item.breakdown.unidades,
      };
    },
    { totalCaixas: 0, totalUnidades: 0 },
  );

  return {
    totalPaletes: calcularTotalPaletesFisicos(itensPalete),
    totalCaixas: totaisCaixasUnidades.totalCaixas,
    totalUnidades: totaisCaixasUnidades.totalUnidades,
  };
}

export function montarCabecalhoGrupo(
  bloco: BlocoCabecalhoGrupo,
  itens: ItemComBreakdown[],
  nomeGrupo: string,
  transportesPorId: Map<string, TransporteMetaMapa>,
  itensEmpacotamento?: Array<{ caixasPorPalete?: number | null }>,
): GerarMapasResponse['grupos'][number]['cabecalho'] {
  const transportePrincipalId = bloco.linhas[0]?.transporteId ?? 'sem-transporte';
  const transporteMeta = transportesPorId.get(transportePrincipalId);
  const transporteRota = resolverTransporteRota(bloco, transporteMeta);
  const clientes = coletarClientesOrdem(bloco.linhas);
  const primeiro = clientes[0] ?? { cod: '', nome: '' };
  const { empresa, categoria } = resolverEmpresaCategoria(bloco, itens);
  const pesoTotal = itens.reduce((total, item) => total + (item.peso ?? 0), 0);
  const totais = somarBreakdown(itens, itensEmpacotamento);

  return {
    transporte: transporteRota,
    placa: transporteMeta?.placa ?? null,
    transportadora: transporteMeta?.transportadora ?? null,
    codPrimeiroCliente: primeiro.cod,
    primeiroCliente: primeiro.nome,
    codTodosClientes: clientes.map((c) => c.cod).join(SEPARADOR_CLIENTES),
    todosClientes: clientes.map((c) => c.nome).join(SEPARADOR_CLIENTES),
    pesoTotal,
    totalCaixas: totais.totalCaixas,
    totalUnidades: totais.totalUnidades,
    totalPaletes: totais.totalPaletes,
    nomeGrupo,
    quantidadeLinhas: itens.length,
    categoria,
    empresa,
    microUuid: gerarMicroUuidMapa(transporteRota),
  };
}

import type { DocaApi } from '@/features/docas/types/doca.api';
import type { MapaGrupoDisponivelApi, MapaResumoTransporteApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { RecursosSessaoFuncionarioApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import { criarConfigDistribuicaoPadrao } from '@/features/distribuicao-demandas/lib/config-distribuicao-padrao';
import {
  mapearEmpresaOperador,
  mapearFuncaoOperador,
  operadorElegivelPresenca,
} from '@/features/distribuicao-demandas/lib/mapear-funcao-operador';
import type {
  DistribuicaoDadosCarregados,
  Doca,
  MapaGrupoProcesso,
  MapaIndex,
  MapaSeparacao,
  Operador,
  PedidoMapa,
  PlanejamentoDistribuicaoCarregado,
  PrioridadeMapa,
  StatusTransporte,
  TransporteExpedicao,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';
import type {
  RemessaTransporteApiItem,
  TransporteApiItem,
} from '@/features/transporte/lib/expedicao-api';

type MapDistribuicaoExecucaoInput = {
  sessaoId?: string;
  transportes: TransporteApiItem[];
  transporteIds: string[];
  mapasSeparacao: MapaGrupoDisponivelApi[];
  mapasConferencia: MapaGrupoDisponivelApi[];
  mapasCarregamento: MapaGrupoDisponivelApi[];
  funcionarios: RecursosSessaoFuncionarioApi[];
  docas: DocaApi[];
};

function mapPrioridade(transporte: TransporteApiItem): PrioridadeMapa {
  if (!transporte.isPrioridade) return 'normal';
  switch (transporte.nivelPrioridade) {
    case 'urgente':
      return 'critica';
    case 'prioritaria':
      return 'alta';
    case 'baixa':
      return 'baixa';
    default:
      return 'normal';
  }
}

function mapStatusTransporte(status: TransporteApiItem['status']): StatusTransporte {
  switch (status) {
    case 'PENDENTE':
      return 'pendente';
    case 'ALOCADO':
      return 'em_distribuicao';
    case 'PARCIAL':
      return 'em_separacao';
    default:
      return 'pendente';
  }
}

function moda(values: string[]): string {
  if (values.length === 0) return '—';
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = values[0] ?? '—';
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function mapDoca(doca: DocaApi): Doca {
  return {
    id: doca.id,
    codigo: doca.codigo,
    transportadoraDedicada: null,
    ocupada: doca.situacao !== 'disponivel',
  };
}

function caixasFromRemessa(remessa: RemessaTransporteApiItem): number {
  let totalCaixas = 0;
  let temBreakdown = false;

  for (const item of remessa.itens) {
    if (item.breakdown) {
      temBreakdown = true;
      totalCaixas += item.breakdown.caixas;
      if (item.breakdown.paletes > 0 && item.caixasPorPalete) {
        totalCaixas += item.breakdown.paletes * item.caixasPorPalete;
      }
    }
  }

  if (temBreakdown) {
    return Math.max(1, totalCaixas);
  }

  return Math.max(1, Math.round(remessa.volume));
}

function mapRemessasToPedidos(remessas: RemessaTransporteApiItem[]): PedidoMapa[] {
  return remessas.map((remessa) => ({
    id: remessa.id,
    numero: remessa.remessa,
    cliente: remessa.cliente,
    pesoKg: remessa.peso,
    caixas: caixasFromRemessa(remessa),
    carros: 1,
    enderecos: [],
    skus: remessa.itens.length,
  }));
}

function empresasECategoriasDasRemessas(transporte: TransporteApiItem) {
  const empresas: string[] = [];
  const categorias: string[] = [];

  for (const remessa of transporte.remessas) {
    empresas.push(remessa.empresa);
    for (const item of remessa.itens) {
      if (item.empresa) empresas.push(item.empresa);
      if (item.categoria) categorias.push(item.categoria);
    }
  }

  return {
    empresas: empresas.filter(Boolean),
    categorias: [...new Set(categorias.filter(Boolean))],
  };
}

function mapMapasFromRemessas(
  transporte: TransporteApiItem,
  prioridade: PrioridadeMapa,
): MapaSeparacao[] {
  const pedidos = mapRemessasToPedidos(transporte.remessas);
  const { empresas, categorias } = empresasECategoriasDasRemessas(transporte);

  return [
    {
      id: `${transporte.id}-remessas`,
      mapaGrupoId: '',
      numero: transporte.rota,
      transportadora: transporte.transportadora ?? '—',
      empresa: moda(empresas),
      categoria: categorias[0] ?? '—',
      processo: 'separacao',
      prioridade,
      pesoTotalKg: transporte.pesoTotal,
      caixas: pedidos.reduce((s, p) => s + p.caixas, 0) || 1,
      carros: Math.max(1, transporte.quantidadeRemessas),
      totalSkus: pedidos.reduce((s, p) => s + p.skus, 0),
      docasSugeridas: [],
      status: 'pendente',
      pedidos,
      enderecosUnicos: [],
    },
  ];
}

function mapMapaSeparacao(
  mapa: MapaGrupoDisponivelApi,
  transporte: TransporteApiItem,
  prioridade: PrioridadeMapa,
): MapaSeparacao {
  const pedidos = mapRemessasToPedidos(transporte.remessas);
  const skus = pedidos.reduce((s, p) => s + p.skus, 0);

  return {
    id: mapa.id,
    mapaGrupoId: mapa.id,
    numero: mapa.microUuid.slice(0, 8).toUpperCase(),
    transportadora: transporte.transportadora ?? '—',
    empresa: mapa.empresa || '—',
    categoria: mapa.categoria || '—',
    processo: mapa.processo,
    prioridade,
    pesoTotalKg: mapa.pesoTotalKg,
    caixas: Math.max(1, mapa.totalCaixas || 0),
    carros: 1,
    totalSkus: skus,
    docasSugeridas: [],
    status: 'pendente',
    pedidos,
    enderecosUnicos: [],
  };
}

function mapMapasFromResumo(
  transporte: TransporteApiItem,
  resumo: MapaResumoTransporteApi,
  prioridade: PrioridadeMapa,
): MapaSeparacao[] {
  const caixasBase = Math.max(1, Math.floor(resumo.totalCaixas / resumo.totalMapas));
  const caixasResto = resumo.totalCaixas - caixasBase * resumo.totalMapas;
  const pesoBase = resumo.pesoTotalKg / resumo.totalMapas;

  return Array.from({ length: resumo.totalMapas }, (_, index) => ({
    id: `${transporte.id}-resumo-${index}`,
    mapaGrupoId: '',
    numero: `${transporte.rota}-${index + 1}`,
    transportadora: transporte.transportadora ?? '—',
    empresa: '—',
    categoria: '—',
    processo: 'separacao' as const,
    prioridade,
    pesoTotalKg: pesoBase,
    caixas: caixasBase + (index < caixasResto ? 1 : 0),
    carros: 1,
    totalSkus: 0,
    docasSugeridas: [],
    status: 'pendente' as const,
    pedidos: [],
    enderecosUnicos: [],
  }));
}

export function mapTransporteExpedicao(
  transporte: TransporteApiItem,
  mapasSep?: MapaGrupoDisponivelApi[],
  resumo?: MapaResumoTransporteApi,
): TransporteExpedicao {
  const prioridade = mapPrioridade(transporte);
  const temMapasDetalhados = mapasSep != null && mapasSep.length > 0;
  const temResumoMapas = resumo != null && resumo.totalMapas > 0;
  const mapas = temMapasDetalhados
    ? mapasSep.map((m) => mapMapaSeparacao(m, transporte, prioridade))
    : temResumoMapas
      ? mapMapasFromResumo(transporte, resumo, prioridade)
      : mapMapasFromRemessas(transporte, prioridade);

  const empresasMapa = mapas.map((m) => m.empresa).filter(Boolean);
  const { empresas: empresasRemessa } = empresasECategoriasDasRemessas(transporte);
  const empresas = empresasMapa.length > 0 ? empresasMapa : empresasRemessa;
  const categorias = [
    ...new Set(mapas.map((m) => m.categoria).filter((c) => c && c !== '—')),
  ];
  const empresaLabel =
    empresas.length > 1 && new Set(empresas).size > 1 ? 'Multi' : moda(empresas);

  const pedidos = mapRemessasToPedidos(transporte.remessas);
  const caixasRemessa = pedidos.reduce((s, p) => s + p.caixas, 0);
  const caixasMapas = mapas.reduce((s, m) => s + m.caixas, 0);
  const totalMapas = temResumoMapas
    ? resumo.totalMapas
    : temMapasDetalhados
      ? mapas.length
      : 0;
  const caixas = temResumoMapas
    ? resumo.totalCaixas
    : temMapasDetalhados
      ? caixasMapas
      : caixasRemessa;
  const temMapaGerado = temResumoMapas || temMapasDetalhados || transporte.mapaGeradoEm != null;

  return {
    id: transporte.id,
    codigo: transporte.rota,
    placa: transporte.placa ?? '—',
    transportadora: transporte.transportadora ?? '—',
    empresa: empresaLabel,
    categorias,
    prioridade,
    pesoTotalKg: temResumoMapas ? resumo.pesoTotalKg : transporte.pesoTotal,
    caixas: Math.max(1, caixas),
    totalPaletes: temResumoMapas ? resumo.totalPaletes : 0,
    carros: Math.max(1, transporte.quantidadeRemessas),
    totalMapas,
    totalSkus: mapas.reduce((s, m) => s + m.totalSkus, 0),
    docasSugeridas: [],
    status: mapStatusTransporte(transporte.status),
    mapas,
    horarioSaida: transporte.horarioExpectativaSaida ?? '—',
    temMapaGerado,
  };
}

function buildMapaIndex(
  transporteIds: Set<string>,
  mapasPorProcesso: Record<MapaGrupoProcesso, MapaGrupoDisponivelApi[]>,
): MapaIndex {
  const index: MapaIndex = {};

  for (const transporteId of transporteIds) {
    index[transporteId] = {
      separacao: [],
      conferencia: [],
      carregamento: [],
    };
  }

  for (const processo of ['separacao', 'conferencia', 'carregamento'] as const) {
    for (const mapa of mapasPorProcesso[processo]) {
      if (!index[mapa.transporteId]) {
        index[mapa.transporteId] = {
          separacao: [],
          conferencia: [],
          carregamento: [],
        };
      }
      index[mapa.transporteId]![processo].push(mapa.id);
    }
  }

  return index;
}

function mapOperador(funcionario: RecursosSessaoFuncionarioApi): Operador {
  const funcaoInterna = mapearFuncaoOperador(funcionario.cargo);
  const funcao =
    funcaoInterna === 'carregador' ? 'separador' : funcaoInterna;

  return {
    id: funcionario.id,
    sessaoFuncionarioId: funcionario.id,
    nome: funcionario.nome,
    cargo: funcionario.cargo,
    funcao,
    empresa: mapearEmpresaOperador(funcionario.cargo),
    statusPresenca: funcionario.statusPresenca,
    capacidadeKgH: 450,
    cargaAtualPercent: 0,
    produtividadeMedia: 85,
  };
}

export function mapPlanejamentoDistribuicao(input: {
  transportes: TransporteApiItem[];
  docas: DocaApi[];
  resumoPorTransporte?: Map<string, MapaResumoTransporteApi>;
}): PlanejamentoDistribuicaoCarregado {
  const docas = input.docas.map(mapDoca);
  const transportesPendentes = input.transportes
    .filter((t) => t.status === 'PENDENTE')
    .map((t) =>
      mapTransporteExpedicao(t, undefined, input.resumoPorTransporte?.get(t.id)),
    );

  return {
    transportes: transportesPendentes,
    docas,
    configInicial: criarConfigDistribuicaoPadrao(docas),
  };
}

export function mapDistribuicaoExecucao(
  input: MapDistribuicaoExecucaoInput,
): DistribuicaoDadosCarregados {
  const docas = input.docas.map(mapDoca);
  const idsSelecionados = new Set(input.transporteIds);
  const mapasPorTransporteSep = new Map<string, MapaGrupoDisponivelApi[]>();

  for (const mapa of input.mapasSeparacao) {
    if (!idsSelecionados.has(mapa.transporteId)) continue;
    const list = mapasPorTransporteSep.get(mapa.transporteId) ?? [];
    list.push(mapa);
    mapasPorTransporteSep.set(mapa.transporteId, list);
  }

  const transportes: TransporteExpedicao[] = [];

  for (const transporte of input.transportes) {
    if (!idsSelecionados.has(transporte.id)) continue;
    const mapasSep = mapasPorTransporteSep.get(transporte.id);
    transportes.push(
      mapTransporteExpedicao(transporte, mapasSep, undefined),
    );
  }

  const transporteIds = new Set(transportes.map((t) => t.id));
  const mapaIndex = buildMapaIndex(transporteIds, {
    separacao: input.mapasSeparacao.filter((m) => transporteIds.has(m.transporteId)),
    conferencia: input.mapasConferencia.filter((m) => transporteIds.has(m.transporteId)),
    carregamento: input.mapasCarregamento.filter((m) => transporteIds.has(m.transporteId)),
  });

  const elegiveis = input.funcionarios.filter((f) =>
    operadorElegivelPresenca(f.statusPresenca),
  );

  const operadoresCarregamento = elegiveis
    .filter((f) => mapearFuncaoOperador(f.cargo) === 'carregador')
    .map(mapOperador);

  const operadores = elegiveis
    .filter((f) => mapearFuncaoOperador(f.cargo) !== 'carregador')
    .map(mapOperador);

  return {
    sessaoId: input.sessaoId,
    transportes,
    docas,
    operadores,
    operadoresCarregamento,
    mapaIndex,
    configInicial: criarConfigDistribuicaoPadrao(docas),
  };
}

export function calcularResumoPlanejamento(
  transportes: TransporteExpedicao[],
  docas: Doca[],
) {
  const pendentes = transportes.filter((t) => t.status === 'pendente');

  const mapasPendentes = pendentes.flatMap((t) => t.mapas);

  return {
    mapasPendentes: mapasPendentes.length,
    pesoPendenteKg: pendentes.reduce((s, t) => s + t.pesoTotalKg, 0),
    totalVolumes: pendentes.reduce((s, t) => s + t.caixas, 0),
    totalCarros: pendentes.reduce((s, t) => s + t.carros, 0),
    docasOcupadas: docas.filter((d) => d.ocupada).length,
    docasTotal: docas.length,
    transportesAguardando: pendentes.length,
  };
}

/** @deprecated Use mapPlanejamentoDistribuicao ou mapDistribuicaoExecucao */
export function mapDistribuicaoData(
  input: MapDistribuicaoExecucaoInput & { sessaoId: string },
): DistribuicaoDadosCarregados {
  return mapDistribuicaoExecucao({
    ...input,
    transporteIds: input.transportes.map((t) => t.id),
  });
}

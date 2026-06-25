import type {
  ConfigDistribuicao,
  Doca,
  MapaSeparacao,
  Operador,
  PedidoMapa,
  ResumoPlanejamento,
  TransporteExpedicao,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

const ENDERECOS = [
  'A-01-02-03',
  'A-02-04-01',
  'B-03-01-05',
  'B-05-02-08',
  'C-01-03-02',
  'C-04-01-07',
  'D-02-05-04',
  'D-06-03-01',
  'E-01-01-09',
  'E-03-04-02',
  'F-02-02-06',
  'F-05-01-03',
  'G-01-05-01',
  'G-04-02-04',
  'H-03-03-05',
];

function criarPedidos(
  prefixo: string,
  quantidade: number,
  basePeso: number,
): PedidoMapa[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const idx = (i * 3) % ENDERECOS.length;
    const enderecos = [
      ENDERECOS[idx]!,
      ENDERECOS[(idx + 2) % ENDERECOS.length]!,
    ].filter((v, j, a) => a.indexOf(v) === j);

    return {
      id: `${prefixo}-ped-${i + 1}`,
      numero: `PED-${prefixo}-${String(i + 1).padStart(4, '0')}`,
      cliente: `Cliente ${String.fromCharCode(65 + (i % 26))} ${1000 + i}`,
      pesoKg: Math.round(basePeso + i * 12.5 + (i % 3) * 8),
      caixas: 2 + (i % 5),
      carros: 1 + (i % 2),
      enderecos,
      skus: 3 + (i % 7),
    };
  });
}

function agregarMapa(
  id: string,
  numero: string,
  transportadora: string,
  empresa: string,
  prioridade: MapaSeparacao['prioridade'],
  pedidos: PedidoMapa[],
  docasSugeridas: string[],
  status: MapaSeparacao['status'] = 'pendente',
): MapaSeparacao {
  const enderecosUnicos = [
    ...new Set(pedidos.flatMap((p) => p.enderecos)),
  ];

  return {
    id,
    mapaGrupoId: id,
    numero,
    transportadora,
    empresa,
    categoria: 'Geral',
    processo: 'separacao' as const,
    prioridade,
    pesoTotalKg: pedidos.reduce((s, p) => s + p.pesoKg, 0),
    caixas: pedidos.reduce((s, p) => s + p.caixas, 0),
    carros: pedidos.reduce((s, p) => s + p.carros, 0),
    totalSkus: pedidos.reduce((s, p) => s + p.skus, 0),
    docasSugeridas,
    status,
    pedidos,
    enderecosUnicos,
  };
}

export const MOCK_DOCAS: Doca[] = [
  { id: 'doca-01', codigo: 'D01', transportadoraDedicada: 'TransLog Norte', ocupada: true },
  { id: 'doca-02', codigo: 'D02', transportadoraDedicada: 'TransLog Norte', ocupada: false },
  { id: 'doca-03', codigo: 'D03', transportadoraDedicada: null, ocupada: true },
  { id: 'doca-04', codigo: 'D04', transportadoraDedicada: null, ocupada: false },
  { id: 'doca-05', codigo: 'D05', transportadoraDedicada: 'Rota Express', ocupada: true },
  { id: 'doca-06', codigo: 'D06', transportadoraDedicada: 'Rota Express', ocupada: false },
  { id: 'doca-07', codigo: 'D07', transportadoraDedicada: 'Cargo Sul', ocupada: true },
  { id: 'doca-08', codigo: 'D08', transportadoraDedicada: null, ocupada: false },
];

export const MOCK_OPERADORES: Operador[] = [
  {
    id: 'op-001',
    sessaoFuncionarioId: 'op-001',
    nome: 'João Silva',
    cargo: 'Separador - LogFlex',
    funcao: 'separador',
    empresa: 'LogFlex',
    statusPresenca: 'presente',
    capacidadeKgH: 420,
    cargaAtualPercent: 35,
    produtividadeMedia: 92,
  },
  {
    id: 'op-002',
    sessaoFuncionarioId: 'op-002',
    nome: 'Carlos Mendes',
    cargo: 'Separador - LogFlex',
    funcao: 'separador',
    empresa: 'LogFlex',
    statusPresenca: 'presente',
    capacidadeKgH: 380,
    cargaAtualPercent: 60,
    produtividadeMedia: 88,
  },
  {
    id: 'op-003',
    sessaoFuncionarioId: 'op-003',
    nome: 'Maria Oliveira',
    cargo: 'Conferente - LogFlex',
    funcao: 'conferente',
    empresa: 'LogFlex',
    statusPresenca: 'presente',
    capacidadeKgH: 500,
    cargaAtualPercent: 45,
    produtividadeMedia: 95,
  },
  {
    id: 'op-004',
    sessaoFuncionarioId: 'op-004',
    nome: 'Lucas Ferreira',
    cargo: 'Separador - SeparaMax',
    funcao: 'separador',
    empresa: 'SeparaMax',
    statusPresenca: 'presente',
    capacidadeKgH: 400,
    cargaAtualPercent: 20,
    produtividadeMedia: 90,
  },
  {
    id: 'op-005',
    sessaoFuncionarioId: 'op-005',
    nome: 'Pedro Santos',
    cargo: 'Conferente - SeparaMax',
    funcao: 'conferente',
    empresa: 'SeparaMax',
    statusPresenca: 'presente',
    capacidadeKgH: 480,
    cargaAtualPercent: 55,
    produtividadeMedia: 91,
  },
  {
    id: 'op-006',
    sessaoFuncionarioId: 'op-006',
    nome: 'Ana Costa',
    cargo: 'Separador - SeparaMax',
    funcao: 'separador',
    empresa: 'SeparaMax',
    statusPresenca: 'presente',
    capacidadeKgH: 360,
    cargaAtualPercent: 70,
    produtividadeMedia: 85,
  },
  {
    id: 'op-007',
    sessaoFuncionarioId: 'op-007',
    nome: 'Rafael Lima',
    cargo: 'Separador - OperLog',
    funcao: 'separador',
    empresa: 'OperLog',
    statusPresenca: 'presente',
    capacidadeKgH: 410,
    cargaAtualPercent: 15,
    produtividadeMedia: 93,
  },
  {
    id: 'op-008',
    sessaoFuncionarioId: 'op-008',
    nome: 'Fernanda Rocha',
    cargo: 'Conferente - OperLog',
    funcao: 'conferente',
    empresa: 'OperLog',
    statusPresenca: 'presente',
    capacidadeKgH: 490,
    cargaAtualPercent: 30,
    produtividadeMedia: 94,
  },
  {
    id: 'op-009',
    sessaoFuncionarioId: 'op-009',
    nome: 'Bruno Alves',
    cargo: 'Separador - OperLog',
    funcao: 'separador',
    empresa: 'OperLog',
    statusPresenca: 'presente',
    capacidadeKgH: 395,
    cargaAtualPercent: 40,
    produtividadeMedia: 87,
  },
  {
    id: 'op-010',
    sessaoFuncionarioId: 'op-010',
    nome: 'Juliana Prado',
    cargo: 'Conferente - LogFlex',
    funcao: 'conferente',
    empresa: 'LogFlex',
    statusPresenca: 'presente',
    capacidadeKgH: 470,
    cargaAtualPercent: 25,
    produtividadeMedia: 96,
  },
];

export const MOCK_MAPAS: MapaSeparacao[] = [
  agregarMapa(
    'mapa-2031',
    'MAPA-2031',
    'TransLog Norte',
    'LogFlex',
    'critica',
    criarPedidos('2031', 6, 85),
    ['D01', 'D02'],
  ),
  agregarMapa(
    'mapa-2032',
    'MAPA-2032',
    'Rota Express',
    'SeparaMax',
    'alta',
    criarPedidos('2032', 5, 72),
    ['D05', 'D06'],
  ),
  agregarMapa(
    'mapa-2033',
    'MAPA-2033',
    'Cargo Sul',
    'OperLog',
    'alta',
    criarPedidos('2033', 4, 95),
    ['D07'],
  ),
  agregarMapa(
    'mapa-2034',
    'MAPA-2034',
    'TransLog Norte',
    'SeparaMax',
    'normal',
    criarPedidos('2034', 7, 60),
    ['D02', 'D03'],
  ),
  agregarMapa(
    'mapa-2035',
    'MAPA-2035',
    'Rota Express',
    'LogFlex',
    'critica',
    criarPedidos('2035', 8, 55),
    ['D05', 'D04'],
  ),
  agregarMapa(
    'mapa-2036',
    'MAPA-2036',
    'Cargo Sul',
    'LogFlex',
    'normal',
    criarPedidos('2036', 3, 110),
    ['D07', 'D08'],
  ),
  agregarMapa(
    'mapa-2037',
    'MAPA-2037',
    'TransLog Norte',
    'OperLog',
    'alta',
    criarPedidos('2037', 5, 78),
    ['D01'],
  ),
  agregarMapa(
    'mapa-2038',
    'MAPA-2038',
    'Rota Express',
    'OperLog',
    'normal',
    criarPedidos('2038', 6, 65),
    ['D06', 'D08'],
  ),
  agregarMapa(
    'mapa-2039',
    'MAPA-2039',
    'Cargo Sul',
    'SeparaMax',
    'baixa',
    criarPedidos('2039', 4, 88),
    ['D07'],
  ),
  agregarMapa(
    'mapa-2040',
    'MAPA-2040',
    'TransLog Norte',
    'LogFlex',
    'alta',
    criarPedidos('2040', 5, 70),
    ['D01', 'D03'],
    'em_distribuicao',
  ),
  agregarMapa(
    'mapa-2041',
    'MAPA-2041',
    'Rota Express',
    'SeparaMax',
    'normal',
    criarPedidos('2041', 3, 100),
    ['D05'],
  ),
  agregarMapa(
    'mapa-2042',
    'MAPA-2042',
    'Cargo Sul',
    'OperLog',
    'critica',
    criarPedidos('2042', 7, 58),
    ['D07', 'D08'],
  ),
  agregarMapa(
    'mapa-2043',
    'MAPA-2043',
    'TransLog Norte',
    'SeparaMax',
    'normal',
    criarPedidos('2043', 4, 82),
    ['D02'],
  ),
];

function agregarTransporte(
  id: string,
  codigo: string,
  placa: string,
  transportadora: string,
  empresa: string,
  prioridade: TransporteExpedicao['prioridade'],
  mapas: MapaSeparacao[],
  horarioSaida: string,
  status: TransporteExpedicao['status'] = 'pendente',
): TransporteExpedicao {
  const docasSugeridas = [
    ...new Set(mapas.flatMap((m) => m.docasSugeridas)),
  ];

  return {
    id,
    codigo,
    placa,
    transportadora,
    empresa,
    categorias: [...new Set(mapas.map((m) => m.categoria))],
    prioridade,
    pesoTotalKg: mapas.reduce((s, m) => s + m.pesoTotalKg, 0),
    caixas: mapas.reduce((s, m) => s + m.caixas, 0),
    totalPaletes: 0,
    carros: mapas.reduce((s, m) => s + m.carros, 0),
    totalMapas: mapas.length,
    totalSkus: mapas.reduce((s, m) => s + m.totalSkus, 0),
    docasSugeridas,
    status,
    mapas,
    horarioSaida,
    temMapaGerado: mapas.length > 0,
  };
}

function mapasPorIds(ids: string[]): MapaSeparacao[] {
  return ids
    .map((id) => MOCK_MAPAS.find((m) => m.id === id))
    .filter((m): m is MapaSeparacao => Boolean(m));
}

export const MOCK_TRANSPORTES: TransporteExpedicao[] = [
  agregarTransporte(
    'tr-001',
    'TR-8842',
    'ABC-1D23',
    'TransLog Norte',
    'LogFlex',
    'critica',
    mapasPorIds(['mapa-2031', 'mapa-2034', 'mapa-2037', 'mapa-2043']),
    '03:15',
  ),
  agregarTransporte(
    'tr-002',
    'TR-7710',
    'DEF-4E56',
    'Rota Express',
    'SeparaMax',
    'alta',
    mapasPorIds(['mapa-2032', 'mapa-2035', 'mapa-2038', 'mapa-2041']),
    '03:00',
  ),
  agregarTransporte(
    'tr-003',
    'TR-6621',
    'GHI-7F89',
    'Cargo Sul',
    'OperLog',
    'alta',
    mapasPorIds(['mapa-2033', 'mapa-2036', 'mapa-2039', 'mapa-2042']),
    '03:30',
  ),
  agregarTransporte(
    'tr-004',
    'TR-5590',
    'JKL-8G01',
    'TransLog Norte',
    'LogFlex',
    'normal',
    mapasPorIds(['mapa-2040']),
    '04:00',
    'em_distribuicao',
  ),
  agregarTransporte(
    'tr-005',
    'TR-4488',
    'MNO-9H12',
    'Rota Express',
    'LogFlex',
    'critica',
    mapasPorIds([]),
    '02:45',
    'distribuido',
  ),
];

export const CONFIG_DISTRIBUICAO_PADRAO: ConfigDistribuicao = {
  qtdDocas: 3,
  qtdFuncionarios: 8,
  usarDocasDedicadas: true,
  docasSelecionadasIds: ['doca-01', 'doca-03', 'doca-05'],
  regrasPorTransportadora: [
    {
      transportadora: 'TransLog Norte',
      docaDedicadaId: 'doca-01',
      maxSeparadores: 4,
    },
    {
      transportadora: 'Rota Express',
      docaDedicadaId: 'doca-05',
      maxSeparadores: 3,
    },
    {
      transportadora: 'Cargo Sul',
      docaDedicadaId: 'doca-07',
      maxSeparadores: 4,
    },
  ],
  maxSeparadoresPorWorkload: 4,
  estrategia: 'score_composto',
};

export function calcularResumoPlanejamento(
  transportes: TransporteExpedicao[],
  docas: Doca[],
): ResumoPlanejamento {
  const pendentes = transportes.filter(
    (t) => t.status === 'pendente' || t.status === 'em_distribuicao',
  );

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

export function buscarTransportePorId(
  transporteId: string,
): TransporteExpedicao | undefined {
  return MOCK_TRANSPORTES.find((t) => t.id === transporteId);
}

export function listarTransportesPendentes(): TransporteExpedicao[] {
  return MOCK_TRANSPORTES.filter(
    (t) => t.status === 'pendente' || t.status === 'em_distribuicao',
  ).filter((t) => t.mapas.length > 0);
}

export function buscarMapaPorId(mapaId: string): MapaSeparacao | undefined {
  return MOCK_MAPAS.find((m) => m.id === mapaId);
}

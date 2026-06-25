import type {
  DivergenciaItem,
  InventarioDetalheHeader,
  InventarioDetalheMetricas,
  MembroProdutividade,
  SetorProgresso,
} from '@/features/inventario/types/inventario-detalhe.schema';

export const MOCK_INVENTARIO_DETALHE_HEADER: InventarioDetalheHeader = {
  codigo: 'INV-2023-085',
  statusLabel: 'Em progresso',
  tempoDecorridoLabel: 'Iniciado há 4h 22m',
};

export const MOCK_INVENTARIO_METRICAS: InventarioDetalheMetricas = {
  progressoPercent: 68,
  itensContados: 1452,
  itensTotal: 2135,
  acuraciaPercent: 99.2,
  metaDeltaLabel: '+1,2% vs meta',
  divergenciasCount: 14,
  impactoFinanceiroLabel: '-R$ 1.240,00',
};

export const MOCK_SETORES_PROGRESSO: SetorProgresso[] = [
  {
    id: 's1',
    nome: 'Câmara Fria',
    iconName: 'snow',
    statusLabel: 'Concluído',
    statusTone: 'accent',
    progressPercent: 100,
    skuContados: 450,
    skuTotal: 450,
    acuraciaLabel: '100%',
    opaco: false,
  },
  {
    id: 's2',
    nome: 'Corredor A',
    iconName: 'grid',
    statusLabel: '75% · Contando',
    statusTone: 'primary',
    progressPercent: 75,
    skuContados: 820,
    skuTotal: 1090,
    acuraciaLabel: '98,4%',
    opaco: false,
  },
  {
    id: 's3',
    nome: 'Mezanino',
    iconName: 'layers',
    statusLabel: 'Aguardando',
    statusTone: 'muted',
    progressPercent: 5,
    skuContados: 0,
    skuTotal: 595,
    acuraciaLabel: null,
    opaco: true,
  },
];

export const MOCK_MEMBROS_PRODUTIVIDADE: MembroProdutividade[] = [
  {
    id: 'm1',
    nome: 'Ricardo Silva',
    papel: 'Líder Setor A',
    itensCount: 542,
    segundosPorItem: 12,
    tone: 'primary',
  },
  {
    id: 'm2',
    nome: 'Beatriz Costa',
    papel: 'Operador Sênior',
    itensCount: 489,
    segundosPorItem: 14,
    tone: 'secondary',
  },
  {
    id: 'm3',
    nome: 'Felipe Rocha',
    papel: 'Operador Jr',
    itensCount: 421,
    segundosPorItem: 18,
    tone: 'accent',
  },
];

export const MOCK_DIVERGENCIAS: DivergenciaItem[] = [
  {
    id: 'dv1',
    sku: '#44921-X',
    produtoNome: 'Leite Integral 1L - Nestlé',
    setor: 'Corredor A',
    esperadoLabel: '120 un',
    encontradoLabel: '112 un',
    diferencaLabel: '-8 un',
    tipo: 'falta',
  },
  {
    id: 'dv2',
    sku: '#99201-B',
    produtoNome: 'Café Gourmet 500g',
    setor: 'Corredor A',
    esperadoLabel: '45 un',
    encontradoLabel: '48 un',
    diferencaLabel: '+3 un',
    tipo: 'sobra',
  },
  {
    id: 'dv3',
    sku: '#12093-Y',
    produtoNome: 'Iogurte Grego Tradicional',
    setor: 'Câmara Fria',
    esperadoLabel: '60 un',
    encontradoLabel: '57 un',
    diferencaLabel: '-3 un',
    tipo: 'falta',
  },
];

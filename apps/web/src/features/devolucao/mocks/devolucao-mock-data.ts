import type {
  ConferenceItem,
  DemandaDetalhe,
  Evidence,
  TimelineStep,
} from '@/features/devolucao/types/devolucao-detalhes.schema';
import type {
  DemandaItem,
  DockSlot,
  GestaoStats,
  OperatorLeaderboard,
} from '@/features/devolucao/types/devolucao-gestao.schema';
import type {
  DockOption,
  NfRow,
  OutraViagem,
  TripInfo,
} from '@/features/devolucao/types/devolucao-checkin.schema';

export const MOCK_GESTAO_STATS: GestaoStats = {
  demandasAtivas: 42,
  demandasTotal: 128,
  tempoMedioMinutos: 48,
  tempoMedioSegundos: 32,
  ocupacaoDocasPercent: 85,
  docasOcupadas: 17,
  docasTotal: 20,
  veiculosAtrasados: 3,
  mediaGiroDoca: 2.4,
};

export const MOCK_DEMANDAS: DemandaItem[] = [
  {
    id: 'd-01',
    doca: 'D-01',
    veiculo: 'Volvo FH 540',
    placa: 'BRA-2E19',
    motorista: 'Ricardo Mendes',
    tipo: 'carga',
    progresso: 75,
    previsao: '14:45',
    status: 'em-progresso',
  },
  {
    id: 'd-04',
    doca: 'D-04',
    veiculo: 'Scania R 450',
    placa: 'LUX-4J11',
    motorista: 'João Silveira',
    tipo: 'descarga',
    progresso: 22,
    previsao: '14:10',
    status: 'atrasado',
  },
  {
    id: 'd-08',
    doca: 'D-08',
    veiculo: 'Mercedes Actros',
    placa: 'FLX-9K23',
    motorista: 'Marcos Dutra',
    tipo: 'carga',
    progresso: 100,
    previsao: '13:55',
    status: 'finalizado',
  },
  {
    id: 'd-12',
    doca: 'D-12',
    veiculo: 'Iveco Hi-Way',
    placa: 'MTR-1W88',
    motorista: 'Ana Paula L.',
    tipo: 'carga',
    progresso: 0,
    previsao: '15:30',
    status: 'aguardando-chegada',
  },
  {
    id: 'd-16',
    doca: '—',
    veiculo: 'MAN TGX',
    placa: 'RIO-7P44',
    motorista: 'Fernanda Rocha',
    tipo: 'descarga',
    progresso: 0,
    previsao: '16:00',
    status: 'aguardando-chegada',
  },
  {
    id: 'd-15',
    doca: 'D-15',
    veiculo: 'DAF XF',
    placa: 'TRK-8X77',
    motorista: 'Gilberto Costa',
    tipo: 'descarga',
    progresso: 45,
    previsao: '15:15',
    status: 'em-progresso',
  },
];

export const MOCK_DOCK_SLOTS: DockSlot[] = [
  { numero: 1, status: 'ativa' },
  { numero: 2, status: 'ativa' },
  { numero: 3, status: 'critica' },
  { numero: 4, status: 'ativa' },
  { numero: 5, status: 'livre' },
  { numero: 6, status: 'ativa' },
  { numero: 7, status: 'livre' },
  { numero: 8, status: 'finalizada' },
  { numero: 9, status: 'ativa' },
  { numero: 10, status: 'ativa' },
  { numero: 11, status: 'ativa' },
  { numero: 12, status: 'ativa' },
  { numero: 13, status: 'livre' },
  { numero: 14, status: 'ativa' },
  { numero: 15, status: 'ativa' },
  { numero: 16, status: 'ativa' },
  { numero: 17, status: 'ativa' },
  { numero: 18, status: 'ativa' },
  { numero: 19, status: 'ativa' },
  { numero: 20, status: 'ativa' },
];

export const MOCK_OPERATORS: OperatorLeaderboard[] = [
  {
    id: 'op-1',
    nome: 'Carlos Eduardo',
    movimentacoesPorHora: 14,
    eficiencia: 98,
    rank: 1,
  },
  {
    id: 'op-2',
    nome: 'Beatriz Gomes',
    movimentacoesPorHora: 12,
    eficiencia: 94,
    rank: 2,
  },
  {
    id: 'op-3',
    nome: 'Luís Fernando',
    movimentacoesPorHora: 11,
    eficiencia: 91,
    rank: 3,
  },
];

export const MOCK_DEMANDA_DETALHE: DemandaDetalhe = {
  id: 'd-01',
  placa: 'BRA-2E19',
  motorista: 'Marcos Oliveira',
  viagemId: '#TRP-88421',
  status: 'em-conferencia',
  totalItens: 1240,
  totalItensEsperado: 1400,
  temperaturaBau: -14.2,
  temperaturaBauAlvo: -18,
  temperaturaProduto: -16.8,
  temperaturaProdutoAlvo: -18,
  inicioOperacao: '08:45 AM',
  duracao: '01h 12m',
  estimativaTermino: '10:30 AM',
  eficiencia: 94,
};

export const MOCK_CONFERENCE_ITEMS: ConferenceItem[] = [
  {
    id: 'ci-1',
    sku: '440912-A',
    produto: 'Frango Congelado (Corte)',
    previsto: 500,
    confirmado: 500,
    status: 'concluido',
  },
  {
    id: 'ci-2',
    sku: '220198-B',
    produto: 'Lâmina Suína Especial',
    previsto: 400,
    confirmado: 342,
    status: 'pendente',
  },
  {
    id: 'ci-3',
    sku: '991004-C',
    produto: 'Mix de Legumes (400g)',
    previsto: 250,
    confirmado: 238,
    status: 'divergente',
  },
  {
    id: 'ci-4',
    sku: '110443-X',
    produto: 'Peito de Peru Defumado',
    previsto: 150,
    confirmado: 150,
    status: 'concluido',
  },
  {
    id: 'ci-5',
    sku: '330776-Y',
    produto: 'Queijo Prato Fatiado',
    previsto: 100,
    confirmado: 10,
    status: 'iniciando',
  },
];

export const MOCK_TIMELINE: TimelineStep[] = [
  {
    id: 'tl-1',
    titulo: 'Chegada no Pátio',
    descricao: '08:15 AM - Reconhecimento automático',
    status: 'completed',
  },
  {
    id: 'tl-2',
    titulo: 'Alocação na Doca 04',
    descricao: '08:30 AM - Autorizado por Sistema',
    status: 'completed',
  },
  {
    id: 'tl-3',
    titulo: 'Início da Conferência',
    descricao: '08:45 AM - Op: Marcos Oliveira',
    status: 'completed',
  },
  {
    id: 'tl-4',
    titulo: 'Verificação de Temperatura',
    descricao: 'Em progresso... 75% concluído',
    status: 'active',
    progressoPercent: 75,
  },
  {
    id: 'tl-5',
    titulo: 'Liberação e Saída',
    descricao: 'Previsão: 10:45 AM',
    status: 'future',
  },
];

export const MOCK_EVIDENCES: Evidence[] = [
  {
    id: 'ev-1',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
    alt: 'Estado da carga no compartimento',
    isPlaceholder: false,
  },
  {
    id: 'ev-2',
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400',
    alt: 'Verificação de lacre',
    isPlaceholder: false,
  },
  {
    id: 'ev-3',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400',
    alt: 'Medição de temperatura',
    isPlaceholder: false,
  },
  {
    id: 'ev-4',
    alt: 'Anexar nova evidência',
    isPlaceholder: true,
  },
];

export const MOCK_TRIP_INFO: TripInfo = {
  motorista: 'Ricardo Alcantara Salles',
  placa: 'ABC-1234',
  transportadora: 'LogiTrans Express',
  viagemRavexId: '#RVX-2023-99812',
};

export function getDemandaDetalheById(id: string): DemandaDetalhe {
  return { ...MOCK_DEMANDA_DETALHE, id };
}

export function getDemandaById(id: string): DemandaItem | undefined {
  return MOCK_DEMANDAS.find((d) => d.id === id);
}

export function getTripInfoByDemandaId(id: string): TripInfo {
  const demanda = getDemandaById(id);
  if (!demanda) return MOCK_TRIP_INFO;

  return {
    motorista: demanda.motorista,
    placa: demanda.placa,
    transportadora: 'LogiTrans Express',
    viagemRavexId: `#RVX-2023-${demanda.id.replace('d-', '').padStart(5, '0')}`,
  };
}

export const MOCK_DOCK_OPTIONS: DockOption[] = [
  { id: '', label: 'Selecione uma doca...' },
  { id: 'd-04', label: 'Doca 04 (Leste)' },
  { id: 'd-05', label: 'Doca 05 (Leste)' },
  { id: 'd-08', label: 'Doca 08 (Norte - Frio)' },
];

export const MOCK_NFS: NfRow[] = [
  {
    id: 'nf-1',
    numero: '001.244.592',
    cliente: 'Supermercados BH - Loja 42',
    tipoDevolucao: 'parcial',
    itensValidados: 4,
    itensTotal: 6,
    qtdDevolvida: 4,
    motivo: 'Avaria no transporte',
    valorTotal: 4250,
    status: 'parcial',
    divergenciaCritica: false,
    itens: [
      {
        id: 'nfi-1',
        sku: 'PHN-00200',
        produto: 'Smartphone X-200',
        qtdNf: 10,
        qtdDevolucao: 10,
        qtdConferida: 10,
        motivo: 'Avaria no Transporte',
        status: 'validado',
      },
      {
        id: 'nfi-2',
        sku: 'ACC-00120',
        produto: 'Cabo USB-C 2m',
        qtdNf: 50,
        qtdDevolucao: 48,
        qtdConferida: 48,
        motivo: 'Recusa Cliente',
        status: 'divergente',
      },
    ],
  },
  {
    id: 'nf-2',
    numero: '001.244.601',
    cliente: 'Distribuidora Minas Gerais Ltda',
    tipoDevolucao: 'total',
    itensValidados: 12,
    itensTotal: 12,
    qtdDevolvida: 12,
    motivo: 'Erro de pedido',
    valorTotal: 12890.45,
    status: 'validado',
    divergenciaCritica: false,
    itens: [],
  },
  {
    id: 'nf-3',
    numero: '001.244.615',
    cliente: 'Posto Shell - Conveniência',
    tipoDevolucao: 'parcial',
    itensValidados: 0,
    itensTotal: 2,
    qtdDevolvida: 0,
    motivo: 'Recusa Cliente',
    valorTotal: 312.1,
    status: 'divergente',
    divergenciaCritica: true,
    mensagemDivergencia:
      '2 itens com falta de retorno reportada pelo motorista.',
    itens: [],
  },
];

export const MOCK_NF_VALIDATION_ITEMS = [
  {
    id: 'nfv-1',
    sku: '44582',
    produto: 'Óleo de Motor Sintético 5W30 1L',
    gtin: '789123456789',
    qtdNf: 24,
    qtdDevolucao: 12,
    qtdConferida: 12,
    motivo: 'Avaria no transporte',
    status: 'validado' as const,
  },
  {
    id: 'nfv-2',
    sku: '44901',
    produto: 'Filtro de Ar Premium X-Flow',
    gtin: '789987654321',
    qtdNf: 5,
    qtdDevolucao: 2,
    qtdConferida: 0,
    motivo: 'Produto não retornado',
    status: 'pendente' as const,
  },
];

export const MOCK_OUTRAS_VIAGENS: OutraViagem[] = [
  {
    id: 'vx-77401',
    viagemRavexId: '#RVX-2023-77401',
    placa: 'SPZ-9K21',
    motorista: 'Carlos Eduardo',
    transportadora: 'TransCargo Sul',
    data: '23 Out 2023',
    nfs: [
      {
        id: 'ext-nf-1',
        numero: '001.238.110',
        cliente: 'Atacadão Central — Filial 08',
        tipoDevolucao: 'parcial',
        itensValidados: 0,
        itensTotal: 4,
        qtdDevolvida: 0,
        motivo: 'Erro de pedido',
        valorTotal: 2890.5,
        status: 'pendente',
        divergenciaCritica: false,
        itens: [
          {
            id: 'ext-nfi-1',
            sku: 'BEB-00441',
            produto: 'Refrigerante 2L (pack)',
            qtdNf: 24,
            qtdDevolucao: 12,
            qtdConferida: 0,
            motivo: 'Erro de pedido',
            status: 'pendente',
          },
        ],
      },
      {
        id: 'ext-nf-2',
        numero: '001.238.118',
        cliente: 'Mercado Bom Preço',
        tipoDevolucao: 'total',
        itensValidados: 0,
        itensTotal: 8,
        qtdDevolvida: 0,
        motivo: 'Avaria no transporte',
        valorTotal: 5420,
        status: 'pendente',
        divergenciaCritica: false,
        itens: [],
      },
    ],
  },
  {
    id: 'vx-88102',
    viagemRavexId: '#RVX-2023-88102',
    placa: 'CUR-3M55',
    motorista: 'Beatriz Gomes',
    transportadora: 'LogiTrans Express',
    data: '22 Out 2023',
    nfs: [
      {
        id: 'ext-nf-3',
        numero: '001.231.902',
        cliente: 'Farmácia Popular — Unidade Centro',
        tipoDevolucao: 'parcial',
        itensValidados: 0,
        itensTotal: 3,
        qtdDevolvida: 0,
        motivo: 'Vencimento próximo',
        valorTotal: 890.75,
        status: 'pendente',
        divergenciaCritica: false,
        itens: [],
      },
    ],
  },
  {
    id: 'vx-90233',
    viagemRavexId: '#RVX-2023-90233',
    placa: 'BHZ-1L77',
    motorista: 'Luís Fernando',
    transportadora: 'RodoFrete MG',
    data: '21 Out 2023',
    nfs: [
      {
        id: 'ext-nf-4',
        numero: '001.229.445',
        cliente: 'Rede Extra — Loja 15',
        tipoDevolucao: 'parcial',
        itensValidados: 0,
        itensTotal: 5,
        qtdDevolvida: 0,
        motivo: 'Recusa Cliente',
        valorTotal: 3150,
        status: 'pendente',
        divergenciaCritica: false,
        itens: [],
      },
      {
        id: 'ext-nf-5',
        numero: '001.229.451',
        cliente: 'Padaria Pão Quente',
        tipoDevolucao: 'total',
        itensValidados: 0,
        itensTotal: 2,
        qtdDevolvida: 0,
        motivo: 'Produto não retornado',
        valorTotal: 420,
        status: 'pendente',
        divergenciaCritica: false,
        itens: [],
      },
    ],
  },
];

export function getOutrasViagensDisponiveis(
  demandId: string,
  nfsVinculadas: readonly NfRow[],
): OutraViagem[] {
  const viagemAtual = getTripInfoByDemandaId(demandId).viagemRavexId;
  const numerosJaVinculados = new Set(nfsVinculadas.map((nf) => nf.numero));

  return MOCK_OUTRAS_VIAGENS.map((viagem) => ({
    ...viagem,
    nfs: viagem.nfs.filter((nf) => !numerosJaVinculados.has(nf.numero)),
  })).filter(
    (viagem) =>
      viagem.viagemRavexId !== viagemAtual && viagem.nfs.length > 0,
  );
}

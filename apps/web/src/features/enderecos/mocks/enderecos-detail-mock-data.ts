import type {
  ChangeLogItem,
  EnderecoConfiguracaoFormValues,
  LabelPreview,
} from '@/features/enderecos/types/enderecos-configuracao.schema';
import type {
  AlertaCritico,
  HeatCell,
  RuaMetricas,
} from '@/features/enderecos/types/enderecos-mapa-calor.schema';
import type {
  ImpressaoResumo,
  LoteEnderecoItem,
} from '@/features/enderecos/types/enderecos-impressao-etiqueta.schema';

export const MOCK_CONFIGURACAO_DEFAULT: EnderecoConfiguracaoFormValues = {
  enderecoMascarado: 'A 004 0001 05',
  zona: 'A',
  rua: '004',
  posicao: '0001',
  nivel: '05',
  tipo: 'picking',
  tipoEstrutura: 'porta-palete',
  larguraMm: 1200,
  alturaMm: 1500,
  profundidadeMm: 1000,
  cargaMaxKg: 1500,
  vinculoSkuFixo: true,
  regraLoteUnico: false,
  permiteMisturaValidade: false,
  permiteFracionado: false,
  curvaAbc: 'A',
};

export const CENTRO_OPCOES = [
  { value: 'WMS-ALPHA-01', label: 'WMS-ALPHA-01 (São Paulo)' },
  { value: 'WMS-BETA-02', label: 'WMS-BETA-02 (Curitiba)' },
  { value: 'WMS-GAMMA-03', label: 'WMS-GAMMA-03 (Recife)' },
] as const;

export const TIPO_ESTRUTURA_OPCOES = [
  { value: 'porta-palete', label: 'Porta-Palete Convencional' },
  { value: 'drive-in', label: 'Drive-In' },
  { value: 'estante-dinamica', label: 'Estante Dinâmica' },
  { value: 'flow-rack', label: 'Flow Rack' },
  { value: 'piso', label: 'Piso / Chão' },
  { value: 'staging', label: 'Staging / Triagem' },
  { value: 'area-delimitada', label: 'Área Delimitada' },
  { value: 'patio', label: 'Pátio' },
] as const;

export const MOCK_LABEL_PREVIEW: LabelPreview = {
  enderecoCurto: '04-A-01-05',
  enderecoCompleto: 'WH-01-SEC-A-04-01-05',
  unidade: 'WH-01',
  dimensoesLabel: 'L-1200 H-1500 P-1000',
  formato: 'Formato Padrão Zebra ZPL II - 100x150mm',
};

export const MOCK_CHANGE_LOG: ChangeLogItem[] = [
  {
    id: '1',
    titulo: 'Carga Máxima Alterada',
    descricao: 'há 2 horas • Admin (ID: 442)',
    tipo: 'alteracao',
    valorAnterior: '1200kg',
    valorNovo: '1500kg',
  },
  {
    id: '2',
    titulo: 'Regra FIFO Ativada',
    descricao: 'ontem às 14:30 • Sistema Autônomo',
    tipo: 'regra',
  },
  {
    id: '3',
    titulo: 'Vínculo de SKU Removido',
    descricao: '12 Out 2023 • Gerente Regional',
    tipo: 'vinculo',
  },
];

export const MOCK_LOTE_ENDERECOS: LoteEnderecoItem[] = [
  {
    id: '1',
    endereco: 'A-01-04-01',
    tipo: 'Picking Palete',
    status: 'pronto',
  },
  {
    id: '2',
    endereco: 'A-01-04-02',
    tipo: 'Picking Palete',
    status: 'pronto',
  },
  {
    id: '3',
    endereco: 'B-12-01-05',
    tipo: 'Pulmão Dinâmico',
    status: 'em-uso',
  },
  {
    id: '4',
    endereco: 'A-01-04-03',
    tipo: 'Picking Palete',
    status: 'pronto',
  },
  {
    id: '5',
    endereco: 'A-01-04-04',
    tipo: 'Picking Palete',
    status: 'pronto',
  },
  {
    id: '6',
    endereco: 'C-02-00-01',
    tipo: 'Doca Recebimento',
    status: 'bloqueado',
  },
];

export const GALPAO_OPCOES = [
  { value: 'WMS-ALPHA-01', label: 'WMS-ALPHA-01 (São Paulo)' },
  { value: 'WMS-BETA-02', label: 'WMS-BETA-02 (Curitiba)' },
  { value: 'WMS-GAMMA-03', label: 'WMS-GAMMA-03 (Recife)' },
] as const;

export const NIVEL_IMPRESSAO_OPCOES = ['01', '02', '03', '04', '05'] as const;

export const MOCK_IMPRESSAO_RESUMO: ImpressaoResumo = {
  totalEtiquetas: 24,
  estreiaMediaSegundos: 1.2,
  impressoraOnline: true,
  filaPercent: 75,
};

function cell(
  label: string,
  rua: string,
  nivel: HeatCell['nivel'],
  ocupacaoPercent: number,
): HeatCell {
  return {
    id: `${rua}-${label}`,
    label,
    rua,
    nivel,
    ocupacaoPercent,
  };
}

export const MOCK_HEAT_CELLS: HeatCell[] = [
  // Rua A - lado par
  cell('A-02', 'A', 'livre', 0),
  cell('A-04', 'A', 'parcial', 40),
  cell('A-06', 'A', 'alto', 60),
  cell('A-08', 'A', 'livre', 0),
  cell('A-10', 'A', 'critico', 95),
  cell('A-12', 'A', 'parcial', 30),
  cell('A-14', 'A', 'livre', 0),
  cell('A-16', 'A', 'livre', 0),
  cell('A-18', 'A', 'parcial', 20),
  cell('A-20', 'A', 'livre', 0),
  cell('A-22', 'A', 'livre', 0),
  cell('A-24', 'A', 'livre', 0),
  // Rua A - lado ímpar
  cell('A-01', 'A', 'parcial', 20),
  cell('A-03', 'A', 'livre', 0),
  cell('A-05', 'A', 'livre', 0),
  cell('A-07', 'A', 'parcial', 50),
  cell('A-09', 'A', 'alto', 70),
  cell('A-11', 'A', 'livre', 0),
  cell('A-13', 'A', 'livre', 0),
  cell('A-15', 'A', 'critico', 85),
  cell('A-17', 'A', 'livre', 0),
  cell('A-19', 'A', 'parcial', 30),
  cell('A-21', 'A', 'livre', 0),
  cell('A-23', 'A', 'livre', 0),
  // Rua B - lado par
  cell('B-02', 'B', 'livre', 0),
  cell('B-04', 'B', 'livre', 0),
  cell('B-06', 'B', 'critico', 98),
  cell('B-08', 'B', 'livre', 0),
  cell('B-10', 'B', 'livre', 0),
  cell('B-12', 'B', 'parcial', 40),
  cell('B-14', 'B', 'parcial', 40),
  cell('B-16', 'B', 'livre', 0),
  cell('B-18', 'B', 'livre', 0),
  cell('B-20', 'B', 'livre', 0),
  cell('B-22', 'B', 'livre', 0),
  cell('B-24', 'B', 'livre', 0),
  // Rua B - lado ímpar
  cell('B-01', 'B', 'parcial', 30),
  cell('B-03', 'B', 'parcial', 30),
  cell('B-05', 'B', 'livre', 0),
  cell('B-07', 'B', 'livre', 0),
  cell('B-09', 'B', 'parcial', 50),
  cell('B-11', 'B', 'parcial', 50),
  cell('B-13', 'B', 'livre', 0),
  cell('B-15', 'B', 'livre', 0),
  cell('B-17', 'B', 'critico', 80),
  cell('B-19', 'B', 'livre', 0),
  cell('B-21', 'B', 'livre', 0),
  cell('B-23', 'B', 'livre', 0),
  // Rua C - lado par
  cell('C-02', 'C', 'livre', 0),
  cell('C-04', 'C', 'livre', 0),
  cell('C-06', 'C', 'livre', 0),
  cell('C-08', 'C', 'livre', 0),
  cell('C-10', 'C', 'parcial', 20),
  cell('C-12', 'C', 'livre', 0),
  cell('C-14', 'C', 'livre', 0),
  cell('C-16', 'C', 'livre', 0),
  cell('C-18', 'C', 'livre', 0),
  cell('C-20', 'C', 'livre', 0),
  cell('C-22', 'C', 'livre', 0),
  cell('C-24', 'C', 'livre', 0),
  // Rua C - lado ímpar
  cell('C-01', 'C', 'livre', 0),
  cell('C-03', 'C', 'livre', 0),
  cell('C-05', 'C', 'livre', 0),
  cell('C-07', 'C', 'livre', 0),
  cell('C-09', 'C', 'livre', 0),
  cell('C-11', 'C', 'livre', 0),
  cell('C-13', 'C', 'livre', 0),
  cell('C-15', 'C', 'livre', 0),
  cell('C-17', 'C', 'livre', 0),
  cell('C-19', 'C', 'livre', 0),
  cell('C-21', 'C', 'livre', 0),
  cell('C-23', 'C', 'livre', 0),
];

export const MOCK_RUA_METRICAS: Record<'A' | 'B' | 'C', RuaMetricas> = {
  A: {
    rua: 'A',
    taxaOcupacaoPercent: 82,
    giroPercent: 65,
    giroLabel: 'Frequente',
    totalPallets: 142,
    pickingsPorDia: 28,
  },
  B: {
    rua: 'B',
    taxaOcupacaoPercent: 68,
    giroPercent: 80,
    giroLabel: 'Alta',
    totalPallets: 98,
    pickingsPorDia: 42,
  },
  C: {
    rua: 'C',
    taxaOcupacaoPercent: 35,
    giroPercent: 40,
    giroLabel: 'Moderado',
    totalPallets: 56,
    pickingsPorDia: 12,
  },
};

export const MOCK_ALERTAS_CRITICOS: AlertaCritico[] = [
  {
    id: '1',
    tipo: 'vencimento',
    titulo: 'Vencimento Próximo',
    descricao: 'Lote #8821 - Rua A-05-C',
    detalhe: 'Expira em 48h',
  },
  {
    id: '2',
    tipo: 'gargalo',
    titulo: 'Gargalo de Picking',
    descricao: 'Rua B - Alta Demanda',
    detalhe: 'Sugerido Remanejamento',
  },
  {
    id: '3',
    tipo: 'ocupacao',
    titulo: 'Ocupação Crítica',
    descricao: 'Nível 5 - Rua A-03',
    detalhe: 'Capacidade 98%',
  },
];

export const ENDERECO_TAG = 'SALA-04-A-01-05';

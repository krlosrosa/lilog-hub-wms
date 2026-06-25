import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';
import {
  Columns3,
  Grid3x3,
  Layers,
  Network,
  Package,
  Route,
  User,
  Waves,
} from 'lucide-react';

export const tipoSeparacaoSchema = z.enum([
  'discreto',
  'zona',
  'onda',
  'cluster',
  'corredor',
  'produto',
  'rota',
  'endereco',
]);

export type TipoSeparacao = z.infer<typeof tipoSeparacaoSchema>;

export const formatoPapelSchema = z.enum(['a4', 'a5', 'bobina']);

export type FormatoPapel = z.infer<typeof formatoPapelSchema>;

export const ordenacaoMapaSchema = z.enum([
  'endereco',
  'peso',
  'volume',
  'pedido',
]);

export type OrdenacaoMapa = z.infer<typeof ordenacaoMapaSchema>;

export const campoMapaSchema = z.enum([
  'barcode',
  'foto',
  'peso',
  'volume',
  'observacoes',
  'destino',
]);

export type CampoMapa = z.infer<typeof campoMapaSchema>;

export const tipoDestinoAlocacaoSchema = z.enum([
  'doca',
  'staging',
  'zona_expedicao',
  'pulmao_expedicao',
  'endereco_temporario',
]);

export type TipoDestinoAlocacao = z.infer<typeof tipoDestinoAlocacaoSchema>;

export type DestinoAlocacaoConfig = {
  tipo: TipoDestinoAlocacao;
  referencia: string;
  gerarDemandaEmpilhadeira: boolean;
};

export type ConfigDiscreto = {
  tipo: 'discreto';
  multiploVolumesMapasSeparados: boolean;
  limiteItensPorMapa: number;
};

export type ConfigZona = {
  tipo: 'zona';
  zonasAtivas: string[];
  consolidacaoZona: 'sincronico' | 'zona_anterior';
};

export type ConfigOnda = {
  tipo: 'onda';
  horaCorte: string;
  transportadora: string;
  maxPeso: number;
  maxPedidos: number;
};

export type ConfigCluster = {
  tipo: 'cluster';
  capacidadeCarrinho: number;
};

export type ConfigCorredor = {
  tipo: 'corredor';
  fluxo: 'ziguezague' | 'ushape';
  maxOperadoresPorCorredor: number;
};

export type ConfigProduto = {
  tipo: 'produto';
  curvaABC: 'A' | 'AB' | 'ABC';
  quantidadeMinima: number;
};

export type ConfigRota = {
  tipo: 'rota';
  rotaId: string;
  ordenacaoEntrega: 'lifo' | 'fifo';
};

export type ConfigEndereco = {
  tipo: 'endereco';
  prioridadeNivel: 'chao_primeiro' | 'aereo_primeiro';
};

export type ConfigEspecificaTipoSeparacao =
  | ConfigDiscreto
  | ConfigZona
  | ConfigOnda
  | ConfigCluster
  | ConfigCorredor
  | ConfigProduto
  | ConfigRota
  | ConfigEndereco;

export type ConfigImpressaoMapaSeparacao = {
  tipoSeparacao: TipoSeparacao;
  configEspecifica: ConfigEspecificaTipoSeparacao;
  copias: number;
  formatoPapel: FormatoPapel;
  ordenacao: OrdenacaoMapa;
  itensPorFolha: number;
  operadores: string[];
  campos: CampoMapa[];
  mapaPorOperador: boolean;
  destinoAlocacao: DestinoAlocacaoConfig;
};

export const TIPO_DESTINO_ALOCACAO_LABELS: Record<TipoDestinoAlocacao, string> = {
  doca: 'Doca de expedição',
  staging: 'Staging / Buffer',
  zona_expedicao: 'Zona de expedição',
  pulmao_expedicao: 'Pulmão de expedição',
  endereco_temporario: 'Endereço temporário',
};

export type ItemSeparacao = {
  id: string;
  remessaId: string;
  numeroNF: string;
  sku: string;
  produto: string;
  endereco: string;
  zona: string;
  corredor: string;
  nivel: string;
  rotaEntrega: string;
  quantidade: number;
  peso: number;
  volume: number;
  destinoCliente: string;
  observacoes?: string;
  paleteFechado?: boolean;
  enderecoAlocacao?: string;
};

export type DemandaEmpilhadeira = {
  id: string;
  blocoId: string;
  numeroNF: string;
  origem: string;
  destino: string;
  peso: number;
  volume: number;
  status: 'pendente';
  qrCodeValor: string;
  motivo: string;
};

export type BlocoMapaSeparacao = {
  id: string;
  titulo: string;
  subtitulo?: string;
  operador?: string;
  agrupador: string;
  itens: ItemSeparacao[];
  folhas: number;
  destinoAlocacao: string;
  qrCodeValor: string;
  possuiPaleteFechado: boolean;
};

export type ResultadoMapasSeparacao = {
  blocos: BlocoMapaSeparacao[];
  demandasEmpilhadeira: DemandaEmpilhadeira[];
  totalItens: number;
  totalMapas: number;
  totalFolhas: number;
  tempoMinutos: number;
  totalDemandasEmpilhadeira: number;
};

export type ResumoImpressaoMapaSeparacao = {
  totalFolhas: number;
  mapasBase: number;
  operadores: number;
  itensPorOperador: number;
  tempoEstimado: string;
  tempoMinutos: number;
  pronto: boolean;
  totalItens: number;
  totalBlocos: number;
  totalDemandasEmpilhadeira: number;
  totalPaletesFechados: number;
};

export type OpcaoTipoSeparacao = {
  tipo: TipoSeparacao;
  label: string;
  descricao: string;
  icon: LucideIcon;
  fatorTempo: number;
};

export const TIPO_SEPARACAO_LABELS: Record<TipoSeparacao, string> = {
  discreto: 'Discreto',
  zona: 'Por Zona',
  onda: 'Por Onda (Wave)',
  cluster: 'Por Cluster',
  corredor: 'Por Corredor',
  produto: 'Por Produto / SKU',
  rota: 'Por Rota de Entrega',
  endereco: 'Por Endereço',
};

export const FORMATO_PAPEL_LABELS: Record<FormatoPapel, string> = {
  a4: 'A4',
  a5: 'A5',
  bobina: 'Bobina 80mm',
};

export const ORDENACAO_MAPA_LABELS: Record<OrdenacaoMapa, string> = {
  endereco: 'Por Endereço',
  peso: 'Por Peso',
  volume: 'Por Volume',
  pedido: 'Por Pedido',
};

export const CAMPO_MAPA_LABELS: Record<CampoMapa, string> = {
  barcode: 'Código de Barras',
  foto: 'Foto do Produto',
  peso: 'Peso',
  volume: 'Volume',
  observacoes: 'Observações',
  destino: 'Endereço de Destino',
};

export const OPCOES_TIPO_SEPARACAO: OpcaoTipoSeparacao[] = [
  {
    tipo: 'discreto',
    label: TIPO_SEPARACAO_LABELS.discreto,
    descricao:
      'Um operador separa um pedido completo de cada vez, do início ao fim.',
    icon: User,
    fatorTempo: 1,
  },
  {
    tipo: 'zona',
    label: TIPO_SEPARACAO_LABELS.zona,
    descricao:
      'Operadores fixos em zonas do armazém — cada um separa os itens da sua área.',
    icon: Layers,
    fatorTempo: 0.85,
  },
  {
    tipo: 'onda',
    label: TIPO_SEPARACAO_LABELS.onda,
    descricao:
      'Lotes de pedidos agrupados em ondas; todos os itens de uma onda ao mesmo tempo.',
    icon: Waves,
    fatorTempo: 0.75,
  },
  {
    tipo: 'cluster',
    label: TIPO_SEPARACAO_LABELS.cluster,
    descricao:
      'Um operador carrega múltiplos pedidos simultâneos, separando por carrinho/box.',
    icon: Network,
    fatorTempo: 0.7,
  },
  {
    tipo: 'corredor',
    label: TIPO_SEPARACAO_LABELS.corredor,
    descricao:
      'Rota otimizada percorrendo corredores de forma sequencial, minimizando deslocamento.',
    icon: Columns3,
    fatorTempo: 0.8,
  },
  {
    tipo: 'produto',
    label: TIPO_SEPARACAO_LABELS.produto,
    descricao:
      'Separa todas as unidades de um SKU de uma vez — ideal para produtos de alta rotação.',
    icon: Package,
    fatorTempo: 0.65,
  },
  {
    tipo: 'rota',
    label: TIPO_SEPARACAO_LABELS.rota,
    descricao:
      'Agrupa itens pela rota do veículo de entrega com zonificação geográfica.',
    icon: Route,
    fatorTempo: 0.9,
  },
  {
    tipo: 'endereco',
    label: TIPO_SEPARACAO_LABELS.endereco,
    descricao:
      'Ordena a coleta exatamente pela sequência de endereços do armazém.',
    icon: Grid3x3,
    fatorTempo: 0.78,
  },
];

export const OPERADORES_DISPONIVEIS = [
  'João Silva',
  'Maria Santos',
  'Carlos Mendes',
  'Ana Oliveira',
  'Roberto Alves',
] as const;

export const modoInteligenciaSchema = z.enum([
  'manual',
  'qtd_separadores',
  'meta_velocidade',
  'balancear_carga',
  'minimizar_tempo',
  'minimizar_papel',
  'auto_tipo',
]);

export type ModoInteligencia = z.infer<typeof modoInteligenciaSchema>;

export const metaVelocidadeSchema = z.enum([
  'urgente',
  'rapido',
  'balanceado',
  'cuidadoso',
]);

export type MetaVelocidade = z.infer<typeof metaVelocidadeSchema>;

export type SugestaoInteligente = {
  config: ConfigImpressaoMapaSeparacao;
  explicacoes: string[];
  confianca: 'alta' | 'media' | 'baixa';
  modo: ModoInteligencia;
};

export const MODO_INTELIGENCIA_LABELS: Record<ModoInteligencia, string> = {
  manual: 'Manual',
  qtd_separadores: 'Qtd. de separadores',
  meta_velocidade: 'Meta de velocidade',
  balancear_carga: 'Balancear carga',
  minimizar_tempo: 'Minimizar tempo',
  minimizar_papel: 'Minimizar papel',
  auto_tipo: 'Detectar melhor tipo',
};

export const META_VELOCIDADE_LABELS: Record<MetaVelocidade, string> = {
  urgente: 'Urgente',
  rapido: 'Rápido',
  balanceado: 'Balanceado',
  cuidadoso: 'Cuidadoso',
};

export const META_VELOCIDADE_DESCRICOES: Record<MetaVelocidade, string> = {
  urgente: 'Máxima velocidade — mais operadores e separação paralela',
  rapido: 'Alta produtividade com boa distribuição de carga',
  balanceado: 'Equilíbrio entre tempo, clareza dos mapas e operadores',
  cuidadoso: 'Menos erros — mapas menores e separação mais controlada',
};

export const DEFAULT_DESTINO_ALOCACAO: DestinoAlocacaoConfig = {
  tipo: 'zona_expedicao',
  referencia: 'EXP-01',
  gerarDemandaEmpilhadeira: true,
};

export const ZONAS_DISPONIVEIS = [
  'Zona A — Eletro',
  'Zona B — Acessórios',
  'Zona C — Fluidos',
  'Zona D — Refrigerados',
] as const;

export const ROTAS_DISPONIVEIS = [
  { id: 'rota-sul', label: 'Rota Sul — ABC-1D23' },
  { id: 'rota-norte', label: 'Rota Norte — DEF-4G56' },
  { id: 'rota-leste', label: 'Rota Leste — GHI-7J89' },
  { id: 'rota-oeste', label: 'Rota Oeste — JKL-0M12' },
] as const;

export const DEFAULT_CONFIGS_POR_TIPO: Record<
  TipoSeparacao,
  ConfigEspecificaTipoSeparacao
> = {
  discreto: {
    tipo: 'discreto',
    multiploVolumesMapasSeparados: false,
    limiteItensPorMapa: 30,
  },
  zona: {
    tipo: 'zona',
    zonasAtivas: ['Zona A — Eletro', 'Zona B — Acessórios'],
    consolidacaoZona: 'zona_anterior',
  },
  onda: {
    tipo: 'onda',
    horaCorte: '14:00',
    transportadora: '',
    maxPeso: 500,
    maxPedidos: 50,
  },
  cluster: {
    tipo: 'cluster',
    capacidadeCarrinho: 6,
  },
  corredor: {
    tipo: 'corredor',
    fluxo: 'ziguezague',
    maxOperadoresPorCorredor: 1,
  },
  produto: {
    tipo: 'produto',
    curvaABC: 'A',
    quantidadeMinima: 50,
  },
  rota: {
    tipo: 'rota',
    rotaId: 'rota-sul',
    ordenacaoEntrega: 'lifo',
  },
  endereco: {
    tipo: 'endereco',
    prioridadeNivel: 'chao_primeiro',
  },
};

export function criarConfigEspecifica(
  tipo: TipoSeparacao,
): ConfigEspecificaTipoSeparacao {
  return { ...DEFAULT_CONFIGS_POR_TIPO[tipo] };
}

export const DEFAULT_CONFIG_IMPRESSAO_MAPA_SEPARACAO: ConfigImpressaoMapaSeparacao =
  {
    tipoSeparacao: 'discreto',
    configEspecifica: DEFAULT_CONFIGS_POR_TIPO.discreto,
    copias: 1,
    formatoPapel: 'a4',
    ordenacao: 'endereco',
    itensPorFolha: 20,
    operadores: ['João Silva', 'Maria Santos'],
    campos: ['barcode', 'peso', 'volume', 'destino'],
    mapaPorOperador: true,
    destinoAlocacao: DEFAULT_DESTINO_ALOCACAO,
  };

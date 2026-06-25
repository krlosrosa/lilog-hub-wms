import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Grid3x3,
  Layers,
  Network,
  User,
  Waves,
} from 'lucide-react';

export const estrategiaSeparacaoSchema = z.enum([
  'discreto',
  'batch',
  'cluster',
  'zone',
  'wave',
]);

export type EstrategiaSeparacao = z.infer<typeof estrategiaSeparacaoSchema>;

export const prioridadePedidoSchema = z.enum([
  'urgente',
  'alta',
  'normal',
  'baixa',
]);

export type PrioridadePedido = z.infer<typeof prioridadePedidoSchema>;

export const tipoPedidoSchema = z.enum([
  'venda',
  'transferencia',
  'reentrega',
  'bonificacao',
]);

export type TipoPedido = z.infer<typeof tipoPedidoSchema>;

export const statusMapaSchema = z.enum([
  'gerado',
  'impresso',
  'em_execucao',
  'pausado',
  'concluido',
  'cancelado',
]);

export type StatusMapa = z.infer<typeof statusMapaSchema>;

export const tipoAuditoriaSchema = z.enum([
  'geracao',
  'alteracao',
  'rebalanceamento',
  'reimpressao',
  'cancelamento',
  'inicio_execucao',
  'conclusao',
]);

export type TipoAuditoria = z.infer<typeof tipoAuditoriaSchema>;

export const agrupamentoBatchSchema = z.enum([
  'sku',
  'familia',
  'endereco',
  'corredor',
]);

export type AgrupamentoBatch = z.infer<typeof agrupamentoBatchSchema>;

export type PedidoPicking = {
  id: string;
  numeroNF: string;
  cliente: string;
  rota: string;
  transportadora: string;
  prioridade: PrioridadePedido;
  dataExpedicao: string;
  tipoPedido: TipoPedido;
  centroDistribuicao: string;
  peso: number;
  volume: number;
  qtdLinhas: number;
  qtdVolumes: number;
  transporteId: string;
  transporteRota: string;
};

export type FiltrosPedidoPicking = {
  busca: string;
  rota: string;
  transportadora: string;
  cliente: string;
  prioridade: PrioridadePedido | 'todos';
  dataExpedicao: string;
  tipoPedido: TipoPedido | 'todos';
  centroDistribuicao: string;
};

export type ResumoSelecaoPedidos = {
  qtdPedidos: number;
  qtdLinhas: number;
  qtdVolumes: number;
  pesoTotal: number;
  volumeTotal: number;
};

export type LinhaMapaPicking = {
  id: string;
  pedidoId: string;
  numeroNF: string;
  cliente: string;
  sku: string;
  produto: string;
  endereco: string;
  zona: string;
  corredor: string;
  nivel: string;
  quantidade: number;
  peso: number;
  volume: number;
  lote?: string;
  boxDestino?: string;
  sequenciaColeta: number;
};

export type ConfigDiscreto = {
  tipo: 'discreto';
  limiteLinhasPorMapa: number;
};

export type ConfigBatch = {
  tipo: 'batch';
  agrupamento: AgrupamentoBatch;
  maxPedidosPorMapa: number;
};

export type ConfigCluster = {
  tipo: 'cluster';
  pedidosPorCarrinho: number;
  usarCompartimentos: boolean;
};

export type ConfigZone = {
  tipo: 'zone';
  zonasAtivas: string[];
};

export type ConfigWave = {
  tipo: 'wave';
  nomeOnda: string;
  maxPedidos: number;
  maxLinhas: number;
  maxVolumes: number;
  maxPeso: number;
};

export type ConfigEstrategia =
  | ConfigDiscreto
  | ConfigBatch
  | ConfigCluster
  | ConfigZone
  | ConfigWave;

export type ConfigBalanceamento = {
  ativo: boolean;
  considerarLinhas: boolean;
  considerarVolumes: boolean;
  considerarEnderecos: boolean;
  considerarDistancia: boolean;
  considerarPeso: boolean;
  rebalancearAutomatico: boolean;
};

export type ConfigOtimizacaoRota = {
  ativo: boolean;
  ordenarPorRua: boolean;
  ordenarPorCorredor: boolean;
  ordenarPorModulo: boolean;
  ordenarPorNivel: boolean;
  priorizarNivelChao: boolean;
};

export type ConfigGeracaoMapas = {
  estrategia: EstrategiaSeparacao;
  configEstrategia: ConfigEstrategia;
  balanceamento: ConfigBalanceamento;
  otimizacaoRota: ConfigOtimizacaoRota;
};

export type SimulacaoMapa = {
  id: string;
  titulo: string;
  qtdPedidos: number;
  qtdLinhas: number;
  qtdVolumes: number;
  peso: number;
  distanciaEstimada: number;
  tempoEstimadoMin: number;
  operadoresEstimados: number;
  pedidoIds: string[];
};

export type ResultadoSimulacao = {
  mapas: SimulacaoMapa[];
  totalMapas: number;
  totalPedidos: number;
  totalLinhas: number;
  totalVolumes: number;
  pesoTotal: number;
  distanciaTotal: number;
  tempoTotalMin: number;
  operadoresNecessarios: number;
};

export type MapaPickingGerado = {
  id: string;
  codigo: string;
  titulo: string;
  estrategia: EstrategiaSeparacao;
  status: StatusMapa;
  pedidoIds: string[];
  linhas: LinhaMapaPicking[];
  qtdPedidos: number;
  qtdLinhas: number;
  qtdVolumes: number;
  peso: number;
  distanciaEstimada: number;
  tempoEstimadoMin: number;
  qrCodeValor: string;
  onda?: string;
  zona?: string;
  agrupamento?: string;
  geradoEm: string;
  geradoPor: string;
  operadorAtribuido?: string;
};

export type ResultadoGeracao = {
  mapas: MapaPickingGerado[];
  totalMapas: number;
  geradoEm: string;
  geradoPor: string;
  estrategia: EstrategiaSeparacao;
};

export type RegistroAuditoria = {
  id: string;
  tipo: TipoAuditoria;
  descricao: string;
  usuario: string;
  dataHora: string;
  mapaId?: string;
  detalhes?: string;
};

export type IndicadoresOperacionais = {
  mapasGeradosPeriodo: number;
  linhasSeparadasPorMapa: number;
  tempoMedioExecucaoMin: number;
  produtividadeOperador: number;
  produtividadePorEstrategia: Record<EstrategiaSeparacao, number>;
  taxaConclusao: number;
  taxaDivergencias: number;
  distanciaMediaPorMapa: number;
};

export type OpcaoEstrategia = {
  estrategia: EstrategiaSeparacao;
  label: string;
  descricao: string;
  icon: LucideIcon;
};

export const ESTRATEGIA_LABELS: Record<EstrategiaSeparacao, string> = {
  discreto: 'Picking Discreto',
  batch: 'Batch Picking',
  cluster: 'Cluster Picking',
  zone: 'Zone Picking',
  wave: 'Wave Picking',
};

export const PRIORIDADE_LABELS: Record<PrioridadePedido, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  normal: 'Normal',
  baixa: 'Baixa',
};

export const TIPO_PEDIDO_LABELS: Record<TipoPedido, string> = {
  venda: 'Venda',
  transferencia: 'Transferência',
  reentrega: 'Reentrega',
  bonificacao: 'Bonificação',
};

export const AGRUPAMENTO_BATCH_LABELS: Record<AgrupamentoBatch, string> = {
  sku: 'Por SKU',
  familia: 'Por Família',
  endereco: 'Por Endereço',
  corredor: 'Por Corredor',
};

export const TIPO_AUDITORIA_LABELS: Record<TipoAuditoria, string> = {
  geracao: 'Geração',
  alteracao: 'Alteração',
  rebalanceamento: 'Rebalanceamento',
  reimpressao: 'Reimpressão',
  cancelamento: 'Cancelamento',
  inicio_execucao: 'Início Execução',
  conclusao: 'Conclusão',
};

export const STATUS_MAPA_LABELS: Record<StatusMapa, string> = {
  gerado: 'Gerado',
  impresso: 'Impresso',
  em_execucao: 'Em Execução',
  pausado: 'Pausado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const ZONAS_LOGISTICAS = [
  'Zona A — Eletro',
  'Zona B — Acessórios',
  'Zona C — Fluidos',
  'Zona D — Refrigerados',
] as const;

export const OPCOES_ESTRATEGIA: OpcaoEstrategia[] = [
  {
    estrategia: 'discreto',
    label: ESTRATEGIA_LABELS.discreto,
    descricao: 'Um mapa para cada pedido. Ideal para pedidos unitários e conferência individual.',
    icon: User,
  },
  {
    estrategia: 'batch',
    label: ESTRATEGIA_LABELS.batch,
    descricao: 'Consolida múltiplos pedidos em um único mapa, agrupando por SKU, família ou endereço.',
    icon: Boxes,
  },
  {
    estrategia: 'cluster',
    label: ESTRATEGIA_LABELS.cluster,
    descricao: 'Múltiplos pedidos em carrinho com compartimentos numerados (Box 1, Box 2…).',
    icon: Network,
  },
  {
    estrategia: 'zone',
    label: ESTRATEGIA_LABELS.zone,
    descricao: 'Mapas específicos por zona logística do armazém.',
    icon: Layers,
  },
  {
    estrategia: 'wave',
    label: ESTRATEGIA_LABELS.wave,
    descricao: 'Ondas de separação com capacidade máxima de pedidos, linhas, volumes ou peso.',
    icon: Waves,
  },
];

export const DEFAULT_CONFIGS_ESTRATEGIA: Record<
  EstrategiaSeparacao,
  ConfigEstrategia
> = {
  discreto: { tipo: 'discreto', limiteLinhasPorMapa: 30 },
  batch: { tipo: 'batch', agrupamento: 'sku', maxPedidosPorMapa: 10 },
  cluster: { tipo: 'cluster', pedidosPorCarrinho: 6, usarCompartimentos: true },
  zone: {
    tipo: 'zone',
    zonasAtivas: ['Zona A — Eletro', 'Zona B — Acessórios'],
  },
  wave: {
    tipo: 'wave',
    nomeOnda: '',
    maxPedidos: 50,
    maxLinhas: 200,
    maxVolumes: 100,
    maxPeso: 500,
  },
};

export const DEFAULT_BALANCEAMENTO: ConfigBalanceamento = {
  ativo: true,
  considerarLinhas: true,
  considerarVolumes: true,
  considerarEnderecos: true,
  considerarDistancia: true,
  considerarPeso: true,
  rebalancearAutomatico: true,
};

export const DEFAULT_OTIMIZACAO_ROTA: ConfigOtimizacaoRota = {
  ativo: true,
  ordenarPorRua: true,
  ordenarPorCorredor: true,
  ordenarPorModulo: true,
  ordenarPorNivel: true,
  priorizarNivelChao: true,
};

export const DEFAULT_FILTROS_PEDIDO: FiltrosPedidoPicking = {
  busca: '',
  rota: 'todos',
  transportadora: 'todos',
  cliente: 'todos',
  prioridade: 'todos',
  dataExpedicao: '',
  tipoPedido: 'todos',
  centroDistribuicao: 'todos',
};

export const DEFAULT_CONFIG_GERACAO: ConfigGeracaoMapas = {
  estrategia: 'discreto',
  configEstrategia: DEFAULT_CONFIGS_ESTRATEGIA.discreto,
  balanceamento: DEFAULT_BALANCEAMENTO,
  otimizacaoRota: DEFAULT_OTIMIZACAO_ROTA,
};

export function criarConfigEstrategia(
  estrategia: EstrategiaSeparacao,
): ConfigEstrategia {
  return { ...DEFAULT_CONFIGS_ESTRATEGIA[estrategia] };
}

import { z } from 'zod';

export const mapaGrupoProcessoSchema = z.enum([
  'separacao',
  'conferencia',
  'carregamento',
]);
export type MapaGrupoProcesso = z.infer<typeof mapaGrupoProcessoSchema>;

export const funcaoOperadorSchema = z.enum(['separador', 'conferente']);
export type FuncaoOperador = z.infer<typeof funcaoOperadorSchema>;

export const statusMapaSchema = z.enum([
  'pendente',
  'em_distribuicao',
  'distribuido',
  'em_separacao',
]);
export type StatusMapa = z.infer<typeof statusMapaSchema>;

export const statusTransporteSchema = z.enum([
  'pendente',
  'em_distribuicao',
  'distribuido',
  'em_separacao',
]);
export type StatusTransporte = z.infer<typeof statusTransporteSchema>;

export const prioridadeMapaSchema = z.enum(['critica', 'alta', 'normal', 'baixa']);
export type PrioridadeMapa = z.infer<typeof prioridadeMapaSchema>;

export const estrategiaBalanceamentoSchema = z.enum([
  'peso',
  'caixas',
  'score_composto',
  'tempo_estimado',
]);
export type EstrategiaBalanceamento = z.infer<typeof estrategiaBalanceamentoSchema>;

export const statusEquilibrioSchema = z.enum([
  'equilibrado',
  'sobrecarregado',
  'abaixo_media',
]);
export type StatusEquilibrio = z.infer<typeof statusEquilibrioSchema>;

export const pedidoMapaSchema = z.object({
  id: z.string(),
  numero: z.string(),
  cliente: z.string(),
  pesoKg: z.number(),
  caixas: z.number(),
  carros: z.number(),
  enderecos: z.array(z.string()),
  skus: z.number(),
});
export type PedidoMapa = z.infer<typeof pedidoMapaSchema>;

export const mapaSeparacaoSchema = z.object({
  id: z.string(),
  mapaGrupoId: z.string(),
  numero: z.string(),
  transportadora: z.string(),
  empresa: z.string(),
  categoria: z.string(),
  processo: mapaGrupoProcessoSchema.default('separacao'),
  prioridade: prioridadeMapaSchema,
  pesoTotalKg: z.number(),
  caixas: z.number(),
  carros: z.number(),
  totalSkus: z.number(),
  docasSugeridas: z.array(z.string()),
  status: statusMapaSchema,
  pedidos: z.array(pedidoMapaSchema),
  enderecosUnicos: z.array(z.string()),
});
export type MapaSeparacao = z.infer<typeof mapaSeparacaoSchema>;

export const transporteExpedicaoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  placa: z.string(),
  transportadora: z.string(),
  empresa: z.string(),
  categorias: z.array(z.string()),
  prioridade: prioridadeMapaSchema,
  pesoTotalKg: z.number(),
  caixas: z.number(),
  totalPaletes: z.number().int().nonnegative(),
  carros: z.number(),
  totalMapas: z.number(),
  totalSkus: z.number(),
  docasSugeridas: z.array(z.string()),
  status: statusTransporteSchema,
  mapas: z.array(mapaSeparacaoSchema),
  horarioSaida: z.string(),
  temMapaGerado: z.boolean(),
});
export type TransporteExpedicao = z.infer<typeof transporteExpedicaoSchema>;

export const operadorSchema = z.object({
  id: z.string(),
  sessaoFuncionarioId: z.string(),
  nome: z.string(),
  cargo: z.string(),
  funcao: funcaoOperadorSchema,
  empresa: z.string(),
  statusPresenca: z.string(),
  capacidadeKgH: z.number(),
  cargaAtualPercent: z.number(),
  produtividadeMedia: z.number(),
});
export type Operador = z.infer<typeof operadorSchema>;

export const docaSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  transportadoraDedicada: z.string().nullable(),
  ocupada: z.boolean(),
});
export type Doca = z.infer<typeof docaSchema>;

export const regraTransportadoraSchema = z.object({
  transportadora: z.string(),
  docaDedicadaId: z.string().nullable(),
  maxSeparadores: z.number(),
});
export type RegraTransportadora = z.infer<typeof regraTransportadoraSchema>;

export const configDistribuicaoSchema = z.object({
  qtdDocas: z.number(),
  qtdFuncionarios: z.number(),
  usarDocasDedicadas: z.boolean(),
  docasSelecionadasIds: z.array(z.string()),
  regrasPorTransportadora: z.array(regraTransportadoraSchema),
  maxSeparadoresPorWorkload: z.number(),
  estrategia: estrategiaBalanceamentoSchema,
});
export type ConfigDistribuicao = z.infer<typeof configDistribuicaoSchema>;

export const workloadMetricasSchema = z.object({
  pesoKg: z.number(),
  caixas: z.number(),
  paletes: z.number(),
  carros: z.number(),
  enderecos: z.number(),
  transportes: z.number(),
  mapas: z.number(),
});
export type WorkloadMetricas = z.infer<typeof workloadMetricasSchema>;

export const workloadSchema = z.object({
  id: z.string(),
  indice: z.number(),
  docaId: z.string(),
  transporteIds: z.array(z.string()),
  separadorIds: z.array(z.string()),
  conferenteIds: z.array(z.string()),
  metricas: workloadMetricasSchema,
  score: z.number(),
  statusEquilibrio: statusEquilibrioSchema,
  desvioPercentual: z.number(),
});
export type Workload = z.infer<typeof workloadSchema>;

export const resumoPlanejamentoSchema = z.object({
  mapasPendentes: z.number(),
  pesoPendenteKg: z.number(),
  totalVolumes: z.number(),
  totalCarros: z.number(),
  docasOcupadas: z.number(),
  docasTotal: z.number(),
  transportesAguardando: z.number(),
});
export type ResumoPlanejamento = z.infer<typeof resumoPlanejamentoSchema>;

export const balanceamentoResumoSchema = z.object({
  workloads: z.array(workloadSchema),
  scoreMedio: z.number(),
  desvioMaximoPercentual: z.number(),
  scoreGlobalEquilibrio: z.number(),
});
export type BalanceamentoResumo = z.infer<typeof balanceamentoResumoSchema>;

export const estadoDistribuicaoSchema = z.object({
  transportes: z.array(transporteExpedicaoSchema),
  config: configDistribuicaoSchema,
  docas: z.array(docaSchema),
  operadores: z.array(operadorSchema),
  workloads: z.array(workloadSchema),
  transportesNaoAlocadosIds: z.array(z.string()),
  operadoresDisponiveisIds: z.array(z.string()),
  workloadPreviewId: z.string().nullable(),
  transportePreviewId: z.string().nullable(),
  balanceamento: balanceamentoResumoSchema,
});
export type EstadoDistribuicao = z.infer<typeof estadoDistribuicaoSchema>;

export type MapaIndexPorProcesso = Record<MapaGrupoProcesso, string[]>;

export type MapaIndex = Record<string, MapaIndexPorProcesso>;

export type DistribuicaoDadosCarregados = {
  transportes: TransporteExpedicao[];
  docas: Doca[];
  operadores: Operador[];
  operadoresCarregamento: Operador[];
  mapaIndex: MapaIndex;
  configInicial: ConfigDistribuicao;
  sessaoId?: string;
};

export type PlanejamentoDistribuicaoCarregado = {
  transportes: TransporteExpedicao[];
  docas: Doca[];
  configInicial: ConfigDistribuicao;
};

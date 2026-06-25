import { z } from 'zod';

export const equipamentoStatusSchema = z.enum([
  'operando',
  'pausa',
  'manutencao',
  'bloqueado',
]);

export type EquipamentoStatus = z.infer<typeof equipamentoStatusSchema>;

export const filtroEquipamentoStatusSchema = z.enum([
  'todos',
  'operando',
  'pausa',
  'manutencao',
  'bloqueado',
]);

export type FiltroEquipamentoStatus = z.infer<
  typeof filtroEquipamentoStatusSchema
>;

export const tipoEquipamentoSchema = z.enum([
  'empilhadeira',
  'transpaleteira',
  'reach_truck',
  'order_picker',
]);

export type TipoEquipamento = z.infer<typeof tipoEquipamentoSchema>;

export const areaOperacaoSchema = z.enum([
  'recebimento',
  'armazenagem',
  'expedicao',
  'picking',
]);

export type AreaOperacao = z.infer<typeof areaOperacaoSchema>;

export const equipamentoListaItemSchema = z.object({
  id: z.string(),
  tag: z.string(),
  nome: z.string(),
  modelo: z.string(),
  tipo: tipoEquipamentoSchema,
  status: equipamentoStatusSchema,
  localizacao: z.string(),
  horimetro: z.number().int().nonnegative(),
  centroDistribuicao: z.string(),
});

export type EquipamentoListaItem = z.infer<typeof equipamentoListaItemSchema>;

export const EQUIPAMENTO_STATUS_LABELS: Record<EquipamentoStatus, string> = {
  operando: 'Operando',
  pausa: 'Em pausa',
  manutencao: 'Manutenção',
  bloqueado: 'Bloqueado',
};

export const FILTRO_EQUIPAMENTO_STATUS_LABELS: Record<
  FiltroEquipamentoStatus,
  string
> = {
  todos: 'Todos',
  operando: 'Operando',
  pausa: 'Em pausa',
  manutencao: 'Manutenção',
  bloqueado: 'Bloqueados',
};

export const FILTROS_EQUIPAMENTO_STATUS = [
  'todos',
  'operando',
  'pausa',
  'manutencao',
  'bloqueado',
] as const satisfies readonly FiltroEquipamentoStatus[];

export const TIPO_EQUIPAMENTO_LABELS: Record<TipoEquipamento, string> = {
  empilhadeira: 'Empilhadeira',
  transpaleteira: 'Transpaleteira',
  reach_truck: 'Reach Truck',
  order_picker: 'Order Picker',
};

export const AREA_OPERACAO_LABELS: Record<AreaOperacao, string> = {
  recebimento: 'Recebimento',
  armazenagem: 'Armazenagem',
  expedicao: 'Expedição',
  picking: 'Picking',
};

export const EQUIPAMENTO_LISTA_PAGE_SIZE = 10;

export const equipamentoStatsSchema = z.object({
  disponibilidadePercent: z.number().min(0).max(100),
  emManutencao: z.number().int().nonnegative(),
  bloqueiosCriticos: z.number().int().nonnegative(),
  custosMes: z.string(),
});

export type EquipamentoStats = z.infer<typeof equipamentoStatsSchema>;

export const equipamentoCadastroFormSchema = z.object({
  ean: z.string().min(8, 'Informe o EAN/UPC'),
  serialNumber: z.string().min(3, 'Informe o número de série'),
  tipo: tipoEquipamentoSchema,
  marca: z.string().min(2, 'Informe a marca'),
  modelo: z.string().min(2, 'Informe o modelo'),
  ano: z
    .number()
    .int()
    .min(1990, 'Ano inválido')
    .max(new Date().getFullYear() + 1),
  capacidadeKg: z.number().positive('Capacidade inválida'),
  elevacaoM: z.number().positive('Elevação inválida'),
  centroDistribuicao: z.string().min(1, 'Selecione o CD'),
  areasOperacao: z
    .array(areaOperacaoSchema)
    .min(1, 'Selecione ao menos uma área'),
  supervisor: z.string().min(2, 'Informe o supervisor'),
  usaBateria: z.boolean(),
  tipoBateria: z.string().optional(),
  voltagem: z.string().optional(),
  amperagem: z.string().optional(),
});

export type EquipamentoCadastroForm = z.infer<
  typeof equipamentoCadastroFormSchema
>;

export const equipamentoDossieTabSchema = z.enum([
  'geral',
  'historico',
  'inspecoes',
  'operadores',
  'documentos',
]);

export type EquipamentoDossieTab = z.infer<typeof equipamentoDossieTabSchema>;

export const EQUIPAMENTO_DOSSIE_TAB_LABELS: Record<
  EquipamentoDossieTab,
  string
> = {
  geral: 'Dados Gerais',
  historico: 'Histórico de Manutenção',
  inspecoes: 'Inspeções',
  operadores: 'Operadores Habilitados',
  documentos: 'Documentos / Laudos',
};

export const manutencaoHistoricoSchema = z.object({
  id: z.string(),
  data: z.string(),
  tipo: z.enum(['preventiva', 'corretiva']),
  descricao: z.string(),
  custo: z.string(),
  horimetro: z.number().int().nonnegative(),
});

export type ManutencaoHistorico = z.infer<typeof manutencaoHistoricoSchema>;

export const inspecaoRegistroSchema = z.object({
  id: z.string(),
  data: z.string(),
  tipo: z.string(),
  resultado: z.enum(['aprovado', 'reprovado', 'pendente']),
  responsavel: z.string(),
});

export type InspecaoRegistro = z.infer<typeof inspecaoRegistroSchema>;

export const operadorHabilitadoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cnh: z.string(),
  nr11Validade: z.string(),
  status: z.enum(['ativo', 'vencendo', 'bloqueado']),
});

export type OperadorHabilitado = z.infer<typeof operadorHabilitadoSchema>;

export const documentoLaudoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  vencimento: z.string(),
  status: z.enum(['valido', 'vencendo', 'vencido']),
});

export type DocumentoLaudo = z.infer<typeof documentoLaudoSchema>;

export const equipamentoDossieSchema = z.object({
  id: z.string(),
  tag: z.string(),
  nome: z.string(),
  status: equipamentoStatusSchema,
  refTecnica: z.string(),
  horasTotais: z.number().int().nonnegative(),
  proximaManutencao: z.string(),
  proximaManutencaoDetalhe: z.string(),
  eficienciaPercent: z.number().min(0).max(100),
  custoAcumuladoAno: z.string(),
  tipo: tipoEquipamentoSchema,
  marca: z.string(),
  modelo: z.string(),
  ano: z.number().int(),
  capacidadeKg: z.string(),
  centroCarga: z.string(),
  bateria: z.string(),
  pesoOperacional: z.string(),
  ultimaRevisao: z.string(),
  localizacao: z.string(),
  centroDistribuicao: z.string(),
  telemetria: z.object({
    bateriaPercent: z.number().min(0).max(100),
    temperaturaC: z.number(),
    cargaPercent: z.number().min(0).max(100),
  }),
  manutencoes: z.array(manutencaoHistoricoSchema),
  inspecoes: z.array(inspecaoRegistroSchema),
  operadores: z.array(operadorHabilitadoSchema),
  documentos: z.array(documentoLaudoSchema),
});

export type EquipamentoDossie = z.infer<typeof equipamentoDossieSchema>;

export const osPrioridadeSchema = z.enum(['critica', 'alta', 'baixa']);

export type OsPrioridade = z.infer<typeof osPrioridadeSchema>;

export const ordemServicoSchema = z.object({
  id: z.string(),
  equipamentoTag: z.string(),
  equipamentoNome: z.string(),
  problema: z.string(),
  prioridade: osPrioridadeSchema,
  tempoAberto: z.string(),
  equipamentoId: z.string().optional(),
});

export type OrdemServico = z.infer<typeof ordemServicoSchema>;

export const manutencaoPreventivaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  horimetroAtual: z.number().int().nonnegative(),
  horimetroLimite: z.number().int().positive(),
  percentual: z.number().min(0).max(100),
});

export type ManutencaoPreventiva = z.infer<typeof manutencaoPreventivaSchema>;

export const custoSemanaSchema = z.object({
  semana: z.string(),
  pecas: z.number().nonnegative(),
  maoObra: z.number().nonnegative(),
  terceiros: z.number().nonnegative(),
});

export type CustoSemana = z.infer<typeof custoSemanaSchema>;

export const manutencaoKpisSchema = z.object({
  mtbfHoras: z.number().positive(),
  mtbfDeltaPercent: z.number(),
  mttrHoras: z.number().positive(),
  mttrDeltaPercent: z.number(),
});

export type ManutencaoKpis = z.infer<typeof manutencaoKpisSchema>;

export const OS_PRIORIDADE_LABELS: Record<OsPrioridade, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  baixa: 'Baixa',
};

export const CENTROS_DISTRIBUICAO_EQUIPAMENTO = [
  'CD-01: Barueri / SP',
  'CD-02: Curitiba / PR',
  'CD-03: Recife / PE',
] as const;

export const SUPERVISORES_MOCK = [
  'Carlos Mendes',
  'Ana Paula Ribeiro',
  'Roberto Silva',
] as const;

export const DEFAULT_EQUIPAMENTO_CADASTRO: EquipamentoCadastroForm = {
  ean: '',
  serialNumber: '',
  tipo: 'empilhadeira',
  marca: '',
  modelo: '',
  ano: new Date().getFullYear(),
  capacidadeKg: 2500,
  elevacaoM: 6,
  centroDistribuicao: CENTROS_DISTRIBUICAO_EQUIPAMENTO[0],
  areasOperacao: ['armazenagem'],
  supervisor: SUPERVISORES_MOCK[0],
  usaBateria: true,
  tipoBateria: 'Chumbo-ácido',
  voltagem: '48V',
  amperagem: '625Ah',
};

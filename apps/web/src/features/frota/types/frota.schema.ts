import { z } from 'zod';

export const veiculoStatusSchema = z.enum(['ativo', 'bloqueado', 'manutencao']);

export type VeiculoStatus = z.infer<typeof veiculoStatusSchema>;

export const filtroVeiculoStatusSchema = z.enum([
  'todos',
  'ativo',
  'bloqueado',
  'manutencao',
]);

export type FiltroVeiculoStatus = z.infer<typeof filtroVeiculoStatusSchema>;

export const veiculoListaItemSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  placa: z.string(),
  marcaModelo: z.string(),
  transportadora: z.string(),
  centroDistribuicao: z.string(),
  status: veiculoStatusSchema,
  proximaManutencao: z.string().optional(),
});

export type VeiculoListaItem = z.infer<typeof veiculoListaItemSchema>;

export const VEICULO_STATUS_LABELS: Record<VeiculoStatus, string> = {
  ativo: 'Ativo',
  bloqueado: 'Bloqueado',
  manutencao: 'Manutenção',
};

export const FILTRO_VEICULO_STATUS_LABELS: Record<FiltroVeiculoStatus, string> = {
  todos: 'Todos',
  ativo: 'Ativos',
  bloqueado: 'Bloqueados',
  manutencao: 'Em manutenção',
};

export const FILTROS_VEICULO_STATUS = [
  'todos',
  'ativo',
  'bloqueado',
  'manutencao',
] as const satisfies readonly FiltroVeiculoStatus[];

export const FROTA_LISTA_PAGE_SIZE = 10;

export const alertaSeveridadeSchema = z.enum([
  'critico',
  'urgente',
  'aviso',
  'rotina',
]);

export type AlertaSeveridade = z.infer<typeof alertaSeveridadeSchema>;

export const frotaAlertaSchema = z.object({
  id: z.string(),
  severidade: alertaSeveridadeSchema,
  referenciaId: z.string().optional(),
  metaLabel: z.string().optional(),
  titulo: z.string(),
  descricao: z.string(),
  contexto: z.string(),
  acaoLabel: z.string(),
  veiculoId: z.string().optional(),
});

export type FrotaAlerta = z.infer<typeof frotaAlertaSchema>;

export const frotaStatsSchema = z.object({
  frotaAtiva: z.number().int().nonnegative(),
  veiculosBloqueados: z.number().int().nonnegative(),
  manutencoesAtrasadas: z.number().int().nonnegative(),
  proximaAgenda: z.number().int().nonnegative(),
});

export type FrotaStats = z.infer<typeof frotaStatsSchema>;

export const agendaEventoTipoSchema = z.enum([
  'quebra',
  'oleo',
  'licenca',
  'freios',
  'inspecao',
  'pneus',
]);

export type AgendaEventoTipo = z.infer<typeof agendaEventoTipoSchema>;

export const agendaEventoSchema = z.object({
  id: z.string(),
  dia: z.number().int().min(1).max(31),
  label: z.string(),
  tipo: agendaEventoTipoSchema,
  count: z.number().int().positive().optional(),
});

export type AgendaEvento = z.infer<typeof agendaEventoSchema>;

export const agendaPeriodoSchema = z.enum(['semana', 'mes']);

export type AgendaPeriodo = z.infer<typeof agendaPeriodoSchema>;

export const filaAcaoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  subtitulo: z.string(),
  icon: z.enum(['description', 'build']),
  veiculoId: z.string().optional(),
});

export type FilaAcao = z.infer<typeof filaAcaoSchema>;

export const tipoVeiculoSchema = z.enum([
  'truck_3_eixos',
  'toco_2_eixos',
  'bitrem',
  'vanderleia',
  'rodotrem',
]);

export type TipoVeiculo = z.infer<typeof tipoVeiculoSchema>;

export const veiculoCadastroFormSchema = z.object({
  placa: z
    .string()
    .min(7, 'Informe a placa')
    .max(8, 'Placa inválida'),
  renavam: z.string().min(9, 'Renavam inválido').max(11),
  chassis: z.string().min(5, 'Informe o chassi'),
  marcaModelo: z.string().min(2, 'Informe marca e modelo'),
  anoFabricacao: z
    .number()
    .int()
    .min(1990, 'Ano inválido')
    .max(new Date().getFullYear() + 1),
  anoModelo: z
    .number()
    .int()
    .min(1990, 'Ano inválido')
    .max(new Date().getFullYear() + 2),
  tipoVeiculo: tipoVeiculoSchema,
  pesoBrutoKg: z.number().positive('PBT deve ser maior que zero'),
  pesoLiquidoKg: z.number().positive('Peso líquido inválido'),
  cubagemM3: z.number().positive('Cubagem inválida'),
  capacidadePaletes: z.number().int().positive('Capacidade inválida'),
  vencimentoSeguro: z.string().min(1, 'Informe o vencimento do seguro'),
  transportadora: z.string().min(1, 'Selecione a transportadora'),
  centroDistribuicao: z.string().min(1, 'Selecione o CD'),
  proprietario: z.string().min(2, 'Informe o proprietário'),
});

export type VeiculoCadastroForm = z.infer<typeof veiculoCadastroFormSchema>;

export const veiculoDetalheTabSchema = z.enum([
  'geral',
  'docs',
  'maint',
  'drivers',
  'fuel',
  'audit',
]);

export type VeiculoDetalheTab = z.infer<typeof veiculoDetalheTabSchema>;

export const VEICULO_DETALHE_TAB_LABELS: Record<VeiculoDetalheTab, string> = {
  geral: 'Dados Gerais',
  docs: 'Documentação',
  maint: 'Manutenção',
  drivers: 'Motoristas',
  fuel: 'Abastecimento',
  audit: 'Histórico',
};

export const documentoStatusSchema = z.enum(['valid', 'expiring', 'expired']);

export type DocumentoStatus = z.infer<typeof documentoStatusSchema>;

export const veiculoDocumentoSchema = z.object({
  id: z.string(),
  tipo: z.string(),
  vencimento: z.string(),
  status: documentoStatusSchema,
});

export type VeiculoDocumento = z.infer<typeof veiculoDocumentoSchema>;

export const manutencaoRegistroSchema = z.object({
  id: z.string(),
  data: z.string(),
  tipo: z.string(),
  odometroKm: z.number().int().nonnegative(),
  custo: z.string(),
  oficina: z.string(),
});

export type ManutencaoRegistro = z.infer<typeof manutencaoRegistroSchema>;

export const motoristaVinculoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cnhCategoria: z.string(),
  desde: z.string(),
  papel: z.enum(['primary', 'backup']),
  avatarUrl: z.string().optional(),
});

export type MotoristaVinculo = z.infer<typeof motoristaVinculoSchema>;

export const abastecimentoRegistroSchema = z.object({
  id: z.string(),
  data: z.string(),
  litros: z.string(),
  custoPorLitro: z.string(),
  posto: z.string(),
  eficiencia: z.string(),
});

export type AbastecimentoRegistro = z.infer<typeof abastecimentoRegistroSchema>;

export const auditEventoSchema = z.object({
  id: z.string(),
  autor: z.string(),
  acao: z.string(),
  detalhe: z.string(),
  quando: z.string(),
  icon: z.enum(['history', 'person', 'edit']),
});

export type AuditEvento = z.infer<typeof auditEventoSchema>;

export const veiculoDetalheSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  status: veiculoStatusSchema,
  nome: z.string(),
  placa: z.string(),
  uf: z.string(),
  capacidadePaletes: z.number().int().positive(),
  eficienciaCargaPercent: z.number().min(0).max(100),
  proximaManutencao: z.string(),
  proximaManutencaoDetalhe: z.string(),
  quilometragemTotal: z.number().int().nonnegative(),
  mediaKmMes: z.number().int().nonnegative(),
  renavam: z.string(),
  chassis: z.string(),
  marcaModelo: z.string(),
  anoFabricacao: z.number().int(),
  anoModelo: z.number().int(),
  pesoBrutoKg: z.string(),
  capacidadeCargaKg: z.string(),
  cubagem: z.string(),
  combustivel: z.string(),
  imagemUrl: z.string().optional(),
  refTecnica: z.string(),
  documentos: z.array(veiculoDocumentoSchema),
  manutencoes: z.array(manutencaoRegistroSchema),
  motoristas: z.array(motoristaVinculoSchema),
  consumoMedioKmL: z.number().positive(),
  consumoDeltaPercent: z.number(),
  consumoHistoricoPercent: z.array(z.number().min(0).max(100)),
  abastecimentos: z.array(abastecimentoRegistroSchema),
  auditoria: z.array(auditEventoSchema),
});

export type VeiculoDetalhe = z.infer<typeof veiculoDetalheSchema>;

export const TIPO_VEICULO_LABELS: Record<TipoVeiculo, string> = {
  truck_3_eixos: 'Truck (3 eixos)',
  toco_2_eixos: 'Toco (2 eixos)',
  bitrem: 'Bitrem',
  vanderleia: 'Vanderleia',
  rodotrem: 'Rodotrem',
};

export const ALERTA_SEVERIDADE_LABELS: Record<AlertaSeveridade, string> = {
  critico: 'CRÍTICO',
  urgente: 'URGENTE',
  aviso: '30 DIAS',
  rotina: 'ROTINA',
};

export const AGENDA_EVENTO_TIPO_LABELS: Record<AgendaEventoTipo, string> = {
  quebra: 'QUEBRA',
  oleo: 'ÓLEO',
  licenca: 'LICENÇA VENCENDO',
  freios: 'VERIF. FREIOS',
  inspecao: 'INSPEÇÃO',
  pneus: 'PNEUS',
};

export const DOCUMENTO_STATUS_LABELS: Record<DocumentoStatus, string> = {
  valid: 'Válido',
  expiring: 'Vencendo',
  expired: 'Vencido',
};

export const TRANSPORTADORAS_MOCK = [
  'LogiTech Transportes S.A.',
  'Express Sul Logística',
  'Frota Própria - Matriz',
] as const;

export const CENTROS_DISTRIBUICAO_MOCK = [
  'CD-01: Barueri / SP',
  'CD-02: Curitiba / PR',
  'CD-03: Recife / PE',
] as const;

export const DEFAULT_VEICULO_CADASTRO: VeiculoCadastroForm = {
  placa: '',
  renavam: '',
  chassis: '',
  marcaModelo: '',
  anoFabricacao: new Date().getFullYear(),
  anoModelo: new Date().getFullYear(),
  tipoVeiculo: 'truck_3_eixos',
  pesoBrutoKg: 74000,
  pesoLiquidoKg: 48500,
  cubagemM3: 115,
  capacidadePaletes: 28,
  vencimentoSeguro: '',
  transportadora: TRANSPORTADORAS_MOCK[0],
  centroDistribuicao: CENTROS_DISTRIBUICAO_MOCK[0],
  proprietario: '',
};

import { PlacaVeiculoSchema } from '@lilog/contracts';
import { z } from 'zod';

export const PreRecebimentoSituacaoSchema = z.enum([
  'agendado',
  'aguardando',
  'liberado_para_conferencia',
  'em_conferencia',
  'impedido',
  'conferido',
  'finalizado',
  'cancelado',
]);

export type PreRecebimentoSituacao = z.infer<
  typeof PreRecebimentoSituacaoSchema
>;

export const RecebimentoSituacaoSchema = z.enum([
  'em_conferencia',
  'conferido',
  'finalizado',
  'cancelado',
]);

export type RecebimentoSituacao = z.infer<typeof RecebimentoSituacaoSchema>;

export const ModoUnitizacaoSchema = z.enum([
  'gerar_etiqueta_na_armazenagem',
  'bipar_palete_no_recebimento',
]);

export type ModoUnitizacao = z.infer<typeof ModoUnitizacaoSchema>;

export const TipoDivergenciaSchema = z.enum([
  'quantidade_maior',
  'quantidade_menor',
  'produto_nao_esperado',
  'produto_ausente',
  'divergencia_lote',
  'divergencia_peso',
  'divergencia_validade',
]);

export type TipoDivergencia = z.infer<typeof TipoDivergenciaSchema>;

export const OrigemDadosPreRecebimentoSchema = z.enum([
  'manual',
  'xlsx',
  'xml',
  'ocr',
]);

export type OrigemDadosPreRecebimento = z.infer<
  typeof OrigemDadosPreRecebimentoSchema
>;

export const NotaFiscalPreRecebimentoInputSchema = z.object({
  numeroNf: z.string().min(1).max(20),
  serie: z.string().max(5).optional(),
  chaveAcesso: z.string().max(44).optional(),
  numeroRemessa: z.string().max(100).optional(),
  fornecedorNome: z.string().max(255).optional(),
  fornecedorDocumento: z.string().max(20).optional(),
  pesoTotal: z.number().nonnegative().optional(),
  volumeTotal: z.number().nonnegative().optional(),
  observacao: z.string().optional(),
});

export type NotaFiscalPreRecebimentoInput = z.infer<
  typeof NotaFiscalPreRecebimentoInputSchema
>;

export const ItemPreRecebimentoInputSchema = z.object({
  produtoId: z.string().min(1).max(50),
  quantidadeEsperada: z.number().positive(),
  unidadeMedida: z.string().min(1).max(20),
  loteEsperado: z.string().optional(),
  pesoEsperado: z.number().positive().optional(),
  validadeEsperada: z.coerce.date().optional(),
});

export type ItemPreRecebimentoInput = z.infer<
  typeof ItemPreRecebimentoInputSchema
>;

export const CreatePreRecebimentoInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transportadoraNome: z.string().max(255).optional(),
  placa: z.string().max(20).optional(),
  numeroOcr: z.string().max(100).optional(),
  numeroTransporte: z.string().max(100).optional(),
  origemDados: OrigemDadosPreRecebimentoSchema.default('manual'),
  origem: z.string().max(50).default('3201').optional(),
  horarioPrevisto: z.coerce.date(),
  observacao: z.string().optional(),
  quantidadePaletesEsperada: z.number().int().nonnegative().optional(),
  itens: z.array(ItemPreRecebimentoInputSchema).min(1),
  notasFiscais: z.array(NotaFiscalPreRecebimentoInputSchema).optional(),
});

export type CreatePreRecebimentoInput = z.infer<
  typeof CreatePreRecebimentoInputSchema
>;

export const UpdatePreRecebimentoInputSchema = z.object({
  transportadoraNome: z.string().max(255).nullable().optional(),
  placa: z.string().max(20).nullable().optional(),
  numeroOcr: z.string().max(100).nullable().optional(),
  numeroTransporte: z.string().max(100).nullable().optional(),
  origemDados: OrigemDadosPreRecebimentoSchema.optional(),
  origem: z.string().max(50).nullable().optional(),
  horarioPrevisto: z.coerce.date().optional(),
  observacao: z.string().nullable().optional(),
  quantidadePaletesEsperada: z.number().int().nonnegative().nullable().optional(),
  itens: z.array(ItemPreRecebimentoInputSchema).min(1).optional(),
  notasFiscais: z.array(NotaFiscalPreRecebimentoInputSchema).optional(),
});

export type UpdatePreRecebimentoInput = z.infer<
  typeof UpdatePreRecebimentoInputSchema
>;

export const GrauPrioridadePreRecebimentoSchema = z.enum([
  'baixo',
  'normal',
  'alto',
  'urgente',
]);

export type GrauPrioridadePreRecebimento = z.infer<
  typeof GrauPrioridadePreRecebimentoSchema
>;

export const RecepcionarCarroInputSchema = z.object({
  motoristaNome: z.string().min(1).max(255),
  placa: PlacaVeiculoSchema,
  motoristaTelefone: z.string().max(20).optional(),
  dataChegada: z.iso.datetime().optional(),
  grauPrioridade: GrauPrioridadePreRecebimentoSchema.optional(),
  quantidadePaletesEsperada: z.number().int().min(0).optional(),
  numeroTermoPalete: z.string().max(100).optional(),
});

export type RecepcionarCarroInput = z.infer<
  typeof RecepcionarCarroInputSchema
>;

export const LiberarConferenciaInputSchema = z.object({
  docaId: z.uuid(),
});

export type LiberarConferenciaInput = z.infer<
  typeof LiberarConferenciaInputSchema
>;

export const ConferirItemInputSchema = z.object({
  produtoId: z.string().min(1).max(50),
  quantidadeRecebida: z.number().nonnegative(),
  unidadeMedida: z.string().min(1).max(20),
  loteRecebido: z.string().optional(),
  pesoRecebido: z.number().positive().optional(),
  etiquetaCodigo: z.string().min(1).max(100).optional(),
  validade: z.coerce.date().optional(),
  numeroSerie: z.string().optional(),
  unitizadorCodigo: z.string().min(1).optional(),
});

export type ConferirItemInput = z.infer<typeof ConferirItemInputSchema>;

export const IniciarRecebimentoInputSchema = z.object({
  preRecebimentoId: z.uuid(),
  docaId: z.uuid().optional(),
  responsavelId: z.number().int().positive(),
});

export type IniciarRecebimentoInput = z.infer<
  typeof IniciarRecebimentoInputSchema
>;

export const CreateChecklistRecebimentoInputSchema = z.object({
  lacre: z.string().max(100).optional(),
  tempBau: z.number().optional(),
  tempProduto: z.number().optional(),
  conditions: z.record(z.string(), z.boolean()),
  observacoes: z.string().optional(),
  photoCount: z.number().int().min(0).optional(),
});

export type CreateChecklistRecebimentoInput = z.infer<
  typeof CreateChecklistRecebimentoInputSchema
>;

export const TemperaturaProdutoEtapaSchema = z.enum([
  'inicio',
  'meio',
  'fim',
]);

export type TemperaturaProdutoEtapa = z.infer<
  typeof TemperaturaProdutoEtapaSchema
>;

export const UpsertTemperaturaProdutoRecebimentoInputSchema = z.object({
  etapa: TemperaturaProdutoEtapaSchema,
  temperatura: z.number(),
});

export type UpsertTemperaturaProdutoRecebimentoInput = z.infer<
  typeof UpsertTemperaturaProdutoRecebimentoInputSchema
>;

export const TipoImpedimentoSchema = z.enum([
  'carreta_tombada',
  'veiculo_avariado',
  'condicao_insegura',
  'acidente',
  'outro',
]);

export type TipoImpedimento = z.infer<typeof TipoImpedimentoSchema>;

export const RegistrarImpedimentoInputSchema = z.object({
  preRecebimentoId: z.uuid(),
  tipo: TipoImpedimentoSchema,
  descricao: z.string().min(10).max(1000),
  photoCount: z.number().int().min(1),
  registradoPorId: z.number().int().positive().optional(),
});

export type RegistrarImpedimentoInput = z.infer<
  typeof RegistrarImpedimentoInputSchema
>;

export const PESO_DIVERGENCIA_TOLERANCIA = 0.001;

const PRE_RECEBIMENTO_TRANSITIONS: Record<
  PreRecebimentoSituacao,
  readonly PreRecebimentoSituacao[]
> = {
  agendado: ['aguardando', 'cancelado'],
  aguardando: ['liberado_para_conferencia', 'cancelado'],
  liberado_para_conferencia: ['em_conferencia', 'impedido', 'cancelado'],
  em_conferencia: ['conferido', 'impedido'],
  impedido: ['liberado_para_conferencia', 'cancelado'],
  conferido: ['finalizado', 'em_conferencia'],
  finalizado: [],
  cancelado: [],
};

export function canTransitionPreRecebimento(
  from: PreRecebimentoSituacao,
  to: PreRecebimentoSituacao,
): boolean {
  return PRE_RECEBIMENTO_TRANSITIONS[from].includes(to);
}

export function canEditPreRecebimento(situacao: PreRecebimentoSituacao): boolean {
  return situacao === 'agendado';
}

export function canCancelPreRecebimento(
  situacao: PreRecebimentoSituacao,
): boolean {
  return (
    situacao === 'agendado' ||
    situacao === 'aguardando' ||
    situacao === 'liberado_para_conferencia'
  );
}

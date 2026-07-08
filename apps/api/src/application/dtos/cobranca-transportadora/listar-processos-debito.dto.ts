import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProcessoDebitoStatusSchema = z.enum([
  'aberto',
  'em_analise',
  'aprovado',
  'incluido_em_documento',
  'cancelado',
]);

export const DebitoItemTipoSchema = z.enum(['falta', 'avaria', 'sobra']);

export const DebitoItemStatusSchema = z.enum([
  'pendente',
  'aprovado',
  'rejeitado',
  'cobrar',
  'nao_cobrar',
  'sobra',
]);

export const ListarProcessosDebitoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  status: ProcessoDebitoStatusSchema.optional(),
  transportadoraId: z.uuid().optional(),
  demandaId: z.uuid().optional(),
});

export class ListarProcessosDebitoQueryDto extends createZodDto(
  ListarProcessosDebitoQuerySchema,
) {}

export const ProcessoDebitoListItemSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  demandaId: z.uuid(),
  codigoDemanda: z.string(),
  transporteId: z.string().nullable(),
  transportadoraId: z.uuid().nullable(),
  transportadoraNome: z.string().nullable(),
  status: ProcessoDebitoStatusSchema,
  valorTotal: z.number().nonnegative(),
  quantidadeItens: z.number().int().nonnegative(),
  quantidadeItensFalta: z.number().int().nonnegative(),
  quantidadeItensAvaria: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ListarProcessosDebitoResponseSchema = z.object({
  processos: z.array(ProcessoDebitoListItemSchema),
});

export class ListarProcessosDebitoResponseDto extends createZodDto(
  ListarProcessosDebitoResponseSchema,
) {}

export const BuscarProcessoDebitoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class BuscarProcessoDebitoQueryDto extends createZodDto(
  BuscarProcessoDebitoQuerySchema,
) {}

export const CobrancaEventoSchema = z.object({
  id: z.uuid(),
  entidadeTipo: z.enum(['processo', 'documento']),
  entidadeId: z.uuid(),
  statusAnterior: z.string().nullable(),
  statusNovo: z.string(),
  descricao: z.string().nullable(),
  criadoPorUserId: z.number().int().nullable(),
  criadoPorNome: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const ProcessoDebitoTransporteSchema = z.object({
  numeroTransporte: z.string(),
  motorista: z.string().nullable(),
  placa: z.string().nullable(),
  perfilEsperado: z.string().nullable(),
  perfilPagamentoNome: z.string().nullable(),
  regiao: z.string().nullable(),
  cidade: z.string().nullable(),
  bairro: z.string().nullable(),
  itinerario: z.string().nullable(),
  status: z.string(),
  mapaGeradoEm: z.iso.datetime().nullable(),
});

export const ProcessoDebitoDemandaSchema = z.object({
  placa: z.string().nullable(),
  doca: z.string().nullable(),
  cargaSegregada: z.boolean(),
  paletesEsperados: z.number().int().nonnegative().nullable(),
});

export const DevolucaoNotaFiscalTipoSchema = z.enum([
  'reentrega',
  'devolucao_parcial',
  'devolucao_total',
]);

export const ProcessoDebitoNotaFiscalSchema = z.object({
  id: z.uuid(),
  numeroNf: z.string(),
  tipo: DevolucaoNotaFiscalTipoSchema,
  cliente: z.string().nullable(),
  transporteId: z.string().nullable(),
});

export const ProcessoDebitoEvidenciaSchema = z.object({
  id: z.string(),
  avariaId: z.uuid(),
  tipo: z.string(),
  natureza: z.string().nullable(),
  photoUrls: z.array(z.string()),
  createdAt: z.iso.datetime(),
});

export const ProcessoDebitoRegistroCorteSchema = z.object({
  id: z.uuid(),
  codigo: z.string(),
  rota: z.string(),
  doca: z.string().nullable(),
  totalVolumes: z.number().int().nullable(),
  pesoTotalKg: z.number().nullable(),
  separadorNome: z.string().nullable(),
  status: z.string(),
  solicitadoEm: z.iso.datetime(),
});

export const ProcessoDebitoMapaSeparacaoSchema = z.object({
  codigo: z.string(),
  geradoEm: z.iso.datetime().nullable(),
  totalItens: z.number().int().nonnegative(),
  totalVolumes: z.number().int().nonnegative(),
});

export const ProcessoDebitoItemSchema = z.object({
  id: z.uuid(),
  processoDebitoId: z.uuid(),
  demandaId: z.uuid(),
  notaFiscalId: z.uuid().nullable(),
  itemId: z.uuid().nullable(),
  avariaId: z.uuid().nullable(),
  faltaPesoId: z.uuid().nullable(),
  tipo: DebitoItemTipoSchema,
  sku: z.string().nullable(),
  descricaoProduto: z.string().nullable(),
  lote: z.string().nullable(),
  qtdConferida: z.number().int().nullable(),
  quantidade: z.number().nullable(),
  qtdAnomalia: z.number().nonnegative(),
  pesoKg: z.number().nullable(),
  pesoTotalKg: z.number().nullable(),
  valorUnitario: z.number().nullable(),
  valorDebito: z.number().nonnegative(),
  motivo: z.string().nullable(),
  observacao: z.string().nullable(),
  status: DebitoItemStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const InteracaoAutorSchema = z.enum(['transportadora', 'cd']);

export const InteracaoTipoTransportadoraSchema = z.enum([
  'erro_conferencia',
  'nf_incorreta',
  'avaria_nao_procedente',
  'envio_documento',
  'esclarecimento',
  'outros',
]);

export const InteracaoTipoCdSchema = z.enum([
  'solicitacao_prova',
  'parecer',
  'observacao_cd',
]);

export const InteracaoTipoSchema = z.union([
  InteracaoTipoTransportadoraSchema,
  InteracaoTipoCdSchema,
]);

export const ProcessoDebitoInteracaoSchema = z.object({
  id: z.uuid(),
  processoDebitoId: z.uuid(),
  autor: InteracaoAutorSchema,
  tipo: InteracaoTipoSchema,
  descricao: z.string(),
  anexoChaves: z.array(z.string()),
  anexoUrls: z.array(z.string()),
  transportadoraId: z.uuid().nullable(),
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
});

export const BuscarProcessoDebitoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  demandaId: z.uuid(),
  codigoDemanda: z.string(),
  transporteId: z.string().nullable(),
  transportadoraId: z.uuid().nullable(),
  transportadoraNome: z.string().nullable(),
  status: ProcessoDebitoStatusSchema,
  valorTotal: z.number().nonnegative(),
  quantidadeItens: z.number().int().nonnegative(),
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  itens: z.array(ProcessoDebitoItemSchema),
  eventos: z.array(CobrancaEventoSchema),
  transporte: ProcessoDebitoTransporteSchema.nullable(),
  demanda: ProcessoDebitoDemandaSchema,
  notasFiscais: z.array(ProcessoDebitoNotaFiscalSchema),
  evidencias: z.array(ProcessoDebitoEvidenciaSchema),
  registrosCorte: z.array(ProcessoDebitoRegistroCorteSchema),
  mapaSeparacao: ProcessoDebitoMapaSeparacaoSchema.nullable(),
  interacoes: z.array(ProcessoDebitoInteracaoSchema),
});

export class BuscarProcessoDebitoResponseDto extends createZodDto(
  BuscarProcessoDebitoResponseSchema,
) {}

export const AtualizarStatusProcessoDebitoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class AtualizarStatusProcessoDebitoQueryDto extends createZodDto(
  AtualizarStatusProcessoDebitoQuerySchema,
) {}

export const AtualizarStatusProcessoDebitoResponseSchema = z.object({
  id: z.uuid(),
  status: ProcessoDebitoStatusSchema,
  statusAnterior: ProcessoDebitoStatusSchema,
  updatedAt: z.iso.datetime(),
});

export class AtualizarStatusProcessoDebitoResponseDto extends createZodDto(
  AtualizarStatusProcessoDebitoResponseSchema,
) {}

export const AtualizarItemProcessoDebitoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class AtualizarItemProcessoDebitoQueryDto extends createZodDto(
  AtualizarItemProcessoDebitoQuerySchema,
) {}

export const AtualizarItemProcessoDebitoResponseSchema = z.object({
  id: z.uuid(),
  processoDebitoId: z.uuid(),
  valorDebito: z.number().nonnegative(),
  status: DebitoItemStatusSchema,
  valorTotalProcesso: z.number().nonnegative(),
});

export class AtualizarItemProcessoDebitoResponseDto extends createZodDto(
  AtualizarItemProcessoDebitoResponseSchema,
) {}

export const RemoverItemProcessoDebitoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class RemoverItemProcessoDebitoQueryDto extends createZodDto(
  RemoverItemProcessoDebitoQuerySchema,
) {}

export const RemoverItemProcessoDebitoResponseSchema = z.object({
  id: z.uuid(),
  processoDebitoId: z.uuid(),
  valorTotalProcesso: z.number().nonnegative(),
  quantidadeItens: z.number().int().nonnegative(),
});

export class RemoverItemProcessoDebitoResponseDto extends createZodDto(
  RemoverItemProcessoDebitoResponseSchema,
) {}

export const AtualizarItensProcessoDebitoEmMassaQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class AtualizarItensProcessoDebitoEmMassaQueryDto extends createZodDto(
  AtualizarItensProcessoDebitoEmMassaQuerySchema,
) {}

export const AtualizarItensProcessoDebitoEmMassaItemSchema = z.object({
  itemId: z.uuid(),
  valorUnitario: z.coerce.number().nonnegative().nullable().optional(),
  valorDebito: z.coerce.number().nonnegative().optional(),
  quantidade: z.coerce.number().positive().optional(),
  status: DebitoItemStatusSchema.optional(),
  observacao: z.string().max(2000).nullable().optional(),
});

export const AtualizarItensProcessoDebitoEmMassaBodySchema = z.object({
  itens: z.array(AtualizarItensProcessoDebitoEmMassaItemSchema).min(1),
});

export class AtualizarItensProcessoDebitoEmMassaBodyDto extends createZodDto(
  AtualizarItensProcessoDebitoEmMassaBodySchema,
) {}

export const AtualizarItensProcessoDebitoEmMassaResponseSchema = z.object({
  quantidadeItensAtualizados: z.number().int().positive(),
  valorTotalProcesso: z.number().nonnegative(),
});

export class AtualizarItensProcessoDebitoEmMassaResponseDto extends createZodDto(
  AtualizarItensProcessoDebitoEmMassaResponseSchema,
) {}

export const RegistrarInteracaoCdQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class RegistrarInteracaoCdQueryDto extends createZodDto(
  RegistrarInteracaoCdQuerySchema,
) {}

export const RegistrarInteracaoCdBodySchema = z.object({
  tipo: InteracaoTipoCdSchema,
  descricao: z.string().min(10).max(2000),
  anexoChaves: z.array(z.string()).max(5).default([]),
});

export class RegistrarInteracaoCdBodyDto extends createZodDto(
  RegistrarInteracaoCdBodySchema,
) {}

export const RegistrarInteracaoCdResponseSchema = z.object({
  id: z.uuid(),
  processoDebitoId: z.uuid(),
  autor: InteracaoAutorSchema,
  tipo: InteracaoTipoCdSchema,
  descricao: z.string(),
  anexoChaves: z.array(z.string()),
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  statusProcesso: ProcessoDebitoStatusSchema,
});

export class RegistrarInteracaoCdResponseDto extends createZodDto(
  RegistrarInteracaoCdResponseSchema,
) {}

export const UploadInteracaoAnexoCdResponseSchema = z.object({
  chave: z.string(),
});

export class UploadInteracaoAnexoCdResponseDto extends createZodDto(
  UploadInteracaoAnexoCdResponseSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DepositoCodigoSchema,
  DepositoFinalidadeSchema,
} from '../../../domain/model/estoque/deposito.model.js';
import { OrigemMotivoBloqueioSaldoSchema } from '../../../domain/model/estoque/motivo-bloqueio-saldo.model.js';
import {
  MotivoBloqueioSaldoResumoSchema,
  StatusSaldoEnderecoSchema,
} from '../../../domain/model/estoque/saldo-endereco.model.js';
import { NaturezaSaldoSchema } from '../../../domain/model/estoque/saldo.model.js';

export const ListDepositosQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class ListDepositosQueryDto extends createZodDto(
  ListDepositosQuerySchema,
) {}

export const DepositoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  codigo: z.string(),
  nome: z.string(),
  finalidade: z.string(),
  permiteVenda: z.boolean(),
  permitePicking: z.boolean(),
  exigeEndereco: z.boolean(),
  contaDisponivel: z.boolean(),
  sistema: z.boolean(),
  ativo: z.boolean(),
});

export class DepositoResponseDto extends createZodDto(DepositoResponseSchema) {}

export const ListDepositosResponseSchema = z.object({
  items: z.array(DepositoResponseSchema),
});

export class ListDepositosResponseDto extends createZodDto(
  ListDepositosResponseSchema,
) {}

export const ListSaldosEnderecoQuerySchema = z.object({
  unidadeId: z.string().min(1),
  depositoId: z.uuid().optional(),
  enderecoId: z.uuid().optional(),
  produtoId: z.string().min(1).max(50).optional(),
  lote: z.string().max(100).optional(),
  status: StatusSaldoEnderecoSchema.optional(),
});

export class ListSaldosEnderecoQueryDto extends createZodDto(
  ListSaldosEnderecoQuerySchema,
) {}

export const SaldoEnderecoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  produtoId: z.string().min(1).max(50),
  depositoId: z.uuid(),
  enderecoId: z.uuid(),
  enderecoMascarado: z.string().optional(),
  lote: z.string(),
  validade: z.iso.datetime().nullable(),
  numeroSerie: z.string(),
  natureza: z.enum(['fisico', 'debito']),
  status: StatusSaldoEnderecoSchema,
  motivoBloqueio: MotivoBloqueioSaldoResumoSchema.nullable(),
  observacaoBloqueio: z.string().nullable(),
  bloqueadoEm: z.iso.datetime().nullable(),
  bloqueadoPor: z.number().int().nullable(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  updatedAt: z.iso.datetime(),
});

export class SaldoEnderecoResponseDto extends createZodDto(
  SaldoEnderecoResponseSchema,
) {}

export const ListSaldosEnderecoResponseSchema = z.object({
  items: z.array(SaldoEnderecoResponseSchema),
});

export class ListSaldosEnderecoResponseDto extends createZodDto(
  ListSaldosEnderecoResponseSchema,
) {}

export const SaldoEnderecoDetalheResponseSchema = SaldoEnderecoResponseSchema.extend(
  {
    produtoSku: z.string(),
    produtoDescricao: z.string(),
    produtoGrupo: z.string().nullable(),
    depositoCodigo: z.string(),
    depositoNome: z.string(),
    saldoReservado: z.number(),
  },
);

export class SaldoEnderecoDetalheResponseDto extends createZodDto(
  SaldoEnderecoDetalheResponseSchema,
) {}

export const AjustarSaldoEnderecoBodySchema = z.object({
  novaQuantidade: z.number().min(0),
  motivo: z.string().min(1).max(255),
});

export class AjustarSaldoEnderecoBodyDto extends createZodDto(
  AjustarSaldoEnderecoBodySchema,
) {}

export const TransferirSaldoEnderecoBodySchema = z.object({
  enderecoDestinoId: z.uuid(),
  quantidade: z.number().positive(),
  observacao: z.string().max(255).optional(),
});

export class TransferirSaldoEnderecoBodyDto extends createZodDto(
  TransferirSaldoEnderecoBodySchema,
) {}

export const BloquearSaldoEnderecoBodySchema = z.object({
  motivoBloqueioId: z.uuid(),
  quantidade: z.number().positive().optional(),
  observacao: z.string().max(255).optional(),
});

export class BloquearSaldoEnderecoBodyDto extends createZodDto(
  BloquearSaldoEnderecoBodySchema,
) {}

export const CreateDepositoBodySchema = z.object({
  unidadeId: z.string().min(1),
  codigo: z.string().min(1).max(30),
  nome: z.string().min(1).max(100),
  finalidade: DepositoFinalidadeSchema,
  permiteVenda: z.boolean().default(false),
  permitePicking: z.boolean().default(false),
  exigeEndereco: z.boolean().default(false),
  contaDisponivel: z.boolean().default(false),
});

export class CreateDepositoBodyDto extends createZodDto(CreateDepositoBodySchema) {}

export const UpdateDepositoBodySchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  permiteVenda: z.boolean().optional(),
  permitePicking: z.boolean().optional(),
  exigeEndereco: z.boolean().optional(),
  contaDisponivel: z.boolean().optional(),
  ativo: z.boolean().optional(),
});

export class UpdateDepositoBodyDto extends createZodDto(UpdateDepositoBodySchema) {}

export const ListMotivosBloqueioSaldoQuerySchema = z.object({
  unidadeId: z.string().min(1),
  ativo: z.coerce.boolean().optional(),
  origem: OrigemMotivoBloqueioSaldoSchema.optional(),
});

export class ListMotivosBloqueioSaldoQueryDto extends createZodDto(
  ListMotivosBloqueioSaldoQuerySchema,
) {}

export const MotivoBloqueioSaldoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  codigo: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  origem: OrigemMotivoBloqueioSaldoSchema,
  ativo: z.boolean(),
  sistema: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class MotivoBloqueioSaldoResponseDto extends createZodDto(
  MotivoBloqueioSaldoResponseSchema,
) {}

export const ListMotivosBloqueioSaldoResponseSchema = z.object({
  items: z.array(MotivoBloqueioSaldoResponseSchema),
});

export class ListMotivosBloqueioSaldoResponseDto extends createZodDto(
  ListMotivosBloqueioSaldoResponseSchema,
) {}

export const ListDisponibilidadeEstoqueQuerySchema = z.object({
  unidadeId: z.string().min(1),
  produtoId: z.string().min(1).max(50).optional(),
  depositoId: z.uuid().optional(),
  enderecoId: z.uuid().optional(),
  status: StatusSaldoEnderecoSchema.optional(),
  natureza: NaturezaSaldoSchema.optional(),
  lote: z.string().max(100).optional(),
  grupos: z
    .string()
    .max(2000)
    .optional()
    .transform((value) =>
      value
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListDisponibilidadeEstoqueQueryDto extends createZodDto(
  ListDisponibilidadeEstoqueQuerySchema,
) {}

export const DisponibilidadeEstoqueItemSchema = z.object({
  saldoEnderecoId: z.uuid().optional(),
  produtoId: z.string(),
  produtoSku: z.string(),
  produtoDescricao: z.string(),
  produtoGrupo: z.string().nullable(),
  depositoId: z.uuid(),
  depositoCodigo: z.string(),
  depositoNome: z.string(),
  enderecoId: z.uuid(),
  enderecoMascarado: z.string(),
  lote: z.string(),
  numeroSerie: z.string(),
  validade: z.iso.datetime().nullable(),
  unidadeMedida: z.string(),
  saldoFisico: z.number(),
  saldoBloqueado: z.number(),
  saldoDebito: z.number(),
  saldoReservado: z.number(),
  saldoDisponivel: z.number(),
  pesoLiquidoTotalKg: z.number().nullable(),
  vencimentoProximo: z.boolean(),
  updatedAt: z.iso.datetime(),
});

export class DisponibilidadeEstoqueItemDto extends createZodDto(
  DisponibilidadeEstoqueItemSchema,
) {}

export const DisponibilidadeEstoqueSummarySchema = z.object({
  saldoFisico: z.number(),
  saldoBloqueado: z.number(),
  saldoDebito: z.number(),
  saldoReservado: z.number(),
  saldoDisponivel: z.number(),
  pesoLiquidoTotalKg: z.number(),
});

export class DisponibilidadeEstoqueSummaryDto extends createZodDto(
  DisponibilidadeEstoqueSummarySchema,
) {}

export const ListDisponibilidadeEstoqueResponseSchema = z.object({
  items: z.array(DisponibilidadeEstoqueItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  summary: DisponibilidadeEstoqueSummarySchema,
});

export class ListDisponibilidadeEstoqueResponseDto extends createZodDto(
  ListDisponibilidadeEstoqueResponseSchema,
) {}

export const ListDisponibilidadeEstoqueAgrupadoQuerySchema = z.object({
  unidadeId: z.string().min(1),
  produtoId: z.string().min(1).max(50).optional(),
  depositoId: z.uuid().optional(),
  status: StatusSaldoEnderecoSchema.optional(),
  natureza: NaturezaSaldoSchema.optional(),
  lote: z.string().max(100).optional(),
  grupos: z
    .string()
    .max(2000)
    .optional()
    .transform((value) =>
      value
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  search: z.string().max(200).optional(),
  groupBy: z.enum(['produto', 'lote']).optional().default('lote'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListDisponibilidadeEstoqueAgrupadoQueryDto extends createZodDto(
  ListDisponibilidadeEstoqueAgrupadoQuerySchema,
) {}

export const DisponibilidadeEstoqueAgrupadoItemSchema = z.object({
  produtoId: z.string(),
  produtoSku: z.string(),
  produtoDescricao: z.string(),
  produtoGrupo: z.string().nullable(),
  lote: z.string(),
  totalLotes: z.number().int().nonnegative().optional(),
  unidadeMedida: z.string(),
  posicoes: z.number().int().nonnegative(),
  validadeMaisProxima: z.iso.datetime().nullable(),
  saldoFisico: z.number(),
  saldoBloqueado: z.number(),
  saldoDebito: z.number(),
  saldoReservado: z.number(),
  saldoDisponivel: z.number(),
  pesoLiquidoTotalKg: z.number().nullable(),
  vencimentoProximo: z.boolean(),
  updatedAt: z.iso.datetime(),
});

export class DisponibilidadeEstoqueAgrupadoItemDto extends createZodDto(
  DisponibilidadeEstoqueAgrupadoItemSchema,
) {}

export const ListDisponibilidadeEstoqueAgrupadoResponseSchema = z.object({
  items: z.array(DisponibilidadeEstoqueAgrupadoItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  summary: DisponibilidadeEstoqueSummarySchema,
});

export class ListDisponibilidadeEstoqueAgrupadoResponseDto extends createZodDto(
  ListDisponibilidadeEstoqueAgrupadoResponseSchema,
) {}

export const ListGruposDisponibilidadeEstoqueQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class ListGruposDisponibilidadeEstoqueQueryDto extends createZodDto(
  ListGruposDisponibilidadeEstoqueQuerySchema,
) {}

export const ListGruposDisponibilidadeEstoqueResponseSchema = z.object({
  items: z.array(z.string()),
});

export class ListGruposDisponibilidadeEstoqueResponseDto extends createZodDto(
  ListGruposDisponibilidadeEstoqueResponseSchema,
) {}

export const ObterExposicaoEstoqueQuerySchema = z.object({
  unidadeId: z.string().min(1),
});

export class ObterExposicaoEstoqueQueryDto extends createZodDto(
  ObterExposicaoEstoqueQuerySchema,
) {}

export const ObterExposicaoEstoqueResponseSchema = z.object({
  cncPendentes: z.number().int().nonnegative(),
  cncEmAnalise: z.number().int().nonnegative(),
  cncEmAbertoTotal: z.number().int().nonnegative(),
  devolucaoDebitoEmAbertoValor: z.number().nonnegative(),
});

export class ObterExposicaoEstoqueResponseDto extends createZodDto(
  ObterExposicaoEstoqueResponseSchema,
) {}

export const TipoMovimentoEstoqueSchema = z.enum([
  'ENTRADA',
  'SAIDA',
  'TRANSFERENCIA_DEPOSITO',
  'AJUSTE',
  'ESTORNO',
]);

export const ListHistoricoProdutoQuerySchema = z.object({
  unidadeId: z.string().min(1),
  produtoId: z.string().min(1).max(50),
  lote: z.string().max(100).optional(),
  depositoId: z.uuid().optional(),
  enderecoId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export class ListHistoricoProdutoQueryDto extends createZodDto(
  ListHistoricoProdutoQuerySchema,
) {}

export const HistoricoMovimentacaoItemSchema = z.object({
  id: z.uuid(),
  tipoMovimento: TipoMovimentoEstoqueSchema,
  quantidade: z.number(),
  unidadeMedida: z.string(),
  lote: z.string(),
  validade: z.iso.datetime().nullable(),
  numeroSerie: z.string(),
  natureza: NaturezaSaldoSchema,
  documentoRef: z.string().nullable(),
  motivo: z.string(),
  operatorId: z.number().int().nullable(),
  operatorNome: z.string().nullable(),
  occurredAt: z.iso.datetime(),
  depositoOrigemId: z.uuid().nullable(),
  depositoOrigemCodigo: z.string().nullable(),
  depositoOrigemNome: z.string().nullable(),
  depositoDestinoId: z.uuid().nullable(),
  depositoDestinoCodigo: z.string().nullable(),
  depositoDestinoNome: z.string().nullable(),
  enderecoOrigemId: z.uuid().nullable(),
  enderecoOrigemMascarado: z.string().nullable(),
  enderecoDestinoId: z.uuid().nullable(),
  enderecoDestinoMascarado: z.string().nullable(),
});

export class HistoricoMovimentacaoItemDto extends createZodDto(
  HistoricoMovimentacaoItemSchema,
) {}

export const ListHistoricoProdutoResponseSchema = z.object({
  items: z.array(HistoricoMovimentacaoItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListHistoricoProdutoResponseDto extends createZodDto(
  ListHistoricoProdutoResponseSchema,
) {}

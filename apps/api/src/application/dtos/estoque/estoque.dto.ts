import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DepositoCodigoSchema } from '../../../domain/model/estoque/deposito.model.js';

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

export const ListSaldosQuerySchema = z.object({
  unidadeId: z.string().min(1),
  depositoCodigo: DepositoCodigoSchema.optional(),
  produtoId: z.uuid().optional(),
});

export class ListSaldosQueryDto extends createZodDto(ListSaldosQuerySchema) {}

export const SaldoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  produtoId: z.uuid(),
  depositoId: z.uuid(),
  depositoCodigo: z.string().optional(),
  depositoNome: z.string().optional(),
  lote: z.string(),
  validade: z.iso.datetime().nullable(),
  numeroSerie: z.string(),
  natureza: z.enum(['fisico', 'debito']),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  updatedAt: z.iso.datetime(),
});

export class SaldoResponseDto extends createZodDto(SaldoResponseSchema) {}

export const ListDepositosResponseSchema = z.object({
  items: z.array(DepositoResponseSchema),
});

export class ListDepositosResponseDto extends createZodDto(
  ListDepositosResponseSchema,
) {}

export const ListSaldosResponseSchema = z.object({
  items: z.array(SaldoResponseSchema),
});

export class ListSaldosResponseDto extends createZodDto(
  ListSaldosResponseSchema,
) {}

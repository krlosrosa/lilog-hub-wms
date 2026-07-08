import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AcaoRegraSchema,
  ArvoreCondicoesSchema,
  GatilhoRegraSchema,
  ModoAvaliacaoRegraSchema,
} from '../../../domain/model/regra-processo/regra-processo.model.js';

export const RegraProcessoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  gatilho: GatilhoRegraSchema,
  prioridade: z.number().int(),
  modoAvaliacao: ModoAvaliacaoRegraSchema,
  arvoreCondicoes: ArvoreCondicoesSchema,
  acoes: z.array(AcaoRegraSchema),
  ativo: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class RegraProcessoResponseDto extends createZodDto(
  RegraProcessoResponseSchema,
) {}

export const ListRegrasProcessoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50),
  gatilho: GatilhoRegraSchema.optional(),
  ativo: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export class ListRegrasProcessoQueryDto extends createZodDto(
  ListRegrasProcessoQuerySchema,
) {}

export const ListRegrasProcessoResponseSchema = z.object({
  items: z.array(RegraProcessoResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListRegrasProcessoResponseDto extends createZodDto(
  ListRegrasProcessoResponseSchema,
) {}

export const RegrasProcessoStatsResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  ativas: z.number().int().nonnegative(),
  inativas: z.number().int().nonnegative(),
});

export class RegrasProcessoStatsResponseDto extends createZodDto(
  RegrasProcessoStatsResponseSchema,
) {}

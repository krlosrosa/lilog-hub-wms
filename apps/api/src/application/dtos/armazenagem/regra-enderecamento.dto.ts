import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  RegraEnderecamentoCriterioTipoSchema,
  RegraEnderecamentoDestinoTipoSchema,
} from '../../../domain/model/armazenagem/regra-enderecamento.model.js';

export const RegraEnderecamentoDestinoResponseSchema = z.object({
  id: z.uuid(),
  regraId: z.uuid(),
  prioridade: z.number().int(),
  tipo: RegraEnderecamentoDestinoTipoSchema,
  zona: z.string().nullable(),
  rua: z.string().nullable(),
  enderecoId: z.uuid().nullable(),
  enderecoLabel: z.string().nullable(),
  ativo: z.boolean(),
});

export class RegraEnderecamentoDestinoResponseDto extends createZodDto(
  RegraEnderecamentoDestinoResponseSchema,
) {}

export const RegraEnderecamentoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  nome: z.string(),
  criterioTipo: RegraEnderecamentoCriterioTipoSchema,
  criterioValor: z.string(),
  prioridade: z.number().int(),
  ativo: z.boolean(),
  destinos: z.array(RegraEnderecamentoDestinoResponseSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class RegraEnderecamentoResponseDto extends createZodDto(
  RegraEnderecamentoResponseSchema,
) {}

export const ListRegrasEnderecamentoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50),
  criterioTipo: RegraEnderecamentoCriterioTipoSchema.optional(),
  ativo: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export class ListRegrasEnderecamentoQueryDto extends createZodDto(
  ListRegrasEnderecamentoQuerySchema,
) {}

export const ListRegrasEnderecamentoResponseSchema = z.object({
  items: z.array(RegraEnderecamentoResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListRegrasEnderecamentoResponseDto extends createZodDto(
  ListRegrasEnderecamentoResponseSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TransportadoraStatusSchema } from '../../../domain/model/transportadora/transportadora.model.js';

export const ListTransportadorasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50).optional(),
  status: TransportadoraStatusSchema.optional(),
  search: z.string().optional(),
});

export class ListTransportadorasQueryDto extends createZodDto(
  ListTransportadorasQuerySchema,
) {}

export const TransportadoraResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  idRavexTransportadora: z.number().int(),
  nome: z.string(),
  cnpj: z.string(),
  status: TransportadoraStatusSchema,
  quantidadeVeiculos: z.number().int(),
  emails: z.array(z.string()).default([]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class TransportadoraResponseDto extends createZodDto(
  TransportadoraResponseSchema,
) {}

export const ListTransportadorasResponseSchema = z.object({
  items: z.array(TransportadoraResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListTransportadorasResponseDto extends createZodDto(
  ListTransportadorasResponseSchema,
) {}

export const TransportadoraRavexPreviewSchema = z.object({
  idRavexTransportadora: z.number().int(),
  nome: z.string(),
  cnpj: z.string(),
  quantidadeVeiculos: z.number().int(),
  jaCadastrada: z.boolean(),
  transportadoraExistenteId: z.uuid().nullable().optional(),
});

export class TransportadoraRavexPreviewDto extends createZodDto(
  TransportadoraRavexPreviewSchema,
) {}

export const BuscarTransportadoraRavexQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class BuscarTransportadoraRavexQueryDto extends createZodDto(
  BuscarTransportadoraRavexQuerySchema,
) {}

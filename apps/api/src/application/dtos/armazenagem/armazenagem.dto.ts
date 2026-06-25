import { PoliticaArmazenagemSchema } from '@lilog/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DemandaArmazenagemStatusSchema,
  ItemArmazenagemStatusSchema,
  ModoUnitizacaoSchema,
} from '../../../domain/model/armazenagem/armazenagem.model.js';

export const ItemArmazenagemResponseSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  unitizadorId: z.uuid().nullable(),
  produtoId: z.uuid(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  lote: z.string().nullable(),
  validade: z.iso.datetime().nullable(),
  numeroSerie: z.string().nullable(),
  enderecoSugeridoId: z.uuid().nullable(),
  enderecoConfirmadoId: z.uuid().nullable(),
  status: ItemArmazenagemStatusSchema,
  produtoSku: z.string().nullable(),
  produtoNome: z.string().nullable(),
  enderecoSugeridoLabel: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class ItemArmazenagemResponseDto extends createZodDto(
  ItemArmazenagemResponseSchema,
) {}

export const DemandaArmazenagemResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  recebimentoId: z.uuid(),
  modoUnitizacao: ModoUnitizacaoSchema.or(z.string()),
  status: DemandaArmazenagemStatusSchema,
  responsavelId: z.number().int().nullable(),
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class DemandaArmazenagemResponseDto extends createZodDto(
  DemandaArmazenagemResponseSchema,
) {}

export class PoliticaArmazenagemResponseDto extends createZodDto(
  PoliticaArmazenagemSchema,
) {}

export const DemandaArmazenagemDetailResponseSchema =
  DemandaArmazenagemResponseSchema.extend({
    itens: z.array(ItemArmazenagemResponseSchema),
    politica: PoliticaArmazenagemSchema,
  });

export class DemandaArmazenagemDetailResponseDto extends createZodDto(
  DemandaArmazenagemDetailResponseSchema,
) {}

export const ListDemandasArmazenagemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50),
  status: DemandaArmazenagemStatusSchema.optional(),
  responsavelId: z.coerce.number().int().positive().optional(),
});

export class ListDemandasArmazenagemQueryDto extends createZodDto(
  ListDemandasArmazenagemQuerySchema,
) {}

export const ListDemandasArmazenagemResponseSchema = z.object({
  items: z.array(DemandaArmazenagemResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListDemandasArmazenagemResponseDto extends createZodDto(
  ListDemandasArmazenagemResponseSchema,
) {}

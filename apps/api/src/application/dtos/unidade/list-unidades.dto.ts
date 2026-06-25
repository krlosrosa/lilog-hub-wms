import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  ClusterSchema,
  EmpresaSchema,
} from '../../../domain/model/unidade/unidade.model.js';

export const ListUnidadesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cluster: ClusterSchema.optional(),
  search: z.string().optional(),
});

export class ListUnidadesQueryDto extends createZodDto(ListUnidadesQuerySchema) {}

export const CentroResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  centro: z.string(),
  empresa: EmpresaSchema,
  nome: z.string(),
  createdAt: z.iso.datetime(),
});

export class CentroResponseDto extends createZodDto(CentroResponseSchema) {}

export const UnidadeResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cluster: ClusterSchema,
  nomeFilial: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  centros: z.array(CentroResponseSchema),
});

export class UnidadeResponseDto extends createZodDto(UnidadeResponseSchema) {}

export const ListUnidadesResponseSchema = z.object({
  items: z.array(UnidadeResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListUnidadesResponseDto extends createZodDto(
  ListUnidadesResponseSchema,
) {}

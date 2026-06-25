import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DocaSituacaoSchema,
  DocaTipoSchema,
} from '../../../domain/model/doca/doca.model.js';

export const ListDocasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50).optional(),
  situacao: DocaSituacaoSchema.optional(),
  tipo: DocaTipoSchema.optional(),
  search: z.string().optional(),
});

export class ListDocasQueryDto extends createZodDto(ListDocasQuerySchema) {}

export const DocaResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  codigo: z.string(),
  nome: z.string(),
  tipo: DocaTipoSchema,
  situacao: DocaSituacaoSchema,
  capacidadeVeiculos: z.number().int().nullable(),
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class DocaResponseDto extends createZodDto(DocaResponseSchema) {}

export const ListDocasResponseSchema = z.object({
  items: z.array(DocaResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListDocasResponseDto extends createZodDto(
  ListDocasResponseSchema,
) {}

export const DocaActionBodySchema = z.object({
  motivo: z.string().min(1).optional(),
});

export class DocaActionBodyDto extends createZodDto(DocaActionBodySchema) {}

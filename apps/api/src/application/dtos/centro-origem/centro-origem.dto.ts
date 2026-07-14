import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListCentrosOrigemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export class ListCentrosOrigemQueryDto extends createZodDto(
  ListCentrosOrigemQuerySchema,
) {}

export const CentroOrigemResponseSchema = z.object({
  centro: z.string(),
  nome: z.string(),
});

export class CentroOrigemResponseDto extends createZodDto(
  CentroOrigemResponseSchema,
) {}

export const ListCentrosOrigemResponseSchema = z.object({
  items: z.array(CentroOrigemResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListCentrosOrigemResponseDto extends createZodDto(
  ListCentrosOrigemResponseSchema,
) {}

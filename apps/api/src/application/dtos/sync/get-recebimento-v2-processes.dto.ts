import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetRecebimentoV2ProcessesQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export class GetRecebimentoV2ProcessesQueryDto extends createZodDto(
  GetRecebimentoV2ProcessesQuerySchema,
) {}

export const RecebimentoV2ProcessHeaderSchema = z.object({
  demandId: z.string(),
  unidadeId: z.string(),
  situacao: z.string(),
  preRecebimentoSituacao: z.string(),
  serverRevision: z.number().int().nonnegative(),
  updatedAt: z.string(),
  tombstone: z.boolean().default(false),
  supplier: z.string().optional(),
  dock: z.string().nullable().optional(),
  arrival: z.string().optional(),
  placa: z.string().nullable().optional(),
  conferente: z.string().nullable().optional(),
  atribuidoAMim: z.boolean().optional(),
});

export const GetRecebimentoV2ProcessesResponseSchema = z.object({
  items: z.array(RecebimentoV2ProcessHeaderSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export class GetRecebimentoV2ProcessesResponseDto extends createZodDto(
  GetRecebimentoV2ProcessesResponseSchema,
) {}

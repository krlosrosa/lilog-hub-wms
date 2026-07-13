import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetRecebimentoReferenceQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  cursor: z.string().optional(),
});

export class GetRecebimentoReferenceQueryDto extends createZodDto(
  GetRecebimentoReferenceQuerySchema,
) {}

export const GetRecebimentoReferenceResponseSchema = z.object({
  docas: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      codigo: z.string().nullable(),
      ativa: z.boolean().default(true),
    }),
  ),
  configuracaoConferencia: z.unknown().nullable(),
  nextCursor: z.string().nullable(),
  cachedAt: z.string(),
});

export class GetRecebimentoReferenceResponseDto extends createZodDto(
  GetRecebimentoReferenceResponseSchema,
) {}

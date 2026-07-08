import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ChecklistRecebimentoResponseSchema = z.object({
  id: z.uuid(),
  recebimentoId: z.uuid(),
  lacre: z.string().nullable(),
  tempBau: z.number().nullable(),
  tempProduto: z.number().nullable(),
  conditions: z.record(z.string(), z.boolean()),
  observacoes: z.string().nullable(),
  photoCount: z.number().int(),
  createdAt: z.iso.datetime(),
});

export class ChecklistRecebimentoResponseDto extends createZodDto(
  ChecklistRecebimentoResponseSchema,
) {}

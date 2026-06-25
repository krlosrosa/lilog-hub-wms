import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UploadLoteResponseSchema = z.object({
  loteId: z.string().uuid(),
  totalRemessas: z.number().int(),
  totalTransportes: z.number().int(),
  nomeArquivo: z.string(),
  dataReferencia: z.string(),
  createdAt: z.iso.datetime(),
});

export class UploadLoteResponseDto extends createZodDto(UploadLoteResponseSchema) {}

export type UploadLoteResponse = z.infer<typeof UploadLoteResponseSchema>;

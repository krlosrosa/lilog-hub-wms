import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetRecebimentoV2PackageResponseSchema = z.object({
  processId: z.string(),
  revision: z.number().int().nonnegative(),
  demanda: z.record(z.string(), z.unknown()),
  itensContabeis: z.array(z.unknown()),
  conferencias: z.array(z.unknown()),
  avarias: z.array(z.unknown()),
  checklist: z.record(z.string(), z.unknown()).nullable(),
  temperaturas: z.array(z.unknown()),
  documentosMeta: z.array(z.unknown()),
  fotosMeta: z.array(z.unknown()),
  configuracoes: z.record(z.string(), z.unknown()).nullable(),
  docas: z.array(z.unknown()),
});

export class GetRecebimentoV2PackageResponseDto extends createZodDto(
  GetRecebimentoV2PackageResponseSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SalvarAlocacoesTransportesResponseSchema = z.object({
  atualizados: z.number().int().nonnegative(),
  pulados: z.number().int().nonnegative().optional(),
});

export class SalvarAlocacoesTransportesResponseDto extends createZodDto(
  SalvarAlocacoesTransportesResponseSchema,
) {}

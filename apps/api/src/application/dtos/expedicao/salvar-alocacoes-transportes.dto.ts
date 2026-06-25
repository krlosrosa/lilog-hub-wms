import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SalvarAlocacoesTransportesResponseSchema = z.object({
  atualizados: z.number().int().nonnegative(),
});

export class SalvarAlocacoesTransportesResponseDto extends createZodDto(
  SalvarAlocacoesTransportesResponseSchema,
) {}

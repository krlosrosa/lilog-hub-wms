import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AtualizarItinerarioRemessasResponseSchema = z.object({
  atualizados: z.number().int(),
  naoEncontrados: z.number().int(),
});

export class AtualizarItinerarioRemessasResponseDto extends createZodDto(
  AtualizarItinerarioRemessasResponseSchema,
) {}

export type AtualizarItinerarioRemessasResponse = z.infer<
  typeof AtualizarItinerarioRemessasResponseSchema
>;

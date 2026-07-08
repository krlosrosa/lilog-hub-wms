import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PortalMeResponseSchema = z.object({
  email: z.string().email(),
  transportadoraId: z.string().uuid(),
  transportadoraNome: z.string(),
});

export class PortalMeResponseDto extends createZodDto(PortalMeResponseSchema) {}

export const SolicitarCodigoPortalResponseSchema = z.object({
  message: z.string(),
});

export class SolicitarCodigoPortalResponseDto extends createZodDto(
  SolicitarCodigoPortalResponseSchema,
) {}

export const VerificarCodigoPortalResponseSchema = z.object({
  email: z.string().email(),
  transportadoraId: z.string().uuid(),
});

export class VerificarCodigoPortalResponseDto extends createZodDto(
  VerificarCodigoPortalResponseSchema,
) {}

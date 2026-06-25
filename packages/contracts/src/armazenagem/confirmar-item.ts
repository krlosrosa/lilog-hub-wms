import { z } from 'zod';

export const ConfirmarItemArmazenagemPayloadSchema = z.object({
  enderecoConfirmadoId: z.uuid(),
  unitizadorCodigo: z.string().min(1).optional(),
  motivoDivergencia: z.string().min(1).max(500).optional(),
});
export type ConfirmarItemArmazenagemPayload = z.infer<
  typeof ConfirmarItemArmazenagemPayloadSchema
>;

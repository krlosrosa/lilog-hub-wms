import { z } from 'zod';

export const veiculoStatusSchema = z.enum(['pendente', 'encostado']);

export type VeiculoStatus = z.infer<typeof veiculoStatusSchema>;

export const veiculoSchema = z.object({
  id: z.string(),
  placa: z.string(),
  doca: z.string(),
  motorista: z.string(),
  transportadora: z.string(),
  status: veiculoStatusSchema,
  atribuidoEm: z.string().optional(),
  /** Operação na doca finalizada — manobrista pode retirar o veículo. */
  concluido: z.boolean().optional(),
});

export type Veiculo = z.infer<typeof veiculoSchema>;

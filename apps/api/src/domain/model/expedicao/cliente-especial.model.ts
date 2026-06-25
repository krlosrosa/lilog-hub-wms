import { z } from 'zod';

export const CreateClienteEspecialInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  codCliente: z.string().min(1).max(50),
  nomeCliente: z.string().min(1).max(255),
  ativo: z.boolean().optional().default(true),
  exigeSegregacaoMapa: z.boolean().optional().default(false),
  exigeSeparacaoEspecial: z.boolean().optional().default(false),
  exigeCarregamentoEspecial: z.boolean().optional().default(false),
  observacaoSeparacao: z.string().max(2000).nullable().optional(),
  observacaoCarregamento: z.string().max(2000).nullable().optional(),
  observacaoGeral: z.string().max(2000).nullable().optional(),
  criadoPor: z.number().int().positive().nullable().optional(),
});

export const UpdateClienteEspecialInputSchema = z.object({
  codCliente: z.string().min(1).max(50).optional(),
  nomeCliente: z.string().min(1).max(255).optional(),
  ativo: z.boolean().optional(),
  exigeSegregacaoMapa: z.boolean().optional(),
  exigeSeparacaoEspecial: z.boolean().optional(),
  exigeCarregamentoEspecial: z.boolean().optional(),
  observacaoSeparacao: z.string().max(2000).nullable().optional(),
  observacaoCarregamento: z.string().max(2000).nullable().optional(),
  observacaoGeral: z.string().max(2000).nullable().optional(),
});

export type CreateClienteEspecialInput = z.infer<
  typeof CreateClienteEspecialInputSchema
>;
export type UpdateClienteEspecialInput = z.infer<
  typeof UpdateClienteEspecialInputSchema
>;

export function normalizarCodCliente(codCliente: string): string {
  return codCliente.trim();
}

export function codigosClienteEquivalentes(
  codigoA: string,
  codigoB: string,
): boolean {
  return normalizarCodCliente(codigoA) === normalizarCodCliente(codigoB);
}

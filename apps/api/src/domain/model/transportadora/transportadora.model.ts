import { z } from 'zod';

export const TransportadoraStatusSchema = z.enum(['ativa', 'inativa']);

export type TransportadoraStatus = z.infer<typeof TransportadoraStatusSchema>;

export const TransportadoraSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1).max(50),
  idRavexTransportadora: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  cnpj: z.string().min(14).max(14),
  status: TransportadoraStatusSchema,
  quantidadeVeiculos: z.number().int().nonnegative(),
  emails: z.array(z.email()).optional().default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Transportadora = z.infer<typeof TransportadoraSchema>;

export const CreateTransportadoraInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  idRavexTransportadora: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  cnpj: z.string().min(1).max(18),
  status: TransportadoraStatusSchema.default('ativa'),
  quantidadeVeiculos: z.number().int().nonnegative().default(0),
  emails: z.array(z.email()).optional().default([]),
});

export type CreateTransportadoraInput = z.infer<
  typeof CreateTransportadoraInputSchema
>;

export const UpdateTransportadoraInputSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  cnpj: z.string().min(1).max(18).optional(),
  status: TransportadoraStatusSchema.optional(),
  quantidadeVeiculos: z.number().int().nonnegative().optional(),
  emails: z.array(z.email()).optional(),
});

export type UpdateTransportadoraInput = z.infer<
  typeof UpdateTransportadoraInputSchema
>;

export const ImportarTransportadoraRavexInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  idRavexTransportadora: z.number().int().positive(),
});

export type ImportarTransportadoraRavexInput = z.infer<
  typeof ImportarTransportadoraRavexInputSchema
>;

export function normalizeCnpjDigits(value: string): string {
  return value.replace(/\D/g, '');
}

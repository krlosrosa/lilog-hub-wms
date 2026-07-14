import { z } from 'zod';

export const CentroOrigemSchema = z.object({
  centro: z.string().min(1).max(50),
  nome: z.string().min(1).max(255),
});

export type CentroOrigem = z.infer<typeof CentroOrigemSchema>;

export const CreateCentroOrigemInputSchema = z.object({
  centro: z.string().min(1).max(50),
  nome: z.string().min(1).max(255),
});

export type CreateCentroOrigemInput = z.infer<
  typeof CreateCentroOrigemInputSchema
>;

export const UpdateCentroOrigemInputSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
});

export type UpdateCentroOrigemInput = z.infer<
  typeof UpdateCentroOrigemInputSchema
>;

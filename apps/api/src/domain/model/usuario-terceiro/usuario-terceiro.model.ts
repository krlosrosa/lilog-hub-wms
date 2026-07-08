import { z } from 'zod';

export const UsuarioTerceiroRoleSchema = z.enum(['admin', 'viewer']);
export type UsuarioTerceiroRole = z.infer<typeof UsuarioTerceiroRoleSchema>;

export const UsuarioTerceiroStatusSchema = z.enum([
  'ativo',
  'bloqueado',
  'inativo',
]);
export type UsuarioTerceiroStatus = z.infer<typeof UsuarioTerceiroStatusSchema>;

export const UsuarioTerceiroIdSchema = z.number().int().positive();
export type UsuarioTerceiroId = z.infer<typeof UsuarioTerceiroIdSchema>;

export const UsuarioTerceiroSchema = z.object({
  id: UsuarioTerceiroIdSchema,
  nome: z.string().min(1).max(100),
  email: z.string().email(),
  passwordHash: z.string(),
  role: UsuarioTerceiroRoleSchema,
  status: UsuarioTerceiroStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type UsuarioTerceiro = z.infer<typeof UsuarioTerceiroSchema>;

export const PublicUsuarioTerceiroSchema = UsuarioTerceiroSchema.omit({
  passwordHash: true,
});
export type PublicUsuarioTerceiro = z.infer<typeof PublicUsuarioTerceiroSchema>;

export const CreateUsuarioTerceiroInputSchema = z.object({
  nome: z.string().min(1).max(100),
  email: z.string().email(),
  passwordHash: z.string(),
  role: UsuarioTerceiroRoleSchema.default('viewer'),
  status: UsuarioTerceiroStatusSchema.default('ativo'),
});

export type CreateUsuarioTerceiroInput = z.infer<
  typeof CreateUsuarioTerceiroInputSchema
>;

export const UpdateUsuarioTerceiroInputSchema = z
  .object({
    nome: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    role: UsuarioTerceiroRoleSchema.optional(),
    status: UsuarioTerceiroStatusSchema.optional(),
    passwordHash: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

export type UpdateUsuarioTerceiroInput = z.infer<
  typeof UpdateUsuarioTerceiroInputSchema
>;

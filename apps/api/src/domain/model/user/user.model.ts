import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'manager', 'operator']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum([
  'ativo',
  'bloqueado',
  'pendente',
  'inativo',
]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserIdSchema = z.number().int().positive();
export type UserId = z.infer<typeof UserIdSchema>;

export const UserSchema = z.object({
  id: UserIdSchema,
  name: z.string().min(1).max(100),
  email: z.string().email(),
  passwordHash: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  funcionarioId: z.number().int().positive().nullable(),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.omit({ passwordHash: true });
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const CreateUserInputSchema = z.object({
  id: UserIdSchema,
  name: z.string().min(1).max(100),
  email: z.string().email(),
  passwordHash: z.string(),
  role: UserRoleSchema.default('operator'),
  status: UserStatusSchema.default('pendente'),
  funcionarioId: z.number().int().positive(),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    role: UserRoleSchema.optional(),
    status: UserStatusSchema.optional(),
    funcionarioId: z.number().int().positive().nullable().optional(),
    passwordHash: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

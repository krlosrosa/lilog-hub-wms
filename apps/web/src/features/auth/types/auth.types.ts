import { z } from 'zod';

export const LoginFormSchema = z.object({
  loginId: z
    .string()
    .min(1, 'Informe o ID')
    .regex(/^\d+$/, 'Informe um ID válido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const UserRoleSchema = z.enum(['admin', 'manager', 'operator']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AuthUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

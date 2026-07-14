import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  UserRoleSchema,
  UserStatusSchema,
} from '../../../domain/model/user/user.model.js';

export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: UserStatusSchema.optional(),
  funcionarioId: z.coerce.number().int().positive().optional(),
  unidadeId: z.string().min(1).max(50).optional(),
  search: z.string().optional(),
});

export class ListUsersQueryDto extends createZodDto(ListUsersQuerySchema) {}

export const UserResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  mustChangePassword: z.boolean(),
  funcionarioId: z.number().int().positive().nullable(),
  createdAt: z.iso.datetime(),
});

export class UserResponseDto extends createZodDto(UserResponseSchema) {}

export const ListUsersResponseSchema = z.object({
  items: z.array(UserResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListUsersResponseDto extends createZodDto(ListUsersResponseSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  UsuarioTerceiroRoleSchema,
  UsuarioTerceiroStatusSchema,
} from '../../../domain/model/usuario-terceiro/usuario-terceiro.model.js';

export const UsuarioTerceiroResponseSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string(),
  email: z.string().email(),
  role: UsuarioTerceiroRoleSchema,
  status: UsuarioTerceiroStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class UsuarioTerceiroResponseDto extends createZodDto(
  UsuarioTerceiroResponseSchema,
) {}

export const ListUsuariosTerceirosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: UsuarioTerceiroStatusSchema.optional(),
  search: z.string().optional(),
});

export class ListUsuariosTerceirosQueryDto extends createZodDto(
  ListUsuariosTerceirosQuerySchema,
) {}

export const ListUsuariosTerceirosResponseSchema = z.object({
  items: z.array(UsuarioTerceiroResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export class ListUsuariosTerceirosResponseDto extends createZodDto(
  ListUsuariosTerceirosResponseSchema,
) {}

export const PortalMeResponseSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string(),
  email: z.string().email(),
  role: UsuarioTerceiroRoleSchema,
  status: UsuarioTerceiroStatusSchema,
});

export class PortalMeResponseDto extends createZodDto(PortalMeResponseSchema) {}

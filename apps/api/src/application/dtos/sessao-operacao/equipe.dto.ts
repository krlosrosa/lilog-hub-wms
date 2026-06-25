import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListEquipesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  unidadeId: z.string().min(1).max(50),
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export class ListEquipesQueryDto extends createZodDto(ListEquipesQuerySchema) {}

export const EquipeListItemSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  nome: z.string(),
  area: z.string().nullable(),
  ativo: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class EquipeListItemDto extends createZodDto(EquipeListItemSchema) {}

export const ListEquipesResponseSchema = z.object({
  items: z.array(EquipeListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListEquipesResponseDto extends createZodDto(
  ListEquipesResponseSchema,
) {}

export const AddEquipeFuncionarioBodySchema = z.object({
  funcionarioId: z.number().int().positive(),
});

export class AddEquipeFuncionarioBodyDto extends createZodDto(
  AddEquipeFuncionarioBodySchema,
) {}

export const FuncionarioEquipeResponseSchema = z.object({
  equipeId: z.uuid().nullable(),
});

export class FuncionarioEquipeResponseDto extends createZodDto(
  FuncionarioEquipeResponseSchema,
) {}

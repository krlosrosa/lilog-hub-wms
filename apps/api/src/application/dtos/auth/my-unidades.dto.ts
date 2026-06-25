import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ClusterSchema } from '../../../domain/model/unidade/unidade.model.js';

export const UserUnidadeItemSchema = z.object({
  id: z.string(),
  nome: z.string(),
  nomeFilial: z.string(),
  cluster: ClusterSchema,
});

export class UserUnidadeItemDto extends createZodDto(UserUnidadeItemSchema) {}

export const ListMyUnidadesResponseSchema = z.object({
  items: z.array(UserUnidadeItemSchema),
});

export class ListMyUnidadesResponseDto extends createZodDto(
  ListMyUnidadesResponseSchema,
) {}

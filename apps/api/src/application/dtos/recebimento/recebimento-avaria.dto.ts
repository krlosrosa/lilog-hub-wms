import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RecebimentoAvariaSchema = z.object({
  id: z.uuid(),
  recebimentoId: z.uuid(),
  produtoId: z.uuid().nullable(),
  tipo: z.string(),
  natureza: z.string(),
  causa: z.string(),
  quantidadeCaixas: z.number().int(),
  quantidadeUnidades: z.number().int(),
  photoCount: z.number().int(),
  replicado: z.boolean(),
  createdAt: z.iso.datetime(),
});

export class RecebimentoAvariaDto extends createZodDto(RecebimentoAvariaSchema) {}

export const ListRecebimentoAvariasResponseSchema = z.object({
  items: z.array(RecebimentoAvariaSchema),
});

export class ListRecebimentoAvariasResponseDto extends createZodDto(
  ListRecebimentoAvariasResponseSchema,
) {}

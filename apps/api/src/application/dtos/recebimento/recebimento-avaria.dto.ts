import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RecebimentoAvariaSchema = z.object({
  id: z.uuid(),
  recebimentoId: z.uuid(),
  produtoId: z.string().min(1).max(50).nullable(),
  tipo: z.string(),
  natureza: z.string(),
  causa: z.string(),
  quantidadeCaixas: z.number().int(),
  quantidadeUnidades: z.number().int(),
  lote: z.string().nullable(),
  validade: z.iso.datetime().nullable(),
  numeroSerie: z.string().nullable(),
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

import { z } from 'zod';

export const armazenagemPrioritySchema = z.enum(['urgente', 'normal']);

export type ArmazenagemPriority = z.infer<typeof armazenagemPrioritySchema>;

export const armazenagemItemStatusSchema = z.enum([
  'pendente',
  'em_andamento',
  'guardado',
  'parcial',
]);

export type ArmazenagemItemStatus = z.infer<typeof armazenagemItemStatusSchema>;

export const armazenagemDemandaSchema = z.object({
  id: z.string(),
  routeId: z.string(),
  origem: z.string(),
  zona: z.string(),
  priority: armazenagemPrioritySchema,
  isPriority: z.boolean().optional(),
  itemCount: z.number().int().positive(),
  storedCount: z.number().int().min(0),
  timeAgo: z.string().optional(),
  tag: z.string().optional(),
});

export type ArmazenagemDemanda = z.infer<typeof armazenagemDemandaSchema>;

export const armazenagemItemSchema = z.object({
  id: z.string(),
  codigoProduto: z.string(),
  nomeProduto: z.string(),
  enderecoPickingDesignado: z.string(),
  enderecoSugeridoId: z.string().nullable().optional(),
  status: armazenagemItemStatusSchema,
  sequence: z.number().int().positive(),
  quantidadeSolicitadaCaixas: z.number().int().min(0),
  quantidadeSolicitadaUnidades: z.number().int().min(0),
  quantidadeGuardadaCaixas: z.number().int().min(0).optional(),
  quantidadeGuardadaUnidades: z.number().int().min(0).optional(),
});

export type ArmazenagemItem = z.infer<typeof armazenagemItemSchema>;

export const armazenagemDemandaFilterSchema = z.enum(['all', 'urgente', 'normal']);

export type ArmazenagemDemandaFilter = z.infer<typeof armazenagemDemandaFilterSchema>;

export const armazenagemFormSchema = z
  .object({
    codigoProduto: z.string().min(1, 'Informe o produto'),
    enderecoPicking: z.string().min(1, 'Informe o endereço de picking'),
    quantidadeCaixas: z.coerce.number().int().min(0, 'Quantidade inválida'),
    quantidadeUnidades: z.coerce.number().int().min(0, 'Quantidade inválida'),
  })
  .refine((data) => data.quantidadeCaixas > 0 || data.quantidadeUnidades > 0, {
    message: 'Informe caixas ou unidades',
    path: ['quantidadeUnidades'],
  });

export type ArmazenagemForm = z.infer<typeof armazenagemFormSchema>;

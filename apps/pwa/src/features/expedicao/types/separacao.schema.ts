import { z } from 'zod';

export const separacaoPrioritySchema = z.enum(['urgente', 'normal']);

export type SeparacaoPriority = z.infer<typeof separacaoPrioritySchema>;

export const separacaoItemStatusSchema = z.enum([
  'pendente',
  'em_andamento',
  'separado',
  'parcial',
  'esgotado',
]);

export type SeparacaoItemStatus = z.infer<typeof separacaoItemStatusSchema>;

export const separacaoOrderSchema = z.object({
  id: z.string(),
  routeId: z.string(),
  destino: z.string(),
  zona: z.string(),
  priority: separacaoPrioritySchema,
  isPriority: z.boolean().optional(),
  itemCount: z.number().int().positive(),
  pickedCount: z.number().int().min(0),
  timeAgo: z.string().optional(),
  tag: z.string().optional(),
});

export type SeparacaoOrder = z.infer<typeof separacaoOrderSchema>;

export const separacaoItemSchema = z.object({
  id: z.string(),
  endereco: z.string(),
  codigoProduto: z.string(),
  nomeProduto: z.string(),
  status: separacaoItemStatusSchema,
  sequence: z.number().int().positive(),
  quantidadeSolicitadaCaixas: z.number().int().min(0),
  quantidadeSolicitadaUnidades: z.number().int().min(0),
  quantidadeSeparadaCaixas: z.number().int().min(0).optional(),
  quantidadeSeparadaUnidades: z.number().int().min(0).optional(),
});

export type SeparacaoItem = z.infer<typeof separacaoItemSchema>;

export const separacaoOrderFilterSchema = z.enum(['all', 'urgente', 'normal']);

export type SeparacaoOrderFilter = z.infer<typeof separacaoOrderFilterSchema>;

export const separacaoFormSchema = z
  .object({
    enderecoColeta: z.string().min(1, 'Informe o endereço'),
    codigoProduto: z.string().min(1, 'Informe o produto'),
    quantidadeCaixas: z.coerce.number().int().min(0, 'Quantidade inválida'),
    quantidadeUnidades: z.coerce.number().int().min(0, 'Quantidade inválida'),
  })
  .refine((data) => data.quantidadeCaixas > 0 || data.quantidadeUnidades > 0, {
    message: 'Informe caixas ou unidades',
    path: ['quantidadeUnidades'],
  });

export type SeparacaoForm = z.infer<typeof separacaoFormSchema>;

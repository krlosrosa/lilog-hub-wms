import { z } from 'zod';

export const inventoryDemandTypeSchema = z.enum(['cega', 'validacao']);

export type InventoryDemandType = z.infer<typeof inventoryDemandTypeSchema>;

export const inventoryDemandSchema = z.object({
  id: z.string(),
  type: inventoryDemandTypeSchema,
  zone: z.string(),
  aisle: z.string(),
  routeId: z.string(),
  isPriority: z.boolean().optional(),
  assignedUserAvatar: z.string().url().optional(),
  timeAgo: z.string().optional(),
  tag: z.string().optional(),
});

export type InventoryDemand = z.infer<typeof inventoryDemandSchema>;

export const inventoryAddressStatusSchema = z.enum([
  'pendente',
  'em_andamento',
  'conferido',
]);

export type InventoryAddressStatus = z.infer<typeof inventoryAddressStatusSchema>;

export const inventoryAddressSchema = z.object({
  id: z.string(),
  endereco: z.string(),
  produto: z.string().optional(),
  status: inventoryAddressStatusSchema,
  sequence: z.number().int().positive(),
});

export type InventoryAddress = z.infer<typeof inventoryAddressSchema>;

export const inventoryDemandFilterSchema = z.enum(['all', 'cega', 'validacao']);

export type InventoryDemandFilter = z.infer<typeof inventoryDemandFilterSchema>;

export const contagemCegaFormSchema = z
  .object({
    enderecoArmazenagem: z.string().min(1, 'Informe o endereço'),
    codigoProduto: z.string().min(1, 'Informe o produto'),
    quantidadeCaixas: z.coerce.number().int().min(0, 'Quantidade inválida'),
    quantidadeUnidades: z.coerce.number().int().min(0, 'Quantidade inválida'),
    lote: z.string().min(1, 'Informe o lote'),
    peso: z.coerce.number().min(0.01, 'Informe o peso'),
  })
  .refine((data) => data.quantidadeCaixas > 0 || data.quantidadeUnidades > 0, {
    message: 'Informe caixas ou unidades',
    path: ['quantidadeUnidades'],
  });

export type ContagemCegaForm = z.infer<typeof contagemCegaFormSchema>;

export const contagemValidacaoFormSchema = z.object({
  enderecoConfirmado: z.string().optional(),
  sscc: z.string().optional(),
  enderecoVazio: z.boolean(),
  anomaliaEncontrada: z.boolean(),
  quantidadeCaixas: z.coerce.number().int().min(0),
  quantidadeUnidades: z.coerce.number().int().min(0),
  lote: z.string().optional(),
  peso: z.coerce.number().min(0).optional(),
});

export type ContagemValidacaoForm = z.infer<typeof contagemValidacaoFormSchema>;

const contagemAvariaQuantidadeInt = z.coerce
  .number()
  .int('Use um número inteiro')
  .min(0, 'Valor inválido');

export const contagemAvariaFormSchema = z
  .object({
    motivo: z.string().min(1, 'Selecione o motivo'),
    quantidadeCaixas: contagemAvariaQuantidadeInt,
    quantidadeUnidades: contagemAvariaQuantidadeInt,
  })
  .refine((data) => data.quantidadeCaixas > 0 || data.quantidadeUnidades > 0, {
    message: 'Informe caixas e/ou unidades avariadas',
    path: ['quantidadeUnidades'],
  });

export type ContagemAvariaForm = z.infer<typeof contagemAvariaFormSchema>;

export const contagemAvariaOrigemSchema = z.enum(['cega', 'validacao']);

export type ContagemAvariaOrigem = z.infer<typeof contagemAvariaOrigemSchema>;

export const contagemAvariaRegistroSchema = z.object({
  id: z.string(),
  demandaId: z.string(),
  endereco: z.string(),
  motivo: z.string(),
  quantidadeCaixas: z.number().int().min(0),
  quantidadeUnidades: z.number().int().min(0),
  photoCount: z.number().int().min(0),
  sku: z.string().optional(),
  registradoEm: z.string(),
});

export type ContagemAvariaRegistro = z.infer<typeof contagemAvariaRegistroSchema>;

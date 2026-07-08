import { z } from 'zod';

export const elementTypeSchema = z.enum([
  'estante',
  'corredor',
  'doca',
  'staging',
  'saida',
]);

export type ElementType = z.infer<typeof elementTypeSchema>;

export const builderToolSchema = z.union([
  z.literal('selecionar'),
  elementTypeSchema,
]);

export type BuilderTool = z.infer<typeof builderToolSchema>;

export const layoutElementSchema = z.object({
  id: z.string(),
  type: elementTypeSchema,
  gx: z.number().int().nonnegative(),
  gy: z.number().int().nonnegative(),
  gw: z.number().int().positive(),
  gh: z.number().int().positive(),
  label: z.string().min(1),
  levels: z.number().int().min(1).max(5).optional(),
  zona: z.string().max(2).optional(),
});

export type LayoutElement = z.infer<typeof layoutElementSchema>;

export const warehouseLayoutSchema = z.object({
  name: z.string().min(1),
  gridCols: z.number().int().positive(),
  gridRows: z.number().int().positive(),
  elements: z.array(layoutElementSchema),
});

export type WarehouseLayout = z.infer<typeof warehouseLayoutSchema>;

import { z } from 'zod';

export const ArmazemLayoutElementoTipoSchema = z.enum([
  'estante',
  'corredor',
  'doca',
  'staging',
  'saida',
]);

export type ArmazemLayoutElementoTipo = z.infer<
  typeof ArmazemLayoutElementoTipoSchema
>;

export const SaveArmazemLayoutElementInputSchema = z.object({
  id: z.string().min(1).max(64),
  type: ArmazemLayoutElementoTipoSchema,
  gx: z.number().int().nonnegative(),
  gy: z.number().int().nonnegative(),
  gw: z.number().int().positive(),
  gh: z.number().int().positive(),
  label: z.string().min(1).max(100),
  levels: z.number().int().min(1).max(5).optional(),
  zona: z.string().max(2).optional(),
});

export type SaveArmazemLayoutElementInput = z.infer<
  typeof SaveArmazemLayoutElementInputSchema
>;

export const SaveArmazemLayoutInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  gridCols: z.number().int().positive(),
  gridRows: z.number().int().positive(),
  elements: z.array(SaveArmazemLayoutElementInputSchema),
});

export type SaveArmazemLayoutInput = z.infer<
  typeof SaveArmazemLayoutInputSchema
>;

export const VincularSlotEnderecoInputSchema = z.object({
  slotId: z.uuid(),
  enderecoId: z.uuid().nullable(),
});

export type VincularSlotEnderecoInput = z.infer<
  typeof VincularSlotEnderecoInputSchema
>;

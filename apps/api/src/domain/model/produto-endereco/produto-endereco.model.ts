import { z } from 'zod';

export const ProdutoEnderecoPapelSchema = z.enum([
  'picking_primario',
  'picking_secundario',
  'pulmao',
]);

export type ProdutoEnderecoPapel = z.infer<typeof ProdutoEnderecoPapelSchema>;

export const CreateProdutoEnderecoInputSchema = z.object({
  centroId: z.uuid(),
  produtoId: z.uuid(),
  enderecoId: z.uuid(),
  papel: ProdutoEnderecoPapelSchema,
  ordem: z.number().int().min(1).max(32767).default(1),
  ativo: z.boolean().default(true),
});

export type CreateProdutoEnderecoData = z.infer<
  typeof CreateProdutoEnderecoInputSchema
>;

export const UpdateProdutoEnderecoInputSchema = z.object({
  enderecoId: z.uuid().optional(),
  papel: ProdutoEnderecoPapelSchema.optional(),
  ordem: z.number().int().min(1).max(32767).optional(),
  ativo: z.boolean().optional(),
});

export type UpdateProdutoEnderecoData = z.infer<
  typeof UpdateProdutoEnderecoInputSchema
>;

export function enderecoTipoEsperadoParaPapel(
  papel: ProdutoEnderecoPapel,
): 'picking' | 'pulmao' {
  return papel === 'pulmao' ? 'pulmao' : 'picking';
}

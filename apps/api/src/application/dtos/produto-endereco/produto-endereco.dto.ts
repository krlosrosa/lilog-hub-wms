import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ProdutoEnderecoPapelSchema } from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import { EnderecoTipoSchema } from '../../../domain/model/endereco/endereco.model.js';

export const ListProdutoEnderecosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  centroId: z.uuid().optional(),
  unidadeId: z.string().min(1).max(50).optional(),
  produtoId: z.uuid().optional(),
  papel: ProdutoEnderecoPapelSchema.optional(),
  ativo: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: z.string().optional(),
});

export class ListProdutoEnderecosQueryDto extends createZodDto(
  ListProdutoEnderecosQuerySchema,
) {}

export const ProdutoEnderecoResponseSchema = z.object({
  id: z.uuid(),
  centroId: z.uuid(),
  produtoId: z.uuid(),
  enderecoId: z.uuid(),
  papel: ProdutoEnderecoPapelSchema,
  ordem: z.number().int(),
  ativo: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  produto: z.object({
    sku: z.string(),
    descricao: z.string(),
    produtoId: z.string(),
  }),
  endereco: z.object({
    enderecoMascarado: z.string(),
    tipo: EnderecoTipoSchema,
    zona: z.string(),
  }),
  centro: z.object({
    centro: z.string(),
    nome: z.string(),
    empresa: z.string(),
  }),
});

export class ProdutoEnderecoResponseDto extends createZodDto(
  ProdutoEnderecoResponseSchema,
) {}

export const ListProdutoEnderecosResponseSchema = z.object({
  items: z.array(ProdutoEnderecoResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListProdutoEnderecosResponseDto extends createZodDto(
  ListProdutoEnderecosResponseSchema,
) {}

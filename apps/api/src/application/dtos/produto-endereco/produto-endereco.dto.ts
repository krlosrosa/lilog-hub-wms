import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ProdutoEnderecoPapelSchema } from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import { EnderecoTipoSchema } from '../../../domain/model/endereco/endereco.model.js';

export const ListProdutoEnderecosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  centroId: z.uuid().optional(),
  unidadeId: z.string().min(1).max(50).optional(),
  produtoId: z.string().min(1).max(50).optional(),
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
  produtoId: z.string().min(1).max(50),
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

export const ExportProdutoEnderecosQuerySchema = z.object({
  centroId: z.uuid(),
  unidadeId: z.string().min(1).max(50).optional(),
  tipo: EnderecoTipoSchema.optional(),
  search: z.string().optional(),
  slotting: z.enum(['com_produto', 'sem_produto']).optional(),
});

export class ExportProdutoEnderecosQueryDto extends createZodDto(
  ExportProdutoEnderecosQuerySchema,
) {}

export const ImportProdutoEnderecosResponseSchema = z.object({
  total: z.number().int(),
  inserted: z.number().int(),
  updated: z.number().int(),
  errors: z.array(
    z.object({
      linha: z.number().int(),
      endereco: z.string(),
      sku: z.string(),
      campo: z.string(),
      mensagem: z.string(),
    }),
  ),
});

export class ImportProdutoEnderecosResponseDto extends createZodDto(
  ImportProdutoEnderecosResponseSchema,
) {}

export const SlottingSortColumnSchema = z.enum([
  'endereco',
  'zona',
  'tipo',
  'produto',
  'papel',
  'ordem',
  'status',
]);

export const SlottingSortOrderSchema = z.enum(['asc', 'desc']);

export const ListSlottingProdutoEnderecosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  centroId: z.uuid(),
  unidadeId: z.string().min(1).max(50).optional(),
  tipo: EnderecoTipoSchema.optional(),
  search: z.string().optional(),
  zonas: z
    .string()
    .optional()
    .transform((value) =>
      value
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  slotting: z.enum(['com_produto', 'sem_produto']).optional(),
  papel: ProdutoEnderecoPapelSchema.optional(),
  ativo: z.enum(['ativos', 'inativos']).optional(),
  searchProduto: z.string().optional(),
  sortBy: SlottingSortColumnSchema.default('endereco'),
  sortOrder: SlottingSortOrderSchema.default('asc'),
});

export class ListSlottingProdutoEnderecosQueryDto extends createZodDto(
  ListSlottingProdutoEnderecosQuerySchema,
) {}

export const SlottingAlocacaoResponseSchema = z.object({
  id: z.uuid(),
  produtoId: z.string().min(1).max(50),
  papel: ProdutoEnderecoPapelSchema,
  ordem: z.number().int(),
  ativo: z.boolean(),
  produto: z.object({
    sku: z.string(),
    descricao: z.string(),
    produtoId: z.string(),
  }),
});

export const SlottingEnderecoResponseSchema = z.object({
  enderecoId: z.uuid(),
  enderecoMascarado: z.string(),
  zona: z.string(),
  rua: z.string(),
  tipo: EnderecoTipoSchema,
  alocacao: SlottingAlocacaoResponseSchema.nullable(),
});

export class SlottingEnderecoResponseDto extends createZodDto(
  SlottingEnderecoResponseSchema,
) {}

export const ListSlottingProdutoEnderecosResponseSchema = z.object({
  items: z.array(SlottingEnderecoResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListSlottingProdutoEnderecosResponseDto extends createZodDto(
  ListSlottingProdutoEnderecosResponseSchema,
) {}

export const ListGruposEnderecosQuerySchema = z.object({
  centroId: z.uuid(),
});

export class ListGruposEnderecosQueryDto extends createZodDto(
  ListGruposEnderecosQuerySchema,
) {}

export const GrupoComEnderecosResponseSchema = z.object({
  grupo: z.string(),
  enderecoIds: z.array(z.uuid()),
});

export const ListGruposEnderecosResponseSchema = z.array(
  GrupoComEnderecosResponseSchema,
);

export class ListGruposEnderecosResponseDto extends createZodDto(
  ListGruposEnderecosResponseSchema,
) {}

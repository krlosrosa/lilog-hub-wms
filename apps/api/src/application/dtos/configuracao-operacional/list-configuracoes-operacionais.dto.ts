import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  ParametrosCarregamentoSchema,
  ParametrosConferenciaSchema,
  ParametrosPausaSchema,
  ParametrosSeparacaoSchema,
  SubtipoConfiguracaoSchema,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';

export const ParametrosConfiguracaoOperacionalResponseSchema = z.union([
  ParametrosSeparacaoSchema,
  ParametrosConferenciaSchema,
  ParametrosCarregamentoSchema,
  ParametrosPausaSchema,
]);

export const ConfiguracaoOperacionalResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  dominio: z.string(),
  categoria: z.string(),
  subtipo: SubtipoConfiguracaoSchema,
  nome: z.string(),
  descricao: z.string().nullable(),
  parametros: ParametrosConfiguracaoOperacionalResponseSchema,
  versaoSchema: z.number().int(),
  isPadrao: z.boolean(),
  ativo: z.boolean(),
  criadoPor: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class ConfiguracaoOperacionalResponseDto extends createZodDto(
  ConfiguracaoOperacionalResponseSchema,
) {}

export const ListConfiguracoesOperacionaisQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  dominio: z.string().min(1).max(50).optional(),
  categoria: z.string().min(1).max(50).optional(),
  subtipo: SubtipoConfiguracaoSchema.optional(),
  ativo: z.coerce.boolean().optional(),
});

export class ListConfiguracoesOperacionaisQueryDto extends createZodDto(
  ListConfiguracoesOperacionaisQuerySchema,
) {}

export const ListConfiguracoesOperacionaisResponseSchema = z.object({
  items: z.array(ConfiguracaoOperacionalResponseSchema),
});

export class ListConfiguracoesOperacionaisResponseDto extends createZodDto(
  ListConfiguracoesOperacionaisResponseSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  ConfiguracaoImpressaoConteudoSchema,
  TemplatesHtmlSchema,
} from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';

export const ConfiguracaoImpressaoResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  nome: z.string(),
  configuracao: ConfiguracaoImpressaoConteudoSchema,
  templatesHtml: TemplatesHtmlSchema,
  isPadrao: z.boolean(),
  criadoPor: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class ConfiguracaoImpressaoResponseDto extends createZodDto(
  ConfiguracaoImpressaoResponseSchema,
) {}

export const ListConfiguracoesImpressaoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class ListConfiguracoesImpressaoQueryDto extends createZodDto(
  ListConfiguracoesImpressaoQuerySchema,
) {}

export const ListConfiguracoesImpressaoResponseSchema = z.object({
  items: z.array(ConfiguracaoImpressaoResponseSchema),
});

export class ListConfiguracoesImpressaoResponseDto extends createZodDto(
  ListConfiguracoesImpressaoResponseSchema,
) {}

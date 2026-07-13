import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  CncItemTipoSchema,
  CncResponsavelSchema,
  CncSituacaoSchema,
  CncSubtipoOcorrenciaSchema,
} from '../../../domain/model/cnc/cnc.model.js';

const dateInputSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

export const ListCncItensQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50),
  dataInicio: dateInputSchema,
  dataFim: dateInputSchema,
  situacao: CncSituacaoSchema.optional(),
  tipo: CncItemTipoSchema.optional(),
});

export class ListCncItensQueryDto extends createZodDto(ListCncItensQuerySchema) {}

export const CncItemListadoResponseSchema = z.object({
  id: z.uuid(),
  cncId: z.uuid(),
  cncNumero: z.string(),
  cncSituacao: CncSituacaoSchema,
  tipo: CncItemTipoSchema,
  referenciaId: z.uuid(),
  produtoId: z.string().nullable(),
  sku: z.string().nullable(),
  descricaoProduto: z.string().nullable(),
  subtipoOcorrencia: CncSubtipoOcorrenciaSchema.nullable(),
  quantidadeEsperada: z.number().nullable(),
  quantidadeRecebida: z.number().nullable(),
  quantidadeDivergente: z.number().nullable(),
  quantidadeCaixas: z.number().int().nullable(),
  quantidadeUnidades: z.number().int().nullable(),
  unidadeMedida: z.string().nullable(),
  loteEsperado: z.string().nullable(),
  loteRecebido: z.string().nullable(),
  validadeEsperada: z.iso.datetime().nullable(),
  validadeRecebida: z.iso.datetime().nullable(),
  pesoEsperado: z.number().nullable(),
  pesoRecebido: z.number().nullable(),
  naturezaAvaria: z.string().nullable(),
  causaAvaria: z.string().nullable(),
  tipoAvaria: z.string().nullable(),
  shelfLifeDias: z.number().int().nullable(),
  descricaoDetalhe: z.string().nullable(),
  responsavelSugerido: CncResponsavelSchema.nullable(),
  createdAt: z.iso.datetime(),
});

export class CncItemListadoResponseDto extends createZodDto(
  CncItemListadoResponseSchema,
) {}

export const ListCncItensResponseSchema = z.object({
  items: z.array(CncItemListadoResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export class ListCncItensResponseDto extends createZodDto(
  ListCncItensResponseSchema,
) {}

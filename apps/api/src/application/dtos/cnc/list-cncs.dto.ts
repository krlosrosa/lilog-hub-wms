import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  CncItemTipoSchema,
  CncOrigemSchema,
  CncOpcoesImpressaoSchema,
  CncResponsavelSchema,
  CncSituacaoSchema,
  CncSubtipoOcorrenciaSchema,
  CncTratativaStatusSchema,
  CncTratativaTipoSchema,
} from '../../../domain/model/cnc/cnc.model.js';

export { CncOpcoesImpressaoSchema };

export const ListCncsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50),
  situacao: CncSituacaoSchema.optional(),
  origemId: z.uuid().optional(),
});

export class ListCncsQueryDto extends createZodDto(ListCncsQuerySchema) {}

export const CncItemResponseSchema = z.object({
  id: z.uuid(),
  cncId: z.uuid(),
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

export class CncItemResponseDto extends createZodDto(CncItemResponseSchema) {}

export const CncEventoResponseSchema = z.object({
  id: z.uuid(),
  cncId: z.uuid(),
  tipoEvento: z.string(),
  situacaoAnterior: z.string().nullable(),
  situacaoNova: z.string().nullable(),
  descricao: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
});

export const CncTratativaResponseSchema = z.object({
  id: z.uuid(),
  cncId: z.uuid(),
  tipo: CncTratativaTipoSchema,
  descricao: z.string(),
  responsavelTipo: CncResponsavelSchema,
  prazo: z.iso.datetime().nullable(),
  concluidaEm: z.iso.datetime().nullable(),
  concluidaPorUserId: z.number().int().nullable(),
  status: CncTratativaStatusSchema,
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CncResponseSchema = z.object({
  id: z.uuid(),
  numero: z.string(),
  origem: CncOrigemSchema,
  origemId: z.uuid(),
  unidadeId: z.string(),
  responsavel: CncResponsavelSchema,
  responsavelId: z.string().nullable(),
  descricao: z.string().nullable(),
  observacao: z.string().nullable(),
  situacao: CncSituacaoSchema,
  solicitanteId: z.number().int(),
  analistaId: z.number().int().nullable(),
  iniciadoEm: z.iso.datetime().nullable(),
  encerradoEm: z.iso.datetime().nullable(),
  encerradoPorUserId: z.number().int().nullable(),
  valorDebito: z.number().nullable(),
  opcoesImpressao: CncOpcoesImpressaoSchema.nullable(),
  itens: z.array(CncItemResponseSchema).optional(),
  tratativas: z.array(CncTratativaResponseSchema).optional(),
  eventos: z.array(CncEventoResponseSchema).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class CncResponseDto extends createZodDto(CncResponseSchema) {}

export const ListCncsResponseSchema = z.object({
  items: z.array(CncResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListCncsResponseDto extends createZodDto(ListCncsResponseSchema) {}

export const AdicionarTratativaCncBodySchema = z.object({
  tipo: CncTratativaTipoSchema,
  descricao: z.string().min(1),
  responsavelTipo: CncResponsavelSchema,
  prazo: z.iso.datetime().nullable().optional(),
});

export class AdicionarTratativaCncBodyDto extends createZodDto(
  AdicionarTratativaCncBodySchema,
) {}

export const EncerrarCncBodySchema = z.object({
  responsavel: CncResponsavelSchema.optional(),
  responsavelId: z.string().min(1).max(50).nullable().optional(),
  valorDebito: z.number().nonnegative().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

export class EncerrarCncBodyDto extends createZodDto(EncerrarCncBodySchema) {}

export const CancelarCncBodySchema = z.object({
  observacao: z.string().min(1),
});

export class CancelarCncBodyDto extends createZodDto(CancelarCncBodySchema) {}

export class CncTratativaResponseDto extends createZodDto(
  CncTratativaResponseSchema,
) {}

export const ListCncTratativasResponseSchema = z.object({
  items: z.array(CncTratativaResponseSchema),
});

export class ListCncTratativasResponseDto extends createZodDto(
  ListCncTratativasResponseSchema,
) {}

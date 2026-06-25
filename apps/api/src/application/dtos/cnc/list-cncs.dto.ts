import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  CncItemTipoSchema,
  CncOrigemSchema,
  CncResponsavelSchema,
  CncSituacaoSchema,
} from '../../../domain/model/cnc/cnc.model.js';

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
  createdAt: z.iso.datetime(),
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
  acaoImediata: z.string().nullable(),
  acaoCorretiva: z.string().nullable(),
  situacao: CncSituacaoSchema,
  solicitanteId: z.number().int(),
  aprovadorId: z.number().int().nullable(),
  dataAprovacao: z.iso.datetime().nullable(),
  observacaoAprovador: z.string().nullable(),
  valorDebito: z.number().nullable(),
  debitoConfirmado: z.boolean(),
  itens: z.array(CncItemResponseSchema).optional(),
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

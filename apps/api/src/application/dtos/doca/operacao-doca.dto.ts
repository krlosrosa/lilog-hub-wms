import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  OperacaoDocaPrioridadeSchema,
  OperacaoDocaSituacaoSchema,
  OperacaoDocaTipoSchema,
} from '../../../domain/model/doca/doca.model.js';

export const ListOperacoesDocaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  docaId: z.uuid().optional(),
  situacao: OperacaoDocaSituacaoSchema.optional(),
  dataPrevistaFrom: z.iso.datetime().optional(),
  dataPrevistaTo: z.iso.datetime().optional(),
});

export class ListOperacoesDocaQueryDto extends createZodDto(
  ListOperacoesDocaQuerySchema,
) {}

export const OperacaoDocaResponseSchema = z.object({
  id: z.uuid(),
  docaId: z.uuid(),
  tipoOperacao: OperacaoDocaTipoSchema,
  veiculoId: z.uuid(),
  transportadoraId: z.uuid(),
  motorista: z.string().nullable(),
  dataPrevista: z.iso.datetime().nullable(),
  dataInicio: z.iso.datetime().nullable(),
  dataFim: z.iso.datetime().nullable(),
  situacao: OperacaoDocaSituacaoSchema,
  prioridade: OperacaoDocaPrioridadeSchema,
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class OperacaoDocaResponseDto extends createZodDto(
  OperacaoDocaResponseSchema,
) {}

export const ListOperacoesDocaResponseSchema = z.object({
  items: z.array(OperacaoDocaResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListOperacoesDocaResponseDto extends createZodDto(
  ListOperacoesDocaResponseSchema,
) {}

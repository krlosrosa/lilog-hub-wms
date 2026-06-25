import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import type { ClienteEspecialRecord } from '../../../domain/repositories/expedicao/cliente-especial.repository.js';

export const ClienteEspecialResponseSchema = z.object({
  id: z.string().uuid(),
  unidadeId: z.string(),
  codCliente: z.string(),
  nomeCliente: z.string(),
  ativo: z.boolean(),
  exigeSegregacaoMapa: z.boolean(),
  exigeSeparacaoEspecial: z.boolean(),
  exigeCarregamentoEspecial: z.boolean(),
  observacaoSeparacao: z.string().nullable(),
  observacaoCarregamento: z.string().nullable(),
  observacaoGeral: z.string().nullable(),
  criadoPor: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class ClienteEspecialResponseDto extends createZodDto(
  ClienteEspecialResponseSchema,
) {}

export const ListClientesEspeciaisQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === 'true',
    ),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export class ListClientesEspeciaisQueryDto extends createZodDto(
  ListClientesEspeciaisQuerySchema,
) {}

export const ListClientesEspeciaisResponseSchema = z.object({
  items: z.array(ClienteEspecialResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListClientesEspeciaisResponseDto extends createZodDto(
  ListClientesEspeciaisResponseSchema,
) {}

export function mapClienteEspecialToResponse(record: ClienteEspecialRecord) {
  return {
    id: record.id,
    unidadeId: record.unidadeId,
    codCliente: record.codCliente,
    nomeCliente: record.nomeCliente,
    ativo: record.ativo,
    exigeSegregacaoMapa: record.exigeSegregacaoMapa,
    exigeSeparacaoEspecial: record.exigeSeparacaoEspecial,
    exigeCarregamentoEspecial: record.exigeCarregamentoEspecial,
    observacaoSeparacao: record.observacaoSeparacao,
    observacaoCarregamento: record.observacaoCarregamento,
    observacaoGeral: record.observacaoGeral,
    criadoPor: record.criadoPor,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  BuscarProcessoDebitoResponseSchema,
  InteracaoAutorSchema,
  InteracaoTipoTransportadoraSchema,
  ProcessoDebitoListItemSchema,
  ProcessoDebitoStatusSchema,
} from '../cobranca-transportadora/listar-processos-debito.dto.js';

export const InteracaoTipoPortalSchema = InteracaoTipoTransportadoraSchema;

export const ListarProcessosDebitoPortalQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50).optional(),
  status: ProcessoDebitoStatusSchema.optional(),
});

export class ListarProcessosDebitoPortalQueryDto extends createZodDto(
  ListarProcessosDebitoPortalQuerySchema,
) {}

export const ListarProcessosDebitoPortalResponseSchema = z.object({
  processos: z.array(ProcessoDebitoListItemSchema),
});

export class ListarProcessosDebitoPortalResponseDto extends createZodDto(
  ListarProcessosDebitoPortalResponseSchema,
) {}

export const BuscarProcessoDebitoPortalResponseSchema =
  BuscarProcessoDebitoResponseSchema;

export class BuscarProcessoDebitoPortalResponseDto extends createZodDto(
  BuscarProcessoDebitoPortalResponseSchema,
) {}

export const RegistrarInteracaoPortalBodySchema = z.object({
  tipo: InteracaoTipoPortalSchema,
  descricao: z.string().min(10).max(2000),
  anexoChaves: z.array(z.string()).max(5).default([]),
});

export class RegistrarInteracaoPortalBodyDto extends createZodDto(
  RegistrarInteracaoPortalBodySchema,
) {}

export const RegistrarInteracaoPortalResponseSchema = z.object({
  id: z.uuid(),
  processoDebitoId: z.uuid(),
  autor: InteracaoAutorSchema,
  tipo: InteracaoTipoPortalSchema,
  descricao: z.string(),
  anexoChaves: z.array(z.string()),
  createdAt: z.iso.datetime(),
  statusProcesso: ProcessoDebitoStatusSchema,
});

export class RegistrarInteracaoPortalResponseDto extends createZodDto(
  RegistrarInteracaoPortalResponseSchema,
) {}

export const UploadInteracaoAnexoPortalResponseSchema = z.object({
  chave: z.string(),
});

export class UploadInteracaoAnexoPortalResponseDto extends createZodDto(
  UploadInteracaoAnexoPortalResponseSchema,
) {}

/** @deprecated Use InteracaoTipoPortalSchema */
export const TipoContestacaoSchema = InteracaoTipoPortalSchema;

/** @deprecated Use RegistrarInteracaoPortalBodySchema */
export const RegistrarReplicaPortalBodySchema = RegistrarInteracaoPortalBodySchema;

/** @deprecated Use RegistrarInteracaoPortalBodyDto */
export class RegistrarReplicaPortalBodyDto extends createZodDto(
  RegistrarReplicaPortalBodySchema,
) {}

/** @deprecated Use RegistrarInteracaoPortalResponseSchema */
export const RegistrarReplicaPortalResponseSchema =
  RegistrarInteracaoPortalResponseSchema;

/** @deprecated Use RegistrarInteracaoPortalResponseDto */
export class RegistrarReplicaPortalResponseDto extends createZodDto(
  RegistrarReplicaPortalResponseSchema,
) {}

/** @deprecated Use UploadInteracaoAnexoPortalResponseSchema */
export const UploadReplicaAnexoPortalResponseSchema =
  UploadInteracaoAnexoPortalResponseSchema;

/** @deprecated Use UploadInteracaoAnexoPortalResponseDto */
export class UploadReplicaAnexoPortalResponseDto extends createZodDto(
  UploadReplicaAnexoPortalResponseSchema,
) {}

export const ListarNotificacoesPortalQuerySchema = z.object({
  apenasNaoLidas: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export class ListarNotificacoesPortalQueryDto extends createZodDto(
  ListarNotificacoesPortalQuerySchema,
) {}

export const NotificacaoPortalItemSchema = z.object({
  id: z.uuid(),
  tipo: z.enum(['novo_debito', 'status_atualizado', 'nova_interacao']),
  titulo: z.string(),
  mensagem: z.string(),
  rotaDestino: z.string(),
  lida: z.boolean(),
  createdAt: z.iso.datetime(),
});

export const ListarNotificacoesPortalResponseSchema = z.object({
  notificacoes: z.array(NotificacaoPortalItemSchema),
  totalNaoLidas: z.number(),
});

export class ListarNotificacoesPortalResponseDto extends createZodDto(
  ListarNotificacoesPortalResponseSchema,
) {}

export const MarcarNotificacoesLidasBodySchema = z.object({
  ids: z.array(z.uuid()).min(1).max(50),
});

export class MarcarNotificacoesLidasBodyDto extends createZodDto(
  MarcarNotificacoesLidasBodySchema,
) {}

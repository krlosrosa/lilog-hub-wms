import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  SessaoPresencaStatusSchema,
  SessaoTrabalhoStatusSchema,
} from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';

export const ListSessoesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50),
  status: SessaoTrabalhoStatusSchema.optional(),
  dataReferencia: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export class ListSessoesQueryDto extends createZodDto(ListSessoesQuerySchema) {}

export const SessaoListItemSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  escalaId: z.uuid(),
  equipeId: z.uuid(),
  dataReferencia: z.string(),
  inicioPlanejado: z.iso.datetime(),
  fimPlanejado: z.iso.datetime(),
  inicioReal: z.iso.datetime().nullable(),
  fimReal: z.iso.datetime().nullable(),
  status: SessaoTrabalhoStatusSchema,
  escalaNome: z.string(),
  equipeNome: z.string(),
  horaInicioPlanejada: z.string(),
  horaFimPlanejada: z.string(),
  cruzaMeiaNoite: z.boolean(),
  totalFuncionarios: z.number().int().nonnegative(),
  abertaPorUserId: z.number().int().nullable(),
  encerradaPorUserId: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class SessaoListItemDto extends createZodDto(SessaoListItemSchema) {}

export const SessaoDetailSchema = SessaoListItemSchema;

export class SessaoDetailDto extends createZodDto(SessaoDetailSchema) {}

export const ListSessoesResponseSchema = z.object({
  items: z.array(SessaoListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListSessoesResponseDto extends createZodDto(
  ListSessoesResponseSchema,
) {}

export const SessaoFuncionarioSchema = z.object({
  id: z.uuid(),
  funcionarioId: z.number().int().positive(),
  matricula: z.string(),
  nome: z.string(),
  cargo: z.string(),
  status: SessaoPresencaStatusSchema,
  checkIn: z.iso.datetime().nullable(),
  checkOut: z.iso.datetime().nullable(),
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class SessaoFuncionarioDto extends createZodDto(SessaoFuncionarioSchema) {}

export const ListSessaoFuncionariosResponseSchema = z.object({
  items: z.array(SessaoFuncionarioSchema),
});

export class ListSessaoFuncionariosResponseDto extends createZodDto(
  ListSessaoFuncionariosResponseSchema,
) {}

export const CreateSessaoResponseSchema = SessaoDetailSchema;

export class CreateSessaoResponseDto extends createZodDto(
  CreateSessaoResponseSchema,
) {}

export const SessaoPausaTipoSchema = z.enum(['termica', 'refeicao', 'outros']);

export const SessaoFuncionarioPausaSchema = z.object({
  id: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
  tipo: SessaoPausaTipoSchema,
  inicio: z.iso.datetime(),
  fim: z.iso.datetime().nullable(),
  registradoPorUserId: z.number().int().nullable(),
  observacao: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class SessaoFuncionarioPausaDto extends createZodDto(
  SessaoFuncionarioPausaSchema,
) {}

export const ListSessaoFuncionarioPausasResponseSchema = z.object({
  items: z.array(SessaoFuncionarioPausaSchema),
  totalPausasMinutos: z.number().int().nonnegative(),
  emPausaAgora: SessaoFuncionarioPausaSchema.nullable(),
});

export class ListSessaoFuncionarioPausasResponseDto extends createZodDto(
  ListSessaoFuncionarioPausasResponseSchema,
) {}

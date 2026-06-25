import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { HorarioEscalaSchema } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';

export const ListEscalasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().min(1).max(50),
});

export class ListEscalasQueryDto extends createZodDto(ListEscalasQuerySchema) {}

export const EscalaListItemSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  equipeId: z.uuid(),
  nome: z.string(),
  horaInicioPlanejada: z.string(),
  horaFimPlanejada: z.string(),
  cruzaMeiaNoite: z.boolean(),
  ativo: z.boolean(),
  equipeNome: z.string(),
  equipeArea: z.string().nullable(),
  totalFuncionarios: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class EscalaListItemDto extends createZodDto(EscalaListItemSchema) {}

export const ListEscalasResponseSchema = z.object({
  items: z.array(EscalaListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListEscalasResponseDto extends createZodDto(
  ListEscalasResponseSchema,
) {}

export const EscalaDetailSchema = EscalaListItemSchema;

export class EscalaDetailDto extends createZodDto(EscalaDetailSchema) {}

export const EscalaFuncionarioSchema = z.object({
  id: z.uuid(),
  funcionarioId: z.number().int().positive(),
  matricula: z.string(),
  nome: z.string(),
  cargo: z.string(),
  vigenciaInicio: z.string().nullable(),
  vigenciaFim: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export class EscalaFuncionarioDto extends createZodDto(EscalaFuncionarioSchema) {}

export const ListEscalaFuncionariosResponseSchema = z.object({
  items: z.array(EscalaFuncionarioSchema),
});

export class ListEscalaFuncionariosResponseDto extends createZodDto(
  ListEscalaFuncionariosResponseSchema,
) {}

export const CreateEscalaResponseSchema = EscalaDetailSchema;

export class CreateEscalaResponseDto extends createZodDto(
  CreateEscalaResponseSchema,
) {}

export const CreateEscalaBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nomeEscala: z.string().min(1).max(100),
  horaInicio: HorarioEscalaSchema,
  horaFim: HorarioEscalaSchema,
  nomeEquipe: z.string().min(1).max(100),
  area: z.string().max(50).optional(),
});

export class CreateEscalaBodyDto extends createZodDto(CreateEscalaBodySchema) {}

export const AddEscalaFuncionarioBodySchema = z.object({
  funcionarioIds: z.array(z.number().int().positive()).min(1).max(100),
});

export class AddEscalaFuncionarioBodyDto extends createZodDto(
  AddEscalaFuncionarioBodySchema,
) {}

export const AddEscalaFuncionariosResponseSchema = z.object({
  items: z.array(EscalaFuncionarioSchema),
  adicionados: z.number().int().nonnegative(),
});

export class AddEscalaFuncionariosResponseDto extends createZodDto(
  AddEscalaFuncionariosResponseSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  FuncionarioCargoSchema,
  FuncionarioSituacaoSchema,
} from '../../../domain/model/funcionario/funcionario.model.js';

export const ListFuncionariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().optional(),
  cargo: FuncionarioCargoSchema.optional(),
  situacao: FuncionarioSituacaoSchema.optional(),
  search: z.string().optional(),
});

export class ListFuncionariosQueryDto extends createZodDto(
  ListFuncionariosQuerySchema,
) {}

export const FuncionarioResponseSchema = z.object({
  id: z.number().int().positive(),
  unidadeId: z.string(),
  matricula: z.string(),
  nome: z.string(),
  cargo: FuncionarioCargoSchema,
  situacao: FuncionarioSituacaoSchema,
  dataAdmissao: z.iso.datetime(),
  telefone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
  createdAt: z.iso.datetime(),
});

export class FuncionarioResponseDto extends createZodDto(
  FuncionarioResponseSchema,
) {}

export const ListFuncionariosResponseSchema = z.object({
  items: z.array(FuncionarioResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListFuncionariosResponseDto extends createZodDto(
  ListFuncionariosResponseSchema,
) {}

export const CreateFuncionarioResponseSchema = FuncionarioResponseSchema.extend(
  {
    usuario: z
      .object({
        id: z.number().int().positive(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'manager', 'operator']),
        status: z.enum(['ativo', 'bloqueado', 'pendente', 'inativo']),
        funcionarioId: z.number().int().positive().nullable(),
        createdAt: z.iso.datetime(),
      })
      .optional(),
  },
);

export class CreateFuncionarioResponseDto extends createZodDto(
  CreateFuncionarioResponseSchema,
) {}

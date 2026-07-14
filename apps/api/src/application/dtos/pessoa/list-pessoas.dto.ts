import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { FuncionarioCargoSchema, FuncionarioSituacaoSchema } from '../../../domain/model/funcionario/funcionario.model.js';
import { UserRoleSchema, UserStatusSchema } from '../../../domain/model/user/user.model.js';

export const ListPessoasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unidadeId: z.string().optional(),
  situacao: FuncionarioSituacaoSchema.optional(),
  cargo: FuncionarioCargoSchema.optional(),
  search: z.string().optional(),
  temAcesso: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    }),
  equipeId: z.string().uuid().optional(),
  semEquipe: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    }),
  funcionarioId: z.coerce.number().int().positive().optional(),
});

export class ListPessoasQueryDto extends createZodDto(ListPessoasQuerySchema) {}

export const PessoaResponseSchema = z.object({
  funcionarioId: z.number().int().positive(),
  matricula: z.string(),
  nome: z.string(),
  cargo: FuncionarioCargoSchema,
  situacao: FuncionarioSituacaoSchema,
  unidadeId: z.string(),
  dataAdmissao: z.iso.datetime(),
  equipeId: z.string().uuid().nullable(),
  equipeNome: z.string().nullable(),
  userId: z.number().int().positive().nullable(),
  userStatus: UserStatusSchema.nullable(),
  userRole: UserRoleSchema.nullable(),
  mustChangePassword: z.boolean().nullable(),
  userEmail: z.string().email().nullable(),
});

export class PessoaResponseDto extends createZodDto(PessoaResponseSchema) {}

export const ListPessoasResponseSchema = z.object({
  items: z.array(PessoaResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListPessoasResponseDto extends createZodDto(ListPessoasResponseSchema) {}

import {
  FuncionarioCargoSchema,
  parseFuncionarioCargo,
  type FuncionarioCargo,
} from '@lilog/contracts';
import { z } from 'zod';

export { FuncionarioCargoSchema };
export type { FuncionarioCargo };

export const FuncionarioCargoInputSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    return parseFuncionarioCargo(value) ?? value;
  },
  FuncionarioCargoSchema,
);

export const FuncionarioSituacaoSchema = z.enum([
  'ativo',
  'afastado',
  'ferias',
  'desligado',
  'bloqueado',
]);

export type FuncionarioSituacao = z.infer<typeof FuncionarioSituacaoSchema>;

export const FuncionarioIdSchema = z.number().int().positive();
export type FuncionarioId = z.infer<typeof FuncionarioIdSchema>;

export const FuncionarioSchema = z.object({
  id: FuncionarioIdSchema,
  unidadeId: z.string().min(1).max(50),
  matricula: z
    .string()
    .min(1)
    .max(50)
    .regex(/^\d+$/, 'Matrícula deve ser um ID numérico'),
  nome: z.string().min(1).max(100),
  cargo: FuncionarioCargoSchema,
  situacao: FuncionarioSituacaoSchema,
  dataAdmissao: z.coerce.date(),
  telefone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  observacao: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export type Funcionario = z.infer<typeof FuncionarioSchema>;

export const CreateFuncionarioInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  matricula: z
    .string()
    .min(1)
    .max(50)
    .regex(/^\d+$/, 'Matrícula deve ser um ID numérico'),
  nome: z.string().min(1).max(100),
  cargo: FuncionarioCargoSchema,
  situacao: FuncionarioSituacaoSchema.default('ativo'),
  dataAdmissao: z.coerce.date(),
  telefone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  observacao: z.string().optional(),
});

export type CreateFuncionarioInput = z.infer<typeof CreateFuncionarioInputSchema>;

export const UpdateFuncionarioInputSchema = z
  .object({
    unidadeId: z.string().min(1).max(50).optional(),
    matricula: z
      .string()
      .min(1)
      .max(50)
      .regex(/^\d+$/, 'Matrícula deve ser um ID numérico')
      .optional(),
    nome: z.string().min(1).max(100).optional(),
    cargo: FuncionarioCargoSchema.optional(),
    situacao: FuncionarioSituacaoSchema.optional(),
    dataAdmissao: z.coerce.date().optional(),
    telefone: z.string().max(20).nullable().optional(),
    email: z.string().email().nullable().optional(),
    observacao: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

export type UpdateFuncionarioInput = z.infer<typeof UpdateFuncionarioInputSchema>;

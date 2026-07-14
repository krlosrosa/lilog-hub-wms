import {
  FUNCIONARIO_CARGO_LABELS,
  FUNCIONARIO_CARGO_OPTIONS,
  FuncionarioCargoSchema,
  type FuncionarioCargo,
} from '@lilog/contracts';
import { z } from 'zod';

import { funcionarioTurnoSchema } from '@/features/funcionarios/types/funcionarios-gestao.schema';

export { FuncionarioCargoSchema, type FuncionarioCargo };

export const funcionarioCargoSchema = FuncionarioCargoSchema;

export const funcionarioFormSchema = z
  .object({
    nomeCompleto: z.string().min(3, 'Informe o nome completo'),
    matricula: z
      .string()
      .min(1, 'Informe a matrícula/ID')
      .regex(/^\d+$/, 'Informe um ID numérico (ex: 421931)'),
    cargo: funcionarioCargoSchema,
    equipeId: z
      .string()
      .min(1, 'Selecione um departamento')
      .uuid('Selecione um departamento'),
    turno: funcionarioTurnoSchema,
    dataAdmissao: z.string().min(1, 'Informe a data de admissão'),
    unidadesIds: z
      .array(z.string())
      .min(1, 'Selecione ao menos uma unidade'),
    criarUsuarioAdmin: z.boolean(),
    usuarioEmail: z.string().optional(),
    usuarioSenha: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.criarUsuarioAdmin) return;

    if (
      data.usuarioEmail?.trim() &&
      !z.string().email().safeParse(data.usuarioEmail.trim()).success
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'E-mail inválido',
        path: ['usuarioEmail'],
      });
    }

    if (!data.usuarioSenha?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a senha de acesso',
        path: ['usuarioSenha'],
      });
      return;
    }

    if (data.usuarioSenha.trim().length < 6) {
      ctx.addIssue({
        code: 'custom',
        message: 'A senha deve ter no mínimo 6 caracteres',
        path: ['usuarioSenha'],
      });
    }
  });

export type FuncionarioFormValues = z.infer<typeof funcionarioFormSchema>;

export const CARGO_OPTIONS = FUNCIONARIO_CARGO_OPTIONS;
export const CARGO_LABELS = FUNCIONARIO_CARGO_LABELS;

export const TURNO_OPTIONS = [
  { value: 'manha' as const, label: 'Manhã' },
  { value: 'tarde' as const, label: 'Tarde' },
  { value: 'noite' as const, label: 'Noite' },
] as const;

export type FuncionarioCargoForm = FuncionarioCargo;

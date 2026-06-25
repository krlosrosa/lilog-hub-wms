import { z } from 'zod';

import { funcionarioTurnoSchema } from '@/features/funcionarios/types/funcionarios-gestao.schema';

export const funcionarioCargoSchema = z.enum([
  'operador_empilhadeira',
  'separador',
  'conferente',
  'ajudante',
  'administrativo',
]);

export type FuncionarioCargo = z.infer<typeof funcionarioCargoSchema>;

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
    } else if (data.usuarioSenha.trim().length < 6) {
      ctx.addIssue({
        code: 'custom',
        message: 'A senha deve ter no mínimo 6 caracteres',
        path: ['usuarioSenha'],
      });
    }
  });

export type FuncionarioFormValues = z.infer<typeof funcionarioFormSchema>;

export const CARGO_OPTIONS: Array<{
  value: FuncionarioCargo;
  label: string;
}> = [
  { value: 'operador_empilhadeira', label: 'Operador Empilhadeira' },
  { value: 'separador', label: 'Separador' },
  { value: 'conferente', label: 'Conferente' },
  { value: 'ajudante', label: 'Ajudante' },
  { value: 'administrativo', label: 'Administrativo' },
];

export const TURNO_OPTIONS = [
  { value: 'manha' as const, label: 'Manhã' },
  { value: 'tarde' as const, label: 'Tarde' },
  { value: 'noite' as const, label: 'Noite' },
] as const;

export const CARGO_LABELS: Record<FuncionarioCargo, string> = {
  operador_empilhadeira: 'Operador Empilhadeira',
  separador: 'Separador',
  conferente: 'Conferente',
  ajudante: 'Ajudante',
  administrativo: 'Administrativo',
};

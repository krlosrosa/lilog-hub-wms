import { z } from 'zod';

export const funcionarioStatusSchema = z.enum(['ativo', 'inativo']);

export type FuncionarioStatus = z.infer<typeof funcionarioStatusSchema>;

export const funcionarioTurnoSchema = z.enum(['manha', 'tarde', 'noite']);

export type FuncionarioTurno = z.infer<typeof funcionarioTurnoSchema>;

export const funcionarioDepartamentoSchema = z.enum([
  'logistica',
  'montagem',
  'qualidade',
  'triagem',
  'manutencao',
  'recebimento',
  'estoque',
  'expedicao',
]);

export type FuncionarioDepartamento = z.infer<typeof funcionarioDepartamentoSchema>;

export const funcionarioRecordSchema = z.object({
  id: z.string(),
  matricula: z.string(),
  nome: z.string(),
  cargo: z.string(),
  departamento: funcionarioDepartamentoSchema,
  turno: funcionarioTurnoSchema,
  produtividade: z.number().min(0).max(100),
  status: funcionarioStatusSchema,
  avatarUrl: z.string().url().optional(),
});

export type FuncionarioRecord = z.infer<typeof funcionarioRecordSchema>;

export const funcionarioKpiSchema = z.object({
  totalFuncionarios: z.number().int().nonnegative(),
  totalFuncionariosTrendPercent: z.number(),
  totalFuncionariosProgress: z.number().min(0).max(100),
  produtividadeMedia: z.number().min(0).max(100),
  produtividadeMediaTrendPercent: z.number(),
  produtividadeMediaProgress: z.number().min(0).max(100),
  horarioMedioOperacao: z.string(),
  horarioMedioTrendPercent: z.number(),
  horarioMedioProgress: z.number().min(0).max(100),
});

export type FuncionarioKpi = z.infer<typeof funcionarioKpiSchema>;

export const funcionarioFiltroStatusSchema = z.enum([
  'todos',
  'ativo',
  'inativo',
]);

export type FuncionarioFiltroStatus = z.infer<typeof funcionarioFiltroStatusSchema>;

export const funcionarioFiltroDepartamentoSchema = z.enum([
  'todos',
  'logistica',
  'montagem',
  'qualidade',
  'triagem',
  'manutencao',
  'recebimento',
]);

export type FuncionarioFiltroDepartamento = z.infer<
  typeof funcionarioFiltroDepartamentoSchema
>;

export const funcionarioFiltroTurnoSchema = z.enum([
  'todos',
  'manha',
  'tarde',
  'noite',
]);

export type FuncionarioFiltroTurno = z.infer<typeof funcionarioFiltroTurnoSchema>;

export const FUNCIONARIO_STATUS_LABELS: Record<FuncionarioStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
};

export const FUNCIONARIO_TURNO_LABELS: Record<FuncionarioTurno, string> = {
  manha: 'Manhã (A)',
  tarde: 'Tarde (B)',
  noite: 'Noite (C)',
};

export const FUNCIONARIO_TURNO_SHORT_LABELS: Record<FuncionarioTurno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export const FUNCIONARIO_DEPARTAMENTO_LABELS: Record<
  FuncionarioDepartamento,
  string
> = {
  logistica: 'Logística',
  montagem: 'Montagem',
  qualidade: 'Qualidade',
  triagem: 'Triagem',
  manutencao: 'Manutenção',
  recebimento: 'Recebimento',
  estoque: 'Estoque',
  expedicao: 'Expedição',
};

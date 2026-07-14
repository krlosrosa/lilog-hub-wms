import { z } from 'zod';

export const usuarioStatusSchema = z.enum(['ativo', 'inativo', 'bloqueado']);

export type UsuarioStatus = z.infer<typeof usuarioStatusSchema>;

export const usuarioPerfilSchema = z.enum([
  'admin',
  'gerente',
  'lider',
  'analista',
  'operador',
]);

export type UsuarioPerfil = z.infer<typeof usuarioPerfilSchema>;

export const usuarioRecordSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string().email(),
  perfil: usuarioPerfilSchema,
  status: usuarioStatusSchema,
  lastLogin: z.string(),
  lastLoginIp: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  securityLockout: z.boolean().optional(),
});

export type UsuarioRecord = z.infer<typeof usuarioRecordSchema>;

export const usuarioKpiSchema = z.object({
  totalPessoal: z.number().int().nonnegative(),
  totalPessoalTrendPercent: z.number(),
  ativosAgora: z.number().int().nonnegative(),
  ativosPercent: z.number().min(0).max(100),
  contasSinalizadas: z.number().int().nonnegative(),
  rotacaoSenhaPercent: z.number().min(0).max(100),
});

export type UsuarioKpi = z.infer<typeof usuarioKpiSchema>;

export const usuarioFiltroStatusSchema = z.enum([
  'todos',
  'ativo',
  'inativo',
  'bloqueado',
]);

export type UsuarioFiltroStatus = z.infer<typeof usuarioFiltroStatusSchema>;

export const usuarioFiltrosSchema = z.object({
  status: usuarioFiltroStatusSchema,
  busca: z.string(),
});

export type UsuarioFiltros = z.infer<typeof usuarioFiltrosSchema>;

export const USUARIO_STATUS_LABELS: Record<UsuarioStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  bloqueado: 'Bloqueado',
};

export const USUARIO_PERFIL_LABELS: Record<UsuarioPerfil, string> = {
  admin: 'Admin',
  gerente: 'Gerente',
  lider: 'Líder de Turno',
  analista: 'Analista',
  operador: 'Operador',
};

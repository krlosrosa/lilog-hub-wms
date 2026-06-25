import { z } from 'zod';

import { usuarioPerfilSchema } from '@/features/usuarios/types/usuarios-gestao.schema';

export const permissaoAcaoSchema = z.object({
  ver: z.boolean(),
  criar: z.boolean(),
  editar: z.boolean(),
  excluir: z.boolean(),
});

export type PermissaoAcao = z.infer<typeof permissaoAcaoSchema>;

export const permissaoModuloSchema = z.object({
  id: z.string(),
  nome: z.string(),
  descricao: z.string(),
  icon: z.string(),
  permissoes: permissaoAcaoSchema,
});

export type PermissaoModulo = z.infer<typeof permissaoModuloSchema>;

export const perfilRoleSchema = z.object({
  id: usuarioPerfilSchema,
  label: z.string(),
  descricao: z.string(),
  icon: z.string(),
  healthScore: z.number().min(0).max(100),
});

export type PerfilRole = z.infer<typeof perfilRoleSchema>;

export const perfilPermissoesSchema = z.object({
  perfilId: usuarioPerfilSchema,
  modulos: z.array(permissaoModuloSchema),
});

export type PerfilPermissoes = z.infer<typeof perfilPermissoesSchema>;

export const PERMISSAO_ACOES = ['ver', 'criar', 'editar', 'excluir'] as const;

export type PermissaoAcaoKey = (typeof PERMISSAO_ACOES)[number];

export const PERMISSAO_ACAO_LABELS: Record<PermissaoAcaoKey, string> = {
  ver: 'Ver',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
};

export const USER_PERMISSION = {
  FUNCIONARIO_VIEW: 'funcionario.visualizar',
  FUNCIONARIO_CREATE: 'funcionario.cadastrar',
  FUNCIONARIO_UPDATE: 'funcionario.alterar',
  FUNCIONARIO_BLOCK: 'funcionario.bloquear',
  FUNCIONARIO_TRANSFER: 'funcionario.transferir',
  USUARIO_VIEW: 'usuario.visualizar',
  USUARIO_CREATE: 'usuario.cadastrar',
  USUARIO_UPDATE: 'usuario.alterar',
  USUARIO_BLOCK: 'usuario.bloquear',
  USUARIO_UNBLOCK: 'usuario.desbloquear',
  SESSAO_OPERACAO_VIEW: 'sessao_operacao.visualizar',
  SESSAO_OPERACAO_MANAGE: 'sessao_operacao.gerenciar',
} as const;

export type UserPermission =
  (typeof USER_PERMISSION)[keyof typeof USER_PERMISSION];

const ADMIN_USER_PERMISSIONS: UserPermission[] = Object.values(USER_PERMISSION);

const MANAGER_USER_PERMISSIONS: UserPermission[] = [
  USER_PERMISSION.FUNCIONARIO_VIEW,
  USER_PERMISSION.USUARIO_VIEW,
  USER_PERMISSION.USUARIO_CREATE,
  USER_PERMISSION.USUARIO_UPDATE,
  USER_PERMISSION.USUARIO_BLOCK,
  USER_PERMISSION.USUARIO_UNBLOCK,
  USER_PERMISSION.SESSAO_OPERACAO_VIEW,
  USER_PERMISSION.SESSAO_OPERACAO_MANAGE,
];

const OPERATOR_USER_PERMISSIONS: UserPermission[] = [
  USER_PERMISSION.FUNCIONARIO_VIEW,
  USER_PERMISSION.USUARIO_VIEW,
];

export function resolveUserRolePermissions(role: string): UserPermission[] {
  if (role === 'admin') {
    return ADMIN_USER_PERMISSIONS;
  }

  if (role === 'manager') {
    return MANAGER_USER_PERMISSIONS;
  }

  return OPERATOR_USER_PERMISSIONS;
}

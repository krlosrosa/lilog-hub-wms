export const DEVOLUCAO_PERMISSION = {
  VISUALIZAR: 'devolucao.visualizar',
  GERENCIAR: 'devolucao.gerenciar',
} as const;

export type DevolucaoPermission =
  (typeof DEVOLUCAO_PERMISSION)[keyof typeof DEVOLUCAO_PERMISSION];

const ADMIN_PERMISSIONS: DevolucaoPermission[] =
  Object.values(DEVOLUCAO_PERMISSION);

const OPERATOR_PERMISSIONS: DevolucaoPermission[] = [
  DEVOLUCAO_PERMISSION.VISUALIZAR,
  DEVOLUCAO_PERMISSION.GERENCIAR,
];

const LEADER_PERMISSIONS: DevolucaoPermission[] = [
  DEVOLUCAO_PERMISSION.VISUALIZAR,
];

export function resolveDevolucaoRolePermissions(
  role: string,
): DevolucaoPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  if (role === 'leader') {
    return LEADER_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

export const PERFIL_TARIFA_PERMISSION = {
  VIEW: 'perfil_tarifa.visualizar',
  CREATE: 'perfil_tarifa.cadastrar',
  UPDATE: 'perfil_tarifa.alterar',
  DELETE: 'perfil_tarifa.excluir',
} as const;

export type PerfilTarifaPermission =
  (typeof PERFIL_TARIFA_PERMISSION)[keyof typeof PERFIL_TARIFA_PERMISSION];

const ADMIN_PERMISSIONS: PerfilTarifaPermission[] = Object.values(
  PERFIL_TARIFA_PERMISSION,
);

const OPERATOR_PERMISSIONS: PerfilTarifaPermission[] = [
  PERFIL_TARIFA_PERMISSION.VIEW,
  PERFIL_TARIFA_PERMISSION.CREATE,
  PERFIL_TARIFA_PERMISSION.UPDATE,
];

export function resolvePerfilTarifaRolePermissions(
  role: string,
): PerfilTarifaPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

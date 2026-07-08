export const INVENTARIO_PERMISSION = {
  DIVERGENCIA_SOLICITAR_RECONTAGEM:
    'inventario.divergencia.solicitar-recontagem',
} as const;

export type InventarioPermission =
  (typeof INVENTARIO_PERMISSION)[keyof typeof INVENTARIO_PERMISSION];

const ADMIN_PERMISSIONS: InventarioPermission[] = Object.values(
  INVENTARIO_PERMISSION,
);

export function resolveInventarioRolePermissions(
  role: string,
): InventarioPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return [];
}

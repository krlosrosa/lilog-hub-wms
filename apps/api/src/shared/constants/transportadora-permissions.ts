export const TRANSPORTADORA_PERMISSION = {
  VIEW: 'transportadora.visualizar',
  CREATE: 'transportadora.cadastrar',
  UPDATE: 'transportadora.alterar',
  DELETE: 'transportadora.excluir',
  IMPORT_RAVEX: 'transportadora.importar_ravex',
} as const;

export type TransportadoraPermission =
  (typeof TRANSPORTADORA_PERMISSION)[keyof typeof TRANSPORTADORA_PERMISSION];

const ADMIN_PERMISSIONS: TransportadoraPermission[] = Object.values(
  TRANSPORTADORA_PERMISSION,
);

const OPERATOR_PERMISSIONS: TransportadoraPermission[] = [
  TRANSPORTADORA_PERMISSION.VIEW,
  TRANSPORTADORA_PERMISSION.CREATE,
  TRANSPORTADORA_PERMISSION.IMPORT_RAVEX,
];

export function resolveTransportadoraRolePermissions(
  role: string,
): TransportadoraPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

export const CNC_PERMISSION = {
  VISUALIZAR: 'cnc.visualizar',
  ANALISAR: 'cnc.analisar',
  ENCERRAR: 'cnc.encerrar',
  CANCELAR: 'cnc.cancelar',
} as const;

export type CncPermission =
  (typeof CNC_PERMISSION)[keyof typeof CNC_PERMISSION];

const ADMIN_PERMISSIONS: CncPermission[] = Object.values(CNC_PERMISSION);

const OPERATOR_PERMISSIONS: CncPermission[] = [
  CNC_PERMISSION.VISUALIZAR,
  CNC_PERMISSION.ANALISAR,
  CNC_PERMISSION.ENCERRAR,
  CNC_PERMISSION.CANCELAR,
];

export function resolveCncRolePermissions(role: string): CncPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

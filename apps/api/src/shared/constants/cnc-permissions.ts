export const CNC_PERMISSION = {
  VISUALIZAR: 'cnc.visualizar',
  APROVAR: 'cnc.aprovar',
  REJEITAR: 'cnc.rejeitar',
  ENCERRAR: 'cnc.encerrar',
} as const;

export type CncPermission =
  (typeof CNC_PERMISSION)[keyof typeof CNC_PERMISSION];

const ADMIN_PERMISSIONS: CncPermission[] = Object.values(CNC_PERMISSION);

const SUPERVISOR_PERMISSIONS: CncPermission[] = [
  CNC_PERMISSION.VISUALIZAR,
  CNC_PERMISSION.APROVAR,
  CNC_PERMISSION.REJEITAR,
  CNC_PERMISSION.ENCERRAR,
];

export function resolveCncRolePermissions(role: string): CncPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return SUPERVISOR_PERMISSIONS;
}

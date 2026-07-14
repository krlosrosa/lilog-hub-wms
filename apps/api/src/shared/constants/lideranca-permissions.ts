export const LIDERANCA_PERMISSION = {
  ACESSO: 'lideranca.acesso',
} as const;

export const LIDERANCA_PWA_CLIENT_APP = 'pwa-lideranca';

export type LiderancaPermission =
  (typeof LIDERANCA_PERMISSION)[keyof typeof LIDERANCA_PERMISSION];

const LIDERANCA_ACCESS_PERMISSIONS: LiderancaPermission[] = [
  LIDERANCA_PERMISSION.ACESSO,
];

export function resolveLiderancaRolePermissions(
  role: string,
): LiderancaPermission[] {
  if (role === 'admin' || role === 'leader' || role === 'manager') {
    return LIDERANCA_ACCESS_PERMISSIONS;
  }

  return [];
}

export function canAccessLiderancaPwa(role: string): boolean {
  return resolveLiderancaRolePermissions(role).includes(
    LIDERANCA_PERMISSION.ACESSO,
  );
}

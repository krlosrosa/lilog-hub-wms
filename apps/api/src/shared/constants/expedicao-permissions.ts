export const EXPEDICAO_PERMISSION = {
  UPLOAD: 'expedicao.upload',
  VISUALIZAR: 'expedicao.visualizar',
} as const;

export type ExpedicaoPermission =
  (typeof EXPEDICAO_PERMISSION)[keyof typeof EXPEDICAO_PERMISSION];

const ADMIN_PERMISSIONS: ExpedicaoPermission[] =
  Object.values(EXPEDICAO_PERMISSION);

const OPERATOR_PERMISSIONS: ExpedicaoPermission[] = [
  EXPEDICAO_PERMISSION.UPLOAD,
  EXPEDICAO_PERMISSION.VISUALIZAR,
];

export function resolveExpedicaoRolePermissions(
  role: string,
): ExpedicaoPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

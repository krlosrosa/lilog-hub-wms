export const DOCUMENTO_PERMISSION = {
  UPLOAD: 'documento:upload',
  CONFIRM: 'documento:confirm',
  LIST: 'documento:list',
  DELETE: 'documento:delete',
  DOWNLOAD_URL: 'documento:download-url',
} as const;

export type DocumentoPermission =
  (typeof DOCUMENTO_PERMISSION)[keyof typeof DOCUMENTO_PERMISSION];

const ADMIN_PERMISSIONS: DocumentoPermission[] =
  Object.values(DOCUMENTO_PERMISSION);

const MANAGER_PERMISSIONS: DocumentoPermission[] = [
  DOCUMENTO_PERMISSION.UPLOAD,
  DOCUMENTO_PERMISSION.CONFIRM,
  DOCUMENTO_PERMISSION.LIST,
  DOCUMENTO_PERMISSION.DOWNLOAD_URL,
];

const OPERATOR_PERMISSIONS: DocumentoPermission[] = [
  DOCUMENTO_PERMISSION.UPLOAD,
  DOCUMENTO_PERMISSION.CONFIRM,
  DOCUMENTO_PERMISSION.LIST,
  DOCUMENTO_PERMISSION.DOWNLOAD_URL,
];

export function resolveDocumentoRolePermissions(
  role: string,
): DocumentoPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  if (role === 'manager') {
    return MANAGER_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

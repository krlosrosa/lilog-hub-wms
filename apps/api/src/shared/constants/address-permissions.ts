export const ADDRESS_PERMISSION = {
  CREATE: 'address:create',
  UPDATE: 'address:update',
  VIEW: 'address:view',
  BLOCK: 'address:block',
  UNBLOCK: 'address:unblock',
  INVENTORY: 'address:inventory',
  CAPACITY_VIEW: 'address:capacity:view',
  HISTORY_VIEW: 'address:history:view',
} as const;

export type AddressPermission =
  (typeof ADDRESS_PERMISSION)[keyof typeof ADDRESS_PERMISSION];

const ADMIN_PERMISSIONS: AddressPermission[] = Object.values(ADDRESS_PERMISSION);

const OPERATOR_PERMISSIONS: AddressPermission[] = [
  ADDRESS_PERMISSION.VIEW,
  ADDRESS_PERMISSION.CAPACITY_VIEW,
  ADDRESS_PERMISSION.HISTORY_VIEW,
  ADDRESS_PERMISSION.INVENTORY,
  ADDRESS_PERMISSION.BLOCK,
  ADDRESS_PERMISSION.UNBLOCK,
];

export function resolveRolePermissions(role: string): AddressPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

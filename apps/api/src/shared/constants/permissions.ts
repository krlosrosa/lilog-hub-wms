import {
  resolveDocumentoRolePermissions,
  type DocumentoPermission,
} from './documento-permissions.js';
import {
  resolveDocaRolePermissions,
  type DocaPermission,
} from './doca-permissions.js';
import {
  resolveCncRolePermissions,
  type CncPermission,
} from './cnc-permissions.js';
import {
  resolveRecebimentoRolePermissions,
  type RecebimentoPermission,
} from './recebimento-permissions.js';
import {
  resolveUserRolePermissions,
  type UserPermission,
} from './user-permissions.js';
import {
  resolveLiderancaRolePermissions,
  type LiderancaPermission,
} from './lideranca-permissions.js';

export type AppPermission =
  | UserPermission
  | DocaPermission
  | RecebimentoPermission
  | DocumentoPermission
  | CncPermission
  | LiderancaPermission;

export function resolveAllRolePermissions(role: string): AppPermission[] {
  return [
    ...resolveUserRolePermissions(role),
    ...resolveDocaRolePermissions(role),
    ...resolveRecebimentoRolePermissions(role),
    ...resolveCncRolePermissions(role),
    ...resolveDocumentoRolePermissions(role),
    ...resolveLiderancaRolePermissions(role),
  ];
}

import {
  resolveRolePermissions as resolveAddressRolePermissions,
  type AddressPermission,
} from './address-permissions.js';
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
  resolveExpedicaoRolePermissions,
  type ExpedicaoPermission,
} from './expedicao-permissions.js';
import {
  resolveTransportadoraRolePermissions,
  type TransportadoraPermission,
} from './transportadora-permissions.js';
import {
  resolvePerfilTarifaRolePermissions,
  type PerfilTarifaPermission,
} from './perfil-tarifa-permissions.js';
import {
  resolveDevolucaoRolePermissions,
  type DevolucaoPermission,
} from './devolucao-permissions.js';
import {
  resolveCobrancaTransportadoraRolePermissions,
  type CobrancaTransportadoraPermission,
} from './cobranca-transportadora-permissions.js';
import {
  resolveInventarioRolePermissions,
  type InventarioPermission,
} from './inventario-permissions.js';
import {
  resolveRecebimentoRolePermissions,
  type RecebimentoPermission,
} from './recebimento-permissions.js';
import {
  resolveUserRolePermissions,
  type UserPermission,
} from './user-permissions.js';

export type AppPermission =
  | AddressPermission
  | UserPermission
  | DocaPermission
  | RecebimentoPermission
  | DocumentoPermission
  | CncPermission
  | ExpedicaoPermission
  | TransportadoraPermission
  | PerfilTarifaPermission
  | DevolucaoPermission
  | CobrancaTransportadoraPermission
  | InventarioPermission;

export function resolveAllRolePermissions(role: string): AppPermission[] {
  return [
    ...resolveAddressRolePermissions(role),
    ...resolveUserRolePermissions(role),
    ...resolveDocaRolePermissions(role),
    ...resolveRecebimentoRolePermissions(role),
    ...resolveCncRolePermissions(role),
    ...resolveDocumentoRolePermissions(role),
    ...resolveExpedicaoRolePermissions(role),
    ...resolveTransportadoraRolePermissions(role),
    ...resolvePerfilTarifaRolePermissions(role),
    ...resolveDevolucaoRolePermissions(role),
    ...resolveCobrancaTransportadoraRolePermissions(role),
    ...resolveInventarioRolePermissions(role),
  ];
}

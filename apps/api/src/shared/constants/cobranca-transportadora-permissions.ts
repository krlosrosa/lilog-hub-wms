export const COBRANCA_TRANSPORTADORA_PERMISSION = {
  VISUALIZAR: 'cobranca_transportadora.visualizar',
  GERENCIAR: 'cobranca_transportadora.gerenciar',
} as const;

export type CobrancaTransportadoraPermission =
  (typeof COBRANCA_TRANSPORTADORA_PERMISSION)[keyof typeof COBRANCA_TRANSPORTADORA_PERMISSION];

const ADMIN_PERMISSIONS: CobrancaTransportadoraPermission[] = Object.values(
  COBRANCA_TRANSPORTADORA_PERMISSION,
);

const OPERATOR_PERMISSIONS: CobrancaTransportadoraPermission[] = [
  COBRANCA_TRANSPORTADORA_PERMISSION.VISUALIZAR,
  COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR,
];

export function resolveCobrancaTransportadoraRolePermissions(
  role: string,
): CobrancaTransportadoraPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

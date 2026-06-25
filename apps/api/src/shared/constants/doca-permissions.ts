export const DOCA_PERMISSION = {
  DOCA_VIEW: 'doca.visualizar',
  DOCA_CREATE: 'doca.cadastrar',
  DOCA_UPDATE: 'doca.alterar',
  DOCA_BLOCK: 'doca.bloquear',
  OPERACAO_VIEW: 'operacao.visualizar',
  OPERACAO_CREATE: 'operacao.criar',
  OPERACAO_START: 'operacao.iniciar',
  OPERACAO_FINISH: 'operacao.finalizar',
  OPERACAO_CANCEL: 'operacao.cancelar',
} as const;

export type DocaPermission =
  (typeof DOCA_PERMISSION)[keyof typeof DOCA_PERMISSION];

const ADMIN_PERMISSIONS: DocaPermission[] = Object.values(DOCA_PERMISSION);

const OPERATOR_PERMISSIONS: DocaPermission[] = [
  DOCA_PERMISSION.DOCA_VIEW,
  DOCA_PERMISSION.OPERACAO_VIEW,
  DOCA_PERMISSION.OPERACAO_CREATE,
  DOCA_PERMISSION.OPERACAO_START,
  DOCA_PERMISSION.OPERACAO_FINISH,
];

export function resolveDocaRolePermissions(role: string): DocaPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

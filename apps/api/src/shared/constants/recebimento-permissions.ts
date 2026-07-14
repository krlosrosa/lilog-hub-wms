export const RECEBIMENTO_PERMISSION = {
  VISUALIZAR: 'recebimento.visualizar',
  CRIAR: 'recebimento.criar',
  ALTERAR: 'recebimento.alterar',
  CANCELAR: 'recebimento.cancelar',
  INICIAR: 'recebimento.iniciar',
  CONFERIR: 'recebimento.conferir',
  FINALIZAR: 'recebimento.finalizar',
  HISTORICO_VISUALIZAR: 'recebimento.historico.visualizar',
  GERENCIAR: 'recebimento.gerenciar',
} as const;

export type RecebimentoPermission =
  (typeof RECEBIMENTO_PERMISSION)[keyof typeof RECEBIMENTO_PERMISSION];

const ADMIN_PERMISSIONS: RecebimentoPermission[] =
  Object.values(RECEBIMENTO_PERMISSION);

const OPERATOR_PERMISSIONS: RecebimentoPermission[] = [
  RECEBIMENTO_PERMISSION.VISUALIZAR,
  RECEBIMENTO_PERMISSION.INICIAR,
  RECEBIMENTO_PERMISSION.CONFERIR,
  RECEBIMENTO_PERMISSION.FINALIZAR,
  RECEBIMENTO_PERMISSION.HISTORICO_VISUALIZAR,
];

const LEADER_PERMISSIONS: RecebimentoPermission[] = [
  RECEBIMENTO_PERMISSION.VISUALIZAR,
  RECEBIMENTO_PERMISSION.GERENCIAR,
  RECEBIMENTO_PERMISSION.INICIAR,
  RECEBIMENTO_PERMISSION.FINALIZAR,
  RECEBIMENTO_PERMISSION.HISTORICO_VISUALIZAR,
];

export function resolveRecebimentoRolePermissions(
  role: string,
): RecebimentoPermission[] {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }

  if (role === 'leader' || role === 'manager') {
    return LEADER_PERMISSIONS;
  }

  return OPERATOR_PERMISSIONS;
}

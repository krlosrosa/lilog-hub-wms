import type { SyncIssueOperation } from './sync-operation-labels';

export const CONFERENCIA_BLOQUEADA_MESSAGES = [
  'Conferência só é permitida com recebimento em andamento',
  'Avarias só podem ser registradas durante a conferência',
] as const;

export function isConferenciaBloqueadaError(message: string | undefined): boolean {
  if (!message?.trim()) {
    return false;
  }

  const normalized = message.trim();
  return CONFERENCIA_BLOQUEADA_MESSAGES.some((fragment) => normalized.includes(fragment));
}

export function hasConferenciaBloqueadaIssues(
  issues: Pick<SyncIssueOperation, 'errorMessage'>[],
): boolean {
  return issues.some((issue) => isConferenciaBloqueadaError(issue.errorMessage));
}

export function formatSyncIssueErrorMessage(message: string | undefined): string | undefined {
  if (!message?.trim()) {
    return undefined;
  }

  if (!isConferenciaBloqueadaError(message)) {
    return message;
  }

  return `${message.trim()} Reabra a conferência no servidor para continuar a sincronização.`;
}

export const REABRIR_CONFERENCIA_HINT =
  'A conferência foi encerrada no servidor. Reabra para enviar as alterações pendentes.';

export const REABRIR_CONFERENCIA_SEM_PERMISSAO_HINT =
  'A conferência foi encerrada no servidor. Peça a um responsável para reabrir a demanda.';

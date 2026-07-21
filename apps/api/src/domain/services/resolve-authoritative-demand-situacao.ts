import type { PreRecebimentoSituacao } from '../model/recebimento/recebimento.model.js';

export type AuthoritativeDemandSituacaoInput = {
  preRecebimentoSituacao: string;
  recebimentoSituacao?: string | null;
};

/**
 * Matriz autoritativa de status entre pré-recebimento e recebimento.
 * Recebimento prevalece quando existe — evita pré-recebimento stale como "conferido"
 * enquanto o recebimento ainda está em_conferencia.
 */
export function resolveAuthoritativeDemandSituacao(
  input: AuthoritativeDemandSituacaoInput,
): PreRecebimentoSituacao {
  const { preRecebimentoSituacao, recebimentoSituacao } = input;
  const recebimento = recebimentoSituacao ?? null;

  if (recebimento === 'conferido') {
    return 'conferido';
  }

  if (recebimento === 'em_conferencia') {
    return 'em_conferencia';
  }

  if (preRecebimentoSituacao === 'conferido') {
    return 'conferido';
  }

  if (preRecebimentoSituacao === 'em_conferencia') {
    return 'em_conferencia';
  }

  if (preRecebimentoSituacao === 'impedido') {
    return 'impedido';
  }

  if (preRecebimentoSituacao === 'liberado_para_conferencia') {
    return 'liberado_para_conferencia';
  }

  return preRecebimentoSituacao as PreRecebimentoSituacao;
}

export function applyAuthoritativeDemandSituacao<T extends { situacao: string }>(
  demandView: T,
  input: AuthoritativeDemandSituacaoInput,
): void {
  demandView.situacao = resolveAuthoritativeDemandSituacao(input);
}

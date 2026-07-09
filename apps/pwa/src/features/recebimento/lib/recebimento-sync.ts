export const OFFLINE_RECEBIMENTO_PLACEHOLDER = '__offline__';

export function resolveOutboxRecebimentoId(
  recebimentoId: string | null | undefined,
): string {
  const normalized = recebimentoId?.trim();
  return normalized || OFFLINE_RECEBIMENTO_PLACEHOLDER;
}

export function buildRecebimentoEndpoint(
  recebimentoId: string | null | undefined,
  path: string,
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/recebimentos/${encodeURIComponent(resolveOutboxRecebimentoId(recebimentoId))}${normalizedPath}`;
}

export function withRecebimentoDemandPayload<T extends Record<string, unknown>>(
  preRecebimentoId: string,
  payload: T,
): T & { preRecebimentoId: string; demandId: string } {
  return {
    ...payload,
    preRecebimentoId,
    demandId: preRecebimentoId,
  };
}

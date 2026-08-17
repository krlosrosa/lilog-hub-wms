export function parsePushErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Falha ao sincronizar com o servidor';

  const jsonMatch = /\{[\s\S]*"message"[\s\S]*\}/.exec(raw);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { message?: string };
      if (parsed.message?.trim()) {
        return parsed.message;
      }
    } catch {
      // fall through
    }
  }

  return raw.replace(/^\d+:\s*/, '').trim() || 'Falha ao sincronizar com o servidor';
}

export function isValidationPushError(message: string): boolean {
  return /obrigat[oó]ri[oa]/i.test(message);
}

export function isEncerrarAlreadyClosedPushError(message: string): boolean {
  return (
    /recebimento em andamento/i.test(message) ||
    /situa[cç][aã]o atual:\s*conferido/i.test(message)
  );
}

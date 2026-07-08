export function parseCodigoCelula(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isSafeInteger(value)) {
      return String(value);
    }

    if (Number.isInteger(value)) {
      return BigInt(value).toString();
    }

    return String(Math.trunc(value));
  }

  const text = String(value).trim();
  if (!text) {
    return '';
  }

  if (/^\d+$/.test(text)) {
    return text;
  }

  if (/^[\d\s.,]+$/.test(text) && !text.includes('/') && !text.includes('-')) {
    const digits = text.replace(/\D/g, '');
    if (digits.length > 0) {
      return digits;
    }
  }

  return text;
}

export function parseLote(value: unknown): string | null {
  const codigo = parseCodigoCelula(value);
  return codigo.length > 0 ? codigo : null;
}

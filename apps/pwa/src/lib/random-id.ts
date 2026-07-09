function createShortIdFromRandomValues(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

function createShortIdFallback(length: number): string {
  let result = '';
  while (result.length < length) {
    result += Math.random().toString(16).slice(2);
  }
  return result.slice(0, length);
}

/** ID curto para exportação e rastreio local (funciona fora de contexto seguro). */
export function createShortId(length = 8): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    try {
      return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, length);
    } catch {
      // segue para fallback
    }
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return createShortIdFromRandomValues(length);
  }

  return createShortIdFallback(length);
}

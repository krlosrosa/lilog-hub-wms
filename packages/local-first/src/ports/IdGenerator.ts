export interface IdGenerator {
  generate(): string;
}

export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

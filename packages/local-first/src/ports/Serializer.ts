export interface Serializer {
  readonly contentType: string;
  serialize(value: unknown): Uint8Array | string;
  deserialize<T = unknown>(data: Uint8Array | string): T;
  measureBytes(value: unknown): number;
}

export class JsonSerializer implements Serializer {
  readonly contentType = 'application/json';

  serialize(value: unknown): string {
    return JSON.stringify(value);
  }

  deserialize<T = unknown>(data: Uint8Array | string): T {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    return JSON.parse(text) as T;
  }

  measureBytes(value: unknown): number {
    return new TextEncoder().encode(this.serialize(value)).byteLength;
  }
}

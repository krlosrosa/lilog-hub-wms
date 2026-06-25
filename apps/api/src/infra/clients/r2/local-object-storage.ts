import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const STORAGE_ROOT = join(process.cwd(), '.local-storage');

function resolvePath(chave: string): string {
  const normalized = chave.replace(/^\/+/, '');
  if (normalized.includes('..')) {
    throw new Error('Chave de documento inválida');
  }
  return join(STORAGE_ROOT, normalized);
}

export function isLocalStorageEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export async function putLocalObject(
  chave: string,
  data: Buffer,
): Promise<void> {
  const filePath = resolvePath(chave);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}

export async function headLocalObject(
  chave: string,
): Promise<{ contentLength: number }> {
  const filePath = resolvePath(chave);
  const stats = await stat(filePath);
  return { contentLength: stats.size };
}

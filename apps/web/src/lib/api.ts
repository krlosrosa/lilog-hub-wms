import {
  invalidateSession,
  shouldInvalidateSession,
} from '@/lib/auth-session';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://172.20.10.2:3001/api';

let activeUnidadeId: string | null = null;

export function setActiveUnidadeId(id: string | null) {
  activeUnidadeId = id;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function resolveApiErrorMessage(body: unknown, fallback: string): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'errors' in body &&
    Array.isArray(body.errors) &&
    body.errors.length > 0
  ) {
    return body.errors
      .map((item) => {
        if (typeof item !== 'object' || item === null) {
          return 'Erro de validação';
        }

        const path =
          'path' in item &&
          Array.isArray(item.path) &&
          item.path.length > 0
            ? `${item.path.join('.')}: `
            : '';

        const message =
          'message' in item && typeof item.message === 'string'
            ? item.message
            : 'Erro de validação';

        return `${path}${message}`;
      })
      .join('; ');
  }

  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message;
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (
    !headers.has('Content-Type') &&
    init?.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (activeUnidadeId) {
    headers.set('x-unidade-id', activeUnidadeId);
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiClientError(
      'Não foi possível conectar à API. Verifique se o servidor está em execução.',
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (shouldInvalidateSession(path, response.status)) {
      void invalidateSession();
    }

    const fallback = `Erro na requisição (${response.status})`;
    const message = resolveApiErrorMessage(body, fallback);

    throw new ApiClientError(message, response.status, body);
  }

  return body as T;
}

export type ApiDownloadBlobResult = {
  blob: Blob;
  filename: string;
};

function extrairFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const match =
    /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(contentDisposition);

  if (!match) {
    return null;
  }

  const raw = match[1] ?? match[2];
  if (!raw) {
    return null;
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function fallbackFilenameFromContentType(contentType: string | null): string {
  if (contentType?.includes('spreadsheetml')) {
    return 'download.xlsx';
  }

  if (contentType?.includes('pdf')) {
    return 'download.pdf';
  }

  return 'download.bin';
}

export async function apiDownloadBlob(
  path: string,
  init?: RequestInit,
): Promise<ApiDownloadBlobResult> {
  const headers = new Headers(init?.headers);

  if (
    !headers.has('Content-Type') &&
    init?.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (activeUnidadeId) {
    headers.set('x-unidade-id', activeUnidadeId);
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiClientError(
      'Não foi possível conectar à API. Verifique se o servidor está em execução.',
      0,
    );
  }

  if (!response.ok) {
    if (shouldInvalidateSession(path, response.status)) {
      void invalidateSession();
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const body = isJson ? await response.json() : await response.text();

    const message = resolveApiErrorMessage(body, `Erro na requisição (${response.status})`);

    throw new ApiClientError(message, response.status, body);
  }

  const blob = await response.blob();
  const filename =
    extrairFilename(response.headers.get('content-disposition')) ??
    fallbackFilenameFromContentType(response.headers.get('content-type'));

  return { blob, filename };
}

export function downloadBlobArquivo(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

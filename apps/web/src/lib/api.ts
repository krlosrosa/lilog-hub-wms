const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : `Erro na requisição (${response.status})`;

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

  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? null;
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
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const body = isJson ? await response.json() : await response.text();

    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : `Erro na requisição (${response.status})`;

    throw new ApiClientError(message, response.status, body);
  }

  const blob = await response.blob();
  const filename =
    extrairFilename(response.headers.get('content-disposition')) ??
    'download.pdf';

  return { blob, filename };
}

export function downloadBlobArquivo(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

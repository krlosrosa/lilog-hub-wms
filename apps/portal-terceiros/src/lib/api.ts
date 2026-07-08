const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
    const fallback = `Erro na requisição (${response.status})`;
    const message = resolveApiErrorMessage(body, fallback);

    throw new ApiClientError(message, response.status, body);
  }

  return body as T;
}

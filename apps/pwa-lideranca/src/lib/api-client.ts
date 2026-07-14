function resolveApiBase(): string {
  const configured = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
  const apiPort = import.meta.env.VITE_API_PORT ?? '3001';

  if (typeof window === 'undefined') {
    return configured;
  }

  const { hostname, protocol, origin } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalHost) {
    return configured.startsWith('/') ? `${origin}${configured}` : configured;
  }

  if (import.meta.env.VITE_API_USE_PROXY === 'true') {
    return `${origin}/api`;
  }

  if (configured.startsWith('/')) {
    return `${protocol}//${hostname}:${apiPort}${configured}`;
  }

  try {
    const parsed = new URL(configured);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${parsed.port || apiPort}${parsed.pathname}`.replace(
        /\/$/,
        '',
      );
    }
  } catch {
    return `${protocol}//${hostname}:${apiPort}/api`;
  }

  return configured;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function isApiConfigured(): boolean {
  return Boolean(resolveApiBase());
}

export const LIDERANCA_PWA_CLIENT_APP = 'pwa-lideranca';

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!navigator.onLine) {
    throw new ApiClientError('Sem conexão com a internet');
  }

  if (!isApiConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {} as T;
  }

  const apiBase = resolveApiBase();
  const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: {
        'X-Client-App': LIDERANCA_PWA_CLIENT_APP,
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      'Não foi possível conectar à API. Verifique a rede e tente novamente.',
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    let message = text || `Erro HTTP ${response.status}`;

    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      if (parsed.message) {
        message = Array.isArray(parsed.message)
          ? parsed.message.join(', ')
          : parsed.message;
      }
    } catch {
      // keep raw text
    }

    throw new ApiClientError(message, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

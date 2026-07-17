const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://172.20.10.2:3001/api';

type SessionInvalidationHandler = () => void;

let invalidationHandler: SessionInvalidationHandler | null = null;
let invalidationInFlight: Promise<void> | null = null;

export function registerSessionInvalidationHandler(
  handler: SessionInvalidationHandler,
) {
  invalidationHandler = handler;
}

export function shouldInvalidateSession(path: string, status: number): boolean {
  if (path.startsWith('/auth/login')) {
    return false;
  }

  if (status === 401) {
    return true;
  }

  if (
    status === 404 &&
    (path === '/auth/me' || path.startsWith('/auth/me/'))
  ) {
    return true;
  }

  return false;
}

export async function invalidateSession(): Promise<void> {
  if (invalidationInFlight) {
    return invalidationInFlight;
  }

  invalidationInFlight = (async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignora falhas de rede ao limpar a sessão.
    } finally {
      invalidationHandler?.();
      invalidationInFlight = null;
    }
  })();

  return invalidationInFlight;
}

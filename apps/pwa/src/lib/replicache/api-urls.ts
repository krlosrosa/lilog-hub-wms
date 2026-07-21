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

export function buildReplicacheUrls(unidadeId: string): {
  pullURL: string;
  pushURL: string;
} {
  const base = resolveApiBase();
  const query = `unidadeId=${encodeURIComponent(unidadeId)}`;
  return {
    pullURL: `${base}/replicache/recebimento/pull?${query}`,
    pushURL: `${base}/replicache/recebimento/push?${query}`,
  };
}

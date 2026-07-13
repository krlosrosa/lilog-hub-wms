'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthContext } from '@/contexts/auth-context';
import { listMyUnidades } from '@/features/filiais/lib/unidade-api';
import type { ClusterValue } from '@/features/filiais/types/filial.schema';
import { ApiClientError } from '@/lib/api';
import { setActiveUnidadeId } from '@/lib/api';

const STORAGE_KEY = 'lilog:unidade';
export const SELECIONAR_UNIDADE_PATH = '/selecionar-unidade';
const UNIDADE_OPTIONAL_PATHS = ['/peso-variavel'];

function isUnidadeOptionalPath(pathname: string): boolean {
  return UNIDADE_OPTIONAL_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export type UnidadeSelecionada = {
  id: string;
  nome: string;
  cluster: ClusterValue;
  nomeFilial: string;
};

type UnidadeContextValue = {
  unidades: UnidadeSelecionada[];
  unidadeSelecionada: UnidadeSelecionada | null;
  isResolved: boolean;
  isLoading: boolean;
  error: string | null;
  setUnidade: (unidade: UnidadeSelecionada) => void;
  clearUnidade: () => void;
  refreshUnidades: () => Promise<void>;
};

const UnidadeContext = createContext<UnidadeContextValue | null>(null);

function readStoredUnidade(): UnidadeSelecionada | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (
      parsed &&
      typeof parsed === 'object' &&
      'id' in parsed &&
      typeof parsed.id === 'string' &&
      'nome' in parsed &&
      typeof parsed.nome === 'string' &&
      'cluster' in parsed &&
      typeof parsed.cluster === 'string' &&
      'nomeFilial' in parsed &&
      typeof parsed.nomeFilial === 'string'
    ) {
      return parsed as UnidadeSelecionada;
    }

    return null;
  } catch {
    return null;
  }
}

function persistUnidade(unidade: UnidadeSelecionada | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (unidade) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unidade));
    setActiveUnidadeId(unidade.id);
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  setActiveUnidadeId(null);
}

function resolveInitialUnidade(
  unidades: UnidadeSelecionada[],
): UnidadeSelecionada | null {
  if (unidades.length === 0) {
    return null;
  }

  const stored = readStoredUnidade();
  if (stored && unidades.some((item) => item.id === stored.id)) {
    return unidades.find((item) => item.id === stored.id) ?? stored;
  }

  return unidades[0] ?? null;
}

export function UnidadeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuthContext();
  const [unidades, setUnidades] = useState<UnidadeSelecionada[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionadaState] =
    useState<UnidadeSelecionada | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setUnidade = useCallback((unidade: UnidadeSelecionada) => {
    persistUnidade(unidade);
    setUnidadeSelecionadaState(unidade);
  }, []);

  const clearUnidade = useCallback(() => {
    persistUnidade(null);
    setUnidadeSelecionadaState(null);
  }, []);

  const refreshUnidades = useCallback(async () => {
    if (!user) {
      setUnidades([]);
      setUnidadeSelecionadaState(null);
      persistUnidade(null);
      setError(null);
      setIsLoading(false);
      setIsResolved(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await listMyUnidades();
      const items = (response.items ?? []).map((unidade) => ({
        id: unidade.id,
        nome: unidade.nome,
        nomeFilial: unidade.nomeFilial,
        cluster: unidade.cluster,
      }));

      setUnidades(items);

      const resolved = resolveInitialUnidade(items);
      setUnidadeSelecionadaState(resolved);
      persistUnidade(resolved);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível carregar suas unidades';

      setError(message);
      setUnidades([]);

      const fallback = readStoredUnidade();
      setUnidadeSelecionadaState(fallback);
      persistUnidade(fallback);
    } finally {
      setIsLoading(false);
      setIsResolved(true);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void refreshUnidades();
  }, [isAuthLoading, refreshUnidades, user?.id]);

  const value = useMemo(
    () => ({
      unidades,
      unidadeSelecionada,
      isResolved: isAuthLoading ? false : isResolved,
      isLoading: isAuthLoading || isLoading,
      error,
      setUnidade,
      clearUnidade,
      refreshUnidades,
    }),
    [
      unidades,
      unidadeSelecionada,
      isAuthLoading,
      isResolved,
      isLoading,
      error,
      setUnidade,
      clearUnidade,
      refreshUnidades,
    ],
  );

  return (
    <UnidadeContext.Provider value={value}>
      {children}
    </UnidadeContext.Provider>
  );
}

export function UnidadeGuard({ children }: { children: ReactNode }) {
  const {
    unidades,
    unidadeSelecionada,
    isResolved,
    isLoading,
    error,
  } = useUnidadeContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isResolved || isLoading) {
      return;
    }

    if (
      unidades.length > 1 &&
      !unidadeSelecionada &&
      pathname !== SELECIONAR_UNIDADE_PATH &&
      !isUnidadeOptionalPath(pathname)
    ) {
      router.replace(SELECIONAR_UNIDADE_PATH);
    }
  }, [
    isResolved,
    isLoading,
    unidades.length,
    unidadeSelecionada,
    pathname,
    router,
  ]);

  if (!isResolved || isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Carregando unidade...</span>
      </div>
    );
  }

  if (unidades.length === 0 && !isUnidadeOptionalPath(pathname)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            Sem acesso a unidades
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ??
              'Seu usuário não possui unidades atribuídas. Contate o administrador.'}
          </p>
        </div>
      </div>
    );
  }

  if (
    unidades.length > 1 &&
    !unidadeSelecionada &&
    pathname !== SELECIONAR_UNIDADE_PATH &&
    !isUnidadeOptionalPath(pathname)
  ) {
    return null;
  }

  return children;
}

export function useUnidadeContext() {
  const ctx = useContext(UnidadeContext);

  if (!ctx) {
    throw new Error('useUnidadeContext must be used inside <UnidadeProvider>');
  }

  return ctx;
}

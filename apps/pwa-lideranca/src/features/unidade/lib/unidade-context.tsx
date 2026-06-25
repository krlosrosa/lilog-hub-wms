import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/features/auth/lib/auth-context';
import {
  persistUnidade,
  readPersistedUnidade,
} from '@/features/auth/lib/unidade-storage';
import { ApiClientError } from '@/lib/api-client';

import { listMyUnidadesApi } from '../api';
import type { UnidadeOption } from '../types';

type UnidadeContextValue = {
  unidades: UnidadeOption[];
  unidadeSelecionada: UnidadeOption | null;
  isLoading: boolean;
  error: string | null;
  setUnidadeSelecionada: (unidade: UnidadeOption) => void;
  refreshUnidades: () => Promise<void>;
};

const UnidadeContext = createContext<UnidadeContextValue | null>(null);

function resolveInitialUnidade(
  unidades: UnidadeOption[],
  preferredUnidadeId: string | null,
): UnidadeOption | null {
  if (unidades.length === 0) {
    return null;
  }

  const stored = readPersistedUnidade();
  if (stored && unidades.some((item) => item.id === stored.id)) {
    return unidades.find((item) => item.id === stored.id) ?? stored;
  }

  if (preferredUnidadeId) {
    const preferred = unidades.find((item) => item.id === preferredUnidadeId);
    if (preferred) {
      return preferred;
    }
  }

  return unidades[0] ?? null;
}

export function UnidadeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [unidades, setUnidades] = useState<UnidadeOption[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionadaState] =
    useState<UnidadeOption | null>(() => readPersistedUnidade());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setUnidadeSelecionada = useCallback((unidade: UnidadeOption) => {
    persistUnidade(unidade);
    setUnidadeSelecionadaState(unidade);
  }, []);

  const refreshUnidades = useCallback(async () => {
    if (!user) {
      setUnidades([]);
      setUnidadeSelecionadaState(null);
      persistUnidade(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await listMyUnidadesApi();
      const items = response.items ?? [];
      setUnidades(items);

      const resolved = resolveInitialUnidade(items, user.unidadeId);
      setUnidadeSelecionadaState(resolved);
      persistUnidade(resolved);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível carregar suas unidades';

      setError(message);
      setUnidades([]);

      const fallback = user.unidadeId
        ? {
            id: user.unidadeId,
            nome: user.unidadeId,
            nomeFilial: user.unidadeId,
            cluster: 'CD-Fabrica',
          }
        : null;

      setUnidadeSelecionadaState(fallback);
      persistUnidade(fallback);
    } finally {
      setIsLoading(false);
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
      isLoading: isAuthLoading || isLoading,
      error,
      setUnidadeSelecionada,
      refreshUnidades,
    }),
    [
      unidades,
      unidadeSelecionada,
      isAuthLoading,
      isLoading,
      error,
      setUnidadeSelecionada,
      refreshUnidades,
    ],
  );

  return (
    <UnidadeContext.Provider value={value}>{children}</UnidadeContext.Provider>
  );
}

export function useUnidade() {
  const context = useContext(UnidadeContext);

  if (!context) {
    throw new Error('useUnidade must be used within UnidadeProvider');
  }

  return context;
}

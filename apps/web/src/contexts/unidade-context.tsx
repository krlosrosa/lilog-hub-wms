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

import type { ClusterValue } from '@/features/filiais/types/filial.schema';
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
  unidadeSelecionada: UnidadeSelecionada | null;
  isResolved: boolean;
  setUnidade: (unidade: UnidadeSelecionada) => void;
  clearUnidade: () => void;
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

export function UnidadeProvider({ children }: { children: ReactNode }) {
  const [unidadeSelecionada, setUnidadeSelecionada] =
    useState<UnidadeSelecionada | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    const stored = readStoredUnidade();
    setUnidadeSelecionada(stored);
    setActiveUnidadeId(stored?.id ?? null);
    setIsResolved(true);
  }, []);

  const setUnidade = useCallback((unidade: UnidadeSelecionada) => {
    persistUnidade(unidade);
    setUnidadeSelecionada(unidade);
  }, []);

  const clearUnidade = useCallback(() => {
    persistUnidade(null);
    setUnidadeSelecionada(null);
  }, []);

  const value = useMemo(
    () => ({ unidadeSelecionada, isResolved, setUnidade, clearUnidade }),
    [unidadeSelecionada, isResolved, setUnidade, clearUnidade],
  );

  return (
    <UnidadeContext.Provider value={value}>
      {children}
    </UnidadeContext.Provider>
  );
}

export function UnidadeGuard({ children }: { children: ReactNode }) {
  const { unidadeSelecionada, isResolved } = useUnidadeContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isResolved) {
      return;
    }

    if (
      !unidadeSelecionada &&
      pathname !== SELECIONAR_UNIDADE_PATH &&
      !isUnidadeOptionalPath(pathname)
    ) {
      router.replace(SELECIONAR_UNIDADE_PATH);
    }
  }, [isResolved, unidadeSelecionada, pathname, router]);

  if (!isResolved) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Carregando unidade...</span>
      </div>
    );
  }

  if (
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

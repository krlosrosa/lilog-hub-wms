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
import { useRouter } from 'next/navigation';

import {
  invalidateSession,
  registerSessionInvalidationHandler,
} from '@/lib/auth-session';
import { apiRequest, ApiClientError, setActiveUnidadeId } from '@/lib/api';

const UNIDADE_STORAGE_KEY = 'lilog:unidade';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (loginId: number, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completePasswordChange: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    registerSessionInvalidationHandler(() => {
      setUser(null);

      if (window.location.pathname !== '/login') {
        router.replace('/login');
      }
    });
  }, [router]);

  useEffect(() => {
    async function hydrate() {
      try {
        const data = await apiRequest<{
          id: number;
          name: string;
          email: string;
          role: string;
          mustChangePassword?: boolean;
        }>('/auth/me');

        setUser(data);
      } catch (error) {
        setUser(null);

        if (
          error instanceof ApiClientError &&
          (error.status === 401 || error.status === 404)
        ) {
          await invalidateSession();
        }
      } finally {
        setIsLoading(false);
      }
    }

    void hydrate();
  }, []);

  const login = useCallback(async (loginId: number, password: string) => {
    const data = await apiRequest<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      headers: {
        'x-client-app': 'web',
      },
      body: JSON.stringify({ id: loginId, password }),
    });

    setUser(data.user);

    if (data.user.mustChangePassword) {
      router.push('/alterar-senha');
      return;
    }

    router.push('/');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      if (!(err instanceof ApiClientError)) throw err;
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(UNIDADE_STORAGE_KEY);
      }
      setActiveUnidadeId(null);
      router.replace('/login');
    }
  }, [router]);

  const completePasswordChange = useCallback(() => {
    setUser((current) =>
      current ? { ...current, mustChangePassword: false } : current,
    );
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, completePasswordChange }),
    [user, isLoading, login, logout, completePasswordChange],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>');
  }
  return ctx;
}

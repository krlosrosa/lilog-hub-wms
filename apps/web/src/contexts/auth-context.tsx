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

import { apiRequest, ApiClientError } from '@/lib/api';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (loginId: number, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function hydrate() {
      try {
        const data = await apiRequest<{
          id: number;
          name: string;
          email: string;
          role: string;
        }>('/auth/me');

        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void hydrate();
  }, []);

  const login = useCallback(async (loginId: number, password: string) => {
    const data = await apiRequest<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ id: loginId, password }),
    });

    setUser(data.user);
    router.push('/');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      if (!(err instanceof ApiClientError)) throw err;
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
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

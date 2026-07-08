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

export type PortalAuthUser = {
  email: string;
  transportadoraId: string;
  transportadoraNome: string;
};

type AuthContextValue = {
  user: PortalAuthUser | null;
  isLoading: boolean;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function hydrate() {
      try {
        const data = await apiRequest<PortalAuthUser>('/portal/auth/me');
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void hydrate();
  }, []);

  const requestCode = useCallback(async (email: string) => {
    await apiRequest<{ message: string }>('/portal/auth/solicitar-codigo', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const data = await apiRequest<{
      email: string;
      transportadoraId: string;
    }>('/portal/auth/verificar-codigo', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });

    const me = await apiRequest<PortalAuthUser>('/portal/auth/me');
    setUser(me ?? {
      email: data.email,
      transportadoraId: data.transportadoraId,
      transportadoraNome: '',
    });
    router.push('/');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/portal/auth/logout', { method: 'POST' });
    } catch (err) {
      if (!(err instanceof ApiClientError)) throw err;
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, requestCode, verifyCode, logout }),
    [user, isLoading, requestCode, verifyCode, logout],
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

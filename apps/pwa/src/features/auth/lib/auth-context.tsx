import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useRef,

  useState,

  type ReactNode,

} from 'react';



import { ApiClientError } from '@/lib/offline/api-client';

import { router } from '@/router';

import {
  clearRecebimentoV2UserSessionCache,
  refreshRecebimentoV2UserSession,
} from '@/features/recebimento-v2/services/refresh-user-session.service';



import { getMeApi, loginApi, logoutApi } from '../api';

import type { AuthUser, LoginInput } from '../types';

import { persistUnidade } from './unidade-storage';



const AUTH_USER_STORAGE_KEY = 'lilog.auth.user';



type AuthContextValue = {

  user: AuthUser | null;

  isLoading: boolean;

  loginWithCredentials: (input: LoginInput) => Promise<AuthUser>;

  logout: () => Promise<void>;

  refreshSession: () => Promise<AuthUser | null>;

  completePasswordChange: () => void;

};



const AuthContext = createContext<AuthContextValue | null>(null);



export function normalizeAuthUser(value: AuthUser): AuthUser {

  return {

    ...value,

    mustChangePassword: value.mustChangePassword ?? false,

    funcionarioId: value.funcionarioId ?? null,

    unidadeId: typeof value.unidadeId === 'string' ? value.unidadeId : null,

  };

}



function isValidUser(value: unknown): value is AuthUser {

  if (typeof value !== 'object' || value === null) {

    return false;

  }



  const candidate = value as AuthUser;

  return (

    typeof candidate.id === 'number' &&

    typeof candidate.name === 'string' &&

    typeof candidate.email === 'string' &&

    typeof candidate.role === 'string'

  );

}



function readCachedUser(): AuthUser | null {

  if (typeof window === 'undefined') {

    return null;

  }



  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!raw) {

    return null;

  }



  try {

    const parsed: unknown = JSON.parse(raw);

    if (!isValidUser(parsed)) {

      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);

      return null;

    }



    return normalizeAuthUser(parsed);

  } catch {

    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);

    return null;

  }

}



function persistUser(user: AuthUser | null) {

  if (typeof window === 'undefined') {

    return;

  }



  if (!user) {

    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);

    persistUnidade(null);

    return;

  }



  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));

}



function clearSession(setUser: (user: AuthUser | null) => void) {

  setUser(null);

  persistUser(null);

}



export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser());

  const [isLoading, setIsLoading] = useState(true);

  const sessionGenerationRef = useRef(0);



  const applyUser = useCallback((nextUser: AuthUser | null) => {

    if (!nextUser) {

      clearSession(setUser);

      return null;

    }



    const normalized = normalizeAuthUser(nextUser);

    setUser(normalized);

    persistUser(normalized);

    return normalized;

  }, []);



  const refreshSession = useCallback(async () => {

    const generation = ++sessionGenerationRef.current;



    try {

      const me = await getMeApi();



      if (generation !== sessionGenerationRef.current) {

        return null;

      }



      if (isValidUser(me)) {

        return applyUser(normalizeAuthUser(me));

      }



      clearSession(setUser);

      return null;

    } catch (error) {

      if (generation !== sessionGenerationRef.current) {

        return null;

      }



      if (error instanceof ApiClientError && error.status === 401) {

        clearSession(setUser);

        return null;

      }



      if (!navigator.onLine && readCachedUser()) {

        return readCachedUser();

      }



      clearSession(setUser);

      return null;

    }

  }, [applyUser]);



  useEffect(() => {

    let cancelled = false;



    async function bootstrapSession() {

      await refreshSession();



      if (!cancelled) {

        setIsLoading(false);

      }

    }



    void bootstrapSession();



    return () => {

      cancelled = true;

      sessionGenerationRef.current += 1;

    };

  }, [refreshSession]);



  const loginWithCredentials = useCallback(

    async (input: LoginInput) => {

      const previousUserId = user?.id ?? readCachedUser()?.id ?? null;

      sessionGenerationRef.current += 1;



      await loginApi(input);



      const generation = sessionGenerationRef.current;

      const me = await getMeApi();



      if (generation !== sessionGenerationRef.current) {

        throw new ApiClientError('Login interrompido. Tente novamente.');

      }



      if (!isValidUser(me)) {

        clearSession(setUser);

        throw new ApiClientError(

          'Login realizado, mas a sessão não foi confirmada. Tente entrar novamente.',

        );

      }



      const normalized = normalizeAuthUser(me);

      if (previousUserId !== normalized.id) {

        await refreshRecebimentoV2UserSession(normalized);

      }

      applyUser(normalized);

      return normalized;

    },

    [applyUser, user],

  );



  const logout = useCallback(async () => {

    sessionGenerationRef.current += 1;



    try {

      await logoutApi();

    } catch {

      // Clear local session even if API logout fails (offline / expired cookie).

    } finally {

      await clearRecebimentoV2UserSessionCache();

      clearSession(setUser);

      await router.navigate({ to: '/login', replace: true });

    }

  }, [router]);



  const completePasswordChange = useCallback(() => {

    setUser((current) => {

      if (!current) {

        return current;

      }



      const updated = { ...current, mustChangePassword: false };

      persistUser(updated);

      return updated;

    });

  }, []);



  const value = useMemo(

    () => ({

      user,

      isLoading,

      loginWithCredentials,

      logout,

      refreshSession,

      completePasswordChange,

    }),

    [user, isLoading, loginWithCredentials, logout, refreshSession, completePasswordChange],

  );



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}



export function useAuth() {

  const context = useContext(AuthContext);



  if (!context) {

    throw new Error('useAuth must be used within AuthProvider');

  }



  return context;

}



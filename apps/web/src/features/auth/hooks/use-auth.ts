'use client';

import { useState } from 'react';

import { useAuthContext } from '@/contexts/auth-context';
import { ApiClientError } from '@/lib/api';

export function useAuth() {
  const { user, isLoading, login: contextLogin, logout } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(loginId: number, password: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await contextLogin(loginId, password);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { user, isLoading, isSubmitting, error, login, logout };
}

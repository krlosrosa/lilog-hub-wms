'use client';

import { useState } from 'react';

import { useAuthContext } from '@/contexts/auth-context';
import { ApiClientError } from '@/lib/api';

export function useAuth() {
  const {
    user,
    isLoading,
    requestCode: contextRequestCode,
    verifyCode: contextVerifyCode,
    logout,
  } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(email: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await contextRequestCode(email);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(email: string, code: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      await contextVerifyCode(email, code);
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

  return {
    user,
    isLoading,
    isSubmitting,
    error,
    requestCode,
    verifyCode,
    logout,
  };
}

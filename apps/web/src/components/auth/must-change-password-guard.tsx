'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthContext } from '@/contexts/auth-context';

export function MustChangePasswordGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.mustChangePassword) {
      router.replace('/alterar-senha');
    }
  }, [isLoading, router, user?.mustChangePassword]);

  if (isLoading) {
    return null;
  }

  if (user?.mustChangePassword) {
    return null;
  }

  return <>{children}</>;
}

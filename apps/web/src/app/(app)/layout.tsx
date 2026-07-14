import type { ReactNode } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { AppShell } from '@/components/layout/sidebar/app-shell';
import { MustChangePasswordGuard } from '@/components/auth/must-change-password-guard';
import { UnidadeGuard, UnidadeProvider } from '@/contexts/unidade-context';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <UnidadeProvider>
      <AuthGuard>
        <UnidadeGuard>
          <MustChangePasswordGuard>
            <AppShell>{children}</AppShell>
          </MustChangePasswordGuard>
        </UnidadeGuard>
      </AuthGuard>
    </UnidadeProvider>
  );
}

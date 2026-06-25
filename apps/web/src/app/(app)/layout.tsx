import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/sidebar/app-shell';
import { UnidadeGuard, UnidadeProvider } from '@/contexts/unidade-context';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <UnidadeProvider>
      <UnidadeGuard>
        <AppShell>{children}</AppShell>
      </UnidadeGuard>
    </UnidadeProvider>
  );
}

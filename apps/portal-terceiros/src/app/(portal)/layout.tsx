import type { ReactNode } from 'react';

import { PortalShell } from '@/components/layout/sidebar';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}

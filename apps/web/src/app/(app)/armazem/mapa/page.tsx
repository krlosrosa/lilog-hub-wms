'use client';

import { SidebarMain } from '@/components/layout/sidebar';

export default function ArmazemMapaPage() {
  return (
    <SidebarMain className="flex h-dvh flex-col overflow-hidden p-0">
      <iframe
        src="/armazem/mapa-armazem.html"
        className="min-h-0 w-full flex-1 border-0"
        title="Mapa do Armazém WMS"
      />
    </SidebarMain>
  );
}

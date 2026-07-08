'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@lilog/ui';

const TABS = [
  {
    href: '/debito-transportadora',
    label: 'Ocorrências',
    match: (pathname: string) =>
      pathname === '/debito-transportadora' ||
      (pathname.startsWith('/debito-transportadora/') &&
        !pathname.startsWith('/debito-transportadora/cobrancas')),
  },
  {
    href: '/debito-transportadora/cobrancas',
    label: 'Documentos de Cobrança',
    match: (pathname: string) =>
      pathname.startsWith('/debito-transportadora/cobrancas'),
  },
] as const;

export function DebitoTransportadoraTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do módulo de débito transportadora"
      className="flex gap-1 rounded-lg border border-outline-variant/50 bg-surface-low p-1"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

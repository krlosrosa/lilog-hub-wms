import Link from 'next/link';

import { Button } from '@lilog/ui';

import { ADMIN_URL, NAV_LINKS, SITE_NAME } from '@/lib/site-config';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            LL
          </span>
          <span className="text-lg">{SITE_NAME}</span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/contato">Fale conosco</Link>
          </Button>
          <Button asChild size="sm">
            <a href={ADMIN_URL} rel="noopener noreferrer">
              Acessar plataforma
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

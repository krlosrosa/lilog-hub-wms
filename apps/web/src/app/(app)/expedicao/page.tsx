import Link from 'next/link';

import { Activity, Map, Monitor, Printer, Scale } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { cn } from '@lilog/ui';

const glassCardClassName =
  'rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass transition-colors hover:border-primary/35';

const links: {
  href: string;
  title: string;
  description: string;
  icon: typeof Monitor;
  highlight?: boolean;
}[] = [
  {
    href: '/expedicao/torre-controle',
    title: 'Torre de Controle',
    description:
      'Monitoramento em tempo real da expedição noturna — criticidade, gargalos e recursos.',
    icon: Monitor,
    highlight: true,
  },
  {
    href: '/expedicao/config-mapa',
    title: 'Config. Mapa',
    description: 'Parâmetros de geração e layout dos mapas de separação.',
    icon: Map,
  },
  {
    href: '/expedicao/config-impressao',
    title: 'Config. Impressão',
    description: 'Perfis e opções de impressão dos mapas operacionais.',
    icon: Printer,
  },
  {
    href: '/peso-variavel',
    title: 'Peso Variável',
    description: 'Etiquetas e fluxo de produtos com peso variável.',
    icon: Scale,
  },
];

export default function ExpedicaoPage() {
  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <Activity className="size-5 text-primary" aria-hidden />
              <span className="text-caption font-medium uppercase tracking-wide text-primary">
                Expedição
              </span>
            </div>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
              Hub de Expedição
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              Acesse a torre de controle operacional e configurações do módulo.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    glassCardClassName,
                    'group block',
                    link.highlight &&
                      'border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20',
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-lg',
                        link.highlight
                          ? 'bg-primary/15 text-primary'
                          : 'bg-surface-high text-muted-foreground group-hover:text-primary',
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-foreground group-hover:text-primary">
                        {link.title}
                      </h2>
                      <p className="mt-1 text-caption leading-relaxed text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

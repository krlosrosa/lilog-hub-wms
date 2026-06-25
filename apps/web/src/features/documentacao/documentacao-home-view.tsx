'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  ArrowRight,
  BookOpen,
  Building2,
  ClipboardList,
  Package,
  Search,
  Truck,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  DOC_FLUXO_SUGERIDO,
  DOC_MODULOS,
  DOC_MODULOS_BY_SLUG,
} from '@/features/documentacao/content';
import type { DocModuloContent } from '@/features/documentacao/types';

const ICON_MAP: Record<DocModuloContent['icon'], LucideIcon> = {
  Building2,
  Package,
  Truck,
  ClipboardList,
};

const cardClassName =
  'group rounded-xl border border-outline-variant bg-card p-6 shadow-inner-glow transition-colors hover:border-primary/40';

export function DocumentacaoHomeView() {
  const [busca, setBusca] = useState('');

  const modulosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) {
      return DOC_MODULOS;
    }

    return DOC_MODULOS.filter(
      (modulo) =>
        modulo.title.toLowerCase().includes(termo) ||
        modulo.description.toLowerCase().includes(termo) ||
        modulo.overview.toLowerCase().includes(termo),
    );
  }, [busca]);

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-8 md:space-y-10">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-glass-bg px-3 py-1 text-caption text-muted-foreground">
              <BookOpen className="size-3.5" aria-hidden />
              Central de ajuda
            </div>
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                Documentação do sistema
              </h1>
              <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
                Guias passo a passo para operadores e gestores. Escolha um módulo
                ou siga o fluxo sugerido para começar.
              </p>
            </div>
            <label className="relative block max-w-xl">
              <span className="sr-only">Buscar na documentação</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar módulos (ex.: inventário, recebimento…)"
                className="w-full rounded-lg border border-outline-variant bg-surface-low py-3 pl-10 pr-4 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </header>

          <section aria-labelledby="titulo-modulos">
            <h2
              id="titulo-modulos"
              className="mb-4 text-title-md font-semibold text-foreground"
            >
              Módulos
            </h2>
            {modulosFiltrados.length === 0 ? (
              <p className="rounded-xl border border-outline-variant bg-muted/30 px-4 py-6 text-body-md text-muted-foreground">
                Nenhum módulo encontrado para &quot;{busca}&quot;. Tente outro termo.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {modulosFiltrados.map((modulo) => (
                  <ModuloCard key={modulo.slug} modulo={modulo} />
                ))}
              </div>
            )}
          </section>

          <section
            aria-labelledby="titulo-fluxo"
            className="rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow md:p-8"
          >
            <h2
              id="titulo-fluxo"
              className="text-title-md font-semibold text-foreground"
            >
              Por onde começar
            </h2>
            <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
              Para uma operação completa, siga esta ordem recomendada:
            </p>
            <ol className="mt-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
              {DOC_FLUXO_SUGERIDO.map((slug, index) => {
                const modulo = DOC_MODULOS_BY_SLUG[slug];
                const Icon = ICON_MAP[modulo.icon];

                return (
                  <li key={slug} className="flex items-center gap-3">
                    <Link
                      href={modulo.href}
                      className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-card px-4 py-2 text-label-md transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-caption font-bold text-primary">
                        {index + 1}
                      </span>
                      <Icon className="size-4" aria-hidden />
                      {modulo.title}
                    </Link>
                    {index < DOC_FLUXO_SUGERIDO.length - 1 ? (
                      <ArrowRight
                        className="hidden size-4 text-muted-foreground md:block"
                        aria-hidden
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </main>
    </SidebarMain>
  );
}

type ModuloCardProps = {
  modulo: DocModuloContent;
};

function ModuloCard({ modulo }: ModuloCardProps) {
  const Icon = ICON_MAP[modulo.icon];

  return (
    <Link href={modulo.href} className={cn(cardClassName, 'flex flex-col gap-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <ArrowRight
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden
        />
      </div>
      <div>
        <h3 className="text-title-sm font-semibold text-foreground">{modulo.title}</h3>
        <p className="mt-1 text-body-md text-muted-foreground">{modulo.description}</p>
      </div>
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Info,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import { DocsNav } from '@/features/documentacao/docs-nav';
import type { DocModuloContent, DocSectionId } from '@/features/documentacao/types';

const sectionCardClassName =
  'rounded-xl border border-outline-variant bg-card p-6 shadow-inner-glow md:p-8';

export type DocumentacaoModuloViewProps = {
  modulo: DocModuloContent;
};

export function DocumentacaoModuloView({ modulo }: DocumentacaoModuloViewProps) {
  const [activeSection, setActiveSection] = useState<DocSectionId>('visao-geral');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const syncSectionFromHash = useCallback(() => {
    const hash = window.location.hash.replace('#', '') as DocSectionId;
    const valid = modulo.sections.some((section) => section.id === hash);
    if (valid) {
      setActiveSection(hash);
    }
  }, [modulo.sections]);

  useEffect(() => {
    syncSectionFromHash();
    window.addEventListener('hashchange', syncSectionFromHash);
    return () => window.removeEventListener('hashchange', syncSectionFromHash);
  }, [syncSectionFromHash]);

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto flex max-w-container flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="lg:w-64 lg:shrink-0">
            <div className="sticky top-6 rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow">
              <Link
                href="/documentacao"
                className="mb-4 inline-flex items-center gap-2 text-caption text-muted-foreground transition-colors hover:text-primary md:text-label-md"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Voltar à documentação
              </Link>
              <DocsNav
                modulo={modulo}
                activeSection={activeSection}
                onSectionClick={setActiveSection}
              />
            </div>
          </aside>

          <article className="min-w-0 flex-1 space-y-8 md:space-y-10">
            <header>
              <p className="text-caption uppercase tracking-wider text-muted-foreground">
                Guia do módulo
              </p>
              <h1 className="mt-1 text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                {modulo.title}
              </h1>
              <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
                {modulo.description}
              </p>
            </header>

            <section id="visao-geral" className={sectionCardClassName}>
              <h2 className="text-title-md font-semibold text-foreground">Visão geral</h2>
              <p className="mt-3 text-body-md leading-relaxed text-muted-foreground">
                {modulo.overview}
              </p>
            </section>

            <section id="passo-a-passo" className="space-y-4">
              <h2 className="text-title-md font-semibold text-foreground">Passo a passo</h2>
              <ol className="space-y-4">
                {modulo.steps.map((step, index) => (
                  <li
                    key={step.title}
                    className={cn(sectionCardClassName, 'relative pl-14 md:pl-16')}
                  >
                    <span
                      className="absolute left-6 top-6 flex size-8 items-center justify-center rounded-full bg-primary text-caption font-bold text-primary-foreground md:left-8"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <h3 className="text-title-sm font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-body-md text-muted-foreground">
                      {step.description}
                    </p>
                    {step.details && step.details.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-body-md text-muted-foreground">
                        {step.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            <section id="dicas" className="space-y-4">
              <h2 className="text-title-md font-semibold text-foreground">Dicas</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {modulo.tips.map((tip) => (
                  <TipCard key={tip.title} tip={tip} />
                ))}
              </div>
            </section>

            <section id="perguntas-frequentes" className="space-y-4">
              <h2 className="text-title-md font-semibold text-foreground">
                Perguntas frequentes
              </h2>
              <div className="space-y-2">
                {modulo.faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;

                  return (
                    <div
                      key={faq.question}
                      className="overflow-hidden rounded-xl border border-outline-variant bg-card shadow-inner-glow"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      >
                        <span className="text-label-md font-semibold text-foreground">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={cn(
                            'size-4 shrink-0 text-muted-foreground transition-transform',
                            isOpen && 'rotate-180',
                          )}
                          aria-hidden
                        />
                      </button>
                      {isOpen ? (
                        <div className="border-t border-outline-variant px-5 py-4 text-body-md text-muted-foreground">
                          {faq.answer}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </article>
        </div>
      </main>
    </SidebarMain>
  );
}

type TipCardProps = {
  tip: DocModuloContent['tips'][number];
};

function TipCard({ tip }: TipCardProps) {
  const isWarning = tip.type === 'warning';
  const Icon: LucideIcon = isWarning ? AlertTriangle : Info;

  return (
    <div
      className={cn(
        sectionCardClassName,
        isWarning
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-primary/20 bg-primary/5',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            'mt-0.5 size-5 shrink-0',
            isWarning ? 'text-destructive' : 'text-primary',
          )}
          aria-hidden
        />
        <div>
          <h3 className="text-label-md font-semibold text-foreground">{tip.title}</h3>
          <p className="mt-1 text-body-md text-muted-foreground">{tip.description}</p>
        </div>
      </div>
    </div>
  );
}

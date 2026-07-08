import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Package,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';

import { Button } from '@lilog/ui';

import {
  ADMIN_URL,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY,
  FEATURES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${SITE_NAME} - Plataforma SaaS de Gestão Logística e Operações de Armazém`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
};

const HIGHLIGHTS = [
  {
    icon: Warehouse,
    title: 'Operações de armazém',
    description:
      'Controle ponta a ponta de recebimento, armazenagem, inventário e expedição em um único ecossistema corporativo.',
  },
  {
    icon: Building2,
    title: 'Software empresarial',
    description:
      'Plataforma SaaS desenvolvida para centros de distribuição, equipes operacionais e gestores de logística.',
  },
  {
    icon: ShieldCheck,
    title: 'Confiabilidade operacional',
    description:
      'Arquitetura modular, rastreabilidade de processos e governança para ambientes de missão crítica.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Software empresarial · Gestão logística · SaaS
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {SITE_TAGLINE}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance">
              {SITE_DESCRIPTION} O {SITE_NAME} apoia empresas que precisam de
              automação de processos, visibilidade operacional e padronização em
              centros de distribuição de alto volume.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contato">
                  Solicitar demonstração
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/recursos">Conhecer recursos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <item.icon className="mb-4 size-8 text-primary" aria-hidden />
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Principais funcionalidades</h2>
            <p className="mt-3 text-muted-foreground">
              Módulos pensados para operações corporativas de logística, com foco em
              produtividade, rastreabilidade e controle de estoque.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <Package className="mb-3 size-6 text-accent" aria-hidden />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Público-alvo e segmento</h2>
            <p className="mt-4 text-muted-foreground">
              O {SITE_NAME} atende empresas que operam centros de distribuição,
              operações logísticas internas e cadeias de suprimentos com demanda por
              controle profissional de processos.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Gestores de logística, supervisores operacionais e equipes de chão de
                armazém.
              </li>
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Centros de distribuição, operações de recebimento, separação e
                expedição.
              </li>
              <li className="flex items-start gap-2">
                <Building2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Segmento Business and Economy — software empresarial para operações
                corporativas.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="text-xl font-semibold">Entre em contato</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Fale com nossa equipe para conhecer planos, implantação e integração com
              sua operação logística.
            </p>
            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="font-medium">E-mail comercial</dt>
                <dd>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-primary hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium">Telefone comercial</dt>
                <dd>
                  <a
                    href={`tel:${CONTACT_PHONE}`}
                    className="text-primary hover:underline"
                  >
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium">Acesso à plataforma</dt>
                <dd>
                  <a
                    href={ADMIN_URL}
                    className="text-primary hover:underline"
                    rel="noopener noreferrer"
                  >
                    {ADMIN_URL.replace('https://', '')}
                  </a>
                </dd>
              </div>
            </dl>
            <Button asChild className="mt-6">
              <Link href="/contato">Ir para contato</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

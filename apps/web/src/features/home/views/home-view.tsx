'use client';

import { PackageCheck } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { useAuthContext } from '@/contexts/auth-context';
import { useUnidadeContext } from '@/contexts/unidade-context';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function formatToday(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function HomeView() {
  const { user } = useAuthContext();
  const { unidadeSelecionada } = useUnidadeContext();

  const userName = user?.name ? getFirstName(user.name) : 'usuário';
  const unidadeNome = unidadeSelecionada?.nome ?? 'Selecione uma unidade';

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-8">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-glass-bg px-3 py-1 text-caption text-muted-foreground">
              <PackageCheck className="size-3.5" aria-hidden />
              Portal interno
            </div>
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                {getGreeting()}, {userName}
              </h1>
              <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
                {unidadeNome}
                <span className="mx-2 text-outline-variant" aria-hidden>
                  ·
                </span>
                {formatToday()}
              </p>
            </div>
          </header>

          <section className="max-w-2xl space-y-4 rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow">
            <h2 className="text-label-lg font-semibold text-foreground">
              Em breve, mais opções
            </h2>
            <p className="text-body-md text-muted-foreground">
              Esta página inicial será ampliada com novos recursos. Por enquanto,
              utilize o menu lateral para navegar entre os módulos do sistema.
            </p>
          </section>
        </div>
      </main>
    </SidebarMain>
  );
}

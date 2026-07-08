'use client';

import { Mail, Truck } from 'lucide-react';

import { useAuthContext } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { user } = useAuthContext();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm md:p-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-sm font-medium text-primary">Bem-vindo de volta</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Olá, {user?.transportadoraNome}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Acompanhe suas operações e acesse os recursos disponíveis para sua
            transportadora no portal de terceiros.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Truck className="size-5" aria-hidden />
          </div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Transportadora
          </h2>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {user?.transportadoraNome}
          </p>
        </article>

        <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Mail className="size-5" aria-hidden />
          </div>
          <h2 className="text-sm font-medium text-muted-foreground">E-mail</h2>
          <p className="mt-1 truncate text-lg font-semibold text-foreground">
            {user?.email}
          </p>
        </article>
      </section>
    </div>
  );
}

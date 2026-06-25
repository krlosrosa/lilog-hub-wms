'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Package, Truck } from 'lucide-react';

import { cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';

const PROCESSOS = [
  {
    id: 'separacao',
    titulo: 'Separação',
    descricao: 'Monitore operadores, atribua paletes e acompanhe o progresso da separação.',
    href: '/op-wms/gestao-recursos/separacao',
    icon: Package,
    accent: 'border-primary/30 bg-primary/5 hover:border-primary/50',
    iconClassName: 'text-primary',
  },
  {
    id: 'conferencia',
    titulo: 'Conferência',
    descricao: 'Gerencie conferentes, demandas pendentes e finalização de mapas conferidos.',
    href: '/op-wms/gestao-recursos/conferencia',
    icon: ClipboardCheck,
    accent: 'border-tertiary/30 bg-tertiary/5 hover:border-tertiary/50',
    iconClassName: 'text-tertiary',
  },
  {
    id: 'carregamento',
    titulo: 'Carregamento',
    descricao: 'Organize equipes por veículo/rota e adicione auxiliares ao carregamento.',
    href: '/op-wms/gestao-recursos/carregamento',
    icon: Truck,
    accent: 'border-warning/30 bg-warning/5 hover:border-warning/50',
    iconClassName: 'text-warning',
  },
] as const;

export function GestaoRecursosHubView() {
  return (
    <SidebarMain>
      <main className="relative min-h-dvh">
        <div className="space-y-3 px-margin-mobile py-3 md:px-margin-desktop md:py-4">
          <div className="mx-auto max-w-container space-y-4">
            <header className="border-b border-outline-variant pb-3">
              <nav className="mb-0.5 flex flex-wrap gap-1.5 text-caption text-muted-foreground">
                <Link href="/op-wms" className="hover:text-primary">
                  Warehouse
                </Link>
                <span aria-hidden>/</span>
                <span>Operações</span>
                <span aria-hidden>/</span>
                <span className="text-primary">Gestão de Recursos</span>
              </nav>
              <h1 className="text-headline-md font-semibold text-foreground">
                Gestão de Recursos
              </h1>
              <p className="mt-1 max-w-2xl text-body-md text-muted-foreground">
                Escolha o processo operacional que deseja monitorar e gerenciar
                nesta sessão.
              </p>
            </header>

            <section className="grid gap-3 md:grid-cols-3">
              {PROCESSOS.map((processo) => {
                const Icon = processo.icon;

                return (
                  <Link
                    key={processo.id}
                    href={processo.href}
                    className={cn(
                      glassPanelClassName,
                      'group flex h-full flex-col gap-3 border p-4 transition-colors',
                      processo.accent,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          'rounded-lg border border-outline-variant bg-surface-low p-2',
                          processo.iconClassName,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-label-lg font-semibold text-foreground">
                        {processo.titulo}
                      </h2>
                      <p className="text-caption text-muted-foreground">
                        {processo.descricao}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </section>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

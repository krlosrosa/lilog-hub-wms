'use client';

import { Button } from '@lilog/ui';
import { AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';

import { SidebarMain } from '@/components/layout/sidebar';

import { AgendaCalendario } from '@/features/frota/components/agenda-calendario';
import { AlertaCard } from '@/features/frota/components/alerta-card';
import { FilaAcoes } from '@/features/frota/components/fila-acoes';
import { FrotaSkeleton } from '@/features/frota/components/frota-skeleton';
import { FrotaStatsSummary } from '@/features/frota/components/frota-stats-summary';
import { useFrotaAgenda } from '@/features/frota/hooks/use-frota-agenda';

export function FrotaAgendaView() {
  const {
    isLoading,
    stats,
    alertas,
    eventos,
    filaAcoes,
    periodoAgenda,
    setPeriodo,
    onAlertaAcao,
    onFilaAcaoClick,
    onVerTodasAcoes,
    onNovoVeiculo,
  } = useFrotaAgenda();

  return (
    <SidebarMain className="flex min-h-dvh flex-col blueprint-grid">
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-glass-bg px-margin-mobile backdrop-blur-glass md:px-margin-desktop">
        <div>
          <nav
            aria-label="Navegação estrutural"
            className="mb-1 flex items-center gap-2 text-label-sm"
          >
            <Link
              href="/frota"
              className="text-muted-foreground hover:text-primary"
            >
              Frota
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="text-foreground">Agenda e alertas</span>
          </nav>
          <p className="text-label-sm text-muted-foreground">
            Calendário de manutenção e fila operacional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/frota">Diretório</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/frota/novo">Cadastrar</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-gutter overflow-y-auto px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <FrotaSkeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <FrotaStatsSummary stats={stats} />
        )}

        <section className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <div className="flex flex-col gap-gutter lg:col-span-4">
            <h2 className="flex items-center gap-2 text-title-md font-medium text-foreground">
              <AlertTriangle
                className="h-5 w-5 text-destructive"
                aria-hidden
              />
              Alertas críticos
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <FrotaSkeleton key={i} className="h-36" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {alertas.map((alerta) => (
                  <AlertaCard
                    key={alerta.id}
                    alerta={alerta}
                    onAcao={onAlertaAcao}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-gutter lg:col-span-8">
            {isLoading ? (
              <>
                <FrotaSkeleton className="h-80 rounded-xl" />
                <FrotaSkeleton className="h-48 rounded-xl" />
              </>
            ) : (
              <>
                <AgendaCalendario
                  eventos={eventos}
                  periodo={periodoAgenda}
                  onPeriodoChange={setPeriodo}
                />
                <FilaAcoes
                  acoes={filaAcoes}
                  onAcaoClick={onFilaAcaoClick}
                  onVerTudo={onVerTodasAcoes}
                />
              </>
            )}
          </div>
        </section>
      </main>

      <Button
        type="button"
        size="icon"
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-lg"
        onClick={onNovoVeiculo}
        aria-label="Cadastrar novo veículo"
      >
        <Plus className="h-7 w-7" aria-hidden />
      </Button>
    </SidebarMain>
  );
}

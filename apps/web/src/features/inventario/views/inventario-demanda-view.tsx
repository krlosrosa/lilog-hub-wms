'use client';

import { CheckCircle2, Plus } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { accentSubtleBadgeBorderClassName } from '@/lib/semantic-badge-classes';
import { SidebarMain } from '@/components/layout/sidebar';

import { DemandaRow } from '@/features/inventario/components/demanda-row';
import { useInventarioDemanda } from '@/features/inventario/hooks/use-inventario-demanda';

const statCardBase =
  'rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass transition-colors hover:border-primary/30';

export type InventarioDemandaViewProps = {
  inventarioId: string;
};

export function InventarioDemandaView({
  inventarioId,
}: InventarioDemandaViewProps) {
  const {
    demandas,
    filtroTipo,
    setFiltroTipo,
    resumo,
    irParaNovaDemanda,
    removerDemanda,
    voltarCadastro,
    salvarEIniciar,
    salvando,
    carregando,
  } = useInventarioDemanda(inventarioId);

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto flex max-w-container flex-col gap-5 md:gap-6 lg:gap-8">
          <div className="flex flex-wrap items-center gap-2 text-caption md:text-label-md">
            <BadgeStep concluido label="Passo 1: Configuração básica" />
            <span aria-hidden className="text-muted-foreground">&gt;</span>
            <BadgeStep concluido={false} ativo label="Passo 2: Gestão de demandas" />
            <span aria-hidden className="text-muted-foreground">&gt;</span>
            <BadgeStep concluido={false} label="Passo 3: Revisão e início" />
          </div>

          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                Gestão de demandas de contagem
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Defina os setores, responsáveis e métodos para o inventário atual.
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 gap-2 self-start sm:self-auto"
              onClick={irParaNovaDemanda}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              Adicionar demanda
            </Button>
          </header>

          <div className="grid gap-4 md:grid-cols-12 md:gap-5">
            <div
              className={cn(
                statCardBase,
                'flex flex-col justify-between gap-4 md:col-span-4',
              )}
            >
              <div>
                <p className="text-caption text-muted-foreground">
                  Total de demandas
                </p>
                <p className="text-headline-md font-bold text-foreground">
                  {resumo.total}
                </p>
              </div>
              <div className="flex items-center gap-1 text-caption text-accent">
                <span aria-hidden>↑</span>
                Capacidade de 85% alocada
              </div>
            </div>

            <div className={cn(statCardBase, 'md:col-span-4')}>
              <p className="text-caption text-muted-foreground">
                Tipos de contagem
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-headline-md font-bold text-accent">{resumo.cega}</p>
                  <p className="text-caption text-muted-foreground">Cega</p>
                </div>
                <div className="mx-2 h-8 border-l border-outline-variant" aria-hidden />
                <div>
                  <p className="text-headline-md font-bold text-secondary-foreground">
                    {resumo.validacao}
                  </p>
                  <p className="text-caption text-muted-foreground">Validação</p>
                </div>
              </div>
            </div>

            <div
              className={cn(statCardBase, 'relative overflow-hidden md:col-span-4')}
            >
              <div className="relative z-[2] space-y-2">
                <p className="text-caption text-muted-foreground">Equipe alocada</p>
                <Avatars equipe={resumo} />
              </div>
              <div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-primary/15 blur-[60px]" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="flex flex-col gap-4 border-b border-outline-variant p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
              <h2 className="text-label-md font-semibold text-foreground">
                Demandas atuais
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground md:text-label-md">
                <span>Filtros:</span>
                {(
                  [
                    ['todas', 'Todos'],
                    ['cega', 'Cega'],
                    ['validacao', 'Validação'],
                  ] as const
                ).map(([key, lab]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFiltroTipo(key)}
                    className={cn(
                      'rounded-full px-3 py-1 transition-colors',
                      filtroTipo === key
                        ? 'bg-surface-high font-medium text-foreground ring-1 ring-outline-variant'
                        : 'hover:bg-muted',
                    )}
                  >
                    {lab}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="border-b border-outline-variant bg-surface-high/50">
                  <tr>
                    {['Local / setor', 'Responsável', 'Tipo', 'Status', 'Ações'].map(
                      (col) => (
                        <th
                          key={col}
                          className={cn(
                            'px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-label-md md:font-semibold',
                            col === 'Ações' && 'text-right',
                          )}
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {demandas.map((d) => (
                    <DemandaRow key={d.id} item={d} onRemover={removerDemanda} />
                  ))}
                </tbody>
              </table>
            </div>
            {demandas.length === 0 ? (
              <p className="px-6 py-16 text-center text-body-md text-muted-foreground">
                Nenhuma demanda com este filtro.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/30 pt-6">
            <Button type="button" variant="outline" onClick={voltarCadastro}>
              Voltar
            </Button>
            <Button disabled={salvando} type="button" onClick={() => salvarEIniciar()}>
              {salvando ? 'Salvando…' : 'Salvar e iniciar inventário'}
            </Button>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

function BadgeStep({
  label,
  concluido,
  ativo,
}: {
  label: string;
  concluido: boolean;
  ativo?: boolean;
}) {
  const base =
    'inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-caption md:px-4 md:py-2 md:text-label-md';
  const classes = concluido
    ? cn('border', accentSubtleBadgeBorderClassName)
    : ativo
      ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
      : 'border-transparent text-muted-foreground opacity-90';

  return (
    <div className={cn(base, classes)}>
      {concluido ? <CheckCircle2 className="size-4 shrink-0 md:size-5" aria-hidden /> : null}
      <span>{label}</span>
    </div>
  );
}

function Avatars({
  equipe,
}: {
  equipe: { avatares: { key: string; inicial: string }[]; extras: number };
}) {
  return (
    <div className="flex -space-x-2 pt-1">
      {equipe.avatares.map((av) => (
        <div
          key={av.key}
          title={String(av.inicial)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[11px] font-bold uppercase text-muted-foreground md:size-10"
        >
          {av.inicial}
        </div>
      ))}
      {equipe.extras > 0 ? (
        <div className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-high text-caption text-muted-foreground md:size-10">
          +{equipe.extras}
        </div>
      ) : null}
    </div>
  );
}

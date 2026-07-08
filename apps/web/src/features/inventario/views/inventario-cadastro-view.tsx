'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import {
  ArrowRight,
  BarChart4,
  ChevronRight,
  ClipboardEdit,
  Clock,
  Info,
  Loader2,
  Users,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/inventario/components/form-field-classes';
import { useInventarioCadastro } from '@/features/inventario/hooks/use-inventario-cadastro';

const compactInputClassName = cn(
  fieldInputClassName,
  'px-3 py-2 text-sm',
);

const cardClassName =
  'rounded-xl border border-outline-variant bg-card p-4 shadow-inner-glow transition-colors hover:border-primary/25 md:p-5';

export function InventarioCadastroView() {
  const { form, isSubmitting, proximoDemandas, voltarLista, centros } =
    useInventarioCadastro();

  const tipo = form.watch('tipo');
  const { errors } = form.formState;

  const setTipo = (next: typeof tipo) => {
    void form.setValue('tipo', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <SidebarMain className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-glass-bg px-margin-mobile py-2.5 backdrop-blur-glass md:px-margin-desktop">
        <div className="flex min-w-0 flex-col gap-0.5">
          <nav
            aria-label="Migalhas"
            className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link
              href="/inventario"
              className="transition-colors hover:text-primary"
            >
              Inventário
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">Novo</span>
          </nav>
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
            Cadastro de inventário
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-outline-variant hover:bg-muted"
            onClick={voltarLista}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="inventario-cadastro-form"
            size="sm"
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-surface-lowest px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MiniMetric
              titulo="Acurácia"
              valor="98,4%"
              icon={<BarChart4 className="size-4" aria-hidden />}
              iconAccent="muted"
            />
            <MiniMetric
              titulo="Último"
              valor="12 dias"
              icon={<Clock className="size-4" aria-hidden />}
              iconAccent="accent"
            />
            <MiniMetric
              titulo="Equipe"
              valor="24 membros"
              icon={<Users className="size-4" aria-hidden />}
              iconAccent="primary"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_240px] lg:items-start">
            <section className={cardClassName}>
              <header className="mb-4 flex items-center gap-2 border-b border-outline-variant pb-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ClipboardEdit className="size-4" aria-hidden />
                </span>
                <div>
                  <h2
                    id="titulo-inv-principais"
                    className="text-sm font-semibold text-foreground"
                  >
                    Informações principais
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Dados básicos e cronograma do levantamento
                  </p>
                </div>
              </header>

              <form
                id="inventario-cadastro-form"
                className="space-y-4"
                noValidate
                onSubmit={proximoDemandas}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="nome-inventario" className={fieldLabelClassName}>
                      Nome do inventário
                    </label>
                    <input
                      id="nome-inventario"
                      className={compactInputClassName}
                      placeholder="Ex: Inventário Anual Q4 2026"
                      autoComplete="off"
                      {...form.register('nome')}
                    />
                    {errors.nome?.message ? (
                      <p role="alert" className={fieldErrorClassName}>
                        {errors.nome.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="centro-id" className={fieldLabelClassName}>
                      Centro
                    </label>
                    <select
                      id="centro-id"
                      className={compactInputClassName}
                      {...form.register('centroId')}
                    >
                      <option value="">Selecione o centro</option>
                      {centros.map((centro) => (
                        <option key={centro.id} value={centro.id}>
                          {centro.label}
                        </option>
                      ))}
                    </select>
                    {errors.centroId?.message ? (
                      <p role="alert" className={fieldErrorClassName}>
                        {errors.centroId.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="data-programada" className={fieldLabelClassName}>
                      Data programada
                    </label>
                    <input
                      id="data-programada"
                      type="date"
                      className={compactInputClassName}
                      {...form.register('dataProgramada')}
                    />
                    {errors.dataProgramada?.message ? (
                      <p role="alert" className={fieldErrorClassName}>
                        {errors.dataProgramada.message}
                      </p>
                    ) : null}
                  </div>

                  <fieldset className="flex flex-col gap-1.5 border-0 sm:col-span-2">
                    <legend className={fieldLabelClassName}>Tipo de inventário</legend>
                    <input type="hidden" {...form.register('tipo')} />
                    <div
                      className="inline-flex w-full max-w-sm gap-1 rounded-lg border border-outline-variant bg-surface-low p-0.5"
                      role="group"
                      aria-label="Tipo de inventário"
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant={tipo === 'geral' ? 'default' : 'ghost'}
                        className="h-8 flex-1 text-xs"
                        onClick={() => setTipo('geral')}
                      >
                        Geral
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={tipo === 'ciclo' ? 'default' : 'ghost'}
                        className="h-8 flex-1 text-xs"
                        onClick={() => setTipo('ciclo')}
                      >
                        Ciclo
                      </Button>
                    </div>
                  </fieldset>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-outline-variant/80 bg-surface-low px-3 py-2.5 lg:hidden">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  <TipoInventarioHint tipo={tipo} />
                </div>

                <footer className="flex justify-end pt-1 sm:hidden">
                  <Button
                    disabled={isSubmitting}
                    type="submit"
                    size="sm"
                    className="w-full gap-1.5 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        Salvando…
                      </>
                    ) : (
                      <>
                        Próximo: gerenciar demandas
                        <ArrowRight aria-hidden className="size-3.5" />
                      </>
                    )}
                  </Button>
                </footer>
              </form>
            </section>

            <aside className="hidden flex-col gap-3 lg:flex">
              <div className={cn(cardClassName, 'bg-primary/[0.03]')}>
                <div className="mb-2 flex items-center gap-2">
                  <Info className="size-4 text-primary" aria-hidden />
                  <h2 className="text-xs font-semibold text-foreground">
                    Sobre os tipos
                  </h2>
                </div>
                <TipoInventarioHint tipo={tipo} />
              </div>

              <ul className={cn(cardClassName, 'space-y-2 text-xs text-foreground')}>
                <li className="flex gap-2">
                  <span aria-hidden className="text-accent">✔</span>
                  Validar endereçamento de picking
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-accent">✔</span>
                  Sincronizar coletores de dados
                </li>
              </ul>

              <div
                className={cn(
                  cardClassName,
                  'flex items-center justify-between gap-2 bg-gradient-to-br from-accent/5 to-primary/5 py-3',
                )}
              >
                <span className="text-xs text-muted-foreground">Armazém</span>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  Operacional
                </span>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

function TipoInventarioHint({ tipo }: { tipo: 'geral' | 'ciclo' }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      {tipo === 'geral' ? (
        <>
          <strong className="font-medium text-foreground">Geral</strong> exige
          paralisação total das operações do armazém.
        </>
      ) : (
        <>
          <strong className="font-medium text-foreground">Ciclo</strong> permite
          contagens rotativas sem interrupção do fluxo.
        </>
      )}
    </p>
  );
}

function MiniMetric({
  titulo,
  valor,
  icon,
  iconAccent,
}: {
  titulo: string;
  valor: string;
  icon: ReactNode;
  iconAccent: 'muted' | 'accent' | 'primary';
}) {
  const box =
    iconAccent === 'accent'
      ? 'bg-accent/15 text-accent'
      : iconAccent === 'primary'
        ? 'bg-primary-container/35 text-primary'
        : 'bg-muted text-muted-foreground';

  return (
    <div
      className={cn(
        cardClassName,
        'flex min-w-0 items-center gap-2 px-3 py-2.5 sm:gap-2.5 sm:px-3.5',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          box,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] leading-none text-muted-foreground sm:text-xs">
          {titulo}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold leading-tight text-foreground">
          {valor}
        </p>
      </div>
    </div>
  );
}

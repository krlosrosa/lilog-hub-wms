'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import {
  ArrowRight,
  BarChart4,
  ClipboardEdit,
  Clock,
  Lightbulb,
  Users,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  premiumCardClassName,
  sectionCardClassName,
} from '@/features/inventario/components/form-field-classes';
import { useInventarioCadastro } from '@/features/inventario/hooks/use-inventario-cadastro';

export function InventarioCadastroView() {
  const { form, isSubmitting, proximoDemandas, centros } = useInventarioCadastro();

  const tipo = form.watch('tipo');

  const { errors } = form.formState;

  const setTipo = (next: typeof tipo) => {
    void form.setValue('tipo', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <SidebarMain>
      <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
        <div className="mx-auto flex max-w-container flex-col gap-5 md:gap-6">
        <nav
          aria-label="Migalhas"
          className="flex flex-wrap items-center gap-2 text-label-md"
        >
          <Link
            href="/inventario"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Inventário
          </Link>
          <span aria-hidden className="text-muted-foreground">
            /
          </span>
          <span className="font-semibold text-foreground">Novo inventário</span>
        </nav>

        <section>
          <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
            Cadastro de inventário
          </h1>
          <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
            Configure as especificações técnicas e o cronograma para o novo
            levantamento de estoque corporativo.
          </p>
        </section>

        <div className="grid grid-cols-12 gap-4 md:gap-5 lg:gap-gutter">
          <section className={cn(sectionCardClassName, 'col-span-12 xl:col-span-8')}>
            <header className="mb-6 flex flex-wrap items-center gap-2">
              <ClipboardEdit className="size-6 shrink-0 text-primary" aria-hidden />
              <h2
                id="titulo-inv-principais"
                className="text-headline-md font-bold uppercase tracking-wide text-foreground"
              >
                Informações principais
              </h2>
            </header>

            <form className="space-y-8" noValidate onSubmit={proximoDemandas}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="nome-inventario" className={fieldLabelClassName}>
                    Nome do inventário
                  </label>
                  <input
                    id="nome-inventario"
                    className={fieldInputClassName}
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

                <div className="flex flex-col gap-2">
                  <label htmlFor="centro-id" className={fieldLabelClassName}>
                    Centro
                  </label>
                  <select
                    id="centro-id"
                    className={fieldInputClassName}
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

                <div className="flex flex-col gap-2">
                  <label htmlFor="data-programada" className={fieldLabelClassName}>
                    Data programada
                  </label>
                  <input
                    id="data-programada"
                    type="date"
                    className={fieldInputClassName}
                    {...form.register('dataProgramada')}
                  />
                  {errors.dataProgramada?.message ? (
                    <p role="alert" className={fieldErrorClassName}>
                      {errors.dataProgramada.message}
                    </p>
                  ) : null}
                </div>

                <fieldset className="flex flex-col gap-2 border-0 md:col-span-2">
                  <legend className={`${fieldLabelClassName}`}>
                    Tipo de inventário
                  </legend>
                  <input type="hidden" {...form.register('tipo')} />
                  <div className="flex gap-2 rounded-lg border border-outline-variant bg-surface-low p-1">
                    <Button
                      type="button"
                      variant={tipo === 'geral' ? 'default' : 'ghost'}
                      className="flex-1"
                      onClick={() => setTipo('geral')}
                    >
                      Geral
                    </Button>
                    <Button
                      type="button"
                      variant={tipo === 'ciclo' ? 'default' : 'ghost'}
                      className="flex-1 text-muted-foreground"
                      onClick={() => setTipo('ciclo')}
                    >
                      Ciclo
                    </Button>
                  </div>
                </fieldset>
              </div>

              <footer className="flex justify-end border-t border-outline-variant pt-6">
                <Button disabled={isSubmitting} type="submit" className="gap-2">
                  Próximo: gerenciar demandas
                  <ArrowRight aria-hidden className="size-4" />
                </Button>
              </footer>
            </form>
          </section>

          <aside className="col-span-12 flex flex-col gap-4 md:gap-5 xl:col-span-4">
            <div
              className={cn(
                sectionCardClassName,
                'relative overflow-hidden',
              )}
            >
              <div className="pointer-events-none absolute -right-4 -top-4 text-primary opacity-15" aria-hidden>
                <Lightbulb className="size-[7.5rem]" />
              </div>
              <h2 className="relative mb-2 font-bold text-primary">Guia de cadastro</h2>
              <p className="relative max-w-sm text-caption text-muted-foreground">
                O inventário <strong className="text-foreground">Geral</strong>{' '}
                exige paralisação total das operações do armazém, enquanto o{' '}
                <strong className="text-foreground">Ciclo</strong> permite
                contagens rotativas sem interrupção do fluxo.
              </p>
              <ul className="relative mt-4 space-y-3 text-caption text-foreground">
                <li className="flex gap-2">
                  <span aria-hidden className="text-accent">✔</span>
                  Validar endereçamento de picking
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-accent">✔</span>
                  Sincronizar coletores de dados
                </li>
              </ul>
            </div>

            <div
              className={cn(
                premiumCardClassName,
                'relative h-52 overflow-hidden',
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-muted/70 to-accent/15" aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" aria-hidden />
              <div className="absolute bottom-4 left-4">
                <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-caption font-medium backdrop-blur-md">
                  Status do armazém: Operacional
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <MiniMetric
                titulo="Acurácia atual"
                valor="98,4%"
                icon={<BarChart4 className="size-5" aria-hidden />}
                iconAccent="muted"
              />
              <MiniMetric
                titulo="Último inventário"
                valor="12 dias atrás"
                icon={<Clock className="size-5" aria-hidden />}
                iconAccent="accent"
              />
              <MiniMetric
                titulo="Equipe disponível"
                valor="24 membros"
                icon={<Users className="size-5" aria-hidden />}
                iconAccent="primary"
              />
            </div>
          </aside>
        </div>
        </div>
      </main>
    </SidebarMain>
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
        sectionCardClassName,
        'flex min-h-0 min-w-0 items-start gap-3 sm:gap-4',
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg sm:size-11',
          box,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 overflow-hidden py-0.5">
        <p className="truncate text-caption leading-snug text-muted-foreground">
          {titulo}
        </p>
        <p className="mt-1 break-words text-base font-bold leading-tight tracking-tight text-foreground">
          {valor}
        </p>
      </div>
    </div>
  );
}

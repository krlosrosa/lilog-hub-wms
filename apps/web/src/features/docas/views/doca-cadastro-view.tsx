'use client';

import { Button } from '@lilog/ui';
import { DoorOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';
import { DocaInfoBasicaCard } from '@/features/docas/components/doca-info-basica-card';
import { useDocaForm } from '@/features/docas/hooks/use-doca-form';

function DocaPreviewCard({
  codigo,
  nome,
}: {
  codigo: string;
  nome: string;
}) {
  const label = codigo.trim() || nome.trim() || 'Nova Doca';

  return (
    <div className="rounded-xl border border-outline-variant bg-card p-6 shadow-inner-glow">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <DoorOpen className="size-6" aria-hidden />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Pré-visualização
          </p>
          <p className="text-headline-md font-semibold text-foreground">{label}</p>
          {nome.trim() && codigo.trim() ? (
            <p className="text-body-sm text-muted-foreground">{nome}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DocaCadastroView() {
  const {
    form,
    isSubmitting,
    unidadeSelecionada,
    onSubmit,
    cancelar,
    codigo,
    nome,
  } = useDocaForm();

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav
            aria-label="Navegação estrutural"
            className="flex items-center gap-2 text-label-md"
          >
            <Link
              href="/docas"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Docas
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">Nova Doca</span>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-outline-variant hover:bg-muted"
              onClick={cancelar}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="doca-cadastro-form"
              disabled={isSubmitting || !unidadeSelecionada}
              className="min-w-[9rem]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                'Cadastrar Doca'
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 bg-surface-lowest px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
          <form
            id="doca-cadastro-form"
            className="mx-auto max-w-container"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="mb-10">
              <h1 className="text-headline-lg-mobile font-bold tracking-tight text-foreground md:text-headline-lg">
                Cadastrar Doca
              </h1>
              <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
                A doca será cadastrada na unidade{' '}
                <span className="font-semibold text-foreground">
                  {unidadeSelecionada?.nomeFilial ?? 'não selecionada'}
                </span>
                . Após o cadastro, ficará disponível para agendamento de
                operações.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-gutter">
              <div className="col-span-12 lg:col-span-8">
                <DocaInfoBasicaCard unidadeSelecionada={unidadeSelecionada} />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <DocaPreviewCard codigo={codigo} nome={nome} />
              </div>
            </div>
          </form>
        </main>
      </SidebarMain>
    </FormProvider>
  );
}

'use client';

import { Button } from '@lilog/ui';
import { ChevronRight, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';

import { ItensFormCard } from '@/features/recebimento/components/itens-form-card';
import { VeiculoFormCard } from '@/features/recebimento/components/veiculo-form-card';
import { useRecebimentoCadastro } from '@/features/recebimento/hooks/use-recebimento-cadastro';

export function RecebimentoCadastroView() {
  const { form, isSubmitting, unidadeSelecionada, onSubmit, cancelar } =
    useRecebimentoCadastro();

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav
            aria-label="Navegação estrutural"
            className="flex flex-wrap items-center gap-2 text-label-md"
          >
            <Link
              href="/recebimento"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Recebimento
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">Novo recebimento</span>
          </nav>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
              form="recebimento-cadastro-form"
              disabled={isSubmitting || !unidadeSelecionada}
              className="min-w-[9rem] gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Cadastrando…
                </>
              ) : (
                <>
                  Cadastrar
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </>
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
          <form
            id="recebimento-cadastro-form"
            className="mx-auto max-w-container"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="mb-8">
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                Novo recebimento
              </h1>
              <p className="mt-2 text-body-md text-muted-foreground">
                Cadastre o pré-recebimento informando veículo, transportadora e
                itens esperados manualmente.
              </p>
              {unidadeSelecionada ? (
                <p className="mt-1 text-caption text-muted-foreground">
                  Unidade:{' '}
                  <span className="font-medium text-foreground">
                    {unidadeSelecionada.nome}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-12 gap-4 md:gap-5 lg:gap-gutter">
              <div className="col-span-12 flex flex-col gap-4 md:gap-5 lg:col-span-4">
                <VeiculoFormCard />

                <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-6">
                  <div
                    className="pointer-events-none absolute -right-4 -top-4 text-primary opacity-15"
                    aria-hidden
                  >
                    <Info className="size-[7.5rem]" />
                  </div>
                  <h2 className="mb-2 font-bold text-primary">Dica de processo</h2>
                  <p className="relative max-w-xs text-caption text-muted-foreground">
                    Informe os SKUs e quantidades previstas com atenção. Na
                    conferência cega, o operador não visualizará esses valores.
                  </p>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8">
                <ItensFormCard />
              </div>
            </div>
          </form>
        </main>

        <footer className="mt-auto border-t border-outline-variant/30 px-margin-mobile py-8 md:px-margin-desktop">
          <div className="mx-auto flex max-w-container flex-col justify-between gap-2 text-caption text-muted-foreground opacity-80 sm:flex-row sm:items-center">
            <span>Lilog-Hub • Cadastro de recebimento</span>
            <span>© {new Date().getFullYear()} </span>
          </div>
        </footer>
      </SidebarMain>
    </FormProvider>
  );
}

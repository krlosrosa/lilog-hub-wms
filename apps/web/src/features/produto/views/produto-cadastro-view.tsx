'use client';

import { Button } from '@lilog/ui';
import { Loader2, Save } from 'lucide-react';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';

import { ClassificacaoCard } from '@/features/produto/components/classificacao-card';
import { InfoBasicaCard } from '@/features/produto/components/info-basica-card';
import { LogisticaCard } from '@/features/produto/components/logistica-card';
import { MedidasCard } from '@/features/produto/components/medidas-card';
import { useProdutoForm } from '@/features/produto/hooks/use-produto-form';

type ProdutoCadastroViewProps = {
  produtoId?: string;
};

export function ProdutoCadastroView({ produtoId }: ProdutoCadastroViewProps) {
  const { form, isSubmitting, isLoading, isEditMode, onSubmit, cancelar } =
    useProdutoForm({ produtoId });

  const pageTitle = isEditMode ? 'Editar Produto' : 'Novo Produto';

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav
            aria-label="Navegação estrutural"
            className="flex flex-wrap items-center gap-2 text-label-md"
          >
            <span className="text-muted-foreground">Inventário</span>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">{pageTitle}</span>
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
              form="produto-cadastro-form"
              disabled={isSubmitting || isLoading}
              className="min-w-[9rem] gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                <>
                  <Save className="size-4 shrink-0" aria-hidden />
                  Salvar Produto
                </>
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
          {isLoading ? (
            <div className="mx-auto flex max-w-container items-center justify-center py-24">
              <Loader2
                className="size-8 animate-spin text-muted-foreground"
                aria-hidden
              />
              <span className="sr-only">Carregando produto…</span>
            </div>
          ) : (
            <form
              id="produto-cadastro-form"
              className="mx-auto max-w-container"
              onSubmit={onSubmit}
              noValidate
            >
              <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 md:gap-5">
                <div className="col-span-12 lg:col-span-8">
                  <InfoBasicaCard />
                </div>
                <div className="col-span-12 lg:col-span-4">
                  <ClassificacaoCard />
                </div>
                <div className="col-span-12">
                  <LogisticaCard />
                </div>
                <div className="col-span-12">
                  <MedidasCard />
                </div>
              </div>
            </form>
          )}
        </main>

        <footer className="mt-auto border-t border-outline-variant/30 px-margin-mobile py-8 md:px-margin-desktop">
          <div className="mx-auto flex max-w-container flex-col justify-between gap-2 text-caption text-muted-foreground opacity-80 sm:flex-row sm:items-center">
            <span>Lilog-Hub • Cadastro de produto</span>
            <span>© {new Date().getFullYear()} </span>
          </div>
        </footer>
      </SidebarMain>
    </FormProvider>
  );
}

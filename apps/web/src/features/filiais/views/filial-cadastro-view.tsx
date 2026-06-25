'use client';

import { Button } from '@lilog/ui';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';

import { CentrosCard } from '@/features/filiais/components/centros-card';
import { CentroCadastroModal } from '@/features/filiais/components/centro-cadastro-modal';
import { InfoGeralCard } from '@/features/filiais/components/info-geral-card';
import { useFilialForm } from '@/features/filiais/hooks/use-filial-form';

export function FilialCadastroView() {
  const {
    form,
    centros,
    centroModalOpen,
    centroEmEdicao,
    definirCentroModalOpen,
    abrirModalNovoCentro,
    iniciarEdicaoCentro,
    salvarCentroModal,
    excluirCentro,
    isSubmitting,
    onSubmit,
    cancelar,
  } = useFilialForm({ mode: 'create' });

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-label-md">
            <Link
              href="/unidades"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Unidades
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">Nova unidade</span>
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
              type="button"
              disabled={isSubmitting}
              className="min-w-[9rem]"
              onClick={() => void onSubmit()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                'Salvar unidade'
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
          <form
            id="filial-cadastro-form"
            className="mx-auto max-w-container"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="mb-8">
              <h1 className="text-headline-lg-mobile font-extrabold tracking-tight text-foreground md:text-headline-lg">
                Nova unidade
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Preencha o código, nome, filial, cluster e vincule os centros
                operacionais da unidade.
              </p>
            </div>

            <div className="flex flex-col gap-gutter">
              <InfoGeralCard mode="create" />
              <CentrosCard
                centros={centros}
                onAdicionarCentro={abrirModalNovoCentro}
                onEditarCentro={iniciarEdicaoCentro}
                onExcluirCentro={excluirCentro}
              />
            </div>
          </form>
          <CentroCadastroModal
            centroParaEdicao={centroEmEdicao}
            open={centroModalOpen}
            onOpenChange={definirCentroModalOpen}
            onSubmitCentro={salvarCentroModal}
          />
        </main>

        <footer className="mt-auto border-t border-outline-variant/30 px-margin-mobile py-8 md:px-margin-desktop">
          <div className="mx-auto flex max-w-container flex-col justify-between gap-2 text-caption text-muted-foreground opacity-80 sm:flex-row sm:items-center">
            <span>Lilog-Hub • Cadastro de unidade</span>
            <span>© {new Date().getFullYear()} </span>
          </div>
        </footer>
      </SidebarMain>
    </FormProvider>
  );
}

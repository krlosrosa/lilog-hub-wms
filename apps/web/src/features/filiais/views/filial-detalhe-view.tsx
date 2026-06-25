'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';

import { CentrosCard } from '@/features/filiais/components/centros-card';
import { CentroCadastroModal } from '@/features/filiais/components/centro-cadastro-modal';
import { InfoGeralCard } from '@/features/filiais/components/info-geral-card';
import { useFilialDetalhe } from '@/features/filiais/hooks/use-filial-detalhe';

type FilialDetalheViewProps = {
  filialId: string;
};

export function FilialDetalheView({ filialId }: FilialDetalheViewProps) {
  const {
    form,
    filial,
    carregando,
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
    voltarLista,
    dialogExclusaoAberta,
    setDialogExclusaoAberta,
    solicitarExclusao,
    confirmarExclusao,
    excluindo,
  } = useFilialDetalhe(filialId);

  if (carregando) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile py-16 md:px-margin-desktop">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
          <p className="text-body-md text-muted-foreground">
            Carregando unidade…
          </p>
        </main>
      </SidebarMain>
    );
  }

  if (!filial) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-16 md:px-margin-desktop">
          <div className="max-w-md text-center">
            <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
              Unidade não encontrada
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              Não há unidade cadastrada com o identificador informado.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/unidades">Voltar para unidades</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <AlertDialog
          open={dialogExclusaoAberta}
          onOpenChange={setDialogExclusaoAberta}
        >
          <AlertDialogContent className="border-outline-variant bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Excluir unidade?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Ao confirmar, a unidade{' '}
                <span className="font-medium text-foreground">
                  {filial.nome}
                </span>{' '}
                ({filial.id}) e todos os centros vinculados serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={excluindo} type="button">
                Cancelar
              </AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                disabled={excluindo}
                onClick={() => void confirmarExclusao()}
              >
                {excluindo ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Excluindo…
                  </>
                ) : (
                  'Excluir permanentemente'
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <header className="sticky top-0 z-30 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav
            aria-label="Navegação estrutural"
            className="flex flex-wrap items-center gap-2 text-label-md"
          >
            <Link
              href="/unidades"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Unidades
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {filial.id}
            </span>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">Editar unidade</span>
          </nav>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-outline-variant hover:bg-muted"
              onClick={() => voltarLista()}
            >
              Voltar
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
                'Salvar alterações'
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="order-last sm:order-none"
              onClick={solicitarExclusao}
            >
              Excluir unidade
            </Button>
          </div>
        </header>

        <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
          <form
            id="filial-edit-form"
            className="mx-auto max-w-container"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="mb-8">
              <h1 className="text-headline-lg-mobile font-extrabold tracking-tight text-foreground md:text-headline-lg">
                Editar unidade
              </h1>
              <p className="mt-1 text-body-md font-medium text-foreground">
                {filial.nome}
              </p>
              <p className="mt-1 text-body-md text-muted-foreground">
                Atualize nome, filial, cluster e gerencie os centros vinculados.
              </p>
            </div>

            <div className="flex flex-col gap-gutter">
              <InfoGeralCard mode="edit" unidadeId={filial.id} />
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
            <span>Lilog-Hub • Unidade • {filial.id}</span>
            <span>© {new Date().getFullYear()} </span>
          </div>
        </footer>
      </SidebarMain>
    </FormProvider>
  );
}

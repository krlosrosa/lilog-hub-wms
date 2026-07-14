'use client';

import { Button } from '@lilog/ui';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/filiais/components/form-field-classes';
import { useCentroOrigemForm } from '@/features/centros-origem/hooks/use-centro-origem-form';

type CentroOrigemCadastroViewProps = {
  mode?: 'create' | 'edit';
};

export function CentroOrigemCadastroView({
  mode = 'create',
}: CentroOrigemCadastroViewProps) {
  const params = useParams<{ centro?: string }>();
  const centroParam = params.centro
    ? decodeURIComponent(params.centro)
    : undefined;
  const resolvedMode = mode === 'edit' || centroParam ? 'edit' : 'create';

  const { form, isSubmitting, isEdit, onSubmit, cancelar } = useCentroOrigemForm({
    mode: resolvedMode,
    centro: centroParam,
  });

  const {
    register,
    formState: { errors },
  } = form;

  const titulo = isEdit ? 'Editar centro de origem' : 'Novo centro de origem';

  return (
    <SidebarMain className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
        <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-label-md">
          <Link
            href="/centros-origem"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Centros de Origem
          </Link>
          <span className="text-muted-foreground" aria-hidden>
            /
          </span>
          <span className="font-semibold text-foreground">{titulo}</span>
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
              'Salvar'
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
        <form
          className="mx-auto max-w-container"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="mb-8">
            <h1 className="text-headline-lg-mobile font-extrabold tracking-tight text-foreground md:text-headline-lg">
              {titulo}
            </h1>
            <p className="mt-1 text-body-md text-muted-foreground">
              Cadastre o código do centro e o nome de identificação.
            </p>
          </div>

          <section className={sectionCardClassName}>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="centro" className={fieldLabelClassName}>
                  Centro
                </label>
                <input
                  id="centro"
                  {...register('centro')}
                  disabled={isEdit}
                  placeholder="Ex.: 1001"
                  className={fieldInputClassName}
                />
                {errors.centro ? (
                  <p className={fieldErrorClassName}>{errors.centro.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="nome" className={fieldLabelClassName}>
                  Nome
                </label>
                <input
                  id="nome"
                  {...register('nome')}
                  placeholder="Ex.: Centro Distribuição SP"
                  className={fieldInputClassName}
                />
                {errors.nome ? (
                  <p className={fieldErrorClassName}>{errors.nome.message}</p>
                ) : null}
              </div>
            </div>
          </section>
        </form>
      </main>
    </SidebarMain>
  );
}

'use client';

import { Button } from '@lilog/ui';
import { DoorOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';
import { DocaBulkCard } from '@/features/docas/components/doca-bulk-card';
import {
  DocaCadastroTabs,
  type DocaCadastroModo,
} from '@/features/docas/components/doca-cadastro-tabs';
import { DocaInfoBasicaCard } from '@/features/docas/components/doca-info-basica-card';
import { useDocaBulkForm } from '@/features/docas/hooks/use-doca-bulk-form';
import { useDocaForm } from '@/features/docas/hooks/use-doca-form';
import { DOCA_FORM_TIPO_LABELS } from '@/features/docas/types/doca-form.schema';

function DocaPreviewCard({
  codigo,
  nome,
  quantidade,
}: {
  codigo: string;
  nome: string;
  quantidade?: number;
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
          {quantidade !== undefined && quantidade > 0 ? (
            <p className="mt-1 text-body-sm text-muted-foreground">
              {quantidade} doca(s) no intervalo
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DocaCadastroView() {
  const [modo, setModo] = useState<DocaCadastroModo>('individual');

  const individual = useDocaForm();
  const massa = useDocaBulkForm();

  const isMassa = modo === 'massa';
  const unidadeSelecionada = isMassa
    ? massa.unidadeSelecionada
    : individual.unidadeSelecionada;
  const isSubmitting = isMassa ? massa.isSubmitting : individual.isSubmitting;
  const cancelar = isMassa ? massa.cancelar : individual.cancelar;

  return (
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
            form={isMassa ? 'doca-bulk-form' : 'doca-cadastro-form'}
            disabled={
              isSubmitting ||
              !unidadeSelecionada ||
              (isMassa && massa.quantidade === 0)
            }
            className="min-w-[9rem]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {isMassa ? 'Criando…' : 'Salvando…'}
              </>
            ) : isMassa ? (
              `Criar ${massa.quantidade || ''} doca(s)`
            ) : (
              'Cadastrar Doca'
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-surface-lowest px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
        <div className="mx-auto max-w-container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-headline-lg-mobile font-bold tracking-tight text-foreground md:text-headline-lg">
                {isMassa ? 'Cadastrar Docas em Massa' : 'Cadastrar Doca'}
              </h1>
              <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
                {isMassa ? (
                  <>
                    Crie várias docas de uma vez informando o intervalo numérico
                    na unidade{' '}
                    <span className="font-semibold text-foreground">
                      {unidadeSelecionada?.nomeFilial ?? 'não selecionada'}
                    </span>
                    . Exemplo: de 1 a 10 gera D01…D10 com nomes Doca 01…Doca 10.
                  </>
                ) : (
                  <>
                    A doca será cadastrada na unidade{' '}
                    <span className="font-semibold text-foreground">
                      {unidadeSelecionada?.nomeFilial ?? 'não selecionada'}
                    </span>
                    . Após o cadastro, ficará disponível para agendamento de
                    operações.
                  </>
                )}
              </p>
            </div>
            <DocaCadastroTabs modoAtivo={modo} onChange={setModo} />
          </div>

          {isMassa ? (
            <FormProvider {...massa.form}>
              <form
                id="doca-bulk-form"
                onSubmit={massa.onSubmit}
                noValidate
              >
                <div className="grid grid-cols-12 gap-gutter">
                  <div className="col-span-12 lg:col-span-8">
                    <DocaBulkCard
                      unidadeSelecionada={massa.unidadeSelecionada}
                      quantidade={massa.quantidade}
                      preview={massa.preview}
                    />
                  </div>
                  <div className="col-span-12 lg:col-span-4">
                    <DocaPreviewCard
                      codigo={massa.preview?.primeiroCodigo ?? ''}
                      nome={massa.preview?.primeiroNome ?? ''}
                      quantidade={massa.quantidade}
                    />
                    {massa.preview && massa.quantidade > 1 ? (
                      <p className="mt-3 text-center text-body-sm text-muted-foreground">
                        Tipo: {DOCA_FORM_TIPO_LABELS[massa.tipo]}
                      </p>
                    ) : null}
                  </div>
                </div>
              </form>
            </FormProvider>
          ) : (
            <FormProvider {...individual.form}>
              <form
                id="doca-cadastro-form"
                onSubmit={individual.onSubmit}
                noValidate
              >
                <div className="grid grid-cols-12 gap-gutter">
                  <div className="col-span-12 lg:col-span-8">
                    <DocaInfoBasicaCard
                      unidadeSelecionada={individual.unidadeSelecionada}
                    />
                  </div>
                  <div className="col-span-12 lg:col-span-4">
                    <DocaPreviewCard
                      codigo={individual.codigo}
                      nome={individual.nome}
                    />
                  </div>
                </div>
              </form>
            </FormProvider>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}

'use client';

import { useCallback, useState } from 'react';

import { Button } from '@lilog/ui';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';

import { ImportacaoPanel } from '@/features/recebimento/components/importacao-panel';
import { ItensFormCard } from '@/features/recebimento/components/itens-form-card';
import {
  RecebimentoCadastroTabs,
  type RecebimentoCadastroAba,
} from '@/features/recebimento/components/recebimento-cadastro-tabs';
import { VeiculoFormCard } from '@/features/recebimento/components/veiculo-form-card';
import { useRecebimentoCadastro } from '@/features/recebimento/hooks/use-recebimento-cadastro';
import type { RecebimentoXlsxDemanda } from '@/features/recebimento/lib/parse-recebimento-xlsx';

export function RecebimentoCadastroView() {
  const [abaAtiva, setAbaAtiva] = useState<RecebimentoCadastroAba>('upload');

  const {
    form,
    isSubmitting,
    isSubmittingDemandas,
    unidadeSelecionada,
    onSubmit,
    cadastrarDemandasImportadas,
    carregarDemandaNoFormulario,
    cancelar,
  } = useRecebimentoCadastro();

  const editarDemandaManual = useCallback(
    (demanda: RecebimentoXlsxDemanda) => {
      carregarDemandaNoFormulario(demanda);
      setAbaAtiva('manual');
    },
    [carregarDemandaNoFormulario],
  );

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-glass-bg px-margin-mobile py-2.5 backdrop-blur-glass md:px-margin-desktop">
          <div className="flex min-w-0 flex-col gap-0.5">
            <nav
              aria-label="Navegação estrutural"
              className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link
                href="/recebimento"
                className="transition-colors hover:text-primary"
              >
                Recebimento
              </Link>
              <span aria-hidden>/</span>
              <span className="font-medium text-foreground">Novo</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                Novo recebimento
              </h1>
              {unidadeSelecionada ? (
                <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-[10px] font-medium text-muted-foreground">
                  {unidadeSelecionada.nome}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-outline-variant hover:bg-muted"
              onClick={cancelar}
            >
              Cancelar
            </Button>
            {abaAtiva === 'manual' ? (
              <Button
                type="submit"
                form="recebimento-cadastro-form"
                size="sm"
                disabled={isSubmitting || !unidadeSelecionada}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Cadastrando…
                  </>
                ) : (
                  <>
                    Cadastrar
                    <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </header>

        <main className="flex-1 bg-surface-lowest px-margin-mobile py-4 md:px-margin-desktop md:py-5">
          <div className="mx-auto max-w-container">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <RecebimentoCadastroTabs abaAtiva={abaAtiva} onChange={setAbaAtiva} />
              {abaAtiva === 'upload' && isSubmittingDemandas ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Cadastrando demandas…
                </span>
              ) : null}
            </div>

            <form
              id="recebimento-cadastro-form"
              onSubmit={onSubmit}
              noValidate
              hidden={abaAtiva !== 'manual'}
            >
              <div
                className="grid grid-cols-12 gap-3 lg:gap-4"
                role="tabpanel"
                aria-label="Cadastro manual"
              >
                <div className="col-span-12 lg:col-span-5 xl:col-span-4">
                  <VeiculoFormCard />
                </div>
                <div className="col-span-12 lg:col-span-7 xl:col-span-8">
                  <ItensFormCard />
                </div>
              </div>
            </form>

            {abaAtiva === 'upload' ? (
              <div role="tabpanel" aria-label="Importação">
                <ImportacaoPanel
                  onCadastrarDemandas={cadastrarDemandasImportadas}
                  onEditarDemanda={editarDemandaManual}
                  isSubmittingDemandas={isSubmittingDemandas}
                />
              </div>
            ) : null}
          </div>
        </main>
      </SidebarMain>
    </FormProvider>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@lilog/ui';
import { Building2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { SidebarMain } from '@/components/layout/sidebar';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { FILTRO_CLUSTER_LABELS } from '@/features/filiais/types/filial-lista.schema';
import type { UnidadeSelecionada } from '@/contexts/unidade-context';

export function SelecionarUnidadeView() {
  const router = useRouter();
  const {
    unidades,
    unidadeSelecionada,
    isLoading,
    error,
    setUnidade,
  } = useUnidadeContext();
  const [selecionandoId, setSelecionandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && unidades.length === 1 && !unidadeSelecionada) {
      setUnidade(unidades[0]!);
      router.push('/');
    }
  }, [isLoading, unidades, unidadeSelecionada, setUnidade, router]);

  const handleSelecionar = useCallback(
    async (unidade: UnidadeSelecionada) => {
      setSelecionandoId(unidade.id);

      setUnidade(unidade);
      router.push('/');
    },
    [router, setUnidade],
  );

  return (
    <SidebarMain className="bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:p-8">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 aria-hidden className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Selecionar unidade
              </h1>
              <p className="text-sm text-muted-foreground">
                {unidadeSelecionada
                  ? 'Escolha outra unidade para operar no WMS.'
                  : 'Escolha a unidade em que você vai operar no WMS.'}
              </p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-outline-variant bg-glass-bg">
            <Loader2 aria-hidden className="size-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando unidades</span>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && unidades.length === 0 ? (
          <div className="rounded-lg border border-outline-variant bg-glass-bg p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Você não possui acesso a nenhuma unidade. Contate o administrador.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && unidades.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unidades.map((unidade) => {
              const isAtiva = unidadeSelecionada?.id === unidade.id;
              const isSelecionando = selecionandoId === unidade.id;

              return (
                <button
                  key={unidade.id}
                  type="button"
                  onClick={() => void handleSelecionar(unidade)}
                  disabled={isSelecionando}
                  className={cn(
                    'flex flex-col rounded-lg border border-outline-variant bg-glass-bg p-5 text-left shadow-inner-glow backdrop-blur-glass transition-colors hover:border-primary/40 hover:bg-surface-high/40',
                    isAtiva && 'border-primary/50 ring-1 ring-primary/20',
                    isSelecionando && 'opacity-70',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">
                        {unidade.nome}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {unidade.nomeFilial}
                      </p>
                    </div>
                    <span className="rounded-md bg-surface-highest px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {FILTRO_CLUSTER_LABELS[unidade.cluster]}
                    </span>
                  </div>

                  {isAtiva ? (
                    <div className="mt-5 border-t border-outline-variant/50 pt-4">
                      <span className="text-xs font-medium text-primary">Ativa</span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </SidebarMain>
  );
}

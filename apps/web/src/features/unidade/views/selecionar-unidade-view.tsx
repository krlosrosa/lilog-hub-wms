'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@lilog/ui';
import { Building2, Loader2, Warehouse } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { SidebarMain } from '@/components/layout/sidebar';
import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  listUnidades,
  mapUnidadeToListaItem,
} from '@/features/filiais/lib/unidade-api';
import { FILTRO_CLUSTER_LABELS } from '@/features/filiais/types/filial-lista.schema';
import type { FilialListaItem } from '@/features/filiais/types/filial-lista.schema';
import { ApiClientError } from '@/lib/api';

export function SelecionarUnidadeView() {
  const router = useRouter();
  const { setUnidade, unidadeSelecionada } = useUnidadeContext();
  const [unidades, setUnidades] = useState<FilialListaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionandoId, setSelecionandoId] = useState<string | null>(null);

  useEffect(() => {
    async function carregarUnidades() {
      setCarregando(true);
      setErro(null);

      try {
        const response = await listUnidades({ page: 1, limit: 100 });
        setUnidades(response.items.map(mapUnidadeToListaItem));
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar as unidades';

        setErro(message);
        toast.error(message);
      } finally {
        setCarregando(false);
      }
    }

    void carregarUnidades();
  }, []);

  const handleSelecionar = useCallback(
    async (unidade: FilialListaItem) => {
      setSelecionandoId(unidade.id);

      setUnidade({
        id: unidade.id,
        nome: unidade.nome,
        cluster: unidade.cluster,
        nomeFilial: unidade.nomeFilial,
      });

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

        {carregando ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-outline-variant bg-glass-bg">
            <Loader2 aria-hidden className="size-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando unidades</span>
          </div>
        ) : null}

        {!carregando && erro ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {erro}
          </div>
        ) : null}

        {!carregando && !erro && unidades.length === 0 ? (
          <div className="rounded-lg border border-outline-variant bg-glass-bg p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma unidade cadastrada. Cadastre uma unidade para continuar.
            </p>
          </div>
        ) : null}

        {!carregando && !erro && unidades.length > 0 ? (
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

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-outline-variant/50 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Warehouse aria-hidden className="size-4 shrink-0" />
                      <span>
                        {unidade.centrosCount}{' '}
                        {unidade.centrosCount === 1 ? 'centro' : 'centros'}
                      </span>
                    </div>
                    {isAtiva ? (
                      <span className="text-xs font-medium text-primary">Ativa</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </SidebarMain>
  );
}

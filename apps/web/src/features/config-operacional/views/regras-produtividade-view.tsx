'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@lilog/ui';
import { Loader2, Plus, Timer } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { RegrasProdutividadeListaPanel } from '@/features/config-operacional/components/regras-produtividade-lista-panel';
import { RegrasProdutividadeTabs } from '@/features/config-operacional/components/regras-produtividade-tabs';
import { regrasProdutividadeNovaPath } from '@/features/config-operacional/lib/regras-produtividade-paths';
import { regrasProdutividadeListaPath } from '@/features/config-operacional/lib/regras-produtividade-paths';
import {
  ETAPA_PRODUTIVIDADE_LABELS,
  parseEtapaProdutividade,
  type EtapaProdutividade,
} from '@/features/config-operacional/types/regra-produtividade-tabs';
import { RegraConferenciaRow } from '@/features/regras-conferencia/components/regra-conferencia-row';
import { useRegrasConferenciaLista } from '@/features/regras-conferencia/hooks/use-regras-conferencia-lista';

export function RegrasProdutividadeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaAtiva = parseEtapaProdutividade(searchParams.get('aba'));
  const conferencia = useRegrasConferenciaLista();

  const setAba = (aba: EtapaProdutividade) => {
    router.replace(regrasProdutividadeListaPath(aba));
  };

  const temFiltrosAtivos =
    conferencia.filtroAtivo !== 'todos' || conferencia.busca.trim().length > 0;
  const listaVazia =
    !conferencia.isLoading && conferencia.itemsPagina.length === 0;

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Timer className="size-5" aria-hidden />
                </span>
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Configurações · Recebimento
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Regras de produtividade
              </h1>
              <p className="mt-1 max-w-xl text-body-md text-muted-foreground">
                Tempo esperado para conferência no recebimento — validação por
                linha, palete e cliente.
              </p>
            </div>

            <Button size="sm" className="gap-1.5 self-start sm:self-auto" asChild>
              <Link href={regrasProdutividadeNovaPath(abaAtiva)}>
                <Plus className="size-4" aria-hidden />
                Nova regra · {ETAPA_PRODUTIVIDADE_LABELS[abaAtiva]}
              </Link>
            </Button>
          </div>

          <div className="mb-5">
            <RegrasProdutividadeTabs abaAtiva={abaAtiva} onChange={setAba} />
          </div>

          <RegrasProdutividadeListaPanel
            stats={conferencia.stats}
            metaLabel="Meta de tempo por conferência"
            busca={conferencia.busca}
            onBuscaChange={conferencia.setBusca}
            filtroAtivo={conferencia.filtroAtivo}
            onFiltroAtivoChange={conferencia.setFiltroAtivo}
            totalFiltrados={conferencia.totalFiltrados}
            pagina={conferencia.pagina}
            totalPaginas={conferencia.totalPaginas}
            onChangePagina={conferencia.setPagina}
            itemsInicio={conferencia.itemsInicio}
            pageSize={conferencia.pageSize}
            listaVazia={listaVazia}
            temFiltrosAtivos={temFiltrosAtivos}
          >
            {conferencia.isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <Loader2
                    className="mx-auto size-8 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Carregando regras…
                  </p>
                </td>
              </tr>
            )}
            {!conferencia.isLoading &&
              conferencia.itemsPagina.map((regra) => (
                <RegraConferenciaRow
                  key={regra.id}
                  regra={regra}
                  tempoPreviewSeg={conferencia.calcularPreview(regra)}
                  onToggleAtivo={conferencia.toggleAtivo}
                  onDuplicar={conferencia.duplicarRegra}
                  onExcluir={conferencia.excluirRegra}
                />
              ))}
          </RegrasProdutividadeListaPanel>
        </div>
      </main>
    </SidebarMain>
  );
}

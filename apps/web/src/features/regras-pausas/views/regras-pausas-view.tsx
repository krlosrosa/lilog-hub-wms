'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@lilog/ui';
import { Coffee, Loader2, Plus } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { RegraPausaRow } from '@/features/regras-pausas/components/regra-pausa-row';
import { RegrasPausasListaPanel } from '@/features/regras-pausas/components/regras-pausas-lista-panel';
import { RegrasPausasTabs } from '@/features/regras-pausas/components/regras-pausas-tabs';
import { useRegrasPausasLista } from '@/features/regras-pausas/hooks/use-regras-pausas-lista';
import {
  regrasPausasListaPath,
  regrasPausasNovaPath,
} from '@/features/regras-pausas/lib/regras-pausas-paths';
import {
  parseTipoPausaRegra,
  TIPO_PAUSA_REGRA_LABELS,
  type TipoPausaRegra,
} from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';

const DESCRICOES: Record<TipoPausaRegra, string> = {
  termica:
    'Intervalo de trabalho contínuo antes de orientar pausa térmica e duração esperada da pausa.',
  refeicao:
    'Intervalo para pausa de refeição e tempo previsto de ausência do posto.',
  outros:
    'Regras opcionais para outros tipos de pausa. Intervalo zero desativa alertas automáticos.',
};

export function RegrasPausasView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaAtiva = parseTipoPausaRegra(searchParams.get('aba'));

  const termica = useRegrasPausasLista('termica');
  const refeicao = useRegrasPausasLista('refeicao');
  const outros = useRegrasPausasLista('outros');

  const setAba = (aba: TipoPausaRegra) => {
    router.replace(regrasPausasListaPath(aba));
  };

  const listaAtiva =
    abaAtiva === 'refeicao'
      ? refeicao
      : abaAtiva === 'outros'
        ? outros
        : termica;

  const temFiltrosAtivos =
    listaAtiva.filtroAtivo !== 'todos' || listaAtiva.busca.trim().length > 0;
  const listaVazia =
    !listaAtiva.isLoading && listaAtiva.itemsPagina.length === 0;

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Coffee className="size-5" aria-hidden />
                </span>
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Configurações · Pausas
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Regras de pausa
              </h1>
              <p className="mt-1 max-w-xl text-body-md text-muted-foreground">
                {DESCRICOES[abaAtiva]}
              </p>
            </div>

            <Button size="sm" className="gap-1.5 self-start sm:self-auto" asChild>
              <Link href={regrasPausasNovaPath(abaAtiva)}>
                <Plus className="size-4" aria-hidden />
                Nova regra · {TIPO_PAUSA_REGRA_LABELS[abaAtiva]}
              </Link>
            </Button>
          </div>

          <div className="mb-5">
            <RegrasPausasTabs abaAtiva={abaAtiva} onChange={setAba} />
          </div>

          <RegrasPausasListaPanel
            stats={listaAtiva.stats}
            busca={listaAtiva.busca}
            onBuscaChange={listaAtiva.setBusca}
            filtroAtivo={listaAtiva.filtroAtivo}
            onFiltroAtivoChange={listaAtiva.setFiltroAtivo}
            totalFiltrados={listaAtiva.totalFiltrados}
            pagina={listaAtiva.pagina}
            totalPaginas={listaAtiva.totalPaginas}
            onChangePagina={listaAtiva.setPagina}
            itemsInicio={listaAtiva.itemsInicio}
            pageSize={listaAtiva.pageSize}
            listaVazia={listaVazia}
            temFiltrosAtivos={temFiltrosAtivos}
          >
            {listaAtiva.isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
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
            {!listaAtiva.isLoading &&
              listaAtiva.itemsPagina.map((regra) => (
                <RegraPausaRow
                  key={regra.id}
                  regra={regra}
                  onToggleAtivo={listaAtiva.toggleAtivo}
                  onDuplicar={listaAtiva.duplicarRegra}
                  onExcluir={listaAtiva.excluirRegra}
                />
              ))}
          </RegrasPausasListaPanel>
        </div>
      </main>
    </SidebarMain>
  );
}

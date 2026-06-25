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
import { RegraCarregamentoRow } from '@/features/regras-carregamento/components/regra-carregamento-row';
import { useRegrasCarregamentoLista } from '@/features/regras-carregamento/hooks/use-regras-carregamento-lista';
import { RegraConferenciaRow } from '@/features/regras-conferencia/components/regra-conferencia-row';
import { useRegrasConferenciaLista } from '@/features/regras-conferencia/hooks/use-regras-conferencia-lista';
import { RegraExpedicaoRow } from '@/features/regras-expedicao/components/regra-expedicao-row';
import { useRegrasExpedicaoLista } from '@/features/regras-expedicao/hooks/use-regras-expedicao-lista';

const DESCRICOES: Record<EtapaProdutividade, string> = {
  separacao:
    'Tempo esperado para separação no armazém — deslocamento, pegada de caixas e gordura de mapa.',
  conferencia:
    'Tempo esperado para conferência no staging — validação por linha, palete e cliente.',
  carregamento:
    'Tempo esperado para carregamento na doca — paletes, minutas, amarração e liberação.',
};

const META_LABELS: Record<EtapaProdutividade, string> = {
  separacao: 'Meta de tempo por mapa',
  conferencia: 'Meta de tempo por conferência',
  carregamento: 'Meta de tempo por minuta',
};

export function RegrasProdutividadeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaAtiva = parseEtapaProdutividade(searchParams.get('aba'));

  const separacao = useRegrasExpedicaoLista();
  const conferencia = useRegrasConferenciaLista();
  const carregamento = useRegrasCarregamentoLista();

  const setAba = (aba: EtapaProdutividade) => {
    router.replace(regrasProdutividadeListaPath(aba));
  };

  const listaAtiva =
    abaAtiva === 'conferencia'
      ? conferencia
      : abaAtiva === 'carregamento'
        ? carregamento
        : separacao;

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
                  <Timer className="size-5" aria-hidden />
                </span>
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Configurações · Expedição
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Regras de produtividade
              </h1>
              <p className="mt-1 max-w-xl text-body-md text-muted-foreground">
                {DESCRICOES[abaAtiva]}
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
            stats={listaAtiva.stats}
            metaLabel={META_LABELS[abaAtiva]}
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
            {!listaAtiva.isLoading && abaAtiva === 'separacao' &&
              separacao.itemsPagina.map((regra) => (
                <RegraExpedicaoRow
                  key={regra.id}
                  regra={regra}
                  tempoPreviewSeg={separacao.calcularPreview(regra)}
                  onToggleAtivo={separacao.toggleAtivo}
                  onDuplicar={separacao.duplicarRegra}
                  onExcluir={separacao.excluirRegra}
                />
              ))}
            {!listaAtiva.isLoading && abaAtiva === 'conferencia' &&
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
            {!listaAtiva.isLoading && abaAtiva === 'carregamento' &&
              carregamento.itemsPagina.map((regra) => (
                <RegraCarregamentoRow
                  key={regra.id}
                  regra={regra}
                  tempoPreviewSeg={carregamento.calcularPreview(regra)}
                  onToggleAtivo={carregamento.toggleAtivo}
                  onDuplicar={carregamento.duplicarRegra}
                  onExcluir={carregamento.excluirRegra}
                />
              ))}
          </RegrasProdutividadeListaPanel>
        </div>
      </main>
    </SidebarMain>
  );
}

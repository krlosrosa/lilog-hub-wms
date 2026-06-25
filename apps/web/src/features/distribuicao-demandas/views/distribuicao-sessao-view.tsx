'use client';



import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { useState } from 'react';

import { Loader2 } from 'lucide-react';

import { toast } from 'sonner';



import { Button } from '@lilog/ui';



import { SidebarMain } from '@/components/layout/sidebar';

import { ConfirmarExecucaoDialog } from '@/features/distribuicao-demandas/components/confirmar-execucao-dialog';

import { DistribuicaoWorkspaceGrid } from '@/features/distribuicao-demandas/components/distribuicao-workspace-grid';

import { useDistribuicaoSessao } from '@/features/distribuicao-demandas/hooks/use-distribuicao-sessao';



export function DistribuicaoSessaoView() {

  const router = useRouter();

  const [dialogAberto, setDialogAberto] = useState(false);



  const {

    isLoading,

    isExecutando,

    temTransportes,

    semUnidade,

    semSelecao,

    transporteIdsSelecionados,

    errorMessage,

    state,

    setConfig,

    recalcular,

    simular,

    moverTransporte,

    setPreviewWorkload,

    confirmarDistribuicao,

  } = useDistribuicaoSessao();



  const totalMapas = state.transportes.reduce((s, t) => s + t.totalMapas, 0);

  const pesoTotal = state.transportes.reduce((s, t) => s + t.pesoTotalKg, 0);



  const executarComSessao = async (sessaoId: string) => {

    try {

      const resultado = await confirmarDistribuicao(sessaoId, false);



      if (resultado.criadas > 0) {

        toast.success(

          `${resultado.criadas} demanda(s) criada(s) — separação, conferência e carregamento.`,

        );

      }



      if (resultado.avisos.length > 0) {

        toast.warning(resultado.avisos[0]);

      }



      if (resultado.falhas.length > 0) {

        toast.error(

          `${resultado.falhas.length} lote(s) falharam. ${resultado.falhas[0]?.mensagem ?? ''}`,

        );

      }



      if (resultado.criadas > 0 && resultado.falhas.length === 0) {

        setDialogAberto(false);

        router.push('/op-wms/gestao-recursos');

      }

    } catch (error) {

      const msg =

        error instanceof Error ? error.message : 'Falha ao confirmar distribuição.';



      if (msg.includes('mapas incompletos')) {

        const confirmar = window.confirm(

          `${msg}\n\nDeseja executar mesmo assim (apenas mapas disponíveis)?`,

        );

        if (confirmar) {

          try {

            const parcial = await confirmarDistribuicao(sessaoId, true);

            toast.success(`${parcial.criadas} demanda(s) criada(s) (execução parcial).`);

            if (parcial.criadas > 0) {

              setDialogAberto(false);

              router.push('/op-wms/gestao-recursos');

            }

          } catch (inner) {

            toast.error(

              inner instanceof Error ? inner.message : 'Falha na execução parcial.',

            );

          }

        }

        return;

      }



      toast.error(msg);

    }

  };



  if (semUnidade) {

    return (

      <SidebarMain>

        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">

          <p className="text-muted-foreground">

            Selecione uma unidade para distribuir transportes.

          </p>

          <Button asChild variant="outline">

            <Link href="/op-wms/distribuicao-demandas">Voltar ao planejamento</Link>

          </Button>

        </main>

      </SidebarMain>

    );

  }



  if (!isLoading && semSelecao) {

    return (

      <SidebarMain>

        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">

          <p className="text-muted-foreground">

            Selecione transportes no planejamento antes de simular a distribuição.

          </p>

          <Button asChild variant="outline">

            <Link href="/op-wms/distribuicao-demandas">Ir ao planejamento</Link>

          </Button>

        </main>

      </SidebarMain>

    );

  }



  if (!isLoading && !temTransportes) {

    return (

      <SidebarMain>

        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">

          <p className="text-muted-foreground">

            Nenhum transporte selecionado encontrado.

          </p>

          <Button asChild variant="outline">

            <Link href="/op-wms/distribuicao-demandas">Voltar ao planejamento</Link>

          </Button>

        </main>

      </SidebarMain>

    );

  }



  return (

    <SidebarMain>

      <main className="min-h-dvh pb-12">

        <div className="px-margin-mobile pb-8 pt-6 md:px-margin-desktop md:pt-8">

          <div className="mx-auto max-w-container">

            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">

              <div>

                <nav className="mb-1 text-xs text-muted-foreground">

                  <Link

                    href="/op-wms/distribuicao-demandas"

                    className="hover:text-foreground"

                  >

                    Planejamento

                  </Link>

                  <span className="mx-1">→</span>

                  <span>Simulação de distribuição</span>

                </nav>

                <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">

                  Distribuir transportes selecionados

                </h1>

                <p className="mt-1 text-body-md text-muted-foreground">

                  {state.transportes.length} transporte(s) · {totalMapas} mapas ·{' '}

                  {pesoTotal.toLocaleString('pt-BR')} kg · {state.config.qtdDocas}{' '}

                  doca(s) · {state.config.qtdFuncionarios} funcionário(s)

                </p>

              </div>



              <div className="flex flex-wrap gap-2">

                <Button variant="outline" size="sm" onClick={simular} disabled={isExecutando}>

                  Simular

                </Button>

                <Button variant="outline" size="sm" onClick={recalcular} disabled={isExecutando}>

                  Recalcular

                </Button>

                <Button

                  variant="outline"

                  size="sm"

                  disabled={isExecutando}

                  onClick={() =>

                    router.push('/op-wms/distribuicao-demandas/sessao/balanceamento')

                  }

                >

                  Ver balanceamento

                </Button>

                <Button

                  size="sm"

                  onClick={() => setDialogAberto(true)}

                  disabled={isExecutando}

                >

                  Confirmar distribuição

                </Button>

              </div>

            </header>



            {errorMessage ? (

              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">

                {errorMessage}

              </div>

            ) : null}



            {isLoading ? (

              <div

                className="flex min-h-[480px] items-center justify-center"

                role="status"

                aria-label="Carregando distribuição"

              >

                <Loader2 className="h-8 w-8 animate-spin text-primary" />

              </div>

            ) : (

              <DistribuicaoWorkspaceGrid

                state={state}

                onConfigChange={setConfig}

                onMoverTransporte={moverTransporte}

                onSelectWorkload={setPreviewWorkload}

              />

            )}

          </div>

        </div>

      </main>



      <ConfirmarExecucaoDialog

        open={dialogAberto}

        isSubmitting={isExecutando}

        onClose={() => setDialogAberto(false)}

        onConfirm={(sessaoId) => void executarComSessao(sessaoId)}

      />

    </SidebarMain>

  );

}



/** @deprecated Use DistribuicaoSessaoView */

export const DistribuicaoMapaView = DistribuicaoSessaoView;


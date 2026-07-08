'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import { ArrowRight, Loader2 } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { CncAnaliseTabs, type CncAnaliseAba } from '@/features/cnc/components/cnc-analise-tabs';
import { CncAnaliseWorkflow } from '@/features/cnc/components/cnc-analise-workflow';
import { CncAnomaliasPanel } from '@/features/cnc/components/cnc-anomalias-panel';
import { CncChecklistPanel } from '@/features/cnc/components/cnc-checklist-panel';
import { CncDetalheHeader } from '@/features/cnc/components/cnc-detalhe-header';
import { CncDetalheKpis } from '@/features/cnc/components/cnc-detalhe-kpis';
import { CncEventosTimeline } from '@/features/cnc/components/cnc-eventos-timeline';
import { ModalAdicionarTratativa } from '@/features/cnc/components/modal-adicionar-tratativa';
import { ModalCancelarCnc } from '@/features/cnc/components/modal-cancelar-cnc';
import { ModalEncerrarCnc } from '@/features/cnc/components/modal-encerrar-cnc';
import { ModalIniciarAnalise } from '@/features/cnc/components/modal-iniciar-analise';
import { CncResumoPanel } from '@/features/cnc/components/cnc-resumo-panel';
import { CncTratativasPanel } from '@/features/cnc/components/cnc-tratativas-panel';
import { useCncDetalhe } from '@/features/cnc/hooks/use-cnc-detalhe';
import { useCncRecebimentoContext } from '@/features/cnc/hooks/use-cnc-recebimento-context';
import { useCncTratativas } from '@/features/cnc/hooks/use-cnc-tratativas';
import { calcularProgressoTratativas } from '@/features/cnc/lib/cnc-detalhe-utils';

type CncDetalheViewProps = {
  cncId: string;
};

export function CncDetalheView({ cncId }: CncDetalheViewProps) {
  const {
    cnc,
    isLoading,
    notFound,
    processandoAcao,
    recarregar,
    actions,
  } = useCncDetalhe(cncId);

  const tratativas = useCncTratativas(cncId, recarregar);
  const recebimentoContext = useCncRecebimentoContext(cnc);

  const [abaAtiva, setAbaAtiva] = useState<CncAnaliseAba>('anomalias');
  const [modalIniciar, setModalIniciar] = useState(false);
  const [modalEncerrar, setModalEncerrar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [modalTratativa, setModalTratativa] = useState(false);

  const handleIniciarAnalise = useCallback(async () => {
    await actions.iniciarAnalise();
    setModalIniciar(false);
    setAbaAtiva('anomalias');
  }, [actions]);

  const handleEncerrar = useCallback(
    async (body: Parameters<typeof actions.encerrar>[0]) => {
      await actions.encerrar(body);
      setModalEncerrar(false);
    },
    [actions],
  );

  const handleCancelar = useCallback(
    async (observacao: string) => {
      await actions.cancelar({ observacao });
      setModalCancelar(false);
    },
    [actions],
  );

  const handleAdicionarTratativa = useCallback(
    async (body: Parameters<typeof tratativas.adicionar>[0]) => {
      try {
        await tratativas.adicionar(body);
        setModalTratativa(false);
        setAbaAtiva('tratativas');
      } catch {
        // toast handled in hook
      }
    },
    [tratativas],
  );

  if (isLoading) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile py-16 md:px-margin-desktop">
          <Loader2
            className="size-8 animate-spin text-muted-foreground"
            aria-hidden
          />
          <p className="text-body-md text-muted-foreground">
            Carregando análise da não conformidade…
          </p>
        </main>
      </SidebarMain>
    );
  }

  if (!cnc || notFound) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-16 md:px-margin-desktop">
          <div className="max-w-md text-center">
            <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
              CNC não encontrada
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              Não há não conformidade correspondente ao identificador informado.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/cnc">Voltar para CNCs</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const podeIniciarAnalise = cnc.situacao === 'pendente';
  const podeGerenciar = cnc.situacao === 'em_analise';
  const progressoTratativas = calcularProgressoTratativas(cnc);

  return (
    <SidebarMain>
      {modalIniciar ? (
        <ModalIniciarAnalise
          open={modalIniciar}
          cnc={cnc}
          processando={processandoAcao}
          onOpenChange={setModalIniciar}
          onConfirm={() => void handleIniciarAnalise()}
        />
      ) : null}

      {modalEncerrar ? (
        <ModalEncerrarCnc
          open={modalEncerrar}
          cnc={cnc}
          processando={processandoAcao}
          onOpenChange={setModalEncerrar}
          onConfirm={(body) => void handleEncerrar(body)}
        />
      ) : null}

      {modalCancelar ? (
        <ModalCancelarCnc
          open={modalCancelar}
          cnc={cnc}
          processando={processandoAcao}
          onOpenChange={setModalCancelar}
          onConfirm={(obs) => void handleCancelar(obs)}
        />
      ) : null}

      {modalTratativa ? (
        <ModalAdicionarTratativa
          open={modalTratativa}
          cnc={cnc}
          processando={tratativas.processando}
          onOpenChange={setModalTratativa}
          onConfirm={(body) => void handleAdicionarTratativa(body)}
        />
      ) : null}

      <main className="px-margin-mobile py-4 pb-24 md:px-margin-desktop md:py-6 md:pb-10">
        <div className="mx-auto flex max-w-container flex-col gap-6">
          <CncDetalheHeader
            cnc={cnc}
            podeIniciarAnalise={podeIniciarAnalise}
            podeGerenciar={podeGerenciar}
            processandoAcao={processandoAcao}
            onIniciarAnalise={() => setModalIniciar(true)}
            onEncerrar={() => setModalEncerrar(true)}
            onCancelar={() => setModalCancelar(true)}
          />

          {podeIniciarAnalise ? (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Análise pendente
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                  Inicie a análise para investigar as {cnc.itens.length}{' '}
                  anomalia{cnc.itens.length !== 1 ? 's' : ''} identificada
                  {cnc.itens.length !== 1 ? 's' : ''} e registrar tratativas.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="shrink-0 gap-1.5"
                disabled={processandoAcao}
                onClick={() => setModalIniciar(true)}
              >
                Iniciar análise
                <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            </div>
          ) : null}

          <CncDetalheKpis cnc={cnc} />

          <CncAnaliseWorkflow cnc={cnc} />

          <div className="flex flex-col gap-4">
            <CncAnaliseTabs
              abaAtiva={abaAtiva}
              onChange={setAbaAtiva}
              badges={{
                anomalias: cnc.itens.length,
                tratativas: progressoTratativas.pendentes || undefined,
                checklist:
                  recebimentoContext.fotosChecklist.length > 0
                    ? recebimentoContext.fotosChecklist.length
                    : undefined,
              }}
            />

            <div
              role="tabpanel"
              aria-label={
                abaAtiva === 'anomalias'
                  ? 'Anomalias'
                  : abaAtiva === 'checklist'
                    ? 'Checklist'
                    : abaAtiva === 'tratativas'
                      ? 'Tratativas'
                      : abaAtiva === 'resumo'
                        ? 'Resumo'
                        : 'Histórico'
              }
              className="min-h-[320px]"
            >
              {abaAtiva === 'anomalias' ? (
                <CncAnomaliasPanel
                  cnc={cnc}
                  fotosPorReferencia={recebimentoContext.fotosPorReferencia}
                />
              ) : null}
              {abaAtiva === 'checklist' ? (
                <CncChecklistPanel context={recebimentoContext} />
              ) : null}
              {abaAtiva === 'tratativas' ? (
                <CncTratativasPanel
                  cnc={cnc}
                  podeGerenciar={podeGerenciar}
                  processando={tratativas.processando}
                  onAdicionar={() => setModalTratativa(true)}
                  onConcluir={(id) => void tratativas.concluir(id)}
                />
              ) : null}
              {abaAtiva === 'resumo' ? (
                <CncResumoPanel
                  cnc={cnc}
                  inspecao={recebimentoContext.inspecao}
                  fotosChecklistCount={recebimentoContext.fotosChecklist.length}
                />
              ) : null}
              {abaAtiva === 'historico' ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Histórico de eventos
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Linha do tempo completa das movimentações desta CNC.
                    </p>
                  </div>
                  <CncEventosTimeline eventos={cnc.eventos} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

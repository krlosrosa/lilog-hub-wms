'use client';

import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import { ArrowRight, Loader2 } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { CncAnaliseTabs, type CncAnaliseAba } from '@/features/cnc/components/cnc-analise-tabs';
import { CncAnaliseWorkflow } from '@/features/cnc/components/cnc-analise-workflow';
import { CncAnomaliasPanel } from '@/features/cnc/components/cnc-anomalias-panel';
import { CncChecklistPanel } from '@/features/cnc/components/cnc-checklist-panel';
import { CncDetalheHeader } from '@/features/cnc/components/cnc-detalhe-header';
import { CncDetalheKpis } from '@/features/cnc/components/cnc-detalhe-kpis';
import { CncRegistroAnaliseSheet, type CncRegistroAnaliseSheetMode } from '@/features/cnc/components/cnc-registro-analise-sheet';
import { CncPrintDocument } from '@/features/cnc/components/cnc-print-document';
import { CncEventosTimeline } from '@/features/cnc/components/cnc-eventos-timeline';
import { ModalCancelarCnc } from '@/features/cnc/components/modal-cancelar-cnc';
import { ModalEncerrarCnc } from '@/features/cnc/components/modal-encerrar-cnc';
import { CncResumoPanel } from '@/features/cnc/components/cnc-resumo-panel';
import { useCncDetalhe } from '@/features/cnc/hooks/use-cnc-detalhe';
import { useCncPrint } from '@/features/cnc/hooks/use-cnc-print';
import { useCncRecebimentoContext } from '@/features/cnc/hooks/use-cnc-recebimento-context';
import {
  resolverOpcoesImpressao,
  type CncImpressaoOpcoes,
} from '@/features/cnc/types/cnc-impressao.schema';

type CncDetalheViewProps = {
  cncId: string;
};

export function CncDetalheView({ cncId }: CncDetalheViewProps) {
  const { unidadeSelecionada } = useUnidadeContext();
  const {
    cnc,
    isLoading,
    notFound,
    processandoAcao,
    atualizarCnc,
    recarregar,
    actions,
  } = useCncDetalhe(cncId);

  const recebimentoContext = useCncRecebimentoContext(cnc);

  const fotoUrlsImpressao = useMemo(() => {
    const urls = recebimentoContext.fotosChecklist.map((foto) => foto.url);

    for (const fotos of recebimentoContext.fotosPorReferencia.values()) {
      for (const foto of fotos) {
        urls.push(foto.url);
      }
    }

    return urls;
  }, [
    recebimentoContext.fotosChecklist,
    recebimentoContext.fotosPorReferencia,
  ]);

  const { imprimir, imprimindo, dadosRecebimento, opcoesImpressao } = useCncPrint(
    cnc,
    fotoUrlsImpressao,
  );

  const [abaAtiva, setAbaAtiva] = useState<CncAnaliseAba>('anomalias');
  const [registroSheetOpen, setRegistroSheetOpen] = useState(false);
  const [registroSheetMode, setRegistroSheetMode] =
    useState<CncRegistroAnaliseSheetMode>('editar');
  const [modalEncerrar, setModalEncerrar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [opcoesImpressaoAtuais, setOpcoesImpressaoAtuais] =
    useState<CncImpressaoOpcoes | null>(null);

  const handleOpcoesChange = useCallback((opcoes: CncImpressaoOpcoes) => {
    setOpcoesImpressaoAtuais(opcoes);
  }, []);

  const abrirRegistroSheet = useCallback(
    (mode: CncRegistroAnaliseSheetMode = 'editar') => {
      setRegistroSheetMode(mode);
      setRegistroSheetOpen(true);
    },
    [],
  );

  const handleIniciarAnalise = useCallback(async () => {
    await actions.iniciarAnalise();
    setRegistroSheetOpen(false);
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

  const handleImprimir = useCallback(() => {
    const opcoes =
      opcoesImpressaoAtuais ??
      (cnc ? resolverOpcoesImpressao(cnc.opcoesImpressao) : null);

    if (!opcoes) {
      return;
    }

    void imprimir(opcoes);
  }, [cnc, imprimir, opcoesImpressaoAtuais]);

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
  const podeEditar = podeGerenciar || cnc.situacao === 'pendente';

  return (
    <SidebarMain className="flex min-h-dvh flex-col">
      <CncPrintDocument
        cnc={cnc}
        dadosRecebimento={dadosRecebimento}
        opcoesImpressao={opcoesImpressao}
        unidadeNome={unidadeSelecionada?.nome ?? cnc.unidadeId}
        inspecao={recebimentoContext.inspecao}
        fotosChecklist={recebimentoContext.fotosChecklist}
        fotosPorReferencia={recebimentoContext.fotosPorReferencia}
      />

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

      <CncRegistroAnaliseSheet
        open={registroSheetOpen}
        mode={registroSheetMode}
        cnc={cnc}
        podeEditar={podeEditar}
        processando={processandoAcao}
        onOpenChange={setRegistroSheetOpen}
        onSalvo={atualizarCnc}
        onOpcoesChange={handleOpcoesChange}
        onConfirmarIniciar={() => void handleIniciarAnalise()}
      />

      <CncDetalheHeader
        cnc={cnc}
        podeIniciarAnalise={podeIniciarAnalise}
        podeGerenciar={podeGerenciar}
        processandoAcao={processandoAcao}
        imprimindo={imprimindo}
        onIniciarAnalise={() => abrirRegistroSheet('iniciar')}
        onEncerrar={() => setModalEncerrar(true)}
        onCancelar={() => setModalCancelar(true)}
        onImprimir={handleImprimir}
        onAbrirRegistro={() => abrirRegistroSheet('editar')}
      />

      <main className="flex-1 px-margin-mobile py-4 pb-24 md:px-margin-desktop md:py-5 md:pb-10">
        <div className="mx-auto max-w-container space-y-4">
          {podeIniciarAnalise ? (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-amber-900 dark:text-amber-100">
                <span className="font-semibold">Análise pendente</span>
                <span className="text-amber-800/90 dark:text-amber-200/90">
                  {' '}
                  — {cnc.itens.length} anomalia
                  {cnc.itens.length !== 1 ? 's' : ''} aguardando investigação.
                </span>
              </p>
              <Button
                type="button"
                size="sm"
                className="h-7 shrink-0 gap-1 px-2.5 text-xs"
                disabled={processandoAcao}
                onClick={() => abrirRegistroSheet('iniciar')}
              >
                Iniciar análise
                <ArrowRight className="size-3" aria-hidden />
              </Button>
            </div>
          ) : null}

          <CncDetalheKpis cnc={cnc} />

          <CncAnaliseWorkflow cnc={cnc} />

          <div className="space-y-3">
            <CncAnaliseTabs
              abaAtiva={abaAtiva}
              onChange={setAbaAtiva}
              badges={{
                anomalias: cnc.itens.length,
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
                    : abaAtiva === 'resumo'
                      ? 'Resumo'
                      : 'Histórico'
              }
              className="min-h-[200px]"
            >
              {abaAtiva === 'anomalias' ? (
                <CncAnomaliasPanel
                  cnc={cnc}
                  embedded
                  fotosPorReferencia={recebimentoContext.fotosPorReferencia}
                  podeGerenciar={podeGerenciar}
                  onItemSalvo={recarregar}
                />
              ) : null}
              {abaAtiva === 'checklist' ? (
                <CncChecklistPanel context={recebimentoContext} embedded />
              ) : null}
              {abaAtiva === 'resumo' ? (
                <CncResumoPanel
                  cnc={cnc}
                  embedded
                  inspecao={recebimentoContext.inspecao}
                  fotosChecklistCount={recebimentoContext.fotosChecklist.length}
                />
              ) : null}
              {abaAtiva === 'historico' ? (
                <CncEventosTimeline eventos={cnc.eventos} itens={cnc.itens} />
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

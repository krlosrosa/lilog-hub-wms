'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import { ChevronRight, Clock, PenLine } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { DetalheAnalise } from '@/features/debito-transportadora/components/detalhe-analise';
import { DetalheConferenciaTable } from '@/features/debito-transportadora/components/detalhe-conferencia-table';
import { DetalheEvidencias } from '@/features/debito-transportadora/components/detalhe-evidencias';
import { DetalheInfoGeral } from '@/features/debito-transportadora/components/detalhe-info-geral';
import { DetalheRegistrosCorte } from '@/features/debito-transportadora/components/detalhe-registros-corte';
import { DetalheTimeline } from '@/features/debito-transportadora/components/detalhe-timeline';
import { DetalheTransporte } from '@/features/debito-transportadora/components/detalhe-transporte';
import {
  ModalConfirmarAcaoDebito,
  type AcaoDebitoConfirmacao,
} from '@/features/debito-transportadora/components/modal-confirmar-acao-debito';
import { useDebitoDetalhe } from '@/features/debito-transportadora/hooks/use-debito-detalhe';
import { DEBITO_STATUS_LABELS } from '@/features/debito-transportadora/types/debito.schema';

type DebitoDetalheViewProps = {
  debitoId: string;
};

export function DebitoDetalheView({ debitoId }: DebitoDetalheViewProps) {
  const {
    debito,
    reasonCode,
    setReasonCode,
    notasAnalista,
    setNotasAnalista,
    salvandoNota,
    processandoAcao,
    baixandoMapa,
    actions,
    conferenciaItensPagina,
    conferenciaPagina,
    conferenciaTotalPaginas,
    conferenciaItemsInicio,
    conferenciaTotalItens,
    conferenciaPageSize,
    setPaginaConferencia,
  } = useDebitoDetalhe(debitoId);

  const [acaoConfirmacao, setAcaoConfirmacao] =
    useState<AcaoDebitoConfirmacao | null>(null);

  const abrirConfirmacao = useCallback((acao: AcaoDebitoConfirmacao) => {
    setAcaoConfirmacao(acao);
  }, []);

  const fecharConfirmacao = useCallback(() => {
    if (!processandoAcao) {
      setAcaoConfirmacao(null);
    }
  }, [processandoAcao]);

  const confirmarAcao = useCallback(async () => {
    if (!acaoConfirmacao) {
      return;
    }

    if (acaoConfirmacao === 'assinatura') {
      await actions.enviarParaAssinatura();
    } else {
      await actions.cancelarCobranca();
    }

    setAcaoConfirmacao(null);
  }, [acaoConfirmacao, actions]);

  if (!debito) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-16 md:px-margin-desktop">
          <div className="max-w-md text-center">
            <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
              Ocorrência não encontrada
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              Não há registro correspondente ao identificador informado nos dados
              mock.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/debito-transportadora">
                Voltar para débitos
              </Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const statusEmInvestigacao =
    debito.status === 'em_disputa' ||
    debito.status === 'aguardando_evidencia';

  return (
    <SidebarMain>
      <ModalConfirmarAcaoDebito
        open={acaoConfirmacao !== null}
        acao={acaoConfirmacao}
        debito={debito}
        processando={processandoAcao}
        onOpenChange={(aberto) => {
          if (!aberto) {
            fecharConfirmacao();
          }
        }}
        onConfirm={() => void confirmarAcao()}
      />

      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-label-md text-muted-foreground"
          >
            <Link
              href="/debito-transportadora"
              className="transition-colors hover:text-foreground"
            >
              Débitos Transportadora
            </Link>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
            <span className="text-foreground">
              Detalhes da Ocorrência {debito.protocolo}
            </span>
          </nav>

          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Ocorrência {debito.protocolo}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                    statusEmInvestigacao
                      ? 'bg-tertiary-container/20 text-tertiary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      statusEmInvestigacao
                        ? 'bg-tertiary shadow-[0_0_8px_hsl(var(--tertiary)/0.6)]'
                        : 'bg-muted-foreground',
                    )}
                    aria-hidden
                  />
                  {statusEmInvestigacao
                    ? 'Em Investigação'
                    : DEBITO_STATUS_LABELS[debito.status]}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="size-4" aria-hidden />
                  Criada há {debito.criadaHaDias}{' '}
                  {debito.criadaHaDias === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/20"
                disabled={processandoAcao}
                onClick={() => abrirConfirmacao('cancelar')}
              >
                Cancelar cobrança
              </Button>
              <Button
                type="button"
                disabled={processandoAcao}
                className="gap-2"
                onClick={() => abrirConfirmacao('assinatura')}
              >
                <PenLine className="size-4" aria-hidden />
                Enviar para assinatura
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-gutter">
            <div className="col-span-12 lg:col-span-8">
              <DetalheInfoGeral
                debito={debito}
                onEditar={actions.editarDados}
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <DetalheTransporte debito={debito} />
            </div>
            <div className="col-span-12">
              <DetalheRegistrosCorte
                registros={debito.registrosCorte}
                mapaSeparacao={debito.mapaSeparacao}
                baixandoMapa={baixandoMapa}
                onBaixarMapa={() => void actions.baixarMapaSeparacao()}
              />
            </div>
            <div className="col-span-12">
              <DetalheConferenciaTable
                itensPagina={conferenciaItensPagina}
                notasFiscais={debito.notasFiscais}
                totalAnomalias={debito.totalAnomalias}
                pagina={conferenciaPagina}
                totalPaginas={conferenciaTotalPaginas}
                onChangePagina={setPaginaConferencia}
                totalFiltrados={conferenciaTotalItens}
                itemsInicio={conferenciaItemsInicio}
                pageSize={conferenciaPageSize}
              />
            </div>
            <div className="col-span-12 lg:col-span-8">
              <DetalheEvidencias
                evidencias={debito.evidencias}
                onUpload={actions.uploadEvidencia}
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <DetalheTimeline eventos={debito.timeline} />
            </div>
            <div className="col-span-12">
              <DetalheAnalise
                reasonCode={reasonCode}
                notasAnalista={notasAnalista}
                salvandoNota={salvandoNota}
                onReasonCodeChange={setReasonCode}
                onNotasChange={setNotasAnalista}
                onSalvarNota={() => void actions.salvarNota()}
              />
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

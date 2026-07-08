'use client';

import Link from 'next/link';

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  QrCode,
  RotateCcw,
  Tags,
  Trash2,
  Truck,
  Unlock,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import { ConferenciaTable } from '@/features/recebimento/components/conferencia-table';
import { FotosEvidencias } from '@/features/recebimento/components/fotos-evidencia';
import { InspecaoCard } from '@/features/recebimento/components/inspecao-card';
import { ModalConfirmarRecebimento } from '@/features/recebimento/components/modal-confirmar-recebimento';
import { LiberarConferenciaSheet } from '@/features/recebimento/components/liberar-conferencia-sheet';
import { ModalLinkRastreio } from '@/features/recebimento/components/modal-link-rastreio';
import { RecepcionarCarroSheet } from '@/features/recebimento/components/recepcionar-carro-sheet';
import { VeiculoCard } from '@/features/recebimento/components/veiculo-card';
import { RecebimentoStatusBadge } from '@/features/recebimento/components/recebimento-status-badge';
import { useRecebimentoDetalhe } from '@/features/recebimento/hooks/use-recebimento-detalhe';
import { canReabrirRecebimento } from '@/features/recebimento/types/recebimento-detalhe.schema';

type RecebimentoDetalheViewProps = {
  recebimentoId: string;
};

export function RecebimentoDetalheView({
  recebimentoId,
}: RecebimentoDetalheViewProps) {
  const {
    isLoading,
    isSubmitting,
    recebimento,
    voltar,
    isLiberarOpen,
    openLiberarConferencia,
    closeLiberarConferencia,
    confirmarLiberarConferencia,
    isRecepcionarOpen,
    openRecepcionar,
    closeRecepcionar,
    confirmarRecepcionarCarro,
    isFinalizarOpen,
    openFinalizar,
    closeFinalizar,
    confirmarFinalizar,
    reimprimirEtiquetas,
    reabrirDemanda,
    isExcluirOpen,
    openExcluir,
    closeExcluir,
    confirmarExcluir,
    isLinkRastreioOpen,
    openLinkRastreio,
    closeLinkRastreio,
    conferenciaPagina,
    conferenciaTotalPaginas,
    conferenciaItensPagina,
    conferenciaItemsInicio,
    conferenciaTotalItens,
    conferenciaPageSize,
    setPaginaConferencia,
  } = useRecebimentoDetalhe(recebimentoId);

  if (isLoading) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-margin-mobile py-10 md:px-margin-desktop">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Carregando recebimento…</p>
        </main>
      </SidebarMain>
    );
  }

  if (!recebimento) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile py-10 md:px-margin-desktop">
          <div className="max-w-md text-center">
            <h1 className="text-headline-md font-semibold tracking-tight text-foreground">
              Recebimento não encontrado
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Não há pré-recebimento correspondente ao identificador informado.
            </p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/recebimento">Voltar para recebimentos</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const r = recebimento;
  const podeRecepcionar = r.status === 'agendado';
  const podeLiberar = r.status === 'aguardando';
  const podeFinalizar = r.status === 'conferido';
  const podeReimprimirEtiquetas =
    r.status === 'finalizado' &&
    Boolean(r.recebimentoId) &&
    !r.temPaletesBipados &&
    (r.modoUnitizacao === 'gerar_etiqueta_na_armazenagem' ||
      r.modoUnitizacao === 'bipar_palete_no_recebimento');
  const podeReabrir = canReabrirRecebimento(r.status);
  const podeExcluir = r.status !== 'finalizado' && r.status !== 'cancelado';
  const podeGerarLinkRastreio = r.status !== 'cancelado';

  return (
    <SidebarMain className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 shrink-0 border-b border-outline-variant/60 bg-glass-bg/95 px-margin-mobile py-2.5 backdrop-blur-glass md:px-margin-desktop">
        <div className="mx-auto flex max-w-container flex-col gap-2.5">
          <nav
            className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
            aria-label="Topo do recebimento"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-muted-foreground"
              onClick={voltar}
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Lista</span>
            </Button>
            <span className="text-muted-foreground/50" aria-hidden>
              /
            </span>
            <h1 className="truncate text-sm font-semibold text-foreground">
              #{r.numero}
            </h1>
            <RecebimentoStatusBadge status={r.status} compact />
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {r.unidade} · Iniciado {r.dataInicio} ·{' '}
              <span className="font-mono font-medium text-foreground">{r.placa}</span>
            </p>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {podeGerarLinkRastreio ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-outline-variant px-2.5 text-xs"
                  disabled={isSubmitting}
                  onClick={openLinkRastreio}
                >
                  <QrCode className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Link motorista</span>
                  <span className="sm:hidden">Link</span>
                </Button>
              ) : null}
              {podeExcluir ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-outline-variant px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isSubmitting}
                  onClick={openExcluir}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Excluir demanda</span>
                  <span className="sm:hidden">Excluir</span>
                </Button>
              ) : null}
              {podeRecepcionar ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-outline-variant px-2.5 text-xs"
                  disabled={isSubmitting}
                  onClick={openRecepcionar}
                >
                  <Truck className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Recepcionar carro</span>
                  <span className="sm:hidden">Recepcionar</span>
                </Button>
              ) : null}
              {podeLiberar ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-outline-variant px-2.5 text-xs"
                  disabled={isSubmitting}
                  onClick={openLiberarConferencia}
                >
                  <Unlock className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Liberar p/ conferência</span>
                  <span className="sm:hidden">Liberar</span>
                </Button>
              ) : null}
              {podeReabrir ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-primary/30 px-2.5 text-xs text-primary hover:bg-primary/10"
                  disabled={isSubmitting}
                  onClick={() => void reabrirDemanda()}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RotateCcw className="size-3.5" aria-hidden />
                  )}
                  <span className="hidden sm:inline">Reabrir demanda</span>
                  <span className="sm:hidden">Reabrir</span>
                </Button>
              ) : null}
              {podeReimprimirEtiquetas ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs shadow-sm"
                  disabled={isSubmitting}
                  onClick={() => void reimprimirEtiquetas()}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Tags className="size-3.5" aria-hidden />
                  )}
                  <span className="hidden sm:inline">Reimprimir etiquetas</span>
                  <span className="sm:hidden">Reimprimir</span>
                </Button>
              ) : null}
              {podeFinalizar ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs shadow-sm"
                  disabled={isSubmitting}
                  onClick={openFinalizar}
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Finalizar
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto flex max-w-container flex-col gap-4">
          {podeReimprimirEtiquetas ? (
            <section className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Recebimento finalizado
                </p>
                <p className="text-sm text-muted-foreground">
                  As etiquetas de palete já foram geradas. Baixe o PDF novamente
                  quando precisar reimprimir.
                </p>
              </div>
              <Button
                type="button"
                className="shrink-0 gap-2"
                disabled={isSubmitting}
                onClick={() => void reimprimirEtiquetas()}
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Tags className="size-4" aria-hidden />
                )}
                Reimprimir etiquetas
              </Button>
            </section>
          ) : null}

          <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <VeiculoCard
                documentacaoOk={r.documentacaoOk}
                transportadora={r.transportador}
                placa={r.placa}
              />
            </div>
            <div className="lg:col-span-8">
              <InspecaoCard inspecao={r.inspecao} />
            </div>
          </section>

          <ConferenciaTable
            divergencias={r.numDivergencias}
            itensPagina={conferenciaItensPagina}
            itemsInicio={conferenciaItemsInicio}
            onChangePagina={setPaginaConferencia}
            pageSize={conferenciaPageSize}
            pagina={conferenciaPagina}
            totalFiltrados={conferenciaTotalItens}
            totalPaginas={conferenciaTotalPaginas}
          />

          <FotosEvidencias fotos={r.fotos} totalInformado={r.fotoTotalInformado} />
        </div>
      </main>

      <LiberarConferenciaSheet
        open={isLiberarOpen}
        onOpenChange={(aberto) => {
          if (!aberto) {
            closeLiberarConferencia();
          } else {
            openLiberarConferencia();
          }
        }}
        onConfirm={confirmarLiberarConferencia}
        placa={r.placa}
        unidadeId={r.unidade}
        isSubmitting={isSubmitting}
      />

      <RecepcionarCarroSheet
        open={isRecepcionarOpen}
        onOpenChange={(aberto) => {
          if (!aberto) {
            closeRecepcionar();
          } else {
            openRecepcionar();
          }
        }}
        placa={r.placa}
        isSubmitting={isSubmitting}
        onConfirm={confirmarRecepcionarCarro}
      />

      <ModalConfirmarRecebimento
        open={isFinalizarOpen}
        onClose={closeFinalizar}
        onConfirm={(liberarPortaria) =>
          void confirmarFinalizar(liberarPortaria, r)
        }
        recebimento={r}
        isSubmitting={isSubmitting}
      />

      <ModalLinkRastreio
        open={isLinkRastreioOpen}
        onClose={closeLinkRastreio}
        preRecebimentoId={r.id}
        placa={r.placa}
      />

      <AlertDialog
        open={isExcluirOpen}
        onOpenChange={(aberto) => {
          if (!aberto && !isSubmitting) {
            closeExcluir();
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Cancelar pré-recebimento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              O agendamento será cancelado na API. Veículo{' '}
              <span className="font-semibold text-foreground">{r.placa}</span>{' '}
              ({r.transportador}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isSubmitting}>
              Voltar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => void confirmarExcluir()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Cancelando…
                </>
              ) : (
                'Confirmar cancelamento'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMain>
  );
}

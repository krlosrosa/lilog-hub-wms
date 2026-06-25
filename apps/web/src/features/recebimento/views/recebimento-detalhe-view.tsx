'use client';

import Link from 'next/link';

import {
  ArrowLeft,
  CheckCircle2,
  Dock,
  Loader2,
  Warehouse,
} from 'lucide-react';

import { Button } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import { ConferenciaTable } from '@/features/recebimento/components/conferencia-table';
import { FotosEvidencias } from '@/features/recebimento/components/fotos-evidencia';
import { InspecaoCard } from '@/features/recebimento/components/inspecao-card';
import { ModalAlocarDoca } from '@/features/recebimento/components/modal-alocar-doca';
import { ModalConfirmarRecebimento } from '@/features/recebimento/components/modal-confirmar-recebimento';
import { VeiculoCard } from '@/features/recebimento/components/veiculo-card';
import { RecebimentoStatusBadge } from '@/features/recebimento/components/recebimento-status-badge';
import { useRecebimentoDetalhe } from '@/features/recebimento/hooks/use-recebimento-detalhe';
import type { ProcessoInternoRecebimento } from '@/features/recebimento/types/recebimento-detalhe.schema';

const LABEL_PROCESSO: Record<ProcessoInternoRecebimento, string> = {
  'nao-iniciado': 'Não iniciado',
  conferindo: 'Em conferência',
  finalizado: 'Processo encerrado',
};

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
    docas,
    isAlocarDocaOpen,
    openAlocarDoca,
    closeAlocarDoca,
    confirmarAlocarDoca,
    liberarArmazem,
    isFinalizarOpen,
    openFinalizar,
    closeFinalizar,
    confirmarFinalizar,
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
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-secondary/25 bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
              role="status"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-status-active" />
              {LABEL_PROCESSO[r.processoAtual]}
            </span>
            <RecebimentoStatusBadge status={r.status} compact />
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {r.unidade} · Iniciado {r.dataInicio} ·{' '}
              <span className="font-mono font-medium text-foreground">{r.placa}</span>
            </p>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-outline-variant px-2.5 text-xs"
                disabled={isSubmitting}
                onClick={openAlocarDoca}
              >
                <Dock className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Alocar doca</span>
                <span className="sm:hidden">Doca</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-outline-variant px-2.5 text-xs"
                disabled={isSubmitting}
                onClick={() => void liberarArmazem(r)}
              >
                <Warehouse className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Liberar p/ armazém</span>
                <span className="sm:hidden">Armazém</span>
              </Button>
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
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto flex max-w-container flex-col gap-4">
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

      <ModalAlocarDoca
        open={isAlocarDocaOpen}
        onClose={closeAlocarDoca}
        onConfirm={(docaNumero) => void confirmarAlocarDoca(docaNumero)}
        placa={r.placa}
        docas={docas}
      />

      <ModalConfirmarRecebimento
        open={isFinalizarOpen}
        onClose={closeFinalizar}
        onConfirm={(liberarPortaria) =>
          void confirmarFinalizar(liberarPortaria, r)
        }
        recebimento={r}
      />
    </SidebarMain>
  );
}

'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import {
  ChevronRight,
  Loader2,
  Send,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { DocumentoDetalheItensTable } from '@/features/debito-transportadora/components/documento-detalhe-itens-table';
import { DocumentoDetalheTimeline } from '@/features/debito-transportadora/components/documento-detalhe-timeline';
import { DocumentoStatusBadge } from '@/features/debito-transportadora/components/documento-status-badge';
import {
  ModalConfirmarAcaoDocumento,
} from '@/features/debito-transportadora/components/modal-confirmar-acao-documento';
import { useDocumentoAcoes } from '@/features/debito-transportadora/hooks/use-documento-acoes';
import { useDocumentoDetalhe } from '@/features/debito-transportadora/hooks/use-documento-detalhe';
import {
  podeCancelarDocumento,
  proximaAcaoDocumento,
} from '@/features/debito-transportadora/lib/map-documento-cobranca';
import type { AcaoDocumentoConfirmacao } from '@/features/debito-transportadora/types/documento-cobranca.schema';

type DocumentoDetalheViewProps = {
  documentoId: string;
};

const ACAO_CONFIG: Record<
  Exclude<AcaoDocumentoConfirmacao, 'cancelar'>,
  { label: string; icon: typeof FileCheck }
> = {
  emitir: { label: 'Emitir documento', icon: FileCheck },
  enviar: { label: 'Marcar como enviado', icon: Send },
  marcarPago: { label: 'Marcar como pago', icon: CheckCircle2 },
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function DocumentoDetalheView({ documentoId }: DocumentoDetalheViewProps) {
  const { unidadeSelecionada } = useUnidadeContext();
  const { documento, isLoading, notFound, recarregar } =
    useDocumentoDetalhe(documentoId);

  const acoes = useDocumentoAcoes({
    documentoId,
    unidadeId: unidadeSelecionada?.id ?? null,
    onRefetch: recarregar,
  });

  const [acaoConfirmacao, setAcaoConfirmacao] =
    useState<AcaoDocumentoConfirmacao | null>(null);

  const fecharConfirmacao = useCallback(() => {
    if (!acoes.processando) {
      setAcaoConfirmacao(null);
    }
  }, [acoes.processando]);

  const confirmarAcao = useCallback(async () => {
    if (!acaoConfirmacao) {
      return;
    }

    await acoes.executarAcao(acaoConfirmacao);
    setAcaoConfirmacao(null);
  }, [acaoConfirmacao, acoes]);

  if (isLoading) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile py-16 md:px-margin-desktop">
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-body-md text-muted-foreground">
            Carregando documento de cobrança…
          </p>
        </main>
      </SidebarMain>
    );
  }

  if (!documento || notFound) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-16 md:px-margin-desktop">
          <div className="max-w-md text-center">
            <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
              Documento não encontrado
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              Não há documento de cobrança correspondente ao identificador
              informado.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/debito-transportadora/cobrancas">
                Voltar para documentos
              </Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const proximaAcao = proximaAcaoDocumento(documento.status);
  const podeCancelar = podeCancelarDocumento(documento.status);
  const configProximaAcao =
    proximaAcao && proximaAcao !== 'cancelar'
      ? ACAO_CONFIG[proximaAcao]
      : null;

  return (
    <SidebarMain>
      {documento ? (
        <ModalConfirmarAcaoDocumento
          open={acaoConfirmacao !== null}
          acao={acaoConfirmacao}
          documento={documento}
          processando={acoes.processando}
          onOpenChange={(aberto) => {
            if (!aberto) {
              fecharConfirmacao();
            }
          }}
          onConfirm={() => void confirmarAcao()}
        />
      ) : null}

      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-label-md text-muted-foreground"
          >
            <Link
              href="/debito-transportadora/cobrancas"
              className="transition-colors hover:text-foreground"
            >
              Documentos de Cobrança
            </Link>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
            <span className="text-foreground">{documento.numeroDocumento}</span>
          </nav>

          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                {documento.numeroDocumento}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <DocumentoStatusBadge status={documento.status} />
                <span className="text-sm text-muted-foreground">
                  {documento.transportadora}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {podeCancelar ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/20"
                  disabled={acoes.processando}
                  onClick={() => setAcaoConfirmacao('cancelar')}
                >
                  Cancelar documento
                </Button>
              ) : null}
              {configProximaAcao && proximaAcao ? (
                <Button
                  type="button"
                  disabled={acoes.processando}
                  className="gap-2"
                  onClick={() => setAcaoConfirmacao(proximaAcao)}
                >
                  <configProximaAcao.icon className="size-4" aria-hidden />
                  {configProximaAcao.label}
                </Button>
              ) : null}
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-4">
              <p className="text-caption text-muted-foreground">Valor total</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {formatCurrency(documento.valorTotal)}
              </p>
            </article>
            <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-4">
              <p className="text-caption text-muted-foreground">Processos</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {documento.quantidadeProcessos}
              </p>
            </article>
            <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-4">
              <p className="text-caption text-muted-foreground">Itens</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {documento.quantidadeItens}
              </p>
            </article>
          </div>

          {documento.observacao ? (
            <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-4">
              <h3 className="text-label-md font-semibold text-foreground">
                Observação
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {documento.observacao}
              </p>
            </article>
          ) : null}

          <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DocumentoDetalheItensTable itens={documento.itens} />
            </div>
            <DocumentoDetalheTimeline eventos={documento.timeline} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
            <div>
              <p className="font-medium text-foreground">Criado em</p>
              <p>{documento.createdAt}</p>
            </div>
            {documento.emitidoEm ? (
              <div>
                <p className="font-medium text-foreground">Emitido em</p>
                <p>{documento.emitidoEm}</p>
              </div>
            ) : null}
            {documento.enviadoEm ? (
              <div>
                <p className="font-medium text-foreground">Enviado em</p>
                <p>{documento.enviadoEm}</p>
              </div>
            ) : null}
            {documento.pagoEm ? (
              <div>
                <p className="font-medium text-foreground">Pago em</p>
                <p>{documento.pagoEm}</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

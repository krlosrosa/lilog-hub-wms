'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ArrowLeft, Loader2, MapPin, RefreshCw } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import { DemandaArmazenagemStatusBadge } from '../components/demanda-status-badge';
import { ItemArmazenagemRow } from '../components/item-armazenagem-row';
import { SelecionarEnderecoDialog } from '../components/selecionar-endereco-dialog';
import { useArmazenagemDetalhe } from '../hooks/use-armazenagem-detalhe';
import {
  MODO_UNITIZACAO_LABELS,
  type ModoUnitizacaoApi,
} from '../types/armazenagem.api';

type ArmazenagemDetalheViewProps = {
  demandaId: string;
};

export function ArmazenagemDetalheView({ demandaId }: ArmazenagemDetalheViewProps) {
  const router = useRouter();
  const {
    isLoading,
    isSaving,
    demanda,
    progresso,
    itemSelecionado,
    abrirSelecaoEndereco,
    fecharSelecaoEndereco,
    salvarEnderecoSugerido,
    buscarEnderecosDisponiveis,
    recarregar,
  } = useArmazenagemDetalhe(demandaId);

  if (isLoading) {
    return (
      <SidebarMain>
        <main className="flex min-h-dvh items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Carregando demanda...
        </main>
      </SidebarMain>
    );
  }

  if (!demanda) {
    return (
      <SidebarMain>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Demanda de armazenagem não encontrada.
          </p>
          <Button type="button" variant="outline" asChild>
            <Link href="/armazenagem">Voltar para lista</Link>
          </Button>
        </main>
      </SidebarMain>
    );
  }

  return (
    <SidebarMain>
      <main className="min-h-dvh px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto flex max-w-container flex-col gap-6">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 px-2"
                onClick={() => router.push('/armazenagem')}
              >
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </Button>
              <DemandaArmazenagemStatusBadge status={demanda.status} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto gap-2"
                onClick={() => void recarregar()}
              >
                <RefreshCw className="size-4" aria-hidden />
                Atualizar
              </Button>
            </div>

            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Endereços de armazenagem
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Demanda {demanda.id.slice(0, 8).toUpperCase()} · Recebimento{' '}
                {demanda.recebimentoId.slice(0, 8).toUpperCase()} ·{' '}
                {MODO_UNITIZACAO_LABELS[
                  demanda.modoUnitizacao as ModoUnitizacaoApi
                ] ?? demanda.modoUnitizacao}
              </p>
            </div>
          </header>

          <section className="rounded-xl border border-outline-variant bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso da demanda</span>
              <span className="font-semibold tabular-nums">{progresso.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progresso.percent}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>{progresso.armazenados} armazenados de {progresso.total}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {progresso.comEndereco} com endereço definido
              </span>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Itens da demanda</h2>
            {demanda.itens.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant px-6 py-10 text-center text-sm text-muted-foreground">
                Esta demanda não possui itens.
              </div>
            ) : (
              demanda.itens.map((item) => (
                <ItemArmazenagemRow
                  key={item.id}
                  item={item}
                  onSelecionarEndereco={abrirSelecaoEndereco}
                />
              ))
            )}
          </section>
        </div>
      </main>

      <SelecionarEnderecoDialog
        open={itemSelecionado !== null}
        item={itemSelecionado}
        isSaving={isSaving}
        onClose={fecharSelecaoEndereco}
        onConfirm={salvarEnderecoSugerido}
        onSearch={buscarEnderecosDisponiveis}
      />
    </SidebarMain>
  );
}

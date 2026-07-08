'use client';

import Link from 'next/link';

import { ArrowLeft, Loader2, Package, Truck } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { useDevolucaoGrupoDetalhe } from '@/features/devolucao/hooks/use-devolucao-grupo-detalhe';
import {
  GRUPO_DESCARGA_STATUS_LABELS,
} from '@/features/devolucao/types/devolucao-grupo-descarga.schema';

type DevolucaoGrupoDetalheViewProps = {
  id: string;
};

export function DevolucaoGrupoDetalheView({ id }: DevolucaoGrupoDetalheViewProps) {
  const {
    isLoading,
    loadError,
    detalhe,
    itensDraft,
    updateItemDraft,
    itemNaoContabil,
    setItemNaoContabil,
    itensPendentes,
    isSaving,
    salvarConferencia,
    registrarItemNaoContabil,
    liberarConferencia,
    concluirGrupo,
    canLiberar,
    canConcluir,
  } = useDevolucaoGrupoDetalhe(id);

  if (isLoading) {
    return (
      <SidebarMain>
        <main className="flex min-h-dvh items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        </main>
      </SidebarMain>
    );
  }

  if (loadError || !detalhe) {
    return (
      <SidebarMain>
        <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
          <div className="mx-auto max-w-container space-y-4 text-center">
            <p className="text-body-md text-muted-foreground">
              {loadError ?? 'Grupo não encontrado.'}
            </p>
            <Button type="button" variant="outline" asChild>
              <Link href="/devolucao">Voltar à gestão</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-6">
          <nav className="text-caption text-muted-foreground">
            <Link href="/devolucao" className="hover:text-primary">
              Devolução
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{detalhe.codigoGrupo}</span>
          </nav>

          <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary-container">
                  Descarga Agrupada
                </span>
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {GRUPO_DESCARGA_STATUS_LABELS[detalhe.status]}
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold text-primary md:text-headline-lg">
                {detalhe.codigoGrupo}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Truck className="size-4" aria-hidden />
                  {detalhe.placaDescarga}
                </span>
                <span>Doca {detalhe.doca ?? '—'}</span>
                <span>{detalhe.demandas.length} demanda(s)</span>
                <span>{detalhe.itensEsperados.length} item(ns)</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/devolucao">
                  <ArrowLeft className="size-4" aria-hidden />
                  Voltar
                </Link>
              </Button>
              {canLiberar ? (
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void liberarConferencia()}
                >
                  Liberar para conferência
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={isSaving || detalhe.status === 'concluida'}
                onClick={() => void salvarConferencia()}
              >
                Salvar conferência
              </Button>
              {canConcluir ? (
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void concluirGrupo()}
                >
                  Concluir grupo
                </Button>
              ) : null}
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {detalhe.demandas.map((demanda) => (
              <div
                key={demanda.id}
                className="rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass"
              >
                <p className="font-mono text-sm font-bold">{demanda.codigoDemanda}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Placa origem: {demanda.placa ?? '—'}
                </p>
                <p className="mt-2 text-xs">
                  {demanda.totalNfs} NF(s) · {demanda.totalItens} item(ns)
                </p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="flex items-center justify-between border-b border-outline-variant bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" aria-hidden />
                <h2 className="text-label-md font-bold">Itens esperados (contábeis)</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {itensPendentes} pendente(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Demanda</th>
                    <th className="px-3 py-2">NF</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2 text-center">Previsto</th>
                    <th className="px-3 py-2 text-center">Conferido</th>
                    <th className="px-3 py-2">Condição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {detalhe.itensEsperados.map((item) => {
                    const draft = itensDraft.find((d) => d.itemId === item.itemId);
                    const conferido = item.qtdConferida !== null;

                    return (
                      <tr
                        key={item.itemId}
                        className={cn(conferido && 'bg-primary/[0.03]')}
                      >
                        <td className="px-3 py-2 font-mono">{item.codigoDemanda}</td>
                        <td className="px-3 py-2 font-mono">{item.numeroNf}</td>
                        <td className="px-3 py-2">
                          <div className="font-mono font-semibold">{item.sku}</div>
                          <div className="max-w-[220px] truncate text-[10px] text-muted-foreground">
                            {item.descricaoProduto ?? '—'}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {item.quantidade}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            className="mx-auto h-8 w-20 rounded border border-outline-variant bg-background px-2 text-center text-xs"
                            value={draft?.qtdConferida ?? ''}
                            disabled={detalhe.status === 'concluida'}
                            onChange={(e) =>
                              updateItemDraft(item.itemId, {
                                qtdConferida: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="h-8 rounded border border-outline-variant bg-background px-2 text-xs"
                            value={draft?.condicao ?? item.condicao}
                            disabled={detalhe.status === 'concluida'}
                            onChange={(e) =>
                              updateItemDraft(item.itemId, {
                                condicao: e.target.value,
                              })
                            }
                          >
                            <option value="integro">Íntegro</option>
                            <option value="avariado">Avariado</option>
                            <option value="vencido">Vencido</option>
                            <option value="violado">Violado</option>
                            <option value="nao_identificado">Não identificado</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass">
            <h2 className="text-label-md font-bold">Itens não contábeis</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Registre itens encontrados fisicamente que não existem no contábil.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-5">
              <input
                className="h-9 rounded-md border border-outline-variant bg-background px-3 text-sm"
                placeholder="SKU"
                value={itemNaoContabil.sku}
                onChange={(e) =>
                  setItemNaoContabil((prev) => ({ ...prev, sku: e.target.value }))
                }
              />
              <input
                className="h-9 rounded-md border border-outline-variant bg-background px-3 text-sm"
                placeholder="Descrição"
                value={itemNaoContabil.descricaoProduto}
                onChange={(e) =>
                  setItemNaoContabil((prev) => ({
                    ...prev,
                    descricaoProduto: e.target.value,
                  }))
                }
              />
              <input
                type="number"
                min={0}
                className="h-9 rounded-md border border-outline-variant bg-background px-3 text-sm"
                placeholder="Qtd"
                value={itemNaoContabil.quantidadeConferida}
                onChange={(e) =>
                  setItemNaoContabil((prev) => ({
                    ...prev,
                    quantidadeConferida: e.target.value,
                  }))
                }
              />
              <input
                className="h-9 rounded-md border border-outline-variant bg-background px-3 text-sm"
                placeholder="UM"
                value={itemNaoContabil.unidadeMedida}
                onChange={(e) =>
                  setItemNaoContabil((prev) => ({
                    ...prev,
                    unidadeMedida: e.target.value,
                  }))
                }
              />
              <Button
                type="button"
                disabled={isSaving || detalhe.status === 'concluida'}
                onClick={() => void registrarItemNaoContabil()}
              >
                Registrar item
              </Button>
            </div>

            {detalhe.itensNaoContabeis.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Descrição</th>
                      <th className="px-3 py-2 text-center">Qtd</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {detalhe.itensNaoContabeis.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-mono">{item.sku}</td>
                        <td className="px-3 py-2">{item.descricaoProduto ?? '—'}</td>
                        <td className="px-3 py-2 text-center font-mono">
                          {item.quantidadeConferida} {item.unidadeMedida}
                        </td>
                        <td className="px-3 py-2 capitalize">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </SidebarMain>
  );
}

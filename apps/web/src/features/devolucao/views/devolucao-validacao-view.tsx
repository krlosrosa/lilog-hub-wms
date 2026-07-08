'use client';

import Link from 'next/link';

import { CircleAlert, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { NfItemStatusBadge } from '@/features/devolucao/components/devolucao-status-badge';
import { DevolucaoNfRow } from '@/features/devolucao/components/devolucao-nf-row';
import { useDevolucaoCheckin } from '@/features/devolucao/hooks/use-devolucao-checkin';
import { MOTIVOS_DEVOLUCAO } from '@/features/devolucao/types/devolucao-checkin.schema';

type DevolucaoValidacaoViewProps = {
  demandId: string;
};

export function DevolucaoValidacaoView({ demandId }: DevolucaoValidacaoViewProps) {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const {
    isInitialLoading,
    isLoading,
    loadError,
    tripInfo,
    nfs,
    expandedNfIds,
    toggleNfExpanded,
    triagemPercent,
    validationItems,
    updateValidationItem,
    showValidationPanel,
    selectedNfNumero,
    abrirValidacaoNf,
    fecharValidacaoNf,
    salvarValidacaoNf,
    cancelarCheckin,
    liberarConferenciaCega,
    resolverDivergencia,
    updateNfItemQtdDevolucao,
    updateNfMotivo,
    validarNf,
  } = useDevolucaoCheckin(demandId, unidadeId);

  if (isInitialLoading) {
    return (
      <SidebarMain>
        <main className="flex min-h-dvh items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        </main>
      </SidebarMain>
    );
  }

  if (loadError) {
    return (
      <SidebarMain>
        <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
          <div className="mx-auto max-w-container space-y-4 text-center">
            <p className="text-body-md text-muted-foreground">{loadError}</p>
            <Button type="button" variant="outline" asChild>
              <Link href="/devolucao">Voltar à gestão</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const handleValidarNf = async (nfId: string) => {
    const result = await validarNf(nfId);
    if (result.success) {
      toast.success(`NF ${result.numero} validada.`);
    } else if (result.reason === 'motivo') {
      toast.error('Selecione o motivo do retorno antes de validar.');
    }
  };

  const handleSalvar = async () => {
    const result = await salvarValidacaoNf();
    if (result.success) {
      toast.success('Validação da nota salva.');
    } else if ('error' in result) {
      toast.error(result.error);
    }
  };

  const handleCancelar = async () => {
    const result = await cancelarCheckin();
    if (result.success) toast.info('Check-in cancelado.');
  };

  const handleLiberar = async () => {
    const result = await liberarConferenciaCega();
    if (result.success) {
      toast.success('Liberado para conferência cega.');
    } else if ('error' in result) {
      toast.error(result.error);
    }
  };

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-6">
          <nav className="text-caption text-muted-foreground">
            <Link href="/devolucao" className="hover:text-primary">
              Devolução
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/devolucao/${demandId}/registro-chegada`}
              className="hover:text-primary"
            >
              Registro de Chegada
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Validação</span>
          </nav>

          <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary-container">
                  RAVEX Sync Active
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold text-primary md:text-headline-lg">
                Validação de Devolução
              </h1>
              <p className="mt-1 text-muted-foreground">
                Viagem {tripInfo.viagemRavexId} • {tripInfo.placa} •{' '}
                {tripInfo.motorista}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleCancelar}
              >
                <X className="size-4" aria-hidden />
                Cancelar Check-in
              </Button>
              <Button
                type="button"
                disabled={isLoading}
                onClick={handleLiberar}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Liberar para Conferência Cega
              </Button>
            </div>
          </header>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="flex flex-col gap-4 border-b border-outline-variant bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-label-md font-bold">
                  Listagem de Notas Fiscais
                </h2>
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground">
                  {nfs.length} NFs VINCULADAS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-caption text-muted-foreground">
                  Status da Triagem
                </span>
                <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-tertiary"
                    style={{ width: `${triagemPercent}%` }}
                  />
                </div>
                <span className="text-caption font-bold text-tertiary">
                  {triagemPercent}%
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant text-caption uppercase tracking-wider text-muted-foreground">
                    <th className="w-10 px-4 py-3" />
                    <th className="px-6 py-3 font-medium">Número NF</th>
                    <th className="px-6 py-3 font-medium">
                      Cliente / Destino
                    </th>
                    <th className="px-6 py-3 font-medium">Tipo Devolução</th>
                    <th className="px-6 py-3 font-medium">
                      Motivo do Retorno
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      Itens Validados
                    </th>
                    <th className="px-6 py-3 font-medium">Valor Total</th>
                    <th className="px-6 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {nfs.map((nf) => (
                    <DevolucaoNfRow
                      key={nf.id}
                      nf={nf}
                      isExpanded={expandedNfIds.has(nf.id)}
                      isLoading={isLoading}
                      onToggle={() => toggleNfExpanded(nf.id)}
                      onUpdateItemQtdDevolucao={(itemId, value) =>
                        updateNfItemQtdDevolucao(nf.id, itemId, value)
                      }
                      onUpdateMotivo={(motivo) =>
                        updateNfMotivo(nf.id, motivo)
                      }
                      onValidar={() => handleValidarNf(nf.id)}
                      onResolver={async () => {
                        const result = await resolverDivergencia(nf.id);
                        if (result.success) {
                          toast.success('Divergência em resolução.');
                        }
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {showValidationPanel && (
            <section className="rounded-xl border border-t-2 border-t-primary border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-headline-md text-primary">
                  Detalhamento NF: {selectedNfNumero}
                </h2>
                <button
                  type="button"
                  onClick={fecharValidacaoNf}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Fechar painel"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead className="bg-muted">
                    <tr className="text-muted-foreground">
                      <th className="p-3 text-left">SKU / Produto</th>
                      <th className="p-3 text-center">NF Original</th>
                      <th className="p-3 text-center">Devolução Esperada</th>
                      <th className="p-3 text-center">Conferido</th>
                      <th className="p-3 text-left">Motivo</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {validationItems.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold">
                              #{item.sku} - {item.produto}
                            </span>
                            {item.gtin && (
                              <span className="text-[10px] opacity-50">
                                GTIN: {item.gtin}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">{item.qtdNf} un</td>
                        <td className="p-3 text-center font-bold">
                          {item.qtdDevolucao} un
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min={0}
                            value={item.qtdConferida}
                            onChange={(e) =>
                              updateValidationItem(
                                item.id,
                                'qtdConferida',
                                Number(e.target.value),
                              )
                            }
                            className={cn(
                              'w-16 rounded border-none bg-muted py-1 text-center focus:outline-none focus:ring-1',
                              item.status === 'pendente' &&
                                'focus:ring-destructive',
                              item.status !== 'pendente' && 'focus:ring-primary',
                            )}
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={item.motivo}
                            onChange={(e) =>
                              updateValidationItem(
                                item.id,
                                'motivo',
                                e.target.value,
                              )
                            }
                            className="w-full rounded border-none bg-muted py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {MOTIVOS_DEVOLUCAO.map((motivo) => (
                              <option key={motivo} value={motivo}>
                                {motivo}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          {item.status === 'pendente' ? (
                            <CircleAlert
                              className="ml-auto size-4 text-destructive"
                              aria-hidden
                            />
                          ) : (
                            <NfItemStatusBadge status={item.status} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSalvar}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Salvar Validação da Nota
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}

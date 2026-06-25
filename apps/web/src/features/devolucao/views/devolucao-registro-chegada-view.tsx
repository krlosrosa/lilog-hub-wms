'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Minus,
  PackageMinus,
  Plus,
  Route,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { DevolucaoAdicionarViagemDialog } from '@/features/devolucao/components/devolucao-adicionar-viagem-dialog';
import { DevolucaoDemandaFaltaDialog } from '@/features/devolucao/components/devolucao-demanda-falta-dialog';
import { DevolucaoNfRow } from '@/features/devolucao/components/devolucao-nf-row';
import { useDevolucaoCheckin } from '@/features/devolucao/hooks/use-devolucao-checkin';
import { getDemandaById } from '@/features/devolucao/mocks/devolucao-mock-data';
import { canRegistrarChegada } from '@/features/devolucao/types/devolucao-gestao.schema';

type DevolucaoRegistroChegadaViewProps = {
  demandId: string;
};

export function DevolucaoRegistroChegadaView({
  demandId,
}: DevolucaoRegistroChegadaViewProps) {
  const router = useRouter();
  const demanda = getDemandaById(demandId);

  const {
    isLoading,
    tripInfo,
    dockOptions,
    docaId,
    setDocaId,
    cargaSegregada,
    setCargaSegregada,
    paletesRetornados,
    chapasPbr,
    incrementPaletes,
    decrementPaletes,
    nfs,
    expandedNfIds,
    toggleNfExpanded,
    triagemPercent,
    cancelarCheckin,
    liberarConferenciaCega,
    resolverDivergencia,
    outrasViagens,
    nfsOutrasViagens,
    showAdicionarViagemDialog,
    setShowAdicionarViagemDialog,
    showDemandaFaltaDialog,
    setShowDemandaFaltaDialog,
    criarDemandaFalta,
    adicionarNfsDeOutraViagem,
    removerNfExterna,
    updateNfItemQtdDevolucao,
    updateNfMotivo,
    validarNf,
  } = useDevolucaoCheckin(demandId);

  if (!demanda || !canRegistrarChegada(demanda.status)) {
    return (
      <SidebarMain>
        <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
          <div className="mx-auto max-w-container space-y-4 text-center">
            <p className="text-body-md text-muted-foreground">
              Este transporte não está disponível para validação de chegada.
            </p>
            <Button type="button" variant="outline" asChild>
              <Link href="/devolucao">Voltar à gestão</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const handleCancelar = async () => {
    const result = await cancelarCheckin();
    if (result.success) {
      toast.info('Check-in cancelado.');
      router.push('/devolucao');
    }
  };

  const handleLiberar = async () => {
    const result = await liberarConferenciaCega();
    if (result.success) {
      toast.success('Liberado para conferência cega.');
    }
  };

  const handleAdicionarViagem = async (viagemId: string, nfIds: string[]) => {
    const result = await adicionarNfsDeOutraViagem(viagemId, nfIds);
    if (result.success) {
      toast.success(
        `${result.quantidade} NF(s) vinculada(s) da viagem ${result.viagemLabel}.`,
      );
    }
  };

  const handleRemoverNfExterna = async (nfId: string) => {
    const result = await removerNfExterna(nfId);
    if (result.success) toast.info('NF de outra viagem removida.');
  };

  const handleValidarNf = async (nfId: string) => {
    const result = await validarNf(nfId);
    if (result.success) {
      toast.success(`NF ${result.numero} validada.`);
    } else if (result.reason === 'motivo') {
      toast.error('Selecione o motivo do retorno antes de validar.');
    }
  };

  const handleDemandaFalta = async (
    itens: Parameters<typeof criarDemandaFalta>[0],
    observacao: string,
  ) => {
    const result = await criarDemandaFalta(itens, observacao);
    if (result.success) {
      toast.success(
        `Demanda de falta aberta com ${result.quantidade} item(ns).`,
      );
    }
  };

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-6">
          <nav className="flex items-center gap-2 text-caption text-muted-foreground">
            <Link href="/devolucao" className="inline-flex items-center gap-1 hover:text-primary">
              <ArrowLeft className="size-3.5" aria-hidden />
              Devolução
            </Link>
            <span>/</span>
            <span className="text-foreground">
              Validar Chegada — {demanda.placa}
            </span>
          </nav>

          <header className="flex flex-col justify-between gap-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-6 lg:flex-row lg:items-end">
            <div>
              <p className="mb-2 text-caption font-semibold uppercase tracking-wider text-primary">
                Transporte selecionado
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-headline-lg-mobile font-semibold text-foreground md:text-headline-lg">
                  Validação de Chegada
                </h1>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => setShowDemandaFaltaDialog(true)}
                  className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <PackageMinus className="size-4" aria-hidden />
                  Demanda de Falta
                </Button>
              </div>
              <p className="mt-1 text-muted-foreground">
                {demanda.veiculo} • {demanda.motorista} • Previsão{' '}
                {demanda.previsao}
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

          <div className="grid grid-cols-12 gap-6">
            <section className="relative col-span-12 overflow-hidden rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass lg:col-span-4">
              <Truck
                className="absolute right-4 top-4 size-16 text-primary opacity-20"
                aria-hidden
              />
              <h2 className="mb-6 text-label-md uppercase tracking-widest text-muted-foreground">
                Detalhes da Viagem (RAVEX)
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-caption text-muted-foreground">
                    Motorista
                  </span>
                  <p className="text-headline-md font-medium">
                    {tripInfo.motorista}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-caption text-muted-foreground">
                      Placa Veículo
                    </span>
                    <p className="mt-1 inline-block rounded bg-muted px-2 py-1 font-mono text-label-md">
                      {tripInfo.placa}
                    </p>
                  </div>
                  <div>
                    <span className="text-caption text-muted-foreground">
                      Transportadora
                    </span>
                    <p className="text-label-md">{tripInfo.transportadora}</p>
                  </div>
                </div>
                <div className="border-t border-outline-variant pt-4">
                  <span className="text-caption text-muted-foreground">
                    ID Viagem RAVEX
                  </span>
                  <p className="font-mono text-primary">
                    {tripInfo.viagemRavexId}
                  </p>
                </div>
              </div>
            </section>

            <div className="col-span-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-8">
              <section className="space-y-4 rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
                <h2 className="text-label-md uppercase tracking-widest text-muted-foreground">
                  Configuração de Recebimento
                </h2>
                <div>
                  <label
                    htmlFor="doca-select"
                    className="mb-2 block text-caption text-muted-foreground"
                  >
                    Doca de Recebimento
                  </label>
                  <select
                    id="doca-select"
                    value={docaId}
                    onChange={(e) => setDocaId(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant bg-muted px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {dockOptions.map((opt) => (
                      <option key={opt.id || 'empty'} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className="size-5 text-destructive"
                      aria-hidden
                    />
                    <div>
                      <p className="text-label-md text-destructive">
                        Carga Segregada
                      </p>
                      <p className="text-[10px] uppercase text-destructive/80">
                        Perecíveis ou Avarias
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cargaSegregada}
                    onClick={() => setCargaSegregada(!cargaSegregada)}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      cargaSegregada ? 'bg-destructive' : 'bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-5 rounded-full bg-background transition-transform',
                        cargaSegregada ? 'left-[22px]' : 'left-0.5',
                      )}
                    />
                  </button>
                </div>
              </section>

              <section className="flex flex-col justify-between rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
                <h2 className="text-label-md uppercase tracking-widest text-muted-foreground">
                  Controle de Ativos
                </h2>
                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="text-center">
                    <p className="mb-2 text-caption text-muted-foreground">
                      Paletes Retornados
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={decrementPaletes}
                        className="flex size-10 items-center justify-center rounded bg-muted hover:bg-primary hover:text-primary-foreground"
                        aria-label="Diminuir paletes"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="text-headline-lg font-bold">
                        {paletesRetornados}
                      </span>
                      <button
                        type="button"
                        onClick={incrementPaletes}
                        className="flex size-10 items-center justify-center rounded bg-muted hover:bg-primary hover:text-primary-foreground"
                        aria-label="Aumentar paletes"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-outline-variant" aria-hidden />
                  <div className="text-center opacity-50">
                    <p className="mb-2 text-caption text-muted-foreground">
                      Chapas / Pallets PBR
                    </p>
                    <span className="text-headline-lg font-bold">
                      {String(chapasPbr).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <section className="col-span-12 overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="flex flex-col gap-4 border-b border-outline-variant bg-muted/30 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-label-md font-bold">
                    Listagem de Notas Fiscais
                  </h2>
                  <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground">
                    {nfs.length} NFs VINCULADAS
                  </span>
                  {nfsOutrasViagens > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[10px] font-bold text-secondary">
                      <Route className="size-3" aria-hidden />
                      {nfsOutrasViagens} de outra viagem
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading || outrasViagens.length === 0}
                    onClick={() => setShowAdicionarViagemDialog(true)}
                    className="gap-2"
                  >
                    <Route className="size-4" aria-hidden />
                    Adicionar NFs de outra viagem
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-muted-foreground">
                      Status da Triagem
                    </span>
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-muted sm:w-48">
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
                      <th className="px-6 py-3 font-medium">
                        Tipo Devolução
                      </th>
                      <th className="px-6 py-3 font-medium">
                        Motivo do Retorno
                      </th>
                      <th className="px-6 py-3 text-center font-medium">
                        Itens Validados
                      </th>
                      <th className="px-6 py-3 font-medium">Valor Total</th>
                      <th className="px-6 py-3 text-right font-medium">
                        Ações
                      </th>
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
                        onRemover={
                          nf.viagemOrigemId
                            ? () => handleRemoverNfExterna(nf.id)
                            : undefined
                        }
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
          </div>

          <DevolucaoAdicionarViagemDialog
            open={showAdicionarViagemDialog}
            onOpenChange={setShowAdicionarViagemDialog}
            viagens={outrasViagens}
            isLoading={isLoading}
            onConfirm={handleAdicionarViagem}
          />

          <DevolucaoDemandaFaltaDialog
            open={showDemandaFaltaDialog}
            onOpenChange={setShowDemandaFaltaDialog}
            nfs={nfs}
            isLoading={isLoading}
            onConfirm={handleDemandaFalta}
          />

          <div className="flex justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href={`/devolucao/${demandId}/validacao`}>
                Ir para Validação Detalhada
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}

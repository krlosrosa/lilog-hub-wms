'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  CheckCircle2,
  Gauge,
  Loader2,
  Package,
  Tag,
  AlertTriangle,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { FrotaSkeleton } from '@/features/frota/components/frota-skeleton';
import { VeiculoBentoCard } from '@/features/frota/components/veiculo-bento-card';
import { VeiculoTabAbastecimento } from '@/features/frota/components/veiculo-tab-abastecimento';
import { VeiculoTabDocs } from '@/features/frota/components/veiculo-tab-docs';
import { VeiculoTabGeral } from '@/features/frota/components/veiculo-tab-geral';
import { VeiculoTabHistorico } from '@/features/frota/components/veiculo-tab-historico';
import { VeiculoTabManutencao } from '@/features/frota/components/veiculo-tab-manutencao';
import { VeiculoTabMotoristas } from '@/features/frota/components/veiculo-tab-motoristas';
import { useFrotaDetalhes } from '@/features/frota/hooks/use-frota-detalhes';
import {
  VEICULO_DETALHE_TAB_LABELS,
  type VeiculoDetalheTab,
} from '@/features/frota/types/frota.schema';

const TABS: VeiculoDetalheTab[] = [
  'geral',
  'docs',
  'maint',
  'drivers',
  'fuel',
  'audit',
];

type FrotaDetalhesViewProps = {
  veiculoId: string;
};

export function FrotaDetalhesView({ veiculoId }: FrotaDetalhesViewProps) {
  const {
    veiculo,
    isLoading,
    tabAtiva,
    setTab,
    processandoAcao,
    editarInfo,
    despachar,
    registrarManutencao,
    uploadDocumento,
  } = useFrotaDetalhes(veiculoId);

  if (!isLoading && !veiculo) {
    return (
      <SidebarMain className="flex min-h-dvh flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-margin-mobile py-16 md:px-margin-desktop">
          <div className="max-w-md text-center">
            <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
              Veículo não encontrado
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              Não há registro correspondente ao identificador informado nos dados
              mock.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/frota">Voltar para frota</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  return (
    <SidebarMain className="flex min-h-dvh flex-col blueprint-grid">
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-glass-bg px-margin-mobile backdrop-blur-glass md:px-margin-desktop">
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-label-md"
        >
          <Link
            href="/frota"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Frota
          </Link>
          <span className="text-muted-foreground" aria-hidden>
            /
          </span>
          <span className="font-semibold text-foreground">Detalhes</span>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        {isLoading || !veiculo ? (
          <div className="space-y-6">
            <FrotaSkeleton className="h-16 w-full max-w-2xl" />
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <FrotaSkeleton key={i} className="h-32" />
              ))}
            </div>
            <FrotaSkeleton className="h-64" />
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 items-end gap-gutter lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="rounded bg-secondary px-3 py-1 font-mono text-label-sm text-secondary-foreground">
                    {veiculo.codigo}
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    <span className="text-label-sm font-medium uppercase">
                      {veiculo.status}
                    </span>
                  </span>
                </div>
                <h1 className="text-display-lg font-bold uppercase tracking-tight text-primary">
                  {veiculo.nome}
                </h1>
              </div>
              <div className="flex flex-wrap justify-end gap-2 lg:col-span-4">
                <Button type="button" variant="outline" onClick={editarInfo}>
                  Editar info
                </Button>
                <Button
                  type="button"
                  disabled={processandoAcao}
                  className="gap-2"
                  onClick={() => void despachar()}
                >
                  {processandoAcao ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  Despachar agora
                </Button>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
              <VeiculoBentoCard
                label="Placa"
                value={
                  <span className="tracking-widest uppercase">
                    {veiculo.placa}
                  </span>
                }
                subtext={veiculo.uf}
                icon={<Tag className="h-5 w-5" aria-hidden />}
              />
              <VeiculoBentoCard
                label="Capacidade máx."
                value={`${veiculo.capacidadePaletes} paletes`}
                subtext={`${veiculo.eficienciaCargaPercent}% eficiência de carga`}
                icon={<Package className="h-5 w-5" aria-hidden />}
                footer={
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${veiculo.eficienciaCargaPercent}%`,
                      }}
                    />
                  </div>
                }
              />
              <VeiculoBentoCard
                label="Manutenção"
                value={veiculo.proximaManutencao}
                subtext={veiculo.proximaManutencaoDetalhe}
                variant="destructive"
                icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
              />
              <VeiculoBentoCard
                label="Quilometragem total"
                value={`${veiculo.quilometragemTotal.toLocaleString('pt-BR')} KM`}
                subtext={`Média ${veiculo.mediaKmMes.toLocaleString('pt-BR')} KM / mês`}
                icon={<Gauge className="h-5 w-5" aria-hidden />}
              />
            </div>

            <div>
              <div className="mb-6 flex overflow-x-auto border-b border-outline-variant">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={cn(
                      'shrink-0 px-6 py-4 font-mono text-label-sm uppercase transition-colors',
                      tabAtiva === tab
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => setTab(tab)}
                  >
                    {VEICULO_DETALHE_TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              {tabAtiva === 'geral' && <VeiculoTabGeral veiculo={veiculo} />}
              {tabAtiva === 'docs' && (
                <VeiculoTabDocs
                  documentos={veiculo.documentos}
                  onUpload={uploadDocumento}
                />
              )}
              {tabAtiva === 'maint' && (
                <VeiculoTabManutencao
                  registros={veiculo.manutencoes}
                  onRegistrar={registrarManutencao}
                />
              )}
              {tabAtiva === 'drivers' && (
                <VeiculoTabMotoristas motoristas={veiculo.motoristas} />
              )}
              {tabAtiva === 'fuel' && (
                <VeiculoTabAbastecimento
                  consumoMedioKmL={veiculo.consumoMedioKmL}
                  consumoDeltaPercent={veiculo.consumoDeltaPercent}
                  historicoPercent={veiculo.consumoHistoricoPercent}
                  abastecimentos={veiculo.abastecimentos}
                />
              )}
              {tabAtiva === 'audit' && (
                <VeiculoTabHistorico eventos={veiculo.auditoria} />
              )}
            </div>
          </>
        )}
      </main>
    </SidebarMain>
  );
}

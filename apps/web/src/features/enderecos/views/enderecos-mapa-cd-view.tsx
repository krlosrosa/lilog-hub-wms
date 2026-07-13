'use client';

import Link from 'next/link';

import {
  Ban,
  Box,
  Building2,
  Loader2,
  MapPin,
  Package,
  Warehouse,
} from 'lucide-react';

import {
  Button,
  cn,
} from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
import { MapaCdPrateleiraSheet } from '@/features/enderecos/components/mapa-cd-prateleira-sheet';
import { glassPanelClassName } from '@/features/enderecos/components/form-field-classes';
import { useMapaCd } from '@/features/enderecos/hooks/use-mapa-cd';
import {
  resolverCorPosicao,
  splitPosicoesPorLado,
  type MapaCdPosicao,
  type MapaCdRua,
  type MapaCdZona,
} from '@/features/enderecos/types/mapa-cd.schema';

const nf = new Intl.NumberFormat('pt-BR');

function MapaCdLegenda({ compact = false }: { compact?: boolean }) {
  const items = [
    { label: 'Livre', className: 'bg-emerald-950/50 border-emerald-800/40' },
    { label: 'Baixa', className: 'bg-emerald-600/40 border-emerald-500/35' },
    { label: 'Média', className: 'bg-amber-500/40 border-amber-400/35' },
    { label: 'Alta', className: 'bg-orange-500/45 border-orange-400/40' },
    { label: 'Crítica', className: 'bg-destructive/60 border-destructive/45' },
    { label: 'Bloq.', className: 'bg-muted border-outline-variant' },
  ];

  return (
    <div className={cn('flex flex-wrap items-center', compact ? 'gap-2' : 'gap-3')}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span
            className={cn(
              'rounded-sm border',
              compact ? 'size-2' : 'size-2.5',
              item.className,
            )}
            aria-hidden
          />
          <span
            className={cn(
              'text-muted-foreground',
              compact ? 'text-[9px]' : 'text-[10px]',
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PosicaoBox({
  posicao,
  rua,
  selected,
  onSelect,
}: {
  posicao: MapaCdPosicao;
  rua: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const cor = resolverCorPosicao(posicao.niveis);
  const ocupacaoMedia =
    posicao.niveis.reduce((acc, n) => acc + n.ocupacaoPercent, 0) /
    Math.max(1, posicao.niveis.length);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Rua ${rua}, posição ${posicao.posicao}`}
      title={`${rua} ${posicao.posicao} — ${Math.round(ocupacaoMedia)}% · ${posicao.niveis.length} nível(is)`}
      className={cn(
        'group relative flex size-5 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[3px] border transition-all hover:z-10 hover:scale-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:size-6',
        cor.bg,
        cor.border,
        cor.pulse && 'animate-pulse',
        selected && 'z-20 scale-125 ring-1 ring-primary ring-offset-1 ring-offset-background',
      )}
    >
      <span
        className={cn(
          'pointer-events-none font-mono text-[6px] font-bold leading-none sm:text-[7px]',
          cor.text,
        )}
      >
        {posicao.posicao.slice(-2)}
      </span>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/15">
        <div
          className="h-full bg-white/60"
          style={{ width: `${Math.min(100, ocupacaoMedia)}%` }}
        />
      </div>
    </button>
  );
}

function PosicoesFileira({
  posicoes,
  rua,
  posicaoSelecionada,
  onSelectPosicao,
}: {
  posicoes: MapaCdPosicao[];
  rua: string;
  posicaoSelecionada: { rua: string; posicao: string } | null;
  onSelectPosicao: (
    ruaId: string,
    posicao: string,
    niveis: MapaCdPosicao['niveis'],
  ) => void;
}) {
  if (posicoes.length === 0) {
    return <span className="px-1 text-[8px] text-muted-foreground/50">—</span>;
  }

  return (
    <>
      {posicoes.map((posicao) => (
        <PosicaoBox
          key={posicao.posicao}
          posicao={posicao}
          rua={rua}
          selected={
            posicaoSelecionada?.rua === rua &&
            posicaoSelecionada.posicao === posicao.posicao
          }
          onSelect={() =>
            onSelectPosicao(rua, posicao.posicao, posicao.niveis)
          }
        />
      ))}
    </>
  );
}

function RuaLane({
  rua,
  posicaoSelecionada,
  onSelectPosicao,
}: {
  rua: MapaCdRua;
  posicaoSelecionada: { rua: string; posicao: string } | null;
  onSelectPosicao: (
    ruaId: string,
    posicao: string,
    niveis: MapaCdPosicao['niveis'],
  ) => void;
}) {
  const { ladoA, ladoB } = splitPosicoesPorLado(rua.posicoes);
  const vazia = rua.posicoes.length === 0;

  return (
    <div className="flex items-start gap-1.5 border-b border-outline-variant/20 py-1.5 last:border-b-0">
      <div
        className="sticky left-0 z-10 flex w-9 shrink-0 items-center justify-center self-center rounded bg-primary/10 py-1 font-mono text-[9px] font-bold text-primary sm:w-10 sm:text-[10px]"
        title={`Rua ${rua.rua}`}
      >
        {rua.rua}
      </div>

      <div
        className="flex min-w-0 flex-1 flex-col gap-3 rounded-md border border-dashed border-outline-variant/55 px-2 py-1.5 sm:gap-4"
        title={`Rua ${rua.rua}`}
      >
        {vazia ? (
          <span className="px-1 text-[8px] text-muted-foreground/50">—</span>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
              <PosicoesFileira
                posicoes={ladoA}
                rua={rua.rua}
                posicaoSelecionada={posicaoSelecionada}
                onSelectPosicao={onSelectPosicao}
              />
            </div>

            <div
              className="h-px w-full bg-outline-variant/40"
              aria-hidden
              title="Corredor"
            />

            <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
              <PosicoesFileira
                posicoes={ladoB}
                rua={rua.rua}
                posicaoSelecionada={posicaoSelecionada}
                onSelectPosicao={onSelectPosicao}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MapaCdPlanta({
  zona,
  posicaoSelecionada,
  onSelectPosicao,
}: {
  zona: MapaCdZona;
  posicaoSelecionada: { rua: string; posicao: string } | null;
  onSelectPosicao: (
    rua: string,
    posicao: string,
    niveis: MapaCdPosicao['niveis'],
  ) => void;
}) {
  const totalPosicoes = zona.ruas.reduce((acc, r) => acc + r.posicoes.length, 0);
  const totalEnderecos = zona.ruas.reduce(
    (acc, r) => acc + r.posicoes.reduce((a, p) => a + p.niveis.length, 0),
    0,
  );

  return (
    <div className={cn(glassPanelClassName, 'overflow-hidden')}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/50 px-3 py-2.5 md:px-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wide text-primary">
            Planta — Galpão {zona.zona}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {zona.ruas.length} rua{zona.ruas.length === 1 ? '' : 's'} ·{' '}
            {totalPosicoes} posiç{totalPosicoes === 1 ? 'ão' : 'ões'} ·{' '}
            {totalEnderecos} endereços
          </p>
        </div>
        <MapaCdLegenda compact />
      </div>

      <div className="max-h-[calc(100dvh-18rem)] overflow-auto p-2 md:p-3">
        <div className="min-w-max rounded-lg border border-outline-variant/30 bg-gradient-to-br from-surface-lowest/90 via-surface-low/50 to-surface-lowest/80 p-2">
          {zona.ruas.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              Nenhuma rua neste galpão.
            </p>
          ) : (
            zona.ruas.map((rua) => (
              <RuaLane
                key={rua.rua}
                rua={rua}
                posicaoSelecionada={posicaoSelecionada}
                onSelectPosicao={onSelectPosicao}
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant/40 px-3 py-2 text-[10px] text-muted-foreground md:px-4">
        Cada linha pontilhada é uma rua — ímpares em cima, pares embaixo. Clique
        no quadrado para ver a prateleira.
      </div>
    </div>
  );
}

export function EnderecosMapaCdView() {
  const {
    data,
    isLoading,
    error,
    zonaAtiva,
    zonaAtual,
    posicaoSelecionada,
    unidadeId,
    unidadeLabel,
    setZonaAtiva,
    selecionarPosicao,
    fecharDrawer,
  } = useMapaCd();

  const drawerAberto = posicaoSelecionada !== null;

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Link href="/enderecos" className="hover:text-primary">
                  Endereços
                </Link>
                <span aria-hidden>/</span>
                <span className="font-semibold text-foreground">Mapa do CD</span>
              </nav>
              <h1 className="flex items-center gap-2 text-headline-md font-bold tracking-tight text-foreground md:text-headline-lg">
                <Warehouse className="size-5 text-primary md:size-6" aria-hidden />
                Mapa do CD
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Planta do armazém ·{' '}
                <span className="font-semibold text-foreground">{unidadeLabel}</span>
              </p>
            </div>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Carregando mapa...
            </div>
          ) : error ? (
            <div className={cn(glassPanelClassName, 'px-6 py-14 text-center')}>
              <Building2 className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : !data || data.zonas.length === 0 ? (
            <div className={cn(glassPanelClassName, 'px-6 py-14 text-center')}>
              <MapPin className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum endereço cadastrado para esta unidade.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/enderecos/cadastro-lote">Cadastrar em lote</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <EnderecoKpiCard
                  icon={<Package className="size-3.5 text-primary" aria-hidden />}
                  label="Total"
                  value={nf.format(data.kpi.total)}
                  className="p-3"
                />
                <EnderecoKpiCard
                  icon={<Box className="size-3.5 text-emerald-500" aria-hidden />}
                  label="Disponíveis"
                  value={nf.format(data.kpi.disponiveis)}
                  className="p-3"
                />
                <EnderecoKpiCard
                  icon={<Package className="size-3.5 text-tertiary" aria-hidden />}
                  label="Ocupados"
                  value={nf.format(data.kpi.ocupados)}
                  className="p-3"
                />
                <EnderecoKpiCard
                  variant="critical"
                  icon={<Ban className="size-3.5 text-destructive" aria-hidden />}
                  label="Bloqueados"
                  value={nf.format(data.kpi.bloqueados)}
                  className="p-3"
                />
                <EnderecoKpiCard
                  icon={<Warehouse className="size-3.5 text-secondary" aria-hidden />}
                  label="Ocupação"
                  value={`${data.kpi.ocupacaoMediaPercent}%`}
                  progressPercent={data.kpi.ocupacaoMediaPercent}
                  className="col-span-2 p-3 sm:col-span-1"
                />
              </div>

              {data.zonas.length > 1 && (
                <div
                  className="flex flex-wrap gap-1.5"
                  role="tablist"
                  aria-label="Galpões"
                >
                  {data.zonas.map((zona) => (
                    <button
                      key={zona.zona}
                      type="button"
                      role="tab"
                      aria-selected={zonaAtiva === zona.zona}
                      onClick={() => setZonaAtiva(zona.zona)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide transition-all',
                        zonaAtiva === zona.zona
                          ? 'border-primary/40 bg-primary/15 text-primary'
                          : 'border-outline-variant bg-surface-highest text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {zona.zona}
                    </button>
                  ))}
                </div>
              )}

              {zonaAtual && (
                <MapaCdPlanta
                  zona={zonaAtual}
                  posicaoSelecionada={
                    posicaoSelecionada
                      ? {
                          rua: posicaoSelecionada.rua,
                          posicao: posicaoSelecionada.posicao,
                        }
                      : null
                  }
                  onSelectPosicao={(rua, posicao, niveis) =>
                    selecionarPosicao(zonaAtual.zona, rua, posicao, niveis)
                  }
                />
              )}
            </>
          )}
        </div>
      </main>

      <MapaCdPrateleiraSheet
        open={drawerAberto}
        onOpenChange={(open) => !open && fecharDrawer()}
        posicao={posicaoSelecionada}
        unidadeId={unidadeId}
      />
    </SidebarMain>
  );
}

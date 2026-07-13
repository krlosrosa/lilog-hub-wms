'use client';

import Link from 'next/link';

import {
  ArrowRight,
  Ban,
  Box,
  Building2,
  Loader2,
  MapPin,
  Package,
  Warehouse,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
import { glassPanelClassName } from '@/features/enderecos/components/form-field-classes';
import {
  useGalpoesVisao,
  type GalpaoVisaoItem,
} from '@/features/enderecos/hooks/use-galpoes-visao';
import {
  calcularOcupacaoMediaRua,
  resolverCorOcupacao,
  resolverCorPosicao,
  resolverStatusDominanteRua,
  type MapaCdRua,
} from '@/features/enderecos/types/mapa-cd.schema';

const nf = new Intl.NumberFormat('pt-BR');

const GALPAO_CORES = [
  'from-primary/20 via-primary/5 to-surface-lowest',
  'from-secondary/20 via-secondary/5 to-surface-lowest',
  'from-tertiary/20 via-tertiary/5 to-surface-lowest',
  'from-amber-500/20 via-amber-500/5 to-surface-lowest',
  'from-emerald-500/20 via-emerald-500/5 to-surface-lowest',
  'from-orange-500/20 via-orange-500/5 to-surface-lowest',
];

function ocupacaoToneClass(percent: number): string {
  if (percent >= 90) return 'bg-destructive';
  if (percent >= 70) return 'bg-amber-500';
  if (percent >= 40) return 'bg-orange-400';
  return 'bg-emerald-500';
}

function GalpaoMiniPlanta({ ruas }: { ruas: MapaCdRua[] }) {
  const ruasVisiveis = ruas.slice(0, 10);

  return (
    <div className="space-y-0.5 rounded-md border border-outline-variant/40 bg-surface-lowest/60 p-1.5">
      {ruasVisiveis.length === 0 ? (
        <p className="py-4 text-center text-[10px] text-muted-foreground">
          Sem ruas
        </p>
      ) : (
        ruasVisiveis.map((rua) => {
          const ocupacao = calcularOcupacaoMediaRua(rua);
          const status = resolverStatusDominanteRua(rua);
          const cor = resolverCorOcupacao(status, ocupacao);

          return (
            <div key={rua.rua} className="flex items-center gap-1">
              <span className="w-5 shrink-0 font-mono text-[7px] font-bold text-muted-foreground">
                {rua.rua}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap gap-px">
                {rua.posicoes.slice(0, 28).map((posicao) => {
                  const corPosicao = resolverCorPosicao(posicao.niveis);

                  return (
                    <span
                      key={posicao.posicao}
                      className={cn(
                        'size-1.5 rounded-[1px] border',
                        corPosicao.bg,
                        corPosicao.border,
                      )}
                      aria-hidden
                    />
                  );
                })}
              </div>
              <div
                className={cn('h-1 w-6 shrink-0 rounded-full', cor.bg)}
                style={{ opacity: 0.8 }}
                aria-hidden
              />
            </div>
          );
        })
      )}
      {ruas.length > 10 ? (
        <p className="pt-0.5 text-center text-[8px] text-muted-foreground">
          +{ruas.length - 10} ruas
        </p>
      ) : null}
    </div>
  );
}

function GalpaoCard({
  item,
  index,
  selected,
  onSelect,
}: {
  item: GalpaoVisaoItem;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { zona, kpi } = item;
  const corGradiente = GALPAO_CORES[index % GALPAO_CORES.length];
  const critico = kpi.ocupacaoMediaPercent >= 85;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-xl border text-left transition-all',
        selected
          ? 'border-primary/50 bg-primary/5 shadow-md ring-1 ring-primary/30'
          : 'border-outline-variant bg-glass-bg hover:border-primary/30 hover:shadow-sm',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-80',
          corGradiente,
        )}
        aria-hidden
      />

      <div className="relative flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-xl border border-outline-variant/50 bg-card/80 shadow-sm">
              <Warehouse className="size-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Galpão
              </p>
              <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
                {zona.zona}
              </p>
            </div>
          </div>
          {critico ? (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[9px] font-bold uppercase text-destructive">
              Crítico
            </span>
          ) : null}
        </div>

        <GalpaoMiniPlanta ruas={zona.ruas} />

        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Ruas" value={String(kpi.totalRuas)} />
          <MiniStat label="Posições" value={nf.format(kpi.totalPosicoes)} />
          <MiniStat label="Endereços" value={nf.format(kpi.total)} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Ocupação média</span>
            <span
              className={cn(
                'font-mono font-bold tabular-nums',
                critico ? 'text-destructive' : 'text-foreground',
              )}
            >
              {kpi.ocupacaoMediaPercent}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                ocupacaoToneClass(kpi.ocupacaoMediaPercent),
              )}
              style={{ width: `${Math.min(100, kpi.ocupacaoMediaPercent)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <StatusPill
            label="Disp."
            value={kpi.disponiveis}
            className="border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatusPill
            label="Ocup."
            value={kpi.ocupados}
            className="border-primary/25 bg-primary/10 text-primary"
          />
          <StatusPill
            label="Bloq."
            value={kpi.bloqueados}
            className="border-destructive/25 bg-destructive/10 text-destructive"
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-outline-variant/40 pt-2">
          <span className="text-[10px] text-muted-foreground">
            Clique para detalhes
          </span>
          <ArrowRight
            className={cn(
              'size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary',
              selected && 'text-primary',
            )}
            aria-hidden
          />
        </div>
      </div>
    </button>
  );
}

function GalpaoDetalhePainel({ item }: { item: GalpaoVisaoItem }) {
  const { zona, kpi } = item;

  return (
    <div className={cn(glassPanelClassName, 'overflow-hidden')}>
      <div className="border-b border-outline-variant/50 px-4 py-3">
        <p className="font-mono text-xs font-bold uppercase tracking-wide text-primary">
          Detalhe — Galpão {zona.zona}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {kpi.totalRuas} ruas · {kpi.totalPosicoes} posições ·{' '}
          {kpi.total} endereços
        </p>
      </div>

      <div className="max-h-[28rem] space-y-2 overflow-y-auto p-3">
        {zona.ruas.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Nenhuma rua neste galpão.
          </p>
        ) : (
          zona.ruas.map((rua) => {
            const ocupacao = calcularOcupacaoMediaRua(rua);
            const status = resolverStatusDominanteRua(rua);
            const totalEnderecos = rua.posicoes.reduce(
              (acc, posicao) => acc + posicao.niveis.length,
              0,
            );

            return (
              <div
                key={rua.rua}
                className="rounded-lg border border-outline-variant/50 bg-surface-lowest/50 px-3 py-2"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">
                    Rua {rua.rua}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {rua.posicoes.length} pos. · {totalEnderecos} end.
                  </span>
                </div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Ocupação</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {Math.round(ocupacao)}%
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      resolverCorOcupacao(status, ocupacao).bg,
                    )}
                    style={{ width: `${Math.min(100, ocupacao)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-outline-variant/50 p-3">
        <Button asChild size="sm" className="w-full gap-1.5">
          <Link href={`/enderecos/mapa-cd?zona=${encodeURIComponent(zona.zona)}`}>
            <MapPin className="size-3.5" aria-hidden />
            Abrir planta do galpão
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-outline-variant/40 bg-card/60 px-2 py-1.5">
      <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-sm font-bold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

function StatusPill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums',
        className,
      )}
    >
      <span className="font-sans font-medium opacity-80">{label}</span>
      {nf.format(value)}
    </span>
  );
}

export function EnderecosGalpoesView() {
  const {
    data,
    galpoes,
    galpaoAtual,
    galpaoSelecionado,
    isLoading,
    error,
    unidadeLabel,
    setGalpaoSelecionado,
  } = useGalpoesVisao();

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
                <span className="font-semibold text-foreground">Galpões</span>
              </nav>
              <h1 className="flex items-center gap-2 text-headline-md font-bold tracking-tight text-foreground md:text-headline-lg">
                <Building2 className="size-5 text-primary md:size-6" aria-hidden />
                Gestão por Galpão
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Visão geral do CD ·{' '}
                <span className="font-semibold text-foreground">
                  {unidadeLabel}
                </span>
              </p>
            </div>

            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/enderecos/mapa-cd">
                <MapPin className="size-3.5" aria-hidden />
                Mapa completo
              </Link>
            </Button>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Carregando galpões...
            </div>
          ) : error ? (
            <div className={cn(glassPanelClassName, 'px-6 py-14 text-center')}>
              <Building2 className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : !data || galpoes.length === 0 ? (
            <div className={cn(glassPanelClassName, 'px-6 py-14 text-center')}>
              <Warehouse className="mx-auto mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum galpão cadastrado para esta unidade.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/enderecos/cadastro-lote">Cadastrar em lote</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <EnderecoKpiCard
                  icon={<Building2 className="size-3.5 text-primary" aria-hidden />}
                  label="Galpões"
                  value={nf.format(galpoes.length)}
                  className="p-3"
                />
                <EnderecoKpiCard
                  icon={<Package className="size-3.5 text-primary" aria-hidden />}
                  label="Total endereços"
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
                  icon={<Ban className="size-3.5 text-destructive" aria-hidden />}
                  label="Ocupação CD"
                  value={`${data.kpi.ocupacaoMediaPercent}%`}
                  progressPercent={data.kpi.ocupacaoMediaPercent}
                  className="col-span-2 p-3 sm:col-span-1"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {galpoes.map((item, index) => (
                    <GalpaoCard
                      key={item.zona.zona}
                      item={item}
                      index={index}
                      selected={galpaoSelecionado === item.zona.zona}
                      onSelect={() => setGalpaoSelecionado(item.zona.zona)}
                    />
                  ))}
                </div>

                {galpaoAtual ? (
                  <aside className="lg:sticky lg:top-4 lg:self-start">
                    <GalpaoDetalhePainel item={galpaoAtual} />
                  </aside>
                ) : null}
              </div>
            </>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}

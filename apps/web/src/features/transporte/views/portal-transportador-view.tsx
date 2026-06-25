'use client';

import { useCallback, useState } from 'react';

import { Button, cn } from '@lilog/ui';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableClassName,
  compactTableEmptyCellClassName,
} from '@/components/ui/compact-table-classes';

import { AlocarPlacaSheet } from '@/features/transporte/components/alocar-placa-sheet';
import { TransporteStatusBadge } from '@/features/transporte/components/transporte-status-badge';
import { usePortalTransportador } from '@/features/transporte/hooks/use-portal-transportador';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

const nf = new Intl.NumberFormat('pt-BR');

const TABLE_HEADERS = [
  { key: 'expand', label: '', className: 'w-10' },
  { key: 'rota', label: 'Rota', className: 'w-[120px]' },
  { key: 'cidade', label: 'Cidade', className: 'hidden sm:table-cell w-[108px]' },
  { key: 'bairro', label: 'Bairro', className: 'hidden sm:table-cell w-[100px]' },
  { key: 'nfs', label: 'NFs', className: 'w-14 text-center' },
  { key: 'peso', label: 'Peso', className: 'hidden md:table-cell w-[80px] text-right' },
  { key: 'placa', label: 'Placa atual', className: 'w-[90px]' },
  { key: 'motorista', label: 'Motorista', className: 'hidden lg:table-cell w-[120px]' },
  { key: 'status', label: 'Status', className: 'w-[100px]' },
  { key: 'actions', label: '', className: 'w-[120px] text-right' },
] as const;

const filterInputClass = cn(
  'rounded-md border border-outline-variant bg-surface-low px-2 py-1',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

function formatarPesoCompacto(peso: number): string {
  if (peso >= 1000) {
    return `${(peso / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}t`;
  }
  return `${nf.format(peso)} kg`;
};

type PortalSummaryCardsProps = {
  totalEntregas: number;
  placasEmUso: number;
  totalNFs: number;
};

function PortalSummaryCards({
  totalEntregas,
  placasEmUso,
  totalNFs,
}: PortalSummaryCardsProps) {
  const items = [
    {
      label: 'Total entregas',
      value: nf.format(totalEntregas),
      icon: Truck,
      accent: 'text-tertiary',
    },
    {
      label: 'Placas em uso',
      value: nf.format(placasEmUso),
      icon: RefreshCw,
      accent: 'text-primary',
    },
    {
      label: 'Total de NFs',
      value: nf.format(totalNFs),
      icon: Package,
      accent: 'text-foreground',
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              'relative overflow-hidden rounded-lg border border-outline-variant',
              'bg-glass-bg px-3 py-2.5 shadow-inner-glow backdrop-blur-glass',
            )}
          >
            <Icon
              className="pointer-events-none absolute -right-1 -top-1 size-8 text-primary opacity-[0.08]"
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p
              className={cn(
                'mt-0.5 font-mono text-sm font-bold leading-tight',
                item.accent,
              )}
            >
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

type PortalEntregaRowProps = {
  entrega: TransporteGrupo;
  expandido: boolean;
  processando: boolean;
  onToggleExpandido: (id: string) => void;
  onTrocarPlaca: (entrega: TransporteGrupo) => void;
};

function PortalEntregaRow({
  entrega,
  expandido,
  processando,
  onToggleExpandido,
  onTrocarPlaca,
}: PortalEntregaRowProps) {
  const semPlaca = !entrega.veiculoAlocado;
  const accentText = semPlaca ? 'text-destructive' : 'text-tertiary';

  return (
    <>
    <tr
      className={cn(
        'group border-b border-outline-variant/40 border-l-[3px] transition-colors',
        semPlaca
          ? 'border-l-destructive/70 hover:bg-destructive/[0.04]'
          : 'border-l-tertiary/70 hover:bg-tertiary/[0.04]',
        expandido && 'bg-surface-highest/20',
      )}
    >
      <td className="px-3 py-2.5 align-middle">
        <button
          type="button"
          onClick={() => onToggleExpandido(entrega.id)}
          aria-label={expandido ? 'Recolher remessas' : 'Expandir remessas'}
          aria-expanded={expandido}
          className={cn(
            'flex size-7 items-center justify-center rounded-md border border-outline-variant/60',
            'text-muted-foreground transition-all hover:border-primary/40 hover:bg-surface-highest hover:text-primary',
            expandido && 'border-primary/30 bg-primary/10 text-primary',
          )}
        >
          {expandido ? (
            <ChevronUp className="size-3.5" aria-hidden />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden />
          )}
        </button>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <div className="flex min-w-0 items-center gap-1.5">
          <div
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-md',
              semPlaca
                ? 'bg-destructive/10 text-destructive'
                : 'bg-tertiary/10 text-tertiary',
            )}
            aria-hidden
          >
            <MapPin className="size-3" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {entrega.rota}
            </p>
            <p className="truncate text-[10px] text-muted-foreground sm:hidden">
              {entrega.cidade} · {entrega.bairro}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-2.5 align-middle sm:table-cell">
        <span className="block truncate text-[11px] text-foreground">
          {entrega.cidade}
        </span>
      </td>
      <td className="hidden px-3 py-2.5 align-middle sm:table-cell">
        <span className="block truncate text-[11px] text-muted-foreground">
          {entrega.bairro}
        </span>
      </td>
      <td className="px-3 py-2.5 text-center align-middle">
        <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-surface-highest px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground ring-1 ring-inset ring-outline-variant/50">
          {entrega.quantidadeRemessas}
        </span>
      </td>
      <td className="hidden px-3 py-2.5 text-right align-middle md:table-cell">
        <span className="text-[11px] font-medium tabular-nums text-foreground">
          {formatarPesoCompacto(entrega.pesoTotal)}
        </span>
      </td>
      <td className="px-3 py-2.5 align-middle">
        {entrega.veiculoAlocado?.placa ? (
          <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary ring-1 ring-inset ring-primary/15">
            {entrega.veiculoAlocado.placa}
          </span>
        ) : (
          <span className="inline-flex rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive ring-1 ring-inset ring-destructive/15">
            Sem placa
          </span>
        )}
      </td>
      <td className="hidden px-3 py-2.5 align-middle lg:table-cell">
        <span className="block truncate text-[11px] text-foreground">
          {entrega.veiculoAlocado?.motorista ?? '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <TransporteStatusBadge status={entrega.status} />
      </td>
      <td className="px-3 py-2.5 text-right align-middle">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={processando}
          onClick={() => onTrocarPlaca(entrega)}
          className={cn(
            'h-7 gap-1.5 px-2.5 text-[10px] font-semibold',
            semPlaca
              ? 'border-destructive/30 text-destructive hover:bg-destructive/5'
              : 'border-outline-variant',
          )}
        >
          <RefreshCw className="size-3" aria-hidden />
          {semPlaca ? 'Alocar Placa' : 'Trocar Placa'}
        </Button>
      </td>
    </tr>

    {expandido && (
      <tr className="border-b border-outline-variant/40 bg-surface-low/50">
        <td colSpan={TABLE_HEADERS.length} className="p-0">
          <div className="border-t border-outline-variant/30 px-4 py-3 sm:px-5">
            <div className="overflow-hidden rounded-lg border border-outline-variant/60 bg-glass-bg/80">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/50 bg-surface-highest/40 px-3 py-2">
                <h4
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold',
                    accentText,
                  )}
                >
                  <Package className="size-3.5" aria-hidden />
                  Remessas — {entrega.rota}
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  {entrega.quantidadeRemessas} NF
                  {entrega.quantidadeRemessas !== 1 ? 's' : ''} ·{' '}
                  {formatarPesoCompacto(entrega.pesoTotal)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Remessa</th>
                      <th className="px-3 py-2">Empresa</th>
                      <th className="px-3 py-2">Cod. Cliente</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Cidade</th>
                      <th className="px-3 py-2 text-right">Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entrega.remessas.map((remessa, index) => (
                      <tr
                        key={remessa.id}
                        className={cn(
                          'border-b border-outline-variant/20 transition-colors last:border-0 hover:bg-surface-highest/30',
                          index % 2 === 1 && 'bg-surface-highest/10',
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-foreground">
                          {remessa.remessa}
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2 text-foreground">
                          {remessa.empresa}
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">
                          {remessa.codCliente}
                        </td>
                        <td className="max-w-[240px] truncate px-3 py-2 text-foreground">
                          {remessa.cliente}
                        </td>
                        <td className="px-3 py-2 text-foreground">
                          {remessa.cidade}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {nf.format(remessa.peso)} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )}
    </>
  );
}

export function PortalTransportadorView() {
  const {
    transportadoraAtual,
    summary,
    entregas,
    veiculosTransportadora,
    transportesTodos,
    filtroData,
    setFiltroData,
    processando,
    carregandoVeiculos,
    modalTrocarAberto,
    transporteSelecionado,
    abrirModalTrocar,
    fecharModalTrocar,
    confirmarTroca,
  } = usePortalTransportador();

  const [expandidos, setExpandidos] = useState<Set<string>>(() => new Set());

  const toggleExpandido = useCallback((id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Truck className="size-4" aria-hidden />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Transporte
                </span>
              </div>
              <h1 className="text-headline-md font-semibold tracking-tight text-foreground md:text-headline-lg">
                Portal Transportador
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {transportadoraAtual} — visualize suas entregas e troque placas
                alocadas.
              </p>
            </div>
            <span className="inline-flex self-start rounded-full bg-tertiary/15 px-3 py-1 text-[11px] font-semibold text-tertiary ring-1 ring-inset ring-tertiary/25 sm:self-auto">
              {summary.totalEntregas} entrega
              {summary.totalEntregas !== 1 ? 's' : ''} hoje
            </span>
          </header>

          <PortalSummaryCards
            totalEntregas={summary.totalEntregas}
            placasEmUso={summary.placasEmUso}
            totalNFs={summary.totalNFs}
          />

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
            <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant bg-surface-low/30 px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Minhas entregas
              </span>
              <input
                type="date"
                value={filtroData}
                onChange={(event) => setFiltroData(event.target.value)}
                aria-label="Filtrar por data"
                className={filterInputClass}
              />
              <span className="ml-auto text-[10px] text-muted-foreground">
                {entregas.length} entrega
                {entregas.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table
                className={cn(
                  compactTableClassName,
                  'min-w-[720px] table-auto text-[11px]',
                )}
              >
                <thead>
                  <tr className="sticky top-0 z-10 border-b border-outline-variant bg-surface-highest/90 backdrop-blur-md">
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.key}
                        className={cn(
                          'px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
                          header.className,
                        )}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entregas.length ? (
                    entregas.map((entrega) => (
                      <PortalEntregaRow
                        key={entrega.id}
                        entrega={entrega}
                        expandido={expandidos.has(entrega.id)}
                        processando={processando}
                        onToggleExpandido={toggleExpandido}
                        onTrocarPlaca={abrirModalTrocar}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className={cn(
                          compactTableEmptyCellClassName,
                          'py-16',
                        )}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Truck
                            className="size-8 text-muted-foreground/40"
                            aria-hidden
                          />
                          <p className="text-sm font-medium text-foreground">
                            Nenhuma entrega encontrada
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Não há entregas vinculadas à sua transportadora nesta
                            data.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <AlocarPlacaSheet
        open={modalTrocarAberto}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalTrocar();
        }}
        transporte={transporteSelecionado}
        veiculos={veiculosTransportadora}
        transportes={transportesTodos}
        processando={processando}
        carregandoVeiculos={carregandoVeiculos}
        modoTransportador
        onConfirmar={(veiculoId) => void confirmarTroca(veiculoId)}
      />
    </SidebarMain>
  );
}

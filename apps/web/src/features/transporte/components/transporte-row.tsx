'use client';

import { memo } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';
import {
  ArrowRight,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  MoreHorizontal,
  Package,
  RotateCcw,
  Truck,
  Trash2,
} from 'lucide-react';

import { accentSubtleIconClassName } from '@/lib/semantic-badge-classes';
import { PerfilVeiculoBadge } from '@/features/transporte/components/perfil-veiculo-badge';
import { PrioridadeTransporteBadge } from '@/features/transporte/components/prioridade-transporte-badge';
import { TransporteStatusBadge } from '@/features/transporte/components/transporte-status-badge';
import type { StatusTransporte, TransporteGrupo } from '@/features/transporte/types/transporte.schema';

const nf = new Intl.NumberFormat('pt-BR');

const CELL = 'px-3 py-2.5 align-middle';

type RowAccent = { border: string; hover: string; icon: string };

const STATUS_ROW_ACCENT: Record<StatusTransporte, RowAccent> = {
  PENDENTE: {
    border: 'border-l-destructive/70',
    hover: 'hover:bg-destructive/[0.04]',
    icon: 'bg-destructive/10 text-destructive',
  },
  ALOCADO: {
    border: 'border-l-tertiary/70',
    hover: 'hover:bg-tertiary/[0.04]',
    icon: 'bg-tertiary/10 text-tertiary',
  },
  PARCIAL: {
    border: 'border-l-secondary/70',
    hover: 'hover:bg-secondary/[0.04]',
    icon: 'bg-secondary/10 text-secondary',
  },
  EM_SEPARACAO: {
    border: 'border-l-primary/70',
    hover: 'hover:bg-primary/[0.04]',
    icon: 'bg-primary/10 text-primary',
  },
  SEPARADO: {
    border: 'border-l-primary/50',
    hover: 'hover:bg-primary/[0.03]',
    icon: 'bg-primary/10 text-primary',
  },
  EM_CONFERENCIA: {
    border: 'border-l-warning/70',
    hover: 'hover:bg-warning/[0.04]',
    icon: 'bg-warning/10 text-warning',
  },
  CONFERIDO: {
    border: 'border-l-warning/50',
    hover: 'hover:bg-warning/[0.03]',
    icon: 'bg-warning/10 text-warning',
  },
  EM_CARREGAMENTO: {
    border: 'border-l-accent/70',
    hover: 'hover:bg-accent/[0.04]',
    icon: accentSubtleIconClassName,
  },
  CARREGADO: {
    border: 'border-l-success/70',
    hover: 'hover:bg-success/[0.04]',
    icon: 'bg-success/10 text-success',
  },
  EM_VIAGEM: {
    border: 'border-l-primary/80',
    hover: 'hover:bg-primary/[0.04]',
    icon: 'bg-primary/10 text-primary',
  },
  VIAGEM_FINALIZADA: {
    border: 'border-l-muted-foreground/60',
    hover: 'hover:bg-muted/[0.04]',
    icon: 'bg-muted text-muted-foreground',
  },
};

const STATUS_ROW_TEXT: Record<StatusTransporte, string> = {
  PENDENTE: 'text-destructive',
  ALOCADO: 'text-tertiary',
  PARCIAL: 'text-secondary',
  EM_SEPARACAO: 'text-primary',
  SEPARADO: 'text-primary',
  EM_CONFERENCIA: 'text-warning',
  CONFERIDO: 'text-warning',
  EM_CARREGAMENTO: 'text-accent',
  CARREGADO: 'text-success',
  EM_VIAGEM: 'text-primary',
  VIAGEM_FINALIZADA: 'text-muted-foreground',
};

function formatarPesoCompacto(peso: number): string {
  if (peso >= 1000) {
    return `${(peso / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}t`;
  }
  return `${nf.format(peso)} kg`;
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) {
    return iso;
  }
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

type TransporteRowProps = {
  transporte: TransporteGrupo;
  selecionado: boolean;
  expandido: boolean;
  processando: boolean;
  onToggleSelecionado: (id: string) => void;
  onToggleExpandido: (id: string) => void;
  onAlocar: (transporte: TransporteGrupo) => void;
  onAbrirPrioridade: (transporte: TransporteGrupo) => void;
  onExcluir?: (transporte: TransporteGrupo) => void;
};

export const TransporteRow = memo(function TransporteRow({
  transporte,
  selecionado,
  expandido,
  processando,
  onToggleSelecionado,
  onToggleExpandido,
  onAlocar,
  onAbrirPrioridade,
  onExcluir,
}: TransporteRowProps) {
  const accent = transporte.reentregaExclusiva
    ? {
        border: 'border-l-secondary/70',
        hover: 'hover:bg-secondary/[0.04]',
        icon: 'bg-secondary/10 text-secondary',
      }
    : transporte.isPrioridade
      ? {
          border: 'border-l-orange-500/80',
          hover: 'hover:bg-orange-500/[0.04]',
          icon: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
        }
      : STATUS_ROW_ACCENT[transporte.status] ?? STATUS_ROW_ACCENT.PENDENTE;

  const perfilAlocado = transporte.veiculoAlocado?.tipo;
  const perfilAlocadoNome = transporte.veiculoAlocado?.perfilTarifaNome;
  const perfilDivergente =
    perfilAlocado !== undefined &&
    perfilAlocado !== transporte.perfilEsperado;

  const reentregas = transporte.remessas.filter(
    (remessa) => remessa.origem === 'reentrega',
  );
  const temReentrega =
    transporte.reentregaExclusiva || reentregas.length > 0;

  const accentText =
    STATUS_ROW_TEXT[transporte.status] ?? STATUS_ROW_TEXT.PENDENTE;

  return (
    <>
      <tr
        className={cn(
          'group cursor-pointer border-b border-outline-variant/40 border-l-[3px] transition-colors',
          accent.border,
          accent.hover,
          selecionado && 'bg-primary/6 ring-1 ring-inset ring-primary/20',
          expandido && 'bg-surface-highest/20',
        )}
        onClick={() => onAbrirPrioridade(transporte)}
        title="Clique para definir prioridade"
      >
        <td className={cn(CELL, 'w-10')} onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={selecionado}
            onChange={() => onToggleSelecionado(transporte.id)}
            aria-label={`Selecionar ${transporte.rota}`}
            className="size-3.5 rounded border-input accent-primary"
          />
        </td>
        <td className={cn(CELL, 'w-10')} onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => onToggleExpandido(transporte.id)}
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
        <td className={cn(CELL, 'w-[120px] max-w-[120px] overflow-hidden')}>
          <div
            title={transporte.rota}
            className="flex w-full min-w-0 items-center gap-1.5"
          >
            <div
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-md',
                accent.icon,
              )}
              aria-hidden
            >
              {transporte.reentregaExclusiva ? (
                <RotateCcw className="size-3" />
              ) : (
                <MapPin className="size-3" />
              )}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-foreground">
                {transporte.rota}
              </p>
              {transporte.reentregaExclusiva && (
                <span className="mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-secondary/15 px-1.5 py-px text-[9px] font-semibold text-secondary ring-1 ring-inset ring-secondary/20">
                  Placa Exclusiva
                </span>
              )}
              <p className="truncate text-[10px] text-muted-foreground sm:hidden">
                {transporte.cidade} · {transporte.bairro}
              </p>
            </div>
          </div>
        </td>
        <td
          className={cn(
            CELL,
            'hidden w-[88px] whitespace-nowrap text-[11px] tabular-nums text-muted-foreground sm:table-cell',
          )}
        >
          {formatarData(transporte.dataTransporte)}
        </td>
        <td
          className={cn(
            CELL,
            'hidden w-[108px] max-w-[108px] overflow-hidden sm:table-cell',
          )}
        >
          <span
            className="block truncate text-[11px] text-foreground"
            title={transporte.cidade}
          >
            {transporte.cidade}
          </span>
        </td>
        <td
          className={cn(
            CELL,
            'hidden w-[100px] max-w-[100px] overflow-hidden sm:table-cell',
          )}
        >
          <span
            className="block truncate text-[11px] text-muted-foreground"
            title={transporte.bairro}
          >
            {transporte.bairro}
          </span>
        </td>
        <td className={cn(CELL, 'w-14 text-center')}>
          <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-surface-highest px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground ring-1 ring-inset ring-outline-variant/50">
            {transporte.quantidadeRemessas}
          </span>
        </td>
        <td className={cn(CELL, 'hidden text-center sm:table-cell')}>
          {temReentrega ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-inset ring-secondary/20"
              title={`${reentregas.length} NF${reentregas.length !== 1 ? 's' : ''} de reentrega`}
            >
              <RotateCcw className="size-3 shrink-0" aria-hidden />
              Sim
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">Não</span>
          )}
        </td>
        <td className={cn(CELL, 'hidden text-right sm:table-cell')}>
          <div className="flex items-center justify-end gap-1 text-[11px] tabular-nums">
            <Package
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="font-medium text-foreground">
              {formatarPesoCompacto(transporte.pesoTotal)}
            </span>
          </div>
        </td>
        <td className={cn(CELL, 'hidden lg:table-cell')}>
          <PerfilVeiculoBadge
            tipo={transporte.perfilEsperado}
            variante="esperado"
          />
        </td>
        <td className={cn(CELL, 'hidden lg:table-cell')}>
          {perfilAlocado ? (
            <PerfilVeiculoBadge
              tipo={perfilAlocado}
              label={perfilAlocadoNome ?? undefined}
              divergente={perfilDivergente}
              variante="alocado"
            />
          ) : (
            <span className="text-[11px] text-muted-foreground/70">—</span>
          )}
        </td>
        <td className={cn(CELL, 'hidden md:table-cell lg:hidden')}>
          <div className="flex items-center gap-1">
            <PerfilVeiculoBadge
              tipo={transporte.perfilEsperado}
              variante="esperado"
            />
            <ArrowRight className="size-3 shrink-0 text-muted-foreground/60" aria-hidden />
            {perfilAlocado ? (
              <PerfilVeiculoBadge
                tipo={perfilAlocado}
                label={perfilAlocadoNome ?? undefined}
                divergente={perfilDivergente}
                variante="alocado"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground">—</span>
            )}
          </div>
        </td>
        <td className={cn(CELL, 'hidden w-[88px] sm:table-cell')}>
          {transporte.isPrioridade && transporte.nivelPrioridade ? (
            <PrioridadeTransporteBadge nivel={transporte.nivelPrioridade} />
          ) : (
            <span className="text-[11px] text-muted-foreground/70">—</span>
          )}
        </td>
        <td className={cn(CELL, 'w-[88px]')}>
          <TransporteStatusBadge status={transporte.status} />
        </td>
        <td className={cn(CELL, 'w-12 text-center')}>
          {transporte.ultimoMapaLoteId != null ? (
            <span
              className="inline-flex items-center justify-center text-primary"
              title={
                transporte.mapaGeradoEm
                  ? `Mapa disponível para impressão — salvo em ${formatarDataHora(transporte.mapaGeradoEm)}`
                  : 'Mapa disponível para impressão'
              }
              aria-label={
                transporte.mapaGeradoEm
                  ? `Mapa disponível para impressão, salvo em ${formatarDataHora(transporte.mapaGeradoEm)}`
                  : 'Mapa disponível para impressão'
              }
            >
              <CheckCheck className="size-4 shrink-0" aria-hidden />
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/50" aria-hidden>
              —
            </span>
          )}
        </td>
        <td className={cn(CELL, 'hidden max-w-[120px] md:table-cell')}>
          {transporte.veiculoAlocado?.transportadora ? (
            <span
              className="block truncate text-[11px] font-medium text-foreground"
              title={transporte.veiculoAlocado.transportadora}
            >
              {transporte.veiculoAlocado.transportadora}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">—</span>
          )}
        </td>
        <td className={CELL}>
          {transporte.veiculoAlocado?.placa ? (
            <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary ring-1 ring-inset ring-primary/15">
              {transporte.veiculoAlocado.placa}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">—</span>
          )}
        </td>
        <td className={cn(CELL, 'w-[108px] text-right')} onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {transporte.status !== 'ALOCADO' && (
              <Button
                type="button"
                size="sm"
                disabled={processando}
                onClick={() => onAlocar(transporte)}
                className="h-7 px-2.5 text-[10px] font-semibold"
              >
                Alocar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={processando}
                  aria-label={`Ações para ${transporte.rota}`}
                  className="size-7 rounded-md text-muted-foreground opacity-70 transition-opacity hover:text-primary group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10.5rem]">
                <DropdownMenuItem onSelect={() => onToggleExpandido(transporte.id)}>
                  <Truck className="size-3.5" aria-hidden />
                  {expandido ? 'Recolher remessas' : 'Ver remessas'}
                </DropdownMenuItem>
                {transporte.status === 'ALOCADO' && (
                  <DropdownMenuItem onSelect={() => onAlocar(transporte)}>
                    Realocar placa
                  </DropdownMenuItem>
                )}
                {onExcluir && (
                  <DropdownMenuItem
                    disabled={transporte.ultimoMapaLoteId != null}
                    onSelect={() => onExcluir(transporte)}
                    className="text-destructive focus:text-destructive"
                    title={
                      transporte.ultimoMapaLoteId
                        ? 'Exclua o mapa de separação antes de excluir o transporte'
                        : undefined
                    }
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Excluir transporte
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>

      {expandido && (
        <tr className="border-b border-outline-variant/40 bg-surface-low/50">
          <td colSpan={18} className="p-0">
            <div className="border-t border-outline-variant/30 px-4 py-3 sm:px-5">
              <div className="overflow-hidden rounded-lg border border-outline-variant/60 bg-glass-bg/80">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/50 bg-surface-highest/40 px-3 py-2">
                  <h4
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-semibold',
                      accentText,
                    )}
                  >
                    <Truck className="size-3.5" aria-hidden />
                    {transporte.reentregaExclusiva
                      ? 'NFs de Reentrega — Placa Exclusiva'
                      : `Remessas — ${transporte.rota}`}
                  </h4>
                  {transporte.status === 'PARCIAL' && (
                    <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">
                      Parcialmente alocado
                    </span>
                  )}
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
                      {transporte.remessas.map((remessa, index) => (
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
                          <td className="max-w-[200px] truncate px-3 py-2 text-foreground">
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
});

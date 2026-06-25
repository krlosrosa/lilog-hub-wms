'use client';

import { Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button, cn } from '@lilog/ui';

import type { IntervaloData } from '@/features/torre-controle-expedicao/lib/intervalo-data';

const filterInputClassName = cn(
  'rounded-md border border-outline-variant bg-surface-low px-2 py-1.5',
  'text-caption text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

export type TorreControleHeaderProps = {
  clock: string;
  turnoLabel: string;
  sessaoId: string;
  unidadeNome?: string | null;
  intervalo: IntervaloData;
  onIntervaloChange: (intervalo: IntervaloData) => void;
  uploadLoteIdSelecionado?: string | null;
  opcoesLote?: Array<{ value: string; label: string }>;
  onUploadLoteChange?: (uploadLoteId: string) => void;
  fonteDados: 'api' | 'vazio';
  erro?: string | null;
  aviso?: string | null;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  atualizadoHaLabel: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export function TorreControleHeader({
  clock,
  turnoLabel,
  sessaoId,
  unidadeNome,
  intervalo,
  onIntervaloChange,
  uploadLoteIdSelecionado,
  opcoesLote = [],
  onUploadLoteChange,
  fonteDados,
  erro,
  aviso,
  autoRefresh,
  onAutoRefreshChange,
  atualizadoHaLabel,
  onRefresh,
  isRefreshing,
}: TorreControleHeaderProps) {
  const exibirSeletorLote = opcoesLote.length > 1;

  return (
    <header className="space-y-4 border-b border-outline-variant pb-gutter">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <nav className="mb-1 flex flex-wrap gap-2 text-caption text-muted-foreground">
            <Link href="/expedicao" className="hover:text-primary">
              Expedição
            </Link>
            <span aria-hidden>/</span>
            <span className="text-primary">Torre de Controle</span>
          </nav>
          <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
            Torre de Controle — Expedição Noturna
          </h1>
          <p className="mt-1 text-body-md text-muted-foreground">
            Monitoramento operacional em tempo real
            {unidadeNome ? ` · ${unidadeNome}` : ''}
            {fonteDados === 'api' ? ' · dados do lote selecionado' : ''}
          </p>
          {erro ? (
            <p className="mt-1 text-caption text-destructive">{erro}</p>
          ) : null}
          {!erro && aviso ? (
            <p className="mt-1 text-caption text-muted-foreground">{aviso}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-label-md font-medium text-primary">
            {turnoLabel} · Sessão #{sessaoId}
          </span>

          <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-muted px-3 py-2 font-mono text-label-md tabular-nums">
            <Clock className="size-4 text-primary" aria-hidden />
            {clock}
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-caption text-muted-foreground">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
            />
            <span
              className={cn(
                'relative h-5 w-9 rounded-full bg-surface-highest transition-colors',
                'after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:border after:border-outline-variant after:bg-background after:transition-transform',
                'peer-checked:bg-primary peer-checked:after:translate-x-full',
              )}
              aria-hidden
            />
            Auto-refresh
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('size-4', isRefreshing && 'animate-spin')}
              aria-hidden
            />
            Atualizar
          </Button>

          <span className="text-caption text-muted-foreground">
            Atualizado {atualizadoHaLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-3">
        <div className="space-y-1">
          <label
            htmlFor="torre-data-inicio"
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Data início
          </label>
          <input
            id="torre-data-inicio"
            type="date"
            value={intervalo.dataInicio}
            onChange={(event) =>
              onIntervaloChange({
                ...intervalo,
                dataInicio: event.target.value,
              })
            }
            className={filterInputClassName}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="torre-data-fim"
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Data fim
          </label>
          <input
            id="torre-data-fim"
            type="date"
            value={intervalo.dataFim}
            onChange={(event) =>
              onIntervaloChange({
                ...intervalo,
                dataFim: event.target.value,
              })
            }
            className={filterInputClassName}
          />
        </div>

        {exibirSeletorLote ? (
          <div className="min-w-[220px] flex-1 space-y-1">
            <label
              htmlFor="torre-lote"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Lote de expedição
            </label>
            <select
              id="torre-lote"
              value={uploadLoteIdSelecionado ?? ''}
              onChange={(event) => onUploadLoteChange?.(event.target.value)}
              className={cn(filterInputClassName, 'w-full')}
            >
              {opcoesLote.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
    </header>
  );
}

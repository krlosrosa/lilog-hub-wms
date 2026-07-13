'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  ArrowLeft,
  ChevronRight,
  ClipboardPen,
  Loader2,
  Printer,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

import { CncStatusBadge } from '@/features/cnc/components/cnc-status-badge';
import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import {
  CNC_ORIGEM_LABELS,
  CNC_RESPONSAVEL_LABELS,
} from '@/features/cnc/types/cnc.schema';
import { formatCncDate } from '@/features/cnc/lib/cnc-detalhe-utils';

type CncDetalheHeaderProps = {
  cnc: CncDetalhe;
  podeIniciarAnalise: boolean;
  podeGerenciar: boolean;
  processandoAcao: boolean;
  imprimindo: boolean;
  onIniciarAnalise: () => void;
  onEncerrar: () => void;
  onCancelar: () => void;
  onImprimir: () => void;
  onAbrirRegistro: () => void;
};

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface-low/80 px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-outline-variant">
      {children}
    </span>
  );
}

export function CncDetalheHeader({
  cnc,
  podeIniciarAnalise,
  podeGerenciar,
  processandoAcao,
  imprimindo,
  onIniciarAnalise,
  onEncerrar,
  onCancelar,
  onImprimir,
  onAbrirRegistro,
}: CncDetalheHeaderProps) {
  const finalizada =
    cnc.situacao === 'encerrada' || cnc.situacao === 'cancelada';

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-outline-variant/60 bg-glass-bg/95 px-margin-mobile py-2.5 backdrop-blur-glass md:px-margin-desktop">
      <div className="mx-auto flex max-w-container flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground"
          >
            <Link
              href="/cnc"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3" aria-hidden />
              <span className="hidden sm:inline">Não Conformidades</span>
              <span className="sm:hidden">CNCs</span>
            </Link>
            <ChevronRight className="size-3 shrink-0" aria-hidden />
            <span className="truncate font-medium text-foreground">
              {cnc.numero}
            </span>
          </nav>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-outline-variant px-2.5 text-xs"
              onClick={onAbrirRegistro}
            >
              <ClipboardPen className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Registro</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-outline-variant px-2.5 text-xs"
              disabled={imprimindo}
              onClick={onImprimir}
            >
              {imprimindo ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Printer className="size-3.5" aria-hidden />
              )}
              <span className="hidden sm:inline">Imprimir</span>
            </Button>

            {podeIniciarAnalise ? (
              <Button
                type="button"
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs shadow-sm"
                disabled={processandoAcao}
                onClick={onIniciarAnalise}
              >
                Iniciar análise
              </Button>
            ) : null}

            {podeGerenciar ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-destructive/30 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                  disabled={processandoAcao}
                  onClick={onCancelar}
                >
                  <XCircle className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs shadow-sm"
                  disabled={processandoAcao}
                  onClick={onEncerrar}
                >
                  Encerrar
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                finalizada
                  ? 'border-outline-variant bg-surface-low'
                  : 'border-primary/30 bg-primary/10',
              )}
            >
              <ShieldAlert
                className={cn(
                  'size-3.5',
                  finalizada ? 'text-muted-foreground' : 'text-primary',
                )}
                aria-hidden
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
                  {cnc.numero}
                </h1>
                <span className="inline-flex items-center rounded-full border border-outline-variant bg-surface-low px-1.5 py-0">
                  <CncStatusBadge situacao={cnc.situacao} compact />
                </span>
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                <MetaChip>{CNC_ORIGEM_LABELS[cnc.origem]}</MetaChip>
                <MetaChip>{CNC_RESPONSAVEL_LABELS[cnc.responsavel]}</MetaChip>
                <MetaChip>Aberta {formatCncDate(cnc.createdAt)}</MetaChip>
              </div>
            </div>
          </div>

          {cnc.descricao ? (
            <p className="hidden max-w-md truncate text-[11px] text-muted-foreground lg:block">
              {cnc.descricao}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

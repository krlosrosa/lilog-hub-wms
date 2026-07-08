'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  ArrowLeft,
  ChevronRight,
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
  onIniciarAnalise: () => void;
  onEncerrar: () => void;
  onCancelar: () => void;
};

export function CncDetalheHeader({
  cnc,
  podeIniciarAnalise,
  podeGerenciar,
  processandoAcao,
  onIniciarAnalise,
  onEncerrar,
  onCancelar,
}: CncDetalheHeaderProps) {
  const finalizada =
    cnc.situacao === 'encerrada' || cnc.situacao === 'cancelada';

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Link
            href="/cnc"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Não Conformidades
          </Link>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          <span className="font-medium text-foreground">{cnc.numero}</span>
        </nav>

        <div className="flex flex-wrap gap-2">
          {podeIniciarAnalise ? (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5"
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
                className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={processandoAcao}
                onClick={onCancelar}
              >
                <XCircle className="size-3.5" aria-hidden />
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5"
                disabled={processandoAcao}
                onClick={onEncerrar}
              >
                Encerrar CNC
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-xl border shadow-inner-glow',
              finalizada
                ? 'border-outline-variant bg-surface-low'
                : 'border-primary/30 bg-primary/10',
            )}
          >
            <ShieldAlert
              className={cn(
                'size-5',
                finalizada ? 'text-muted-foreground' : 'text-primary',
              )}
              aria-hidden
            />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-headline-md font-bold tracking-tight text-foreground md:text-headline-lg">
                {cnc.numero}
              </h1>
              <span className="inline-flex items-center rounded-full border border-outline-variant bg-surface-low px-2.5 py-0.5">
                <CncStatusBadge situacao={cnc.situacao} compact />
              </span>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {cnc.descricao ??
                'Análise de anomalias identificadas no recebimento — revise cada item, defina tratativas e encerre com responsável e débito.'}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                Origem:{' '}
                <span className="font-medium text-foreground">
                  {CNC_ORIGEM_LABELS[cnc.origem]}
                </span>
              </span>
              <span aria-hidden>·</span>
              <span>
                Responsável:{' '}
                <span className="font-medium text-foreground">
                  {CNC_RESPONSAVEL_LABELS[cnc.responsavel]}
                </span>
              </span>
              <span aria-hidden>·</span>
              <span>
                Aberta em{' '}
                <span className="font-medium text-foreground">
                  {formatCncDate(cnc.createdAt)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

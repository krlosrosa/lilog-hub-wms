'use client';

import { Button, cn } from '@lilog/ui';
import { ArrowRight } from 'lucide-react';

import {
  ALERTA_SEVERIDADE_LABELS,
  type FrotaAlerta,
} from '@/features/frota/types/frota.schema';

type AlertaCardProps = {
  alerta: FrotaAlerta;
  onAcao?: (alerta: FrotaAlerta) => void;
};

const BORDER_BY_SEVERIDADE = {
  critico: 'border-l-destructive',
  urgente: 'border-l-secondary',
  aviso: 'border-l-primary',
  rotina: 'border-l-primary',
} as const;

const BADGE_BY_SEVERIDADE = {
  critico: 'bg-destructive text-destructive-foreground',
  urgente: 'bg-secondary text-secondary-foreground',
  aviso: 'bg-muted text-muted-foreground',
  rotina: 'bg-muted text-muted-foreground',
} as const;

export function AlertaCard({ alerta, onAcao }: AlertaCardProps) {
  return (
    <article
      className={cn(
        'group cursor-pointer rounded-lg border border-outline-variant border-l-4 bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass transition-colors hover:bg-surface-container-high',
        BORDER_BY_SEVERIDADE[alerta.severidade],
        alerta.severidade === 'critico' && 'ring-1 ring-destructive/20',
      )}
      onClick={() => onAcao?.(alerta)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAcao?.(alerta);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                BADGE_BY_SEVERIDADE[alerta.severidade],
              )}
            >
              {ALERTA_SEVERIDADE_LABELS[alerta.severidade]}
            </span>
            {alerta.referenciaId ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                ID: {alerta.referenciaId}
              </span>
            ) : null}
            {alerta.metaLabel ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                {alerta.metaLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-title-md font-medium text-foreground">
            {alerta.titulo}
          </h3>
          <p className="mt-1 text-body-md text-muted-foreground">
            {alerta.descricao}
          </p>
        </div>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4">
        <span className="text-label-sm text-muted-foreground">
          {alerta.contexto}
        </span>
        <Button
          type="button"
          size="sm"
          variant={alerta.severidade === 'critico' ? 'default' : 'outline'}
          className="rounded-full text-label-sm"
          onClick={(e) => {
            e.stopPropagation();
            onAcao?.(alerta);
          }}
        >
          {alerta.acaoLabel}
        </Button>
      </div>
    </article>
  );
}

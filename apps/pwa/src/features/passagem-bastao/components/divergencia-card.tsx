import { cn } from '@lilog/ui';
import { AlertTriangle, Package } from 'lucide-react';

import type { Divergencia } from '../types/passagem-bastao.schema';

interface DivergenciaCardProps {
  divergencia: Divergencia;
  /** Nested inside a parent section card */
  grouped?: boolean;
}

export function DivergenciaCard({ divergencia, grouped = false }: DivergenciaCardProps) {
  const isQuantidade = divergencia.tipo === 'quantidade';

  return (
    <article
      className={cn(
        'flex items-center gap-3 rounded-lg p-3',
        grouped
          ? 'bg-surface-container-low'
          : 'border border-outline-variant bg-surface shadow-sm',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          isQuantidade ? 'bg-destructive/10' : 'bg-destructive/10',
        )}
      >
        {isQuantidade ? (
          <Package className="h-5 w-5 text-destructive" aria-hidden />
        ) : (
          <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-label-md font-bold text-primary">{divergencia.sku}</p>
        <p className="line-clamp-2 text-body-sm text-on-surface-variant">{divergencia.nome}</p>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
          {divergencia.localizacao}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="font-mono text-label-md font-semibold text-destructive">
          {divergencia.valor}
        </span>
        <span
          className={cn(
            'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
            isQuantidade
              ? 'bg-destructive/10 text-destructive'
              : 'bg-destructive/10 text-destructive',
          )}
        >
          {isQuantidade ? 'Quantidade' : 'Avaria'}
        </span>
      </div>
    </article>
  );
}

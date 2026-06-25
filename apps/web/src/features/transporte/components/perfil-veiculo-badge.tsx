'use client';

import { cn } from '@lilog/ui';

import type { TipoVeiculo } from '@/features/transporte/types/transporte.schema';
import { TIPO_VEICULO_LABELS } from '@/features/transporte/types/transporte.schema';

type PerfilVeiculoBadgeProps = {
  tipo: TipoVeiculo;
  label?: string;
  divergente?: boolean;
  variante?: 'esperado' | 'alocado';
  className?: string;
};

export function PerfilVeiculoBadge({
  tipo,
  label,
  divergente = false,
  variante = 'alocado',
  className,
}: PerfilVeiculoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold',
        divergente
          ? 'bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25'
          : variante === 'esperado'
            ? 'bg-surface-highest text-muted-foreground ring-1 ring-inset ring-outline-variant/60'
            : 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20',
        className,
      )}
      title={divergente ? 'Perfil alocado diferente do esperado' : undefined}
    >
      {label ?? TIPO_VEICULO_LABELS[tipo]}
    </span>
  );
}

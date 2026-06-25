'use client';

import { cn } from '@lilog/ui';
import { Check } from 'lucide-react';

import type { OpcaoTipoSeparacao } from '@/features/transporte/types/impressao-mapa-separacao.schema';

type SeparationTypeCardProps = {
  opcao: OpcaoTipoSeparacao;
  selecionado: boolean;
  onSelect: () => void;
};

export function SeparationTypeCard({
  opcao,
  selecionado,
  onSelect,
}: SeparationTypeCardProps) {
  const Icon = opcao.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative rounded-xl border p-4 text-left transition-colors',
        selecionado
          ? 'border-primary/40 bg-primary/10 shadow-[0_0_0_1px_rgba(var(--primary),0.2)]'
          : 'border-outline-variant bg-surface-low/40 hover:border-primary/20 hover:bg-surface-low',
      )}
    >
      <span
        className={cn(
          'absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary-container transition-all',
          selecionado ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
        )}
        aria-hidden
      >
        <Check className="size-3 text-on-primary-container" />
      </span>

      <span
        className={cn(
          'mb-3 flex size-10 items-center justify-center rounded-lg transition-colors',
          selecionado
            ? 'bg-primary-container text-on-primary-container'
            : 'bg-surface-high text-primary',
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>

      <h3 className="text-sm font-bold text-foreground">{opcao.label}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {opcao.descricao}
      </p>
    </button>
  );
}

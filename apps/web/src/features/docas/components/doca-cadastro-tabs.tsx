'use client';

import { cn } from '@lilog/ui';
import { Copy, PenLine } from 'lucide-react';

import {
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/components/ui/panel-styles';

export type DocaCadastroModo = 'individual' | 'massa';

const MODOS: {
  id: DocaCadastroModo;
  label: string;
  icon: typeof PenLine;
}[] = [
  { id: 'individual', label: 'Individual', icon: PenLine },
  { id: 'massa', label: 'Em massa', icon: Copy },
];

type DocaCadastroTabsProps = {
  modoAtivo: DocaCadastroModo;
  onChange: (modo: DocaCadastroModo) => void;
  className?: string;
};

export function DocaCadastroTabs({
  modoAtivo,
  onChange,
  className,
}: DocaCadastroTabsProps) {
  return (
    <div
      className={cn(segmentGroupClassName, className)}
      role="tablist"
      aria-label="Modo de cadastro"
    >
      {MODOS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={modoAtivo === id}
          onClick={() => onChange(id)}
          className={cn(
            segmentButtonClassName(modoAtivo === id),
            'inline-flex items-center gap-1.5',
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

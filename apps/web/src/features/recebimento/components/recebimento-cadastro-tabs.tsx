'use client';

import { cn } from '@lilog/ui';
import { FileSpreadsheet, PenLine } from 'lucide-react';

import {
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/components/ui/panel-styles';

export type RecebimentoCadastroAba = 'upload' | 'manual';

const ABAS: {
  id: RecebimentoCadastroAba;
  label: string;
  icon: typeof FileSpreadsheet;
}[] = [
  { id: 'upload', label: 'Importação', icon: FileSpreadsheet },
  { id: 'manual', label: 'Manual', icon: PenLine },
];

type RecebimentoCadastroTabsProps = {
  abaAtiva: RecebimentoCadastroAba;
  onChange: (aba: RecebimentoCadastroAba) => void;
  className?: string;
};

export function RecebimentoCadastroTabs({
  abaAtiva,
  onChange,
  className,
}: RecebimentoCadastroTabsProps) {
  return (
    <div
      className={cn(segmentGroupClassName, className)}
      role="tablist"
      aria-label="Forma de cadastro"
    >
      {ABAS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={abaAtiva === id}
          onClick={() => onChange(id)}
          className={cn(segmentButtonClassName(abaAtiva === id), 'inline-flex items-center gap-1.5')}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

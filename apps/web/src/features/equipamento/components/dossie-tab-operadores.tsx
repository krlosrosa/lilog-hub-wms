'use client';

import { cn } from '@lilog/ui';
import { User } from 'lucide-react';

import type { EquipamentoDossie } from '@/features/equipamento/types/equipamento.schema';

const STATUS_CLASSES = {
  ativo: 'bg-primary/15 text-primary border-primary/30',
  vencendo: 'bg-tertiary-container/30 text-on-tertiary-container border-tertiary/30',
  bloqueado: 'bg-destructive/15 text-destructive border-destructive/30',
} as const;

type DossieTabOperadoresProps = {
  equipamento: EquipamentoDossie;
};

export function DossieTabOperadores({ equipamento }: DossieTabOperadoresProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {equipamento.operadores.map((op) => (
        <div
          key={op.id}
          className="rounded-lg border border-outline-variant bg-glass-bg p-6 backdrop-blur-glass"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <User className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-title-md font-medium text-foreground">
                {op.nome}
              </p>
              <p className="text-caption text-muted-foreground">{op.cnh}</p>
              <p className="mt-2 font-mono text-caption text-muted-foreground">
                NR-11: {op.nr11Validade}
              </p>
              <span
                className={cn(
                  'mt-3 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                  STATUS_CLASSES[op.status],
                )}
              >
                {op.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

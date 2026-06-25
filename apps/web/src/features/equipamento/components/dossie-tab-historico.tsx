'use client';

import { cn } from '@lilog/ui';
import { Wrench } from 'lucide-react';

import type { EquipamentoDossie } from '@/features/equipamento/types/equipamento.schema';

type DossieTabHistoricoProps = {
  equipamento: EquipamentoDossie;
};

export function DossieTabHistorico({ equipamento }: DossieTabHistoricoProps) {
  return (
    <div className="space-y-4">
      {equipamento.manutencoes.map((item) => (
        <div
          key={item.id}
          className="flex gap-4 rounded-lg border border-outline-variant bg-glass-bg p-6 backdrop-blur-glass"
        >
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              item.tipo === 'preventiva'
                ? 'bg-primary/15 text-primary'
                : 'bg-destructive/15 text-destructive',
            )}
          >
            <Wrench className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-caption text-muted-foreground">
                  {item.data} — {item.horimetro.toLocaleString('pt-BR')} h
                </p>
                <p className="text-title-md font-medium text-foreground">
                  {item.descricao}
                </p>
              </div>
              <span className="font-mono text-label-sm font-semibold text-primary">
                {item.custo}
              </span>
            </div>
            <span
              className={cn(
                'mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                item.tipo === 'preventiva'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-destructive/15 text-destructive',
              )}
            >
              {item.tipo}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

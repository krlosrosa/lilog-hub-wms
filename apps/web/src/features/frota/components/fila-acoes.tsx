'use client';

import { Button } from '@lilog/ui';
import { ChevronRight, FileText, Wrench } from 'lucide-react';

import type { FilaAcao } from '@/features/frota/types/frota.schema';

type FilaAcoesProps = {
  acoes: FilaAcao[];
  onAcaoClick?: (id: string) => void;
  onVerTudo?: () => void;
};

const ICON_MAP = {
  description: FileText,
  build: Wrench,
} as const;

export function FilaAcoes({ acoes, onAcaoClick, onVerTudo }: FilaAcoesProps) {
  return (
    <div className="rounded-xl border border-outline-variant bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-title-md font-medium text-foreground">
          Fila de ações
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-primary"
          onClick={onVerTudo}
        >
          Ver tudo
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="divide-y divide-outline-variant">
        {acoes.map((acao) => {
          const Icon = ICON_MAP[acao.icon];
          return (
            <div
              key={acao.id}
              className="flex items-center justify-between py-3 group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container-high text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-label-sm font-bold text-foreground">
                    {acao.titulo}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {acao.subtitulo}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hover:bg-primary hover:text-primary-foreground"
                onClick={() => onAcaoClick?.(acao.id)}
                aria-label={`Abrir ${acao.titulo}`}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

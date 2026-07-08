'use client';

import { ClipboardCheck } from 'lucide-react';

import { cn } from '@lilog/ui';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { DevolucaoChecklistSection } from '@/features/devolucao/components/devolucao-checklist-section';
import { useDebitoChecklistDevolucao } from '@/features/debito-transportadora/hooks/use-debito-checklist-devolucao';

type DetalheChecklistDevolucaoProps = {
  demandaId: string;
};

function ChecklistSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-lg border border-outline-variant/70 bg-glass-bg shadow-sm backdrop-blur-glass"
      aria-busy="true"
      aria-label="Carregando checklist da devolução"
    >
      <div className="flex items-center gap-2 border-b border-outline-variant/50 bg-muted/10 px-2.5 py-2">
        <ClipboardCheck
          className="size-3.5 shrink-0 text-primary"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-32 animate-pulse rounded bg-muted/70" />
        </div>
      </div>
      <div className="space-y-2.5 p-2.5">
        <div className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded border border-outline-variant/40 bg-muted/20"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-5 w-14 animate-pulse rounded bg-muted/30"
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'aspect-[4/3] animate-pulse rounded border border-outline-variant/40 bg-muted/20',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DetalheChecklistDevolucao({
  demandaId,
}: DetalheChecklistDevolucaoProps) {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const { checklist, fotos, fotoTotalInformado, isLoading } =
    useDebitoChecklistDevolucao(demandaId, unidadeId);

  if (isLoading) {
    return <ChecklistSkeleton />;
  }

  return (
    <DevolucaoChecklistSection
      checklist={checklist}
      fotos={fotos}
      fotoTotalInformado={fotoTotalInformado}
      compact
    />
  );
}

import { cn } from '@lilog/ui';
import { Check, History } from 'lucide-react';

import { DetalheSection } from '@/features/debito-transportadora/components/detalhe-section';
import type { DebitoTimelineEvento } from '@/features/debito-transportadora/types/debito.schema';

type DetalheTimelineProps = {
  eventos: DebitoTimelineEvento[];
};

export function DetalheTimeline({ eventos }: DetalheTimelineProps) {
  return (
    <DetalheSection
      id="titulo-timeline"
      title="Linha do Tempo"
      icon={History}
      badge={
        eventos.length > 0 ? (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {eventos.length}
          </span>
        ) : undefined
      }
    >
      <div className="relative space-y-4 before:absolute before:bottom-1 before:left-[9px] before:top-1 before:w-px before:bg-outline-variant">
        {eventos.map((evento) => (
          <div key={evento.id} className="relative pl-7">
            <div
              className={cn(
                'absolute left-0 top-0.5 flex size-[18px] items-center justify-center rounded-full',
                evento.tipo === 'concluido' &&
                  'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.35)]',
                evento.tipo === 'ativo' &&
                  'border-2 border-primary bg-surface-highest',
                evento.tipo === 'pendente' &&
                  'border border-outline-variant bg-surface-highest',
              )}
            >
              {evento.tipo === 'concluido' ? (
                <Check className="size-2.5 text-primary-foreground" aria-hidden />
              ) : evento.tipo === 'ativo' ? (
                <div className="size-1.5 rounded-full bg-primary" aria-hidden />
              ) : (
                <div
                  className="size-1 rounded-full bg-muted-foreground"
                  aria-hidden
                />
              )}
            </div>

            <div>
              <p
                className={cn(
                  'text-xs font-semibold leading-tight',
                  evento.tipo === 'pendente'
                    ? 'text-muted-foreground'
                    : 'text-foreground',
                )}
              >
                {evento.titulo}
              </p>
              <p className="text-[10px] text-muted-foreground">{evento.subtitulo}</p>
              {evento.descricao ? (
                <p className="mt-1 whitespace-pre-line rounded-md bg-surface-low px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  {evento.descricao}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </DetalheSection>
  );
}

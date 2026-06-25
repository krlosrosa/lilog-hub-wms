import { cn } from '@lilog/ui';
import { Check, History } from 'lucide-react';

import type { DebitoTimelineEvento } from '@/features/debito-transportadora/types/debito.schema';

type DetalheTimelineProps = {
  eventos: DebitoTimelineEvento[];
};

export function DetalheTimeline({ eventos }: DetalheTimelineProps) {
  return (
    <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
      <h3 className="mb-8 flex items-center gap-2 text-headline-md font-medium text-foreground">
        <History className="size-5 text-primary" aria-hidden />
        Linha do Tempo
      </h3>

      <div className="relative space-y-8 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-0.5 before:bg-surface-highest">
        {eventos.map((evento) => (
          <div key={evento.id} className="relative pl-10">
            <div
              className={cn(
                'absolute left-0 top-1 flex size-6 items-center justify-center rounded-full',
                evento.tipo === 'concluido' &&
                  'bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]',
                evento.tipo === 'ativo' &&
                  'border-2 border-primary bg-surface-highest',
                evento.tipo === 'pendente' &&
                  'border border-outline-variant bg-surface-highest',
              )}
            >
              {evento.tipo === 'concluido' ? (
                <Check className="size-3.5 text-primary-foreground" aria-hidden />
              ) : evento.tipo === 'ativo' ? (
                <div className="size-2 rounded-full bg-primary" aria-hidden />
              ) : (
                <div
                  className="size-1.5 rounded-full bg-muted-foreground"
                  aria-hidden
                />
              )}
            </div>

            <div>
              <p
                className={cn(
                  'text-sm font-bold',
                  evento.tipo === 'pendente'
                    ? 'text-muted-foreground'
                    : 'text-foreground',
                )}
              >
                {evento.titulo}
              </p>
              <p className="text-xs text-muted-foreground">{evento.subtitulo}</p>
              {evento.descricao ? (
                <p className="mt-2 rounded bg-surface-low p-2 text-xs leading-relaxed text-muted-foreground">
                  {evento.descricao}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

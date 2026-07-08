'use client';

import { Button, cn } from '@lilog/ui';
import { Loader2, Paperclip, StickyNote } from 'lucide-react';

import { DetalheSection } from '@/features/debito-transportadora/components/detalhe-section';

type DetalheAnaliseProps = {
  notasAnalista: string;
  salvandoNota: boolean;
  onNotasChange: (value: string) => void;
  onSalvarNota: () => void;
};

export function DetalheAnalise({
  notasAnalista,
  salvandoNota,
  onNotasChange,
  onSalvarNota,
}: DetalheAnaliseProps) {
  return (
    <DetalheSection id="titulo-analise" title="Notas do Analista" icon={StickyNote}>
      <div className="relative">
        <textarea
          value={notasAnalista}
          onChange={(event) => onNotasChange(event.target.value)}
          placeholder="Observações internas sobre o andamento da análise..."
          className={cn(
            'h-24 w-full resize-none rounded-md border border-input bg-surface p-2.5 text-sm',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Anexar arquivo"
          >
            <Paperclip className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 text-[11px]"
            disabled={salvandoNota}
            onClick={onSalvarNota}
          >
            {salvandoNota ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </div>
    </DetalheSection>
  );
}

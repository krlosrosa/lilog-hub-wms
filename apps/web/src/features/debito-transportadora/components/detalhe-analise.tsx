'use client';

import { Button, cn } from '@lilog/ui';
import { Brain, Lightbulb, Loader2, Paperclip, StickyNote } from 'lucide-react';

import { REASON_CODES } from '@/features/debito-transportadora/types/debito.schema';

type DetalheAnaliseProps = {
  reasonCode: string;
  notasAnalista: string;
  salvandoNota: boolean;
  onReasonCodeChange: (value: string) => void;
  onNotasChange: (value: string) => void;
  onSalvarNota: () => void;
};

export function DetalheAnalise({
  reasonCode,
  notasAnalista,
  salvandoNota,
  onReasonCodeChange,
  onNotasChange,
  onSalvarNota,
}: DetalheAnaliseProps) {
  return (
    <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <h3 className="mb-6 flex items-center gap-2 text-headline-md font-medium text-foreground">
            <Brain className="size-5 text-primary" aria-hidden />
            Análise de Causa Raiz
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="reason-code"
                className="mb-2 block text-caption uppercase tracking-widest text-muted-foreground"
              >
                Código de Motivo (Reason Code)
              </label>
              <select
                id="reason-code"
                value={reasonCode}
                onChange={(event) => onReasonCodeChange(event.target.value)}
                className={cn(
                  'w-full rounded-lg border border-input bg-surface p-3 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                )}
              >
                {REASON_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-tertiary-container/20 bg-tertiary-container/5 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="size-5 shrink-0 text-tertiary" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-tertiary">
                    Insight Preditivo
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Este transportador apresentou aumento de 15% em ocorrências
                    similares nesta rota nos últimos 30 dias. Recomenda-se
                    revisão de contrato.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-6 flex items-center gap-2 text-headline-md font-medium text-foreground">
            <StickyNote className="size-5 text-primary" aria-hidden />
            Notas do Analista
          </h3>

          <div className="relative">
            <textarea
              value={notasAnalista}
              onChange={(event) => onNotasChange(event.target.value)}
              placeholder="Adicione observações internas sobre o andamento da análise..."
              className={cn(
                'h-32 w-full resize-none rounded-xl border border-input bg-surface p-4 text-sm',
                'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Anexar arquivo"
              >
                <Paperclip className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs font-bold"
                disabled={salvandoNota}
                onClick={onSalvarNota}
              >
                {salvandoNota ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Salvando…
                  </>
                ) : (
                  'SALVAR NOTA'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

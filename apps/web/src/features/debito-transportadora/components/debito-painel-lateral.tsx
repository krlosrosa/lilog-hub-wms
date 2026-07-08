import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import { FileText, Loader2 } from 'lucide-react';

type DebitoPainelLateralProps = {
  conciliando: boolean;
  onForcarConciliacao: () => void;
};

const HEATMAP_INTENSITIES = [
  'bg-surface-highest',
  'bg-tertiary/20',
  'bg-tertiary/40',
  'bg-tertiary/10',
  'bg-surface-highest',
  'bg-destructive/30',
  'bg-tertiary/20',
  'bg-tertiary/10',
  'bg-surface-highest',
  'bg-tertiary/60',
  'bg-tertiary/40',
  'bg-tertiary/10',
  'bg-destructive/50',
  'bg-tertiary/20',
] as const;

export function DebitoPainelLateral({
  conciliando,
  onForcarConciliacao,
}: DebitoPainelLateralProps) {
  return (
    <div className="space-y-6">
      <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <h4 className="mb-4 text-label-md font-semibold text-foreground">
          Integração TMS/Freight
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground">
              Status do Sistema
            </span>
            <span className="flex items-center gap-1 text-caption font-bold text-tertiary">
              <span
                className="size-2 rounded-full bg-tertiary shadow-[0_0_15px_hsl(var(--tertiary)/0.15)]"
                aria-hidden
              />
              ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground">
              Última Sincronização
            </span>
            <span className="font-mono text-caption text-foreground">
              14:22:10
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-highest">
            <div className="h-full w-full bg-tertiary opacity-50" />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full text-caption font-bold"
            disabled={conciliando}
            onClick={onForcarConciliacao}
          >
            {conciliando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Conciliando…
              </>
            ) : (
              'Forçar Conciliação'
            )}
          </Button>
        </div>
      </article>

      <article className="rounded-xl border border-outline-variant/50 bg-gradient-to-br from-surface-high to-card p-6 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-4 w-fit rounded-xl bg-primary/10 p-3 text-primary">
          <FileText className="size-5" aria-hidden />
        </div>
        <h4 className="mb-2 text-label-md font-semibold text-foreground">
          Documentos de Cobrança
        </h4>
        <p className="mb-4 text-caption text-muted-foreground">
          Acompanhe e gerencie os lotes de cobrança gerados a partir das
          ocorrências aprovadas.
        </p>
        <Button type="button" variant="outline" className="w-full gap-2" asChild>
          <Link href="/debito-transportadora/cobrancas">
            <FileText className="size-4" aria-hidden />
            Ver documentos de cobrança
          </Link>
        </Button>
      </article>

      <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <h4 className="mb-4 text-label-md font-semibold text-foreground">
          Frequência de Sinistros
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {HEATMAP_INTENSITIES.map((intensity, index) => (
            <div
              key={`heatmap-${index}`}
              className={cn('aspect-square w-full rounded-sm', intensity)}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>Seg</span>
          <span>Dom</span>
        </div>
      </article>
    </div>
  );
}

import { AlertTriangle, Loader2, UserPlus } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';

type IdleOperatorCardProps = {
  operators: Operator[];
  isLoading: boolean;
  onAssignTask: (operatorId: string) => void;
};

export function IdleOperatorCard({
  operators,
  isLoading,
  onAssignTask,
}: IdleOperatorCardProps) {
  return (
    <section className={cn(glassPanelClassName, 'flex flex-col overflow-hidden')}>
      <div className="flex items-center gap-2 border-b border-outline-variant/60 px-3 py-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive/70" aria-hidden />
        <h2 className="text-caption font-medium text-foreground">Ociosos</h2>
        <span className="ml-auto rounded-full bg-destructive/10 px-1.5 py-px text-[10px] font-medium tabular-nums text-destructive/80">
          {operators.length}
        </span>
      </div>

      <div className="divide-y divide-outline-variant/40">
        {operators.length === 0 ? (
          <p className="px-3 py-4 text-center text-caption text-muted-foreground">
            Nenhum operador ocioso.
          </p>
        ) : (
          operators.map((operator) => (
            <article
              key={operator.id}
              className="group px-3 py-2 transition-colors hover:bg-surface-high/30"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-caption font-medium text-foreground">
                    {operator.name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {operator.sector}
                  </p>
                </div>

                <span className="shrink-0 rounded-md bg-surface-high px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-destructive/80">
                  {operator.idleDuration?.replace(' OCIOSO', '')}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 gap-1 px-2 text-[10px] text-muted-foreground opacity-70 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                  disabled={isLoading}
                  onClick={() => onAssignTask(operator.id)}
                  aria-label={`Atribuir missão a ${operator.name}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" aria-hidden />
                  )}
                  <span className="hidden sm:inline">Atribuir</span>
                </Button>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-surface-high">
                  <div
                    className="h-full rounded-full bg-destructive/60 transition-all"
                    style={{ width: `${operator.idleThreshold ?? 0}%` }}
                  />
                </div>
                <span className="w-6 text-right text-[10px] tabular-nums text-muted-foreground">
                  {operator.idleThreshold}%
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

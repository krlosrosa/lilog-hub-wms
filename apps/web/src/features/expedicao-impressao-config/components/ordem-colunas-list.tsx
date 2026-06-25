'use client';

import { cn } from '@lilog/ui';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { sectionLabelClassName } from '@/features/expedicao-impressao-config/components/panel-styles';

type OrdemColunasListProps<T extends string> = {
  ordem: T[];
  allItems: readonly T[];
  labels: Record<T, string>;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggle: (item: T) => void;
  disabled?: boolean;
};

export function OrdemColunasList<T extends string>({
  ordem,
  allItems,
  labels,
  onMoveUp,
  onMoveDown,
  onToggle,
  disabled = false,
}: OrdemColunasListProps<T>) {
  const inactiveItems = allItems.filter((item) => !ordem.includes(item));

  return (
    <div className="space-y-2.5">
      <p className={sectionLabelClassName}>Campos visíveis na impressão</p>
      <div className="space-y-1">
        {ordem.length === 0 ? (
          <p className="rounded-md border border-dashed border-outline-variant/60 px-2 py-3 text-center text-[10px] text-muted-foreground">
            Selecione ao menos um campo abaixo.
          </p>
        ) : (
          ordem.map((item, index) => (
            <div
              key={item}
              className={cn(
                'flex items-center gap-2 rounded-md border border-outline-variant/60 bg-surface-low/30 px-2 py-1.5',
                disabled && 'opacity-50',
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary-container text-[10px] font-bold text-on-primary-container">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                {labels[item]}
              </span>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  onClick={() => onMoveUp(index)}
                  disabled={disabled || index === 0}
                  aria-label={`Mover ${labels[item]} para cima`}
                  className={cn(
                    'flex size-6 items-center justify-center rounded border border-outline-variant transition-colors',
                    disabled || index === 0
                      ? 'cursor-not-allowed opacity-30'
                      : 'hover:border-primary hover:bg-primary/5',
                  )}
                >
                  <ArrowUp className="size-3" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(index)}
                  disabled={disabled || index === ordem.length - 1}
                  aria-label={`Mover ${labels[item]} para baixo`}
                  className={cn(
                    'flex size-6 items-center justify-center rounded border border-outline-variant transition-colors',
                    disabled || index === ordem.length - 1
                      ? 'cursor-not-allowed opacity-30'
                      : 'hover:border-primary hover:bg-primary/5',
                  )}
                >
                  <ArrowDown className="size-3" aria-hidden />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div>
        <p className={cn(sectionLabelClassName, 'mb-1.5')}>Exibir / ocultar campos</p>
        <div className="flex flex-wrap gap-1">
          {allItems.map((item) => {
            const isActive = ordem.includes(item);

            return (
              <button
                key={item}
                type="button"
                onClick={() => onToggle(item)}
                disabled={disabled}
                aria-pressed={isActive}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
                  disabled && 'cursor-not-allowed opacity-50',
                  isActive
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-outline-variant/60 text-muted-foreground hover:border-primary/30',
                )}
              >
                {labels[item]}
              </button>
            );
          })}
        </div>
        {inactiveItems.length > 0 && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Ocultos: {inactiveItems.map((item) => labels[item]).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

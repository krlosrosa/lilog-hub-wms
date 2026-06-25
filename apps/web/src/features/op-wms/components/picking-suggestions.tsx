'use client';

import { cn } from '@lilog/ui';

type PickingSuggestionsProps = {
  suggestions: readonly string[];
  selected: string;
  onSelect: (address: string) => void;
  compact?: boolean;
};

export function PickingSuggestions({
  suggestions,
  selected,
  onSelect,
  compact = false,
}: PickingSuggestionsProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', compact ? 'pt-0.5' : 'gap-2 pt-1')}>
      <span className="mb-0.5 w-full text-[10px] font-bold uppercase text-muted-foreground">
        {compact ? 'Sugestões:' : 'Sugestões de Picking:'}
      </span>
      {suggestions.map((address) => (
        <button
          key={address}
          type="button"
          onClick={() => onSelect(address)}
          className={cn(
            'rounded border border-outline-variant bg-surface-variant font-mono transition-all hover:border-primary hover:text-primary',
            compact
              ? 'px-2 py-0.5 text-[10px]'
              : 'px-3 py-1.5 text-caption',
            selected === address && 'border-primary text-primary',
          )}
        >
          {address}
        </button>
      ))}
    </div>
  );
}

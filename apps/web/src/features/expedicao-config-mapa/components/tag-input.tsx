'use client';

import { useState, type KeyboardEvent } from 'react';

import { cn } from '@lilog/ui';
import { X } from 'lucide-react';

import { fieldInputClassName } from '@/features/expedicao-config-mapa/components/panel-styles';

type TagInputProps = {
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  id?: string;
};

export function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder = 'Digite e pressione Enter...',
  suggestions = [],
  id,
}: TagInputProps) {
  const [input, setInput] = useState('');

  const filteredSuggestions = suggestions.filter(
    (item) =>
      !tags.includes(item) &&
      item.toLowerCase().includes(input.trim().toLowerCase()),
  );

  const commitTag = (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value || tags.includes(value)) return;
    onAdd(value);
    setInput('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitTag(input);
    }

    if (event.key === 'Backspace' && !input && tags.length > 0) {
      onRemove(tags[tags.length - 1]!);
    }
  };

  return (
    <div className="space-y-1.5">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-primary/20',
                'bg-primary/10 py-0.5 pl-2 pr-1 text-[10px] font-medium text-primary',
              )}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="rounded-full p-0.5 hover:bg-primary/20"
                aria-label={`Remover ${tag}`}
              >
                <X className="size-2.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        id={id}
        type="text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) commitTag(input);
        }}
        placeholder={placeholder}
        className={fieldInputClassName}
      />

      {input.trim() && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filteredSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commitTag(suggestion)}
              className={cn(
                'rounded border border-outline-variant px-1.5 py-0.5',
                'text-[10px] text-muted-foreground transition-colors',
                'hover:border-primary hover:text-primary',
              )}
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

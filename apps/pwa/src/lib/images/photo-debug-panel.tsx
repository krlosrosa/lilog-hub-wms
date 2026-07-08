import { cn } from '@lilog/ui';
import { ChevronDown, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { hapticLight } from '@/lib/haptics';

import {
  clearPhotoDebugEntries,
  usePhotoDebugEntries,
} from './photo-debug-store';

export function PhotoDebugPanel({ className }: { className?: string }) {
  const entries = usePhotoDebugEntries();
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  if (entries.length === 0) {
    return null;
  }

  const latest = entries[0];
  const allText = entries
    .map(
      (entry) =>
        `[${entry.at}] ${entry.event}\n${entry.summary}\n${entry.detail}`,
    )
    .join('\n\n---\n\n');

  const handleCopy = async () => {
    hapticLight();
    try {
      await navigator.clipboard.writeText(allText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      className={cn(
        'rounded-lg border border-warning/40 bg-warning-container/30 p-3',
        className,
      )}
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-label-md font-semibold text-on-warning-container">
            Diagnóstico de foto
          </p>
          <p className="mt-1 break-words text-body-sm text-on-warning-container">
            {latest?.summary}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            hapticLight();
            setExpanded((value) => !value);
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/80 text-on-surface-variant touch-manipulation"
          aria-label={expanded ? 'Recolher diagnóstico' : 'Expandir diagnóstico'}
        >
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
          />
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-outline-variant/60 bg-surface/90 p-2.5"
            >
              <p className="font-mono text-label-sm font-semibold text-on-surface">
                {entry.event}
              </p>
              <p className="mt-1 break-words text-label-sm text-on-surface-variant">
                {entry.summary}
              </p>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-snug text-on-surface-variant">
                {entry.detail}
              </pre>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-label-sm font-medium text-on-surface touch-manipulation active:scale-[0.98]"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copiado!' : 'Copiar diagnóstico'}
            </button>
            <button
              type="button"
              onClick={() => {
                hapticLight();
                clearPhotoDebugEntries();
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-label-sm text-on-surface-variant touch-manipulation"
              aria-label="Limpar diagnóstico"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

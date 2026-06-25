'use client';

import { useState } from 'react';

import { Dialog, DialogContent } from '@lilog/ui';

type FotoExpandivelProps = {
  id: string;
  url: string;
  legenda: string;
  className?: string;
  showLegenda?: boolean;
};

export function FotoExpandivel({
  id,
  url,
  legenda,
  className,
  showLegenda = false,
}: FotoExpandivelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={`Expandir foto: ${legenda}`}
        onClick={() => setOpen(true)}
        className={
          className ??
          'group relative size-16 overflow-hidden rounded-md border border-outline-variant/60 bg-muted/25 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs presignadas do R2 */}
        <img
          src={url}
          alt={legenda}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {showLegenda ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent px-1.5 py-1">
            <p className="truncate text-[8px] font-medium leading-none text-background">
              {legenda}
            </p>
          </div>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[92vh] max-w-[min(92vw,48rem)] gap-0 overflow-hidden border-outline-variant/60 bg-card p-2 sm:p-3"
          aria-describedby={legenda ? `foto-legenda-${id}` : undefined}
        >
          <div className="flex min-h-0 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- URLs presignadas do R2 */}
            <img
              src={url}
              alt={legenda}
              className="max-h-[calc(92vh-4rem)] w-full rounded-md object-contain"
            />
            {legenda ? (
              <p
                id={`foto-legenda-${id}`}
                className="w-full truncate px-1 text-center text-xs text-muted-foreground"
              >
                {legenda}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

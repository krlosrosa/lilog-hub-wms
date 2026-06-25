'use client';

import { Barcode, Loader2 } from 'lucide-react';

import { Button } from '@lilog/ui';

type CorteBipInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBuscar: () => void;
  buscando: boolean;
};

export function CorteBipInput({
  value,
  onChange,
  onBuscar,
  buscando,
}: CorteBipInputProps) {
  return (
    <div className="rounded-xl border border-outline-variant/50 bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass">
      <label
        htmlFor="corte-bip-codigo"
        className="text-xs font-semibold text-foreground"
      >
        Código do mapa-grupo (bipagem)
      </label>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Bipe o código impresso no mapa de separação ou digite o micro UUID.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Barcode
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="corte-bip-codigo"
            type="text"
            autoComplete="off"
            autoFocus
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onBuscar();
              }
            }}
            placeholder="Bipe ou digite o código…"
            className="h-10 w-full rounded-md border border-outline-variant/60 bg-surface-low py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button
          type="button"
          onClick={onBuscar}
          disabled={buscando || !value.trim()}
          className="h-10 shrink-0"
        >
          {buscando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Buscando…
            </>
          ) : (
            'Carregar lista'
          )}
        </Button>
      </div>
    </div>
  );
}

import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { useUnidade } from '../lib/unidade-context';
import type { UnidadeOption } from '../types';

function UnidadeOptionButton({
  unidade,
  active,
  onSelect,
}: {
  unidade: UnidadeOption;
  active: boolean;
  onSelect: (unidade: UnidadeOption) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        hapticMedium();
        onSelect(unidade);
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors touch-manipulation active:scale-[0.99]',
        active
          ? 'border-secondary bg-secondary-container/40'
          : 'border-outline-variant bg-surface',
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container">
        <Building2 className="h-4 w-4 text-secondary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-label-md font-semibold text-on-surface">
          {unidade.nome}
        </p>
        <p className="truncate text-body-sm text-on-surface-variant">
          {unidade.nomeFilial}
        </p>
      </div>
      {active ? (
        <Check className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
      ) : null}
    </button>
  );
}

export function UnidadeSelector({ compact = false }: { compact?: boolean }) {
  const {
    unidades,
    unidadeSelecionada,
    isLoading,
    error,
    setUnidadeSelecionada,
  } = useUnidade();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Unidade...
      </span>
    );
  }

  if (error && !unidadeSelecionada) {
    return (
      <span className="truncate text-label-sm text-destructive">
        Sem unidade vinculada
      </span>
    );
  }

  if (!unidadeSelecionada) {
    return (
      <span className="truncate text-label-sm text-on-surface-variant">
        Unidade não vinculada
      </span>
    );
  }

  const canSwitch = unidades.length > 1;
  const label = compact
    ? unidadeSelecionada.nome
    : `${unidadeSelecionada.nome} · ${unidadeSelecionada.id}`;

  if (!canSwitch) {
    return (
      <span className="truncate font-mono text-label-sm text-on-surface-variant">
        {label}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          hapticLight();
          setOpen(true);
        }}
        className="inline-flex max-w-full items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 font-mono text-label-sm text-on-surface-variant touch-manipulation active:scale-95"
        aria-label="Trocar unidade"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
        >
          <div
            className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant"
            aria-hidden
          />

          <SheetHeader className="text-left">
            <SheetTitle className="text-headline-md text-on-surface">
              Trocar unidade
            </SheetTitle>
            <SheetDescription className="text-body-sm text-on-surface-variant">
              Escolha a unidade para operar o turno.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {unidades.map((unidade) => (
              <UnidadeOptionButton
                key={unidade.id}
                unidade={unidade}
                active={unidade.id === unidadeSelecionada.id}
                onSelect={(next) => {
                  setUnidadeSelecionada(next);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

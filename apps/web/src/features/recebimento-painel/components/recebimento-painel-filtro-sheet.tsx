'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Filter } from 'lucide-react';

import {
  criarIntervaloPadraoHoje,
  intervaloValido,
  normalizarIntervaloData,
  type IntervaloDataPainel,
} from '@/features/recebimento-painel/lib/intervalo-data';

export type RecebimentoPainelFiltroSheetState = IntervaloDataPainel;

export const DEFAULT_RECEBIMENTO_PAINEL_FILTRO: RecebimentoPainelFiltroSheetState =
  criarIntervaloPadraoHoje();

const fieldInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-low px-4 py-3 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const fieldLabelClassName =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground';

type RecebimentoPainelFiltroSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: RecebimentoPainelFiltroSheetState;
  onAplicar: (filtros: RecebimentoPainelFiltroSheetState) => void;
};

export function RecebimentoPainelFiltroSheet({
  open,
  onOpenChange,
  filtros,
  onAplicar,
}: RecebimentoPainelFiltroSheetProps) {
  const [local, setLocal] = useState(filtros);
  const valido = intervaloValido(local);

  useEffect(() => {
    if (open) {
      setLocal(filtros);
    }
  }, [open, filtros]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="size-4" aria-hidden />
            Filtros do painel
          </SheetTitle>
          <SheetDescription>
            O intervalo de datas é obrigatório. Por padrão, o painel exibe o dia
            atual.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
          <div>
            <label htmlFor="painel-data-inicio" className={fieldLabelClassName}>
              Data início *
            </label>
            <input
              id="painel-data-inicio"
              type="date"
              required
              value={local.dataInicio}
              onChange={(event) =>
                setLocal((prev) => ({
                  ...prev,
                  dataInicio: event.target.value,
                }))
              }
              className={cn(fieldInputClassName, 'h-10 py-2 text-xs')}
            />
          </div>

          <div>
            <label htmlFor="painel-data-fim" className={fieldLabelClassName}>
              Data fim *
            </label>
            <input
              id="painel-data-fim"
              type="date"
              required
              value={local.dataFim}
              onChange={(event) =>
                setLocal((prev) => ({
                  ...prev,
                  dataFim: event.target.value,
                }))
              }
              className={cn(fieldInputClassName, 'h-10 py-2 text-xs')}
            />
          </div>

          {!valido ? (
            <p className="text-[11px] text-destructive">
              Informe data início e data fim para aplicar o filtro.
            </p>
          ) : null}
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocal(DEFAULT_RECEBIMENTO_PAINEL_FILTRO)}
          >
            Hoje
          </Button>
          <Button
            type="button"
            disabled={!valido}
            onClick={() => {
              onAplicar(normalizarIntervaloData(local));
              onOpenChange(false);
            }}
          >
            Aplicar filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

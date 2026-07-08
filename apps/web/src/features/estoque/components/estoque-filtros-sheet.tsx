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

import type { DepositoListaItem } from '@/features/depositos/types/depositos-gestao.schema';
import type {
  FiltroNaturezaSaldo,
  FiltroStatusSaldo,
} from '@/features/estoque/types/estoque-gestao.schema';
import {
  NATUREZA_SALDO_LABELS,
  STATUS_SALDO_LABELS,
} from '@/features/estoque/types/estoque-gestao.schema';

export type EstoqueFiltrosSheetState = {
  depositoId: string;
  statusFiltro: FiltroStatusSaldo;
  naturezaFiltro: FiltroNaturezaSaldo;
  loteFiltro: string;
  gruposFiltro: string[];
};

export const DEFAULT_ESTOQUE_FILTROS: EstoqueFiltrosSheetState = {
  depositoId: '',
  statusFiltro: 'todos',
  naturezaFiltro: 'todos',
  loteFiltro: '',
  gruposFiltro: [],
};

const fieldInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-low px-4 py-3 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const fieldLabelClassName =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground';

const FILTER_CHIP_CLASS =
  'rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors';

type EstoqueFiltrosSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: EstoqueFiltrosSheetState;
  onAplicar: (filtros: EstoqueFiltrosSheetState) => void;
  depositos: DepositoListaItem[];
  grupos: string[];
};

export function EstoqueFiltrosSheet({
  open,
  onOpenChange,
  filtros,
  onAplicar,
  depositos,
  grupos,
}: EstoqueFiltrosSheetProps) {
  const [local, setLocal] = useState(filtros);

  useEffect(() => {
    if (open) {
      setLocal(filtros);
    }
  }, [open, filtros]);

  const toggleGrupo = (grupo: string) => {
    setLocal((prev) => ({
      ...prev,
      gruposFiltro: prev.gruposFiltro.includes(grupo)
        ? prev.gruposFiltro.filter((item) => item !== grupo)
        : [...prev.gruposFiltro, grupo],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="size-4" aria-hidden />
            Filtros de estoque
          </SheetTitle>
          <SheetDescription>
            Refine a consulta por depósito, grupo do SKU, status, natureza e
            lote.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
          <div>
            <label htmlFor="filtro-deposito" className={fieldLabelClassName}>
              Depósito
            </label>
            <select
              id="filtro-deposito"
              value={local.depositoId}
              onChange={(event) =>
                setLocal((prev) => ({
                  ...prev,
                  depositoId: event.target.value,
                }))
              }
              className={cn(fieldInputClassName, 'h-10 py-2 text-xs')}
            >
              <option value="">Todos os depósitos</option>
              {depositos.map((deposito) => (
                <option key={deposito.id} value={deposito.id}>
                  {deposito.codigo} — {deposito.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className={fieldLabelClassName}>Grupo do SKU</p>
            {grupos.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Nenhum grupo com saldo nesta unidade.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {grupos.map((grupo) => (
                  <button
                    key={grupo}
                    type="button"
                    onClick={() => toggleGrupo(grupo)}
                    className={cn(
                      FILTER_CHIP_CLASS,
                      local.gruposFiltro.includes(grupo)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {grupo}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className={fieldLabelClassName}>Status do saldo</p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { value: 'todos', label: 'Todos' },
                  { value: 'liberado', label: STATUS_SALDO_LABELS.liberado },
                  { value: 'bloqueado', label: STATUS_SALDO_LABELS.bloqueado },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setLocal((prev) => ({
                      ...prev,
                      statusFiltro: option.value,
                    }))
                  }
                  className={cn(
                    FILTER_CHIP_CLASS,
                    local.statusFiltro === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={fieldLabelClassName}>Natureza</p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { value: 'todos', label: 'Todas' },
                  { value: 'fisico', label: NATUREZA_SALDO_LABELS.fisico },
                  { value: 'debito', label: NATUREZA_SALDO_LABELS.debito },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setLocal((prev) => ({
                      ...prev,
                      naturezaFiltro: option.value,
                    }))
                  }
                  className={cn(
                    FILTER_CHIP_CLASS,
                    local.naturezaFiltro === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="filtro-lote" className={fieldLabelClassName}>
              Lote
            </label>
            <input
              id="filtro-lote"
              type="search"
              value={local.loteFiltro}
              onChange={(event) =>
                setLocal((prev) => ({
                  ...prev,
                  loteFiltro: event.target.value,
                }))
              }
              placeholder="Filtrar por lote..."
              className={cn(fieldInputClassName, 'h-10 py-2 text-xs')}
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocal(DEFAULT_ESTOQUE_FILTROS)}
          >
            Limpar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onAplicar(local);
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

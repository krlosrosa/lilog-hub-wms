'use client';

import { useEffect, useState, type ReactNode } from 'react';

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
  FILTROS_STATUS_RECEBIMENTO,
  getDefaultRecebimentoFiltrosAvancados,
  getRecebimentoStatusLabel,
  normalizeRecebimentoFiltrosAvancados,
  type RecebimentoFiltrosAvancados,
} from '@/features/recebimento/types/recebimento-filtros';

type RecebimentoFiltrosAvancadosSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: RecebimentoFiltrosAvancados;
  onAplicar: (filtros: RecebimentoFiltrosAvancados) => void;
};

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-primary-container text-on-primary-container'
          : 'bg-surface-highest text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function RecebimentoFiltrosAvancadosSheet({
  open,
  onOpenChange,
  filtros,
  onAplicar,
}: RecebimentoFiltrosAvancadosSheetProps) {
  const [draft, setDraft] = useState<RecebimentoFiltrosAvancados>(filtros);

  useEffect(() => {
    if (open) {
      setDraft(filtros);
    }
  }, [open, filtros]);

  const limpar = () => {
    setDraft(getDefaultRecebimentoFiltrosAvancados());
  };

  const aplicar = () => {
    onAplicar(normalizeRecebimentoFiltrosAvancados(draft));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-outline-variant bg-card p-0 sm:max-w-sm"
      >
        <SheetHeader className="shrink-0 border-b border-outline-variant px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base text-foreground">
            <Filter className="size-4" aria-hidden />
            Filtros avançados
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Refine a listagem por status, transportadora e período previsto.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <FilterSection label="Status">
            <div className="flex flex-wrap gap-1.5">
              <OptionButton
                active={draft.situacao === 'todos'}
                onClick={() =>
                  setDraft((prev) => ({ ...prev, situacao: 'todos' }))
                }
              >
                Todos
              </OptionButton>
              {FILTROS_STATUS_RECEBIMENTO.map((status) => (
                <OptionButton
                  key={status}
                  active={draft.situacao === status}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, situacao: status }))
                  }
                >
                  {getRecebimentoStatusLabel(status)}
                </OptionButton>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Transportadora">
            <input
              type="search"
              value={draft.transportadora}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  transportadora: event.target.value,
                }))
              }
              placeholder="Nome da transportadora"
              className="h-9 w-full rounded-md border border-outline-variant bg-surface-low px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </FilterSection>

          <FilterSection label="Período previsto">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[10px] text-muted-foreground">De</span>
                <input
                  type="date"
                  required
                  value={draft.dataInicio}
                  onChange={(event) => {
                    const dataInicio = event.target.value;
                    if (!dataInicio) return;

                    setDraft((prev) => ({
                      ...prev,
                      dataInicio,
                      dataFim:
                        prev.dataFim && prev.dataFim < dataInicio
                          ? dataInicio
                          : prev.dataFim,
                    }));
                  }}
                  className="h-9 w-full rounded-md border border-outline-variant bg-surface-low px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Até</span>
                <input
                  type="date"
                  required
                  value={draft.dataFim}
                  min={draft.dataInicio}
                  onChange={(event) => {
                    const dataFim = event.target.value;
                    if (!dataFim) return;

                    setDraft((prev) => ({ ...prev, dataFim }));
                  }}
                  className="h-9 w-full rounded-md border border-outline-variant bg-surface-low px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
          </FilterSection>
        </div>

        <SheetFooter className="shrink-0 flex-row gap-2 border-t border-outline-variant px-5 py-4">
          <Button type="button" variant="outline" size="sm" onClick={limpar}>
            Limpar
          </Button>
          <Button type="button" size="sm" className="flex-1" onClick={aplicar}>
            Aplicar filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

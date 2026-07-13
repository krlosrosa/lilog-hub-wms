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
  FILTROS_SITUACAO_CNC,
  FILTROS_TIPO_CNC_ITEM,
  getDefaultCncItensFiltros,
  normalizeCncItensFiltros,
  type CncItensFiltros,
} from '@/features/cnc/types/cnc-itens-filtros';
import {
  CNC_ITEM_TIPO_LABELS,
  CNC_SITUACAO_LABELS,
} from '@/features/cnc/types/cnc.schema';

type CncItensFiltrosSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: CncItensFiltros;
  onAplicar: (filtros: CncItensFiltros) => void;
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
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
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
      )}
    >
      {children}
    </button>
  );
}

export function CncItensFiltrosSheet({
  open,
  onOpenChange,
  filtros,
  onAplicar,
}: CncItensFiltrosSheetProps) {
  const [draft, setDraft] = useState<CncItensFiltros>(filtros);

  useEffect(() => {
    if (open) {
      setDraft(filtros);
    }
  }, [open, filtros]);

  const limpar = () => {
    setDraft(getDefaultCncItensFiltros());
  };

  const aplicar = () => {
    onAplicar(normalizeCncItensFiltros(draft));
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
            Filtros
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Refine a listagem por período, status da CNC e tipo de item.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <FilterSection label="Período">
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

          <FilterSection label="Status CNC">
            <div className="flex flex-wrap gap-1.5">
              <OptionButton
                active={draft.situacao === 'todos'}
                onClick={() =>
                  setDraft((prev) => ({ ...prev, situacao: 'todos' }))
                }
              >
                Todos
              </OptionButton>
              {FILTROS_SITUACAO_CNC.map((situacao) => (
                <OptionButton
                  key={situacao}
                  active={draft.situacao === situacao}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, situacao }))
                  }
                >
                  {CNC_SITUACAO_LABELS[situacao]}
                </OptionButton>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Tipo de item">
            <div className="flex flex-wrap gap-1.5">
              <OptionButton
                active={draft.tipo === 'todos'}
                onClick={() => setDraft((prev) => ({ ...prev, tipo: 'todos' }))}
              >
                Todos
              </OptionButton>
              {FILTROS_TIPO_CNC_ITEM.map((tipo) => (
                <OptionButton
                  key={tipo}
                  active={draft.tipo === tipo}
                  onClick={() => setDraft((prev) => ({ ...prev, tipo }))}
                >
                  {CNC_ITEM_TIPO_LABELS[tipo]}
                </OptionButton>
              ))}
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

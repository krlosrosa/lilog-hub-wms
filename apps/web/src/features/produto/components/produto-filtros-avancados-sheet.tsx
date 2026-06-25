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
  DEFAULT_PRODUTO_FILTROS_AVANCADOS,
  type ProdutoFiltrosAvancados,
} from '@/features/produto/types/produto-filtros';
import {
  EMPRESA_OPTIONS,
  TIPO_PRODUTO_VALUES,
} from '@/features/produto/types/produto.schema';

type ProdutoFiltrosAvancadosSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: ProdutoFiltrosAvancados;
  onAplicar: (filtros: ProdutoFiltrosAvancados) => void;
};

const EAN_DUM_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'com', label: 'Com código' },
  { value: 'sem', label: 'Sem código' },
] as const;

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

export function ProdutoFiltrosAvancadosSheet({
  open,
  onOpenChange,
  filtros,
  onAplicar,
}: ProdutoFiltrosAvancadosSheetProps) {
  const [draft, setDraft] = useState<ProdutoFiltrosAvancados>(filtros);

  useEffect(() => {
    if (open) {
      setDraft(filtros);
    }
  }, [open, filtros]);

  const limpar = () => {
    setDraft(DEFAULT_PRODUTO_FILTROS_AVANCADOS);
  };

  const aplicar = () => {
    onAplicar(draft);
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
            Refine a listagem por empresa, tipo e códigos de barras.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <FilterSection label="Empresa">
            <div className="flex flex-wrap gap-1.5">
              <OptionButton
                active={draft.empresa === 'todos'}
                onClick={() => setDraft((prev) => ({ ...prev, empresa: 'todos' }))}
              >
                Todas
              </OptionButton>
              {EMPRESA_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={draft.empresa === option.value}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, empresa: option.value }))
                  }
                >
                  {option.value}
                </OptionButton>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Tipo de produto">
            <div className="flex flex-wrap gap-1.5">
              <OptionButton
                active={draft.tipo === 'todos'}
                onClick={() => setDraft((prev) => ({ ...prev, tipo: 'todos' }))}
              >
                Todos
              </OptionButton>
              {TIPO_PRODUTO_VALUES.map((tipo) => (
                <OptionButton
                  key={tipo}
                  active={draft.tipo === tipo}
                  onClick={() => setDraft((prev) => ({ ...prev, tipo }))}
                >
                  {tipo}
                </OptionButton>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="EAN">
            <div className="flex flex-wrap gap-1.5">
              {EAN_DUM_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={draft.ean === option.value}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, ean: option.value }))
                  }
                >
                  {option.label}
                </OptionButton>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="DUM">
            <div className="flex flex-wrap gap-1.5">
              {EAN_DUM_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  active={draft.dum === option.value}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, dum: option.value }))
                  }
                >
                  {option.label}
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

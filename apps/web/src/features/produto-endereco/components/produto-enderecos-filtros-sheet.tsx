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
import { Box, Filter } from 'lucide-react';

import type { CentroOptionApi } from '@/features/enderecos/types/endereco.api';
import { ZONA_FILTRO_OPCOES } from '@/features/enderecos/mocks/enderecos-mock-data';
import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';
import {
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/produto-endereco/components/form-field-classes';
import type {
  FiltroSlotting,
  FiltroTipoEndereco,
} from '@/features/produto-endereco/hooks/use-produto-enderecos-gestao';
import {
  PAPEL_PRODUTO_ENDERECO_LABELS,
  type FiltroAtivoProdutoEndereco,
  type FiltroPapelProdutoEndereco,
} from '@/features/produto-endereco/types/produto-endereco.schema';

export type ProdutoEnderecosFiltrosSheetState = {
  centroId: string;
  tipoFiltro: FiltroTipoEndereco;
  slottingFiltro: FiltroSlotting;
  papelFiltro: FiltroPapelProdutoEndereco;
  ativoFiltro: FiltroAtivoProdutoEndereco;
  zonasFiltro: string[];
  buscaProduto: string;
  apenasPendentes: boolean;
};

export const DEFAULT_PRODUTO_ENDERECOS_FILTROS: ProdutoEnderecosFiltrosSheetState =
  {
    centroId: '',
    tipoFiltro: 'todos',
    slottingFiltro: 'todos',
    papelFiltro: 'todos',
    ativoFiltro: 'todos',
    zonasFiltro: [],
    buscaProduto: '',
    apenasPendentes: false,
  };

const FILTER_CHIP_CLASS =
  'rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors';

const TIPO_FILTRO_OPCOES: { value: FiltroTipoEndereco; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'picking', label: ENDERECO_TIPO_LABELS.picking },
  { value: 'pulmao', label: ENDERECO_TIPO_LABELS.pulmao },
  { value: 'aereo', label: ENDERECO_TIPO_LABELS.aereo },
];

const SLOTTING_FILTRO_OPCOES: { value: FiltroSlotting; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'com_produto', label: 'Com produto' },
  { value: 'sem_produto', label: 'Sem produto' },
];

const PAPEL_FILTRO_OPCOES: {
  value: FiltroPapelProdutoEndereco;
  label: string;
}[] = [
  { value: 'todos', label: 'Todos' },
  {
    value: 'picking_primario',
    label: PAPEL_PRODUTO_ENDERECO_LABELS.picking_primario,
  },
  {
    value: 'picking_secundario',
    label: PAPEL_PRODUTO_ENDERECO_LABELS.picking_secundario,
  },
  { value: 'pulmao', label: PAPEL_PRODUTO_ENDERECO_LABELS.pulmao },
];

const ATIVO_FILTRO_OPCOES: {
  value: FiltroAtivoProdutoEndereco;
  label: string;
}[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
];

type ProdutoEnderecosFiltrosSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: ProdutoEnderecosFiltrosSheetState;
  onAplicar: (filtros: ProdutoEnderecosFiltrosSheetState) => void;
  centros: CentroOptionApi[];
  unidadeId?: string;
  formatCentroLabel: (centro: CentroOptionApi) => string;
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

export function ProdutoEnderecosFiltrosSheet({
  open,
  onOpenChange,
  filtros,
  onAplicar,
  centros,
  unidadeId,
  formatCentroLabel,
}: ProdutoEnderecosFiltrosSheetProps) {
  const [draft, setDraft] = useState<ProdutoEnderecosFiltrosSheetState>(filtros);

  useEffect(() => {
    if (open) {
      setDraft(filtros);
    }
  }, [open, filtros]);

  const toggleZona = (zona: string) => {
    setDraft((prev) => ({
      ...prev,
      zonasFiltro: prev.zonasFiltro.includes(zona)
        ? prev.zonasFiltro.filter((item) => item !== zona)
        : [...prev.zonasFiltro, zona],
    }));
  };

  const limpar = () => {
    setDraft({
      ...DEFAULT_PRODUTO_ENDERECOS_FILTROS,
      centroId: filtros.centroId || centros[0]?.id || '',
    });
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
            Filtros
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Refine o slotting por centro, zona, alocação e produto.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <FilterSection label="Centro">
            <select
              id="filtro-centro-sheet"
              value={draft.centroId}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, centroId: event.target.value }))
              }
              className={cn(fieldInputClassName, 'h-9 text-xs')}
              disabled={!unidadeId}
            >
              {centros.length === 0 ? (
                <option value="">Carregando...</option>
              ) : (
                centros.map((centro) => (
                  <option key={centro.id} value={centro.id}>
                    {formatCentroLabel(centro)}
                  </option>
                ))
              )}
            </select>
          </FilterSection>

          <FilterSection label="Zona">
            <div className="grid grid-cols-4 gap-1">
              {ZONA_FILTRO_OPCOES.map((zona) => (
                <button
                  key={zona}
                  type="button"
                  onClick={() => toggleZona(zona)}
                  className={cn(
                    FILTER_CHIP_CLASS,
                    draft.zonasFiltro.includes(zona)
                      ? 'border border-primary/30 bg-primary/10 text-primary'
                      : 'border border-transparent bg-surface-highest text-muted-foreground hover:border-outline-variant',
                  )}
                >
                  {zona}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Tipo de endereço">
            <div className="flex flex-wrap gap-1">
              {TIPO_FILTRO_OPCOES.map((opcao) => (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, tipoFiltro: opcao.value }))
                  }
                  className={cn(
                    FILTER_CHIP_CLASS,
                    draft.tipoFiltro === opcao.value
                      ? 'border border-secondary/30 bg-secondary/10 text-secondary'
                      : 'border border-outline-variant/60 bg-surface-highest text-foreground hover:bg-muted',
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Alocação">
            <div className="flex flex-wrap gap-1">
              {SLOTTING_FILTRO_OPCOES.map((opcao) => (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      slottingFiltro: opcao.value,
                    }))
                  }
                  className={cn(
                    FILTER_CHIP_CLASS,
                    draft.slottingFiltro === opcao.value
                      ? 'border border-primary/30 bg-primary/10 text-primary'
                      : 'border border-outline-variant/60 bg-surface-highest text-foreground hover:bg-muted',
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Papel">
            <div className="flex flex-wrap gap-1">
              {PAPEL_FILTRO_OPCOES.map((opcao) => (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, papelFiltro: opcao.value }))
                  }
                  className={cn(
                    FILTER_CHIP_CLASS,
                    'normal-case',
                    draft.papelFiltro === opcao.value
                      ? 'border border-sky-500/30 bg-sky-500/10 text-sky-700'
                      : 'border border-outline-variant/60 bg-surface-highest text-foreground hover:bg-muted',
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Status da alocação">
            <div className="flex flex-wrap gap-1">
              {ATIVO_FILTRO_OPCOES.map((opcao) => (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, ativoFiltro: opcao.value }))
                  }
                  className={cn(
                    FILTER_CHIP_CLASS,
                    draft.ativoFiltro === opcao.value
                      ? opcao.value === 'inativos'
                        ? 'border border-destructive/30 bg-destructive/10 text-destructive'
                        : 'border border-status-active/30 bg-status-active/10 text-status-active'
                      : 'border border-outline-variant/60 bg-surface-highest text-foreground hover:bg-muted',
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Buscar produto">
            <div className="relative">
              <Box
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="filtro-busca-produto-sheet"
                type="search"
                value={draft.buscaProduto}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    buscaProduto: event.target.value,
                  }))
                }
                placeholder="SKU ou descrição..."
                className={cn(fieldInputClassName, 'h-9 py-1.5 pl-8 text-xs')}
              />
            </div>
          </FilterSection>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/60 bg-surface-highest px-3 py-2">
            <input
              type="checkbox"
              checked={draft.apenasPendentes}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  apenasPendentes: event.target.checked,
                }))
              }
              className="size-3.5 rounded border-outline-variant"
            />
            <span className="text-xs text-foreground">
              Apenas alterações pendentes
            </span>
          </label>
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

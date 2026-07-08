'use client';

import { useEffect, useMemo, useState } from 'react';

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
import { Filter, Layers, MapPin, Tag } from 'lucide-react';

import {
  NIVEIS_OPCOES,
  STATUS_FILTRO_OPCOES,
  STATUS_FILTRO_TONE,
  TIPO_FILTRO_OPCOES,
  ZONA_FILTRO_OPCOES,
} from '@/features/enderecos/mocks/enderecos-mock-data';
import type {
  EnderecoFiltros,
  EnderecoStatus,
  EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';
import { DEFAULT_POSICOES_FILTROS } from '@/features/estoque-mapa-ocupacao/hooks/use-estoque-mapa-ocupacao';

const FILTER_CHIP_CLASS =
  'rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors';

type PosicoesFiltrosSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: EnderecoFiltros;
  onAplicar: (filtros: EnderecoFiltros) => void;
};

function countFiltrosAtivos(filtros: EnderecoFiltros): number {
  return (
    filtros.zonas.length +
    filtros.niveis.length +
    filtros.tipos.length +
    filtros.status.length
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  );
}

function FilterSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-outline-variant bg-surface-high px-3.5 py-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <SectionLabel>{label}</SectionLabel>
      </div>
      {children}
    </section>
  );
}

function ActiveSummary({
  filtros,
  onRemoveZona,
  onRemoveNivel,
  onRemoveTipo,
  onRemoveStatus,
}: {
  filtros: EnderecoFiltros;
  onRemoveZona: (zona: string) => void;
  onRemoveNivel: (nivel: string) => void;
  onRemoveTipo: (tipo: EnderecoTipo) => void;
  onRemoveStatus: (status: EnderecoStatus) => void;
}) {
  const hasItems =
    filtros.zonas.length > 0 ||
    filtros.niveis.length > 0 ||
    filtros.tipos.length > 0 ||
    filtros.status.length > 0;

  if (!hasItems) {
    return null;
  }

  const tipoLabel = (value: EnderecoTipo) =>
    TIPO_FILTRO_OPCOES.find((item) => item.value === value)?.label ?? value;

  const statusLabel = (value: EnderecoStatus) =>
    STATUS_FILTRO_OPCOES.find((item) => item.value === value)?.label ?? value;

  return (
    <div className="flex flex-wrap gap-1.5">
      {filtros.zonas.map((zona) => (
        <SummaryChip key={`zona-${zona}`} onRemove={() => onRemoveZona(zona)}>
          Zona {zona}
        </SummaryChip>
      ))}
      {filtros.niveis.map((nivel) => (
        <SummaryChip
          key={`nivel-${nivel}`}
          onRemove={() => onRemoveNivel(nivel)}
        >
          Nív. {nivel}
        </SummaryChip>
      ))}
      {filtros.tipos.map((tipo) => (
        <SummaryChip key={`tipo-${tipo}`} onRemove={() => onRemoveTipo(tipo)}>
          {tipoLabel(tipo)}
        </SummaryChip>
      ))}
      {filtros.status.map((status) => (
        <SummaryChip
          key={`status-${status}`}
          onRemove={() => onRemoveStatus(status)}
        >
          {statusLabel(status)}
        </SummaryChip>
      ))}
    </div>
  );
}

function SummaryChip({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/15"
    >
      {children}
      <span aria-hidden className="text-primary/70">
        ×
      </span>
      <span className="sr-only">Remover filtro</span>
    </button>
  );
}

export function PosicoesFiltrosSheet({
  open,
  onOpenChange,
  filtros,
  onAplicar,
}: PosicoesFiltrosSheetProps) {
  const [local, setLocal] = useState(filtros);

  useEffect(() => {
    if (open) {
      setLocal(filtros);
    }
  }, [open, filtros]);

  const ativos = useMemo(() => countFiltrosAtivos(local), [local]);

  const toggleZona = (zona: string) => {
    setLocal((prev) => ({
      ...prev,
      zonas: prev.zonas.includes(zona)
        ? prev.zonas.filter((item) => item !== zona)
        : [...prev.zonas, zona],
    }));
  };

  const toggleNivel = (nivel: string) => {
    setLocal((prev) => ({
      ...prev,
      niveis: prev.niveis.includes(nivel)
        ? prev.niveis.filter((item) => item !== nivel)
        : [...prev.niveis, nivel],
    }));
  };

  const toggleTipo = (tipo: EnderecoTipo) => {
    setLocal((prev) => ({
      ...prev,
      tipos: prev.tipos.includes(tipo)
        ? prev.tipos.filter((item) => item !== tipo)
        : [...prev.tipos, tipo],
    }));
  };

  const toggleStatus = (status: EnderecoStatus) => {
    setLocal((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((item) => item !== status)
        : [...prev.status, status],
    }));
  };

  const removeZona = (zona: string) => {
    setLocal((prev) => ({
      ...prev,
      zonas: prev.zonas.filter((item) => item !== zona),
    }));
  };

  const removeNivel = (nivel: string) => {
    setLocal((prev) => ({
      ...prev,
      niveis: prev.niveis.filter((item) => item !== nivel),
    }));
  };

  const removeTipo = (tipo: EnderecoTipo) => {
    setLocal((prev) => ({
      ...prev,
      tipos: prev.tipos.filter((item) => item !== tipo),
    }));
  };

  const removeStatus = (status: EnderecoStatus) => {
    setLocal((prev) => ({
      ...prev,
      status: prev.status.filter((item) => item !== status),
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <div className="shrink-0 border-b border-outline-variant px-5 pb-4 pt-5">
          <SheetHeader className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <Filter className="size-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base font-semibold text-foreground">
                  Filtros de posições
                </SheetTitle>
                <SheetDescription className="mt-1 text-xs leading-relaxed">
                  Combine critérios para refinar a lista. A busca no topo da
                  tela filtra por código, zona ou rua.
                </SheetDescription>
              </div>
            </div>
            {ativos > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{ativos}</span>{' '}
                {ativos === 1 ? 'filtro selecionado' : 'filtros selecionados'}
              </p>
            ) : null}
          </SheetHeader>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {ativos > 0 ? (
            <ActiveSummary
              filtros={local}
              onRemoveZona={removeZona}
              onRemoveNivel={removeNivel}
              onRemoveTipo={removeTipo}
              onRemoveStatus={removeStatus}
            />
          ) : null}

          <FilterSection
            icon={<MapPin className="size-3.5" aria-hidden />}
            label="Zona"
          >
            <div className="grid grid-cols-4 gap-1.5">
              {ZONA_FILTRO_OPCOES.map((zona) => (
                <button
                  key={zona}
                  type="button"
                  onClick={() => toggleZona(zona)}
                  aria-pressed={local.zonas.includes(zona)}
                  className={cn(
                    FILTER_CHIP_CLASS,
                    local.zonas.includes(zona)
                      ? 'border border-primary/30 bg-primary/10 text-primary'
                      : 'border border-outline-variant/60 bg-surface-low text-muted-foreground hover:border-outline-variant hover:text-foreground',
                  )}
                >
                  {zona}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            icon={<Layers className="size-3.5" aria-hidden />}
            label="Nível"
          >
            <div className="grid grid-cols-4 gap-1.5">
              {NIVEIS_OPCOES.map((nivel) => (
                <button
                  key={nivel}
                  type="button"
                  onClick={() => toggleNivel(nivel)}
                  aria-pressed={local.niveis.includes(nivel)}
                  className={cn(
                    FILTER_CHIP_CLASS,
                    'font-mono normal-case',
                    local.niveis.includes(nivel)
                      ? 'border border-primary/30 bg-primary/10 text-primary'
                      : 'border border-outline-variant/60 bg-surface-low text-muted-foreground hover:border-outline-variant hover:text-foreground',
                  )}
                >
                  {nivel}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            icon={<Tag className="size-3.5" aria-hidden />}
            label="Tipo"
          >
            <div className="flex flex-wrap gap-1.5">
              {TIPO_FILTRO_OPCOES.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => toggleTipo(tipo.value)}
                  aria-pressed={local.tipos.includes(tipo.value)}
                  className={cn(
                    FILTER_CHIP_CLASS,
                    local.tipos.includes(tipo.value)
                      ? 'border border-secondary/30 bg-secondary/10 text-secondary'
                      : 'border border-outline-variant/60 bg-surface-low text-foreground hover:bg-muted/60',
                  )}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            icon={<Filter className="size-3.5" aria-hidden />}
            label="Status"
          >
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTRO_OPCOES.map((opcao) => {
                const tone = STATUS_FILTRO_TONE[opcao.value];
                const active = local.status.includes(opcao.value);

                return (
                  <button
                    key={opcao.value}
                    type="button"
                    onClick={() => toggleStatus(opcao.value)}
                    aria-pressed={active}
                    className={cn(
                      FILTER_CHIP_CLASS,
                      active ? tone.active : tone.inactive,
                    )}
                  >
                    {opcao.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        </div>

        <SheetFooter className="shrink-0 flex-row gap-2 border-t border-outline-variant bg-surface-high/50 px-5 py-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setLocal(DEFAULT_POSICOES_FILTROS)}
            disabled={ativos === 0}
          >
            Limpar
          </Button>
          <Button
            type="button"
            className="flex-1 sm:flex-none"
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

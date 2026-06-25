'use client';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  ArrowLeftRight,
  Layers,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Puzzle,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import type {
  LayoutHierarchy,
  LayoutSelection,
  RackType,
  StreetType,
} from '@/features/layout-cd/types/layout-cd.schema';
import {
  rackTypeToStreetType,
  streetTypeLabel,
} from '@/features/layout-cd/utils/layout-hierarchy-ops';
import { getComponentDisplayLabel } from '@/features/layout-cd/utils/normalize-component-form';

type LayoutHierarchyPanelProps = {
  hierarchy: LayoutHierarchy;
  selection: LayoutSelection | null;
  expandedStreetIds: Set<string>;
  expandedCabecaIds: Set<string>;
  expandedStructureIds: Set<string>;
  onSelect: (sel: LayoutSelection) => void;
  onToggleStreet: (streetId: string) => void;
  onToggleCabeca: (cabecaId: string) => void;
  onToggleStructure: (structureId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onCollapseSelection: () => void;
  panelCollapsed: boolean;
  onTogglePanelCollapsed: () => void;
  activePartType: RackType;
  onAddStreet: (type: StreetType) => void;
  onAddStructure: () => void;
  onAddComponent: () => void;
  onAddCabecaInicio: () => void;
  onAddCabecaFim: () => void;
};

export function LayoutHierarchyPanel({
  hierarchy,
  selection,
  expandedStreetIds,
  expandedCabecaIds,
  expandedStructureIds,
  onSelect,
  onToggleStreet,
  onToggleCabeca,
  onToggleStructure,
  onExpandAll,
  onCollapseAll,
  onCollapseSelection,
  panelCollapsed,
  onTogglePanelCollapsed,
  activePartType,
  onAddStreet,
  onAddStructure,
  onAddComponent,
  onAddCabecaInicio,
  onAddCabecaFim,
}: LayoutHierarchyPanelProps) {
  const warehouseStreets = hierarchy.streets.filter(
    (s) => s.type === 'corredor-armazem',
  );
  const canAddStructure =
    selection?.level === 'street' ||
    selection?.level === 'cabeca' ||
    (selection?.level === 'structure' && (!!selection.streetId || !!selection.cabecaId));
  const canAddCabeca = warehouseStreets.length > 0;
  const canAddComponent =
    selection?.level === 'structure' && !!selection.structureId;

  const canCollapseSelection =
    !!selection &&
    ((selection.level === 'street' &&
      !!selection.streetId &&
      expandedStreetIds.has(selection.streetId)) ||
      (selection.level === 'cabeca' &&
        !!selection.cabecaId &&
        expandedCabecaIds.has(selection.cabecaId)) ||
      ((selection.level === 'structure' || selection.level === 'component') &&
        !!selection.structureId &&
        expandedStructureIds.has(selection.structureId)));

  if (panelCollapsed) {
    return (
      <aside className="relative flex w-11 shrink-0 flex-col border-r border-outline-variant bg-surface-low">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mx-auto mt-3 h-8 w-8"
          title="Expandir painel da hierarquia"
          onClick={onTogglePanelCollapsed}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
        <span
          className="mx-auto mt-4 font-mono text-[9px] uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]"
          aria-hidden
        >
          Hierarquia
        </span>
      </aside>
    );
  }

  return (
    <aside className="relative flex w-[280px] shrink-0 flex-col border-r border-outline-variant bg-surface-low">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute -right-3 top-14 z-10 h-6 w-6 rounded-full bg-card shadow-sm"
        title="Collapse painel"
        onClick={onTogglePanelCollapsed}
      >
        <PanelLeftClose className="h-3.5 w-3.5" />
      </Button>

      <div className="border-b border-outline-variant px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Hierarquia do layout
        </p>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          Cabeceira · Corredor · Estrutura · Posição
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-outline-variant p-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-[10px]"
          onClick={() => onAddStreet(rackTypeToStreetType(activePartType))}
        >
          <Plus className="h-3 w-3" />
          Corredor
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-[10px]"
          disabled={!canAddStructure}
          onClick={onAddStructure}
        >
          <Plus className="h-3 w-3" />
          Estrutura
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-[10px]"
          disabled={!canAddComponent}
          onClick={onAddComponent}
        >
          <Plus className="h-3 w-3" />
          Posição
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-1.5 text-[10px]"
          disabled={!canAddCabeca}
          title="Cabeceira transversal no topo"
          onClick={onAddCabecaInicio}
        >
          <Plus className="h-3 w-3" />
          Cab. início
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-1.5 text-[10px]"
          disabled={!canAddCabeca}
          title="Cabeceira transversal no fim"
          onClick={onAddCabecaFim}
        >
          <Plus className="h-3 w-3" />
          Cab. fim
        </Button>
        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px]"
            title="Expandir toda a árvore"
            disabled={hierarchy.streets.length === 0}
            onClick={onExpandAll}
          >
            <ChevronsUpDown className="h-3 w-3" />
            Expandir
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px]"
            title="Collapse do item selecionado"
            disabled={!canCollapseSelection}
            onClick={onCollapseSelection}
          >
            <ChevronLeft className="h-3 w-3" />
            Collapse
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px]"
            title="Collapse de toda a árvore"
            disabled={hierarchy.streets.length === 0}
            onClick={onCollapseAll}
          >
            <ChevronsDownUp className="h-3 w-3" />
            Tudo
          </Button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
        {hierarchy.cabecas.length > 0 ? (
          <div className="mb-3">
            <p className="px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-primary/80">
              Cabeceiras transversais
            </p>
            {hierarchy.cabecas
              .sort((a, b) => a.order - b.order)
              .map((cabeca) => {
                const cabecaOpen = expandedCabecaIds.has(cabeca.id);
                const cabecaSelected =
                  selection?.cabecaId === cabeca.id && selection.level === 'cabeca';
                const streetLabels = cabeca.streetIds
                  .map((id) => hierarchy.streets.find((s) => s.id === id)?.code)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div key={cabeca.id} className="mb-1">
                    <div
                      className={cn(
                        'flex w-full items-center gap-1 rounded-lg pr-2 text-xs transition-colors',
                        cabecaSelected
                          ? 'bg-primary/15 text-primary'
                          : 'text-foreground hover:bg-surface-high',
                      )}
                    >
                      <button
                        type="button"
                        aria-expanded={cabecaOpen}
                        onClick={() => onToggleCabeca(cabeca.id)}
                        className="shrink-0 rounded p-2 hover:bg-surface-highest"
                      >
                        {cabecaOpen ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSelect({ level: 'cabeca', cabecaId: cabeca.id })
                        }
                        className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {cabeca.code}
                          {cabeca.name && cabeca.name !== cabeca.code ? (
                            <span className="ml-1 font-normal text-muted-foreground">
                              {cabeca.name}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </div>
                    {cabecaOpen ? (
                      <div className="ml-4 border-l border-primary/20 pl-2">
                        {streetLabels ? (
                          <p className="px-2 py-0.5 font-mono text-[8px] text-muted-foreground">
                            {streetLabels}
                          </p>
                        ) : null}
                        {cabeca.structures.map((structure) => {
                          const structOpen = expandedStructureIds.has(structure.id);
                          const structSelected =
                            selection?.structureId === structure.id &&
                            selection.cabecaId === cabeca.id;

                          return (
                            <div key={structure.id}>
                              <div
                                className={cn(
                                  'flex w-full items-center gap-1 rounded-lg pr-2 text-[11px]',
                                  structSelected && selection?.level === 'structure'
                                    ? 'bg-secondary/15 text-secondary'
                                    : 'hover:bg-surface-high',
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => onToggleStructure(structure.id)}
                                  className="shrink-0 rounded p-1.5"
                                >
                                  {structOpen ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelect({
                                      level: 'structure',
                                      cabecaId: cabeca.id,
                                      structureId: structure.id,
                                    })
                                  }
                                  className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                                >
                                  <Layers className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{structure.code}</span>
                                </button>
                              </div>
                              {structOpen ? (
                                <div className="ml-5 space-y-0.5 border-l border-outline-variant/30 py-1 pl-2">
                                  {structure.components.map((comp) => (
                                    <button
                                      key={comp.id}
                                      type="button"
                                      onClick={() =>
                                        onSelect({
                                          level: 'component',
                                          cabecaId: cabeca.id,
                                          structureId: structure.id,
                                          componentId: comp.id,
                                        })
                                      }
                                      className={cn(
                                        'flex w-full items-center gap-2 rounded px-2 py-1 font-mono text-[10px]',
                                        selection?.componentId === comp.id
                                          ? 'bg-primary/10 text-primary'
                                          : 'text-muted-foreground hover:bg-surface-high',
                                      )}
                                    >
                                      <Puzzle className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{comp.code}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        ) : null}

        {hierarchy.streets.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Nenhum corredor. Use + Corredor para começar.
          </p>
        ) : (
          hierarchy.streets
            .sort((a, b) => a.order - b.order)
            .map((street) => {
              const streetOpen = expandedStreetIds.has(street.id);
              const streetSelected =
                selection?.streetId === street.id && selection.level === 'street';

              return (
                <div key={street.id} className="mb-1">
                  <div
                    className={cn(
                      'flex w-full items-center gap-1 rounded-lg pr-2 text-xs transition-colors',
                      streetSelected
                        ? 'bg-primary/15 text-primary'
                        : 'text-foreground hover:bg-surface-high',
                    )}
                  >
                    <button
                      type="button"
                      aria-label={streetOpen ? 'Recolher corredor' : 'Expandir corredor'}
                      aria-expanded={streetOpen}
                      onClick={() => onToggleStreet(street.id)}
                      className="shrink-0 rounded p-2 hover:bg-surface-highest"
                    >
                      {streetOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onSelect({ level: 'street', streetId: street.id })
                      }
                      className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {street.code}
                        <span className="ml-1 font-normal text-muted-foreground">
                          {street.name}
                        </span>
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {street.structures.length}
                      </span>
                    </button>
                  </div>
                  {streetOpen ? (
                    <div className="ml-4 border-l border-outline-variant/40 pl-2">
                      <p className="px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                        {streetTypeLabel(street.type)}
                      </p>
                      {street.structures.map((structure) => {
                        const structOpen = expandedStructureIds.has(structure.id);
                        const structSelected =
                          selection?.structureId === structure.id &&
                          selection.level !== 'street' &&
                          !selection.cabecaId;

                        return (
                          <div key={structure.id}>
                            <div
                              className={cn(
                                'flex w-full items-center gap-1 rounded-lg pr-2 text-[11px] transition-colors',
                                structSelected && selection?.level === 'structure'
                                  ? 'bg-secondary/15 text-secondary'
                                  : 'text-foreground hover:bg-surface-high',
                              )}
                            >
                              <button
                                type="button"
                                aria-label={
                                  structOpen ? 'Recolher estrutura' : 'Expandir estrutura'
                                }
                                aria-expanded={structOpen}
                                onClick={() => onToggleStructure(structure.id)}
                                className="shrink-0 rounded p-1.5 hover:bg-surface-highest"
                              >
                                {structOpen ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onSelect({
                                    level: 'structure',
                                    streetId: street.id,
                                    structureId: structure.id,
                                  })
                                }
                                className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                              >
                                <Layers className="h-3 w-3 shrink-0" />
                                <span className="min-w-0 flex-1 truncate">
                                  {structure.code}
                                  <span className="ml-1 font-mono text-[8px] text-muted-foreground">
                                    S{structure.side ?? 1}
                                  </span>
                                </span>
                                <span className="font-mono text-[9px] text-muted-foreground">
                                  {structure.components.length}
                                </span>
                              </button>
                            </div>
                            {structOpen ? (
                              <div className="ml-5 space-y-0.5 border-l border-outline-variant/30 pl-2 py-1">
                                {structure.components.length === 0 ? (
                                  <p className="px-1 text-[10px] text-muted-foreground">
                                    Sem posições
                                  </p>
                                ) : (
                                  structure.components.map((comp) => {
                                    const compSelected =
                                      selection?.componentId === comp.id;
                                    const compSubtitle = getComponentDisplayLabel(comp);
                                    return (
                                      <button
                                        key={comp.id}
                                        type="button"
                                        onClick={() =>
                                          onSelect({
                                            level: 'component',
                                            streetId: street.id,
                                            structureId: structure.id,
                                            componentId: comp.id,
                                          })
                                        }
                                        className={cn(
                                          'flex w-full items-center gap-2 rounded px-2 py-1 text-left font-mono text-[10px] transition-colors',
                                          compSelected
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-surface-high hover:text-foreground',
                                        )}
                                      >
                                        <Puzzle className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                          {comp.code}
                                          {compSubtitle ? ` — ${compSubtitle}` : ''}
                                        </span>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
        )}
      </div>
    </aside>
  );
}

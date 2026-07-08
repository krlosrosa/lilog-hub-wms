'use client';

import { Eye, Pencil, Save } from 'lucide-react';

import { Button } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { ElementPropertiesPanel } from '@/features/armazem-layout/components/element-properties-panel';
import { LayoutCanvas } from '@/features/armazem-layout/components/layout-canvas';
import { LayoutToolbar } from '@/features/armazem-layout/components/layout-toolbar';
import { useArmazemLayoutBuilder } from '@/features/armazem-layout/hooks/use-armazem-layout-builder';

export function ArmazemLayoutBuilderScreen() {
  const {
    layout,
    tool,
    selectedId,
    selectedElement,
    zoomPercent,
    hydrated,
    viewMode,
    ocupacao,
    isSaving,
    saveError,
    unidadeId,
    slots,
    linkingSlotId,
    slotLinkError,
    placeElementAt,
    moveElement,
    updateElement,
    removeElement,
    clearAll,
    setLayoutName,
    selectElement,
    setActiveTool,
    zoomIn,
    zoomOut,
    exportJson,
    importJson,
    toggleViewMode,
    vincularSlotEndereco,
  } = useArmazemLayoutBuilder();

  if (!hydrated) {
    return (
      <SidebarMain className="flex h-dvh items-center justify-center">
        <span className="text-sm text-muted-foreground">Carregando layout...</span>
      </SidebarMain>
    );
  }

  const isEditMode = viewMode === 'editar';

  return (
    <SidebarMain className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="z-20 flex shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Layout do CD</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isEditMode
              ? 'Monte a planta do armazém clicando na grade'
              : 'Visualize a ocupação dos endereços vinculados às estantes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant={isEditMode ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => {
              if (!isEditMode) toggleViewMode();
            }}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!isEditMode ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => {
              if (isEditMode) toggleViewMode();
            }}
          >
            <Eye className="h-4 w-4" />
            Ocupação
          </Button>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Nome
            <input
              type="text"
              value={layout.name}
              disabled={!isEditMode}
              onChange={(event) => setLayoutName(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-high px-3 py-1.5 text-sm text-foreground disabled:opacity-60"
            />
          </label>

          <span className="flex items-center gap-1 rounded-lg border border-tertiary/30 bg-tertiary/10 px-2 py-1 font-mono text-[10px] text-tertiary">
            <Save className="h-3 w-3" />
            {isSaving
              ? 'Salvando...'
              : unidadeId
                ? 'Salvo no servidor'
                : 'Salvo localmente'}
          </span>

          {saveError ? (
            <span className="text-[10px] text-destructive">{saveError}</span>
          ) : null}

          <span className="font-mono text-xs text-muted-foreground">
            {layout.elements.length} elementos
          </span>
        </div>
      </header>

      {isEditMode ? (
        <LayoutToolbar
          activeTool={tool}
          zoomPercent={zoomPercent}
          onSelectTool={setActiveTool}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onClearAll={clearAll}
          onExport={exportJson}
          onImport={(file) => void importJson(file)}
        />
      ) : (
        <div className="mx-4 mt-4 flex shrink-0 items-center justify-between rounded-xl border border-outline-variant bg-surface-high px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Cores por status do endereço vinculado (livre, ocupado, bloqueado, inventário)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={zoomOut}
              className="rounded-lg border border-outline-variant px-2 py-1 text-xs"
            >
              −
            </button>
            <span className="min-w-[3rem] text-center font-mono text-xs">
              {zoomPercent}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              className="rounded-lg border border-outline-variant px-2 py-1 text-xs"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4 px-4 pb-4">
        <LayoutCanvas
          layout={layout}
          tool={tool}
          selectedId={selectedId}
          zoomPercent={zoomPercent}
          viewMode={viewMode}
          ocupacaoSlots={ocupacao?.slots ?? []}
          onPlaceAt={placeElementAt}
          onMoveElement={moveElement}
          onSelectElement={selectElement}
          className="min-w-0 flex-1 rounded-xl border border-outline-variant"
        />

        <ElementPropertiesPanel
          element={isEditMode ? selectedElement : null}
          slots={slots}
          unidadeId={unidadeId}
          isSaving={isSaving}
          linkingSlotId={linkingSlotId}
          slotLinkError={slotLinkError}
          onUpdate={updateElement}
          onRemove={removeElement}
          onVincularSlot={vincularSlotEndereco}
        />
      </div>
    </SidebarMain>
  );
}
